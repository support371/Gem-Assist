"""
RSS Aggregator and Content Curation System for GEM Enterprise
Collects RSS feeds from financial and cybersecurity sources for Telegram distribution
"""

import os
import json
import logging
import requests
import feedparser
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import trafilatura

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RSSFeedSource:
    """RSS Feed Source Configuration"""

    name: str
    url: str
    category: str  # 'financial', 'cybersecurity', 'real_estate', 'general'
    enabled: bool = True
    update_frequency: int = 3600  # seconds
    last_updated: Optional[datetime] = None


@dataclass
class ContentItem:
    """Parsed content item from RSS feed"""

    id: str
    source: str
    title: str
    description: str
    content: str
    url: str
    published: datetime
    category: str
    tags: List[str]
    status: str = "pending"  # pending, approved, rejected, posted
    telegram_channels: List[str] = None
    customized_content: Optional[str] = None
    ai_summary: Optional[str] = None


class RSSAggregator:
    """Main RSS Aggregation and Content Curation System"""

    def __init__(self):
        # Default RSS feeds for financial and cybersecurity news
        self.feed_sources = [
            # Cybersecurity Feeds
            RSSFeedSource(
                name="Krebs on Security",
                url="https://krebsonsecurity.com/feed/",
                category="cybersecurity",
            ),
            RSSFeedSource(
                name="The Hacker News",
                url="https://feeds.feedburner.com/TheHackersNews",
                category="cybersecurity",
            ),
            RSSFeedSource(
                name="Dark Reading",
                url="https://www.darkreading.com/rss.xml",
                category="cybersecurity",
            ),
            RSSFeedSource(
                name="SecurityWeek",
                url="https://feeds.feedburner.com/securityweek",
                category="cybersecurity",
            ),
            RSSFeedSource(
                name="Threatpost",
                url="https://threatpost.com/feed/",
                category="cybersecurity",
            ),
            RSSFeedSource(
                name="CISA Alerts",
                url="https://www.cisa.gov/uscert/ncas/current-activity.xml",
                category="cybersecurity",
            ),
            # Financial Feeds
            RSSFeedSource(
                name="Reuters Finance",
                url="https://feeds.reuters.com/reuters/businessNews",
                category="financial",
            ),
            RSSFeedSource(
                name="Bloomberg Markets",
                url="https://feeds.bloomberg.com/markets/news.rss",
                category="financial",
            ),
            RSSFeedSource(
                name="Financial Times",
                url="https://www.ft.com/?format=rss&edition=international",
                category="financial",
            ),
            RSSFeedSource(
                name="Wall Street Journal",
                url="https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
                category="financial",
            ),
            RSSFeedSource(
                name="CoinDesk",
                url="https://www.coindesk.com/arc/outboundfeeds/rss/",
                category="financial",
            ),
            RSSFeedSource(
                name="Cointelegraph",
                url="https://cointelegraph.com/rss",
                category="financial",
            ),
            # Real Estate Feeds
            RSSFeedSource(
                name="Inman News",
                url="https://www.inman.com/feed/",
                category="real_estate",
            ),
            RSSFeedSource(
                name="HousingWire",
                url="https://www.housingwire.com/rss/",
                category="real_estate",
            ),
        ]

        # Storage for aggregated content
        self.content_items = []
        self.pending_review = []
        self.approved_content = []

        # Telegram channel mappings
        self.channel_mappings = {
            "cybersecurity": ["security", "cybergemsecure"],
            "financial": ["client", "gemassist"],
            "real_estate": ["realestate"],
            "general": ["client"],
        }

    def add_feed_source(self, name: str, url: str, category: str) -> bool:
        """Add a new RSS feed source"""
        try:
            # Test the feed first
            feed = feedparser.parse(url)
            if feed.bozo:
                logger.error(f"Invalid RSS feed: {url}")
                return False

            new_source = RSSFeedSource(name=name, url=url, category=category)
            self.feed_sources.append(new_source)
            logger.info(f"Added RSS feed: {name}")
            return True

        except Exception as e:
            logger.error(f"Error adding feed {name}: {e}")
            return False

    def fetch_all_feeds(self) -> List[ContentItem]:
        """Fetch content from all enabled RSS feeds"""
        all_items = []

        for source in self.feed_sources:
            if not source.enabled:
                continue

            try:
                items = self.fetch_feed(source)
                all_items.extend(items)
                source.last_updated = datetime.utcnow()

            except Exception as e:
                logger.error(f"Error fetching {source.name}: {e}")

        # Sort by publication date (newest first)
        all_items.sort(key=lambda x: x.published, reverse=True)

        # Store in pending review
        self.pending_review = all_items

        return all_items

    def fetch_feed(self, source: RSSFeedSource) -> List[ContentItem]:
        """Fetch and parse a single RSS feed"""
        try:
            logger.info(f"Fetching RSS feed: {source.name}")
            feed = feedparser.parse(source.url)

            items = []
            for entry in feed.entries[:10]:  # Limit to 10 latest items per feed
                # Generate unique ID
                content_id = hashlib.sha256(
                    f"{source.name}:{entry.get('link', '')}:{entry.get('title', '')}".encode()
                ).hexdigest()

                # Parse publication date
                pub_date = datetime.utcnow()
                if hasattr(entry, "published_parsed"):
                    pub_date = datetime(*entry.published_parsed[:6])

                # Extract content
                description = entry.get("summary", "")
                content = (
                    entry.get("content", [{}])[0].get("value", description)
                    if hasattr(entry, "content")
                    else description
                )

                # Create content item
                item = ContentItem(
                    id=content_id,
                    source=source.name,
                    title=entry.get("title", "Untitled"),
                    description=description[:500],  # Limit description length
                    content=content,
                    url=entry.get("link", ""),
                    published=pub_date,
                    category=source.category,
                    tags=self.extract_tags(entry),
                    status="pending",
                    telegram_channels=self.channel_mappings.get(
                        source.category, ["general"]
                    ),
                )

                items.append(item)

            logger.info(f"Fetched {len(items)} items from {source.name}")
            return items

        except Exception as e:
            logger.error(f"Error parsing feed {source.name}: {e}")
            return []

    def extract_tags(self, entry: Dict) -> List[str]:
        """Extract tags from RSS entry"""
        tags = []

        # Check for category tags
        if hasattr(entry, "tags"):
            tags.extend([tag.term for tag in entry.tags])

        # Check for categories
        if hasattr(entry, "category"):
            tags.append(entry.category)

        return tags

    def extract_article_content(self, url: str) -> Optional[str]:
        """Extract full article content from URL using trafilatura"""
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded)
                return text
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {e}")
        return None

    def ai_summarize(self, content: str, max_length: int = 200) -> str:
        """Generate AI summary of content (placeholder for actual AI integration)"""
        # This would connect to an AI service like OpenAI or Perplexity
        # For now, returns a truncated version

        if len(content) <= max_length:
            return content

        # Simple summarization - take first and last parts
        half_length = max_length // 2
        summary = content[:half_length] + "..." + content[-half_length:]
        return summary

    def customize_content(
        self, item: ContentItem, custom_text: str = None
    ) -> ContentItem:
        """Customize content for Telegram posting"""
        try:
            # Extract full article if needed
            if not item.content or len(item.content) < 100:
                full_content = self.extract_article_content(item.url)
                if full_content:
                    item.content = full_content

            # Generate AI summary
            item.ai_summary = self.ai_summarize(item.content)

            # Create customized Telegram message
            if custom_text:
                item.customized_content = custom_text
            else:
                # Default formatting for Telegram
                item.customized_content = f"""
🔔 <b>{item.title}</b>

📰 {item.ai_summary}

🏷️ #{item.category.replace('_', '')} #{item.source.replace(' ', '')}
🔗 Read more: {item.url}

💎 Powered by GEM Enterprise
                """.strip()

            return item

        except Exception as e:
            logger.error(f"Error customizing content: {e}")
            return item

    def approve_content(self, content_id: str) -> bool:
        """Approve content for posting"""
        for item in self.pending_review:
            if item.id == content_id:
                item.status = "approved"
                self.approved_content.append(item)
                return True
        return False

    def reject_content(self, content_id: str) -> bool:
        """Reject content from posting"""
        for item in self.pending_review:
            if item.id == content_id:
                item.status = "rejected"
                return True
        return False

    def get_pending_content(self, category: str = None) -> List[ContentItem]:
        """Get pending content for review"""
        if category:
            return [
                item
                for item in self.pending_review
                if item.category == category and item.status == "pending"
            ]
        return [item for item in self.pending_review if item.status == "pending"]

    def get_approved_content(self, limit: int = 10) -> List[ContentItem]:
        """Get approved content ready for posting"""
        approved = [item for item in self.approved_content if item.status == "approved"]
        return approved[:limit]

    def mark_as_posted(self, content_id: str) -> bool:
        """Mark content as posted to Telegram"""
        for item in self.approved_content:
            if item.id == content_id:
                item.status = "posted"
                return True
        return False

    def get_feed_stats(self) -> Dict:
        """Get statistics about RSS feeds and content"""
        stats = {
            "total_feeds": len(self.feed_sources),
            "active_feeds": len([s for s in self.feed_sources if s.enabled]),
            "feeds_by_category": {},
            "content_stats": {
                "total": len(self.pending_review) + len(self.approved_content),
                "pending": len(
                    [i for i in self.pending_review if i.status == "pending"]
                ),
                "approved": len(
                    [i for i in self.approved_content if i.status == "approved"]
                ),
                "rejected": len(
                    [i for i in self.pending_review if i.status == "rejected"]
                ),
                "posted": len(
                    [i for i in self.approved_content if i.status == "posted"]
                ),
            },
            "last_update": max(
                [s.last_updated for s in self.feed_sources if s.last_updated],
                default=None,
            ),
        }

        # Count feeds by category
        for source in self.feed_sources:
            category = source.category
            if category not in stats["feeds_by_category"]:
                stats["feeds_by_category"][category] = 0
            stats["feeds_by_category"][category] += 1

        return stats

    def export_content(self, status: str = "approved") -> List[Dict]:
        """Export content as JSON-serializable format"""
        items = self.pending_review + self.approved_content
        filtered = [item for item in items if item.status == status]

        return [asdict(item) for item in filtered]

    def schedule_posting(
        self, content_id: str, post_time: datetime, channels: List[str]
    ) -> bool:
        """Schedule content for future posting"""
        for item in self.approved_content:
            if item.id == content_id:
                item.scheduled_time = post_time
                item.telegram_channels = channels
                return True
        return False


