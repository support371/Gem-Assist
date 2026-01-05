"""
Automated Notion Content Sync Service
Handles automatic synchronization of content between Notion and the website
"""

import os
import logging
import json
from datetime import datetime
from typing import Dict, List, Any
from notion_cms import notion_cms

logger = logging.getLogger(__name__)


class NotionContentSync:
    """Service for syncing and caching Notion content"""

    def __init__(self):
        self.cache_dir = "static/cache"
        self.cache_file = os.path.join(self.cache_dir, "notion_content.json")
        self._ensure_cache_dir()

    def _ensure_cache_dir(self):
        """Ensure cache directory exists"""
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)

    def sync_all_content(self) -> Dict[str, Any]:
        """Sync all content from Notion and cache it locally"""
        try:
            if not notion_cms.client:
                logger.warning("Notion client not configured")
                return self._load_cached_content()

            # Fetch all content types
            content = {
                "services": notion_cms.get_services_content(),
                "news": notion_cms.get_news_content(),
                "testimonials": notion_cms.get_testimonials(),
                "team_members": notion_cms.get_team_members(),
                "featured": notion_cms.get_featured_content(),
                "last_sync": datetime.now().isoformat(),
                "sync_status": "success",
            }

            # Cache the content
            self._save_cache(content)

            logger.info(
                f"Successfully synced content: {len(content['services'])} services, "
                f"{len(content['news'])} news, {len(content['testimonials'])} testimonials"
            )

            return content

        except Exception as e:
            logger.error(f"Error syncing content: {e}")
            # Return cached content on error
            cached = self._load_cached_content()
            cached["sync_status"] = "error"
            cached["error_message"] = str(e)
            return cached

    def get_service_by_slug(self, slug: str) -> Dict[str, Any]:
        """Get a specific service by URL slug"""
        content = self._load_cached_content()
        services = content.get("services", [])

        for service in services:
            if service.get("url_slug") == slug:
                return service

        return None

    def get_news_by_date(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get news articles sorted by date"""
        content = self._load_cached_content()
        news = content.get("news", [])

        # Sort by publish date
        sorted_news = sorted(
            news, key=lambda x: x.get("publish_date", ""), reverse=True
        )

        return sorted_news[:limit]

    def get_featured_services(self) -> List[Dict[str, Any]]:
        """Get featured services"""
        content = self._load_cached_content()
        services = content.get("services", [])

        featured = [s for s in services if s.get("featured", False)]
        return sorted(featured, key=lambda x: x.get("priority", 999))

    def _save_cache(self, content: Dict[str, Any]):
        """Save content to cache file"""
        try:
            with open(self.cache_file, "w") as f:
                json.dump(content, f, indent=2, default=str)
            logger.debug("Content cached successfully")
        except Exception as e:
            logger.error(f"Error saving cache: {e}")

    def _load_cached_content(self) -> Dict[str, Any]:
        """Load content from cache file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading cache: {e}")

        # Return empty structure if no cache
        return {
            "services": [],
            "news": [],
            "testimonials": [],
            "team_members": [],
            "featured": [],
            "last_sync": None,
            "sync_status": "no_cache",
        }

    def clear_cache(self):
        """Clear the content cache"""
        try:
            if os.path.exists(self.cache_file):
                os.remove(self.cache_file)
                logger.info("Cache cleared successfully")
                return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False


# Create singleton instance
content_sync = NotionContentSync()


def auto_sync_content():
    """Function to be called periodically to sync content"""
    return content_sync.sync_all_content()


def get_cached_content():
    """Get cached content without syncing"""
    return content_sync._load_cached_content()


def initialize_default_content():
    """Initialize default content structure in Notion"""
    if not notion_cms.client:
        return False

    try:
        # Create sample services
        services_data = [
            {
                "title": "Cybersecurity Monitoring",
                "content": "Our 24/7 cybersecurity monitoring service provides comprehensive protection against digital threats. We use advanced AI and machine learning algorithms to detect and prevent attacks before they happen.",
                "category": ["Cybersecurity"],
                "featured": True,
                "priority": 1,
                "seo_description": "Professional 24/7 cybersecurity monitoring and threat detection services",
                "url_slug": "cybersecurity-monitoring",
            },
            {
                "title": "Telegram Bot Automation",
                "content": "Custom Telegram bot development for business automation. Streamline your communications, automate workflows, and enhance customer engagement through intelligent bot solutions.",
                "category": ["Automation"],
                "featured": True,
                "priority": 2,
                "seo_description": "Custom Telegram bot development and automation services",
                "url_slug": "telegram-bot-automation",
            },
            {
                "title": "Real Estate Investment Advisory",
                "content": "Expert real estate investment guidance through our partnership with Alliance Trust Realty LLC. We provide comprehensive market analysis, property valuation, and investment strategies.",
                "category": ["Real Estate", "Investment"],
                "featured": True,
                "priority": 3,
                "seo_description": "Professional real estate investment advisory and portfolio management",
                "url_slug": "real-estate-investment",
            },
            {
                "title": "Power of Attorney Services",
                "content": "Complete power of attorney documentation and legal services. We assist with financial, medical, and general power of attorney preparations with full legal compliance.",
                "category": ["Legal Services"],
                "priority": 4,
                "seo_description": "Power of attorney documentation and legal services",
                "url_slug": "power-of-attorney",
            },
            {
                "title": "Asset Recovery Services",
                "content": "Professional asset recovery and investigation services. We help individuals and businesses recover lost or stolen assets through legal channels and advanced investigation techniques.",
                "category": ["Recovery", "Legal Services"],
                "priority": 5,
                "seo_description": "Professional asset recovery and investigation services",
                "url_slug": "asset-recovery",
            },
        ]

        # Create services
        for service in services_data:
            notion_cms.create_content(
                title=service["title"],
                content_type="Service",
                content=service["content"],
                status="Published",
                **service,
            )

        # Create sample news
        news_data = [
            {
                "title": "GEM Enterprise Expands Cybersecurity Division",
                "content": "We are excited to announce the expansion of our cybersecurity division with new threat intelligence capabilities and expert team members joining our ranks.",
                "category": ["Cybersecurity"],
                "author": "GEM Enterprise Team",
                "publish_date": datetime.now().isoformat(),
                "featured": True,
                "priority": 1,
            },
            {
                "title": "New Partnership with Alliance Trust Realty LLC",
                "content": "GEM Enterprise is proud to announce our strategic partnership with Alliance Trust Realty LLC, expanding our real estate and investment services.",
                "category": ["Real Estate", "Investment"],
                "author": "GEM Enterprise Team",
                "publish_date": datetime.now().isoformat(),
                "priority": 2,
            },
        ]

        for news in news_data:
            notion_cms.create_content(
                title=news["title"],
                content_type="News",
                content=news["content"],
                status="Published",
                **news,
            )

        # Create sample testimonials
        testimonials_data = [
            {
                "title": "Outstanding Security Services",
                "content": "GEM Enterprise has transformed our security posture. Their 24/7 monitoring and rapid response team have prevented multiple incidents. Highly recommended!",
                "author": "John Smith, CEO of TechCorp",
                "category": ["Cybersecurity"],
                "featured": True,
                "priority": 1,
            },
            {
                "title": "Excellent Real Estate Guidance",
                "content": "The investment advisory team at GEM Enterprise helped us build a profitable real estate portfolio. Their market insights are invaluable.",
                "author": "Sarah Johnson, Investment Manager",
                "category": ["Real Estate", "Investment"],
                "priority": 2,
            },
        ]

        for testimonial in testimonials_data:
            notion_cms.create_content(
                title=testimonial["title"],
                content_type="Testimonial",
                content=testimonial["content"],
                status="Published",
                **testimonial,
            )

        logger.info("Default content initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Error initializing default content: {e}")
        return False