class RSSWorkflowManager:
    """Manages the workflow from RSS to Telegram posting"""

    def __init__(self, aggregator: RSSAggregator):
        self.aggregator = aggregator
        self.workflow_queue = []
        self.posting_schedule = []

    def run_workflow(self) -> Dict:
        """Execute the complete RSS to Telegram workflow"""
        workflow_result = {"timestamp": datetime.utcnow().isoformat(), "steps": []}

        # Step 1: Fetch RSS feeds
        items = self.aggregator.fetch_all_feeds()
        workflow_result["steps"].append(
            {"step": "fetch_feeds", "items_fetched": len(items), "status": "success"}
        )

        # Step 2: Customize content with AI
        for item in items[:20]:  # Process top 20 items
            self.aggregator.customize_content(item)

        workflow_result["steps"].append(
            {
                "step": "customize_content",
                "items_processed": min(20, len(items)),
                "status": "success",
            }
        )

        # Step 3: Auto-approve high-quality content (placeholder for ML model)
        auto_approved = 0
        for item in items[:20]:
            # Simple auto-approval based on source reputation
            trusted_sources = ["Reuters Finance", "Bloomberg Markets", "CISA Alerts"]
            if item.source in trusted_sources:
                self.aggregator.approve_content(item.id)
                auto_approved += 1

        workflow_result["steps"].append(
            {
                "step": "auto_approval",
                "items_approved": auto_approved,
                "status": "success",
            }
        )

        # Step 4: Queue for manual review
        pending = self.aggregator.get_pending_content()
        workflow_result["steps"].append(
            {"step": "queue_review", "items_pending": len(pending), "status": "success"}
        )

        workflow_result["summary"] = {
            "total_items": len(items),
            "auto_approved": auto_approved,
            "pending_review": len(pending),
            "ready_to_post": len(self.aggregator.get_approved_content()),
        }

        return workflow_result

    def process_posting_queue(self) -> List[Dict]:
        """Process approved content for Telegram posting"""
        posted_items = []
        approved = self.aggregator.get_approved_content(limit=5)

        for item in approved:
            # This would integrate with gem_telegram_workflows.py
            post_result = {
                "content_id": item.id,
                "title": item.title,
                "channels": item.telegram_channels,
                "status": "queued",
                "scheduled": datetime.utcnow().isoformat(),
            }

            # Mark as posted
            self.aggregator.mark_as_posted(item.id)
            posted_items.append(post_result)

        return posted_items


# Initialize the aggregator
rss_aggregator = RSSAggregator()
workflow_manager = RSSWorkflowManager(rss_aggregator)
