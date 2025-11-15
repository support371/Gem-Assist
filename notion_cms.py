"""
This module provides a comprehensive content management system (CMS) using
Notion as a backend. It includes the `NotionCMS` class, which handles the
connection to Notion, content creation, retrieval, and management. It also
provides standalone functions for easy access to different types of content.
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    from notion_client import Client
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False
    Client = None

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class NotionCMS:
    """
    A complete Notion-based CMS for managing website content.

    This class handles the connection to the Notion API, provides methods for
    creating and managing content databases, and allows for the creation,
    retrieval, and updating of content within a Notion database.
    """
    
    def __init__(self):
        """
        Initializes the NotionCMS instance.

        This method sets up the Notion client using the integration secret and
        database ID from the environment variables.
        """
        if not NOTION_AVAILABLE:
            logger.warning("Notion client not available - CMS features disabled")
            self.client = None
            return
            
        self.notion_token = os.environ.get('NOTION_INTEGRATION_SECRET')
        self.database_id = os.environ.get('NOTION_DATABASE_ID')
        
        if not self.notion_token:
            logger.warning("Notion integration secret not found")
            self.client = None
            return
            
        self.client = Client(auth=self.notion_token)
        logger.info("Notion CMS initialized successfully")
    
    def create_content_database(self, name: str, parent_page_id: Optional[str] = None) -> Optional[str]:
        """
        Create a new database for content management.

        Args:
            name (str): The name of the new database.
            parent_page_id (Optional[str], optional): The ID of the parent page
                                                      for the new database.
                                                      Defaults to None.

        Returns:
            Optional[str]: The ID of the newly created database, or None if an
                           error occurred.
        """
        if not self.client:
            return None
            
        try:
            # Create database with comprehensive schema
            database = self.client.databases.create(
                parent={"type": "page_id", "page_id": parent_page_id} if parent_page_id else {"type": "workspace", "workspace": True},
                title=[{
                    "type": "text",
                    "text": {"content": name}
                }],
                properties={
                    "Title": {
                        "title": {}
                    },
                    "Content Type": {
                        "select": {
                            "options": [
                                {"name": "Service", "color": "blue"},
                                {"name": "News", "color": "green"},
                                {"name": "Testimonial", "color": "purple"},
                                {"name": "Team Member", "color": "yellow"},
                                {"name": "Case Study", "color": "orange"},
                                {"name": "FAQ", "color": "pink"},
                                {"name": "Resource", "color": "gray"}
                            ]
                        }
                    },
                    "Status": {
                        "select": {
                            "options": [
                                {"name": "Draft", "color": "gray"},
                                {"name": "Published", "color": "green"},
                                {"name": "Archived", "color": "red"}
                            ]
                        }
                    },
                    "Category": {
                        "multi_select": {
                            "options": [
                                {"name": "Cybersecurity", "color": "blue"},
                                {"name": "Real Estate", "color": "green"},
                                {"name": "Automation", "color": "purple"},
                                {"name": "Legal Services", "color": "red"},
                                {"name": "Investment", "color": "yellow"},
                                {"name": "Recovery", "color": "orange"}
                            ]
                        }
                    },
                    "Priority": {
                        "number": {}
                    },
                    "Author": {
                        "rich_text": {}
                    },
                    "Publish Date": {
                        "date": {}
                    },
                    "Featured": {
                        "checkbox": {}
                    },
                    "SEO Description": {
                        "rich_text": {}
                    },
                    "Tags": {
                        "multi_select": {
                            "options": []
                        }
                    },
                    "URL Slug": {
                        "rich_text": {}
                    },
                    "Image URL": {
                        "url": {}
                    },
                    "External Link": {
                        "url": {}
                    }
                }
            )
            
            logger.info(f"Created database: {name}")
            return database['id']
            
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            return None
    
    def get_content(self, content_type: Optional[str] = None, status: str = "Published") -> List[Dict]:
        """
        Fetch content from the Notion database.

        Args:
            content_type (Optional[str], optional): The type of content to
                                                      fetch. Defaults to None.
            status (str, optional): The status of the content to fetch.
                                    Defaults to "Published".

        Returns:
            List[Dict]: A list of dictionaries, where each dictionary
                        represents a content item.
        """
        if not self.client or not self.database_id:
            return []
            
        try:
            filters = []
            
            # Add status filter
            if status:
                filters.append({
                    "property": "Status",
                    "select": {
                        "equals": status
                    }
                })
            
            # Add content type filter
            if content_type:
                filters.append({
                    "property": "Content Type",
                    "select": {
                        "equals": content_type
                    }
                })
            
            # Build query
            query_params = {
                "database_id": self.database_id,
                "sorts": [
                    {
                        "property": "Priority",
                        "direction": "ascending"
                    },
                    {
                        "property": "Publish Date",
                        "direction": "descending"
                    }
                ]
            }
            
            # Add filters if any
            if filters:
                if len(filters) == 1:
                    query_params["filter"] = filters[0]
                else:
                    query_params["filter"] = {
                        "and": filters
                    }
            
            response = self.client.databases.query(**query_params)
            
            content = []
            for page in response['results']:
                content_item = self._extract_content(page)
                if content_item:
                    content.append(content_item)
            
            logger.info(f"Fetched {len(content)} content items")
            return content
            
        except Exception as e:
            logger.error(f"Error fetching content: {e}")
            return []
    
    def get_services_content(self) -> List[Dict]:
        """
        Get all service-related content from the Notion database.

        Returns:
            List[Dict]: A list of dictionaries representing the services.
        """
        return self.get_content(content_type="Service")
    
    def get_news_content(self) -> List[Dict]:
        """
        Get all news and updates from the Notion database.

        Returns:
            List[Dict]: A list of dictionaries representing the news articles.
        """
        return self.get_content(content_type="News")
    
    def get_testimonials(self) -> List[Dict]:
        """
        Get all testimonials from the Notion database.

        Returns:
            List[Dict]: A list of dictionaries representing the testimonials.
        """
        return self.get_content(content_type="Testimonial")
    
    def get_team_members(self) -> List[Dict]:
        """
        Get all team member profiles from the Notion database.

        Returns:
            List[Dict]: A list of dictionaries representing the team members.
        """
        return self.get_content(content_type="Team Member")
    
    def get_featured_content(self) -> List[Dict]:
        """
        Get all featured content across all content types.

        Returns:
            List[Dict]: A list of dictionaries representing the featured content.
        """
        if not self.client or not self.database_id:
            return []
            
        try:
            response = self.client.databases.query(
                database_id=self.database_id,
                filter={
                    "and": [
                        {
                            "property": "Featured",
                            "checkbox": {
                                "equals": True
                            }
                        },
                        {
                            "property": "Status",
                            "select": {
                                "equals": "Published"
                            }
                        }
                    ]
                },
                sorts=[
                    {
                        "property": "Priority",
                        "direction": "ascending"
                    }
                ]
            )
            
            featured = []
            for page in response['results']:
                item = self._extract_content(page)
                if item:
                    featured.append(item)
            
            return featured
            
        except Exception as e:
            logger.error(f"Error fetching featured content: {e}")
            return []
    
    def create_content(self, title: str, content_type: str, content: str, **kwargs) -> Optional[str]:
        """
        Create a new content page in the Notion database.

        Args:
            title (str): The title of the new content.
            content_type (str): The type of the new content.
            content (str): The main content of the new page.
            **kwargs: Additional properties for the new page.

        Returns:
            Optional[str]: The ID of the newly created page, or None if an
                           error occurred.
        """
        if not self.client or not self.database_id:
            return None
            
        try:
            properties = {
                "Title": {
                    "title": [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                },
                "Content Type": {
                    "select": {
                        "name": content_type
                    }
                },
                "Status": {
                    "select": {
                        "name": kwargs.get('status', 'Draft')
                    }
                }
            }
            
            # Add optional properties
            if 'author' in kwargs:
                properties["Author"] = {
                    "rich_text": [
                        {
                            "text": {
                                "content": kwargs['author']
                            }
                        }
                    ]
                }
            
            if 'category' in kwargs:
                properties["Category"] = {
                    "multi_select": [
                        {"name": cat} for cat in kwargs['category']
                    ]
                }
            
            if 'priority' in kwargs:
                properties["Priority"] = {
                    "number": kwargs['priority']
                }
            
            if 'featured' in kwargs:
                properties["Featured"] = {
                    "checkbox": kwargs['featured']
                }
            
            if 'seo_description' in kwargs:
                properties["SEO Description"] = {
                    "rich_text": [
                        {
                            "text": {
                                "content": kwargs['seo_description']
                            }
                        }
                    ]
                }
            
            if 'publish_date' in kwargs:
                properties["Publish Date"] = {
                    "date": {
                        "start": kwargs['publish_date']
                    }
                }
            
            # Create the page
            new_page = self.client.pages.create(
                parent={"database_id": self.database_id},
                properties=properties,
                children=[
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {
                                        "content": content
                                    }
                                }
                            ]
                        }
                    }
                ]
            )
            
            logger.info(f"Created content: {title}")
            return new_page['id']
            
        except Exception as e:
            logger.error(f"Error creating content: {e}")
            return None
    
    def update_content(self, page_id: str, **updates) -> bool:
        """
        Update an existing content page in the Notion database.

        Args:
            page_id (str): The ID of the page to update.
            **updates: The properties to update.

        Returns:
            bool: True if the update was successful, False otherwise.
        """
        if not self.client:
            return False
            
        try:
            properties = {}
            
            if 'title' in updates:
                properties["Title"] = {
                    "title": [
                        {
                            "text": {
                                "content": updates['title']
                            }
                        }
                    ]
                }
            
            if 'status' in updates:
                properties["Status"] = {
                    "select": {
                        "name": updates['status']
                    }
                }
            
            if 'featured' in updates:
                properties["Featured"] = {
                    "checkbox": updates['featured']
                }
            
            if properties:
                self.client.pages.update(
                    page_id=page_id,
                    properties=properties
                )
                logger.info(f"Updated content: {page_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating content: {e}")
            return False
    
    def _extract_content(self, page: Dict) -> Optional[Dict]:
        """
        Extract content from a Notion page object.

        Args:
            page (Dict): The Notion page object.

        Returns:
            Optional[Dict]: A dictionary containing the extracted content, or
                            None if an error occurred.
        """
        try:
            properties = page['properties']
            
            content = {
                'id': page['id'],
                'title': self._get_property(properties, 'Title', 'title'),
                'content_type': self._get_property(properties, 'Content Type', 'select'),
                'status': self._get_property(properties, 'Status', 'select'),
                'category': self._get_property(properties, 'Category', 'multi_select'),
                'author': self._get_property(properties, 'Author', 'rich_text'),
                'priority': self._get_property(properties, 'Priority', 'number'),
                'featured': self._get_property(properties, 'Featured', 'checkbox'),
                'seo_description': self._get_property(properties, 'SEO Description', 'rich_text'),
                'publish_date': self._get_property(properties, 'Publish Date', 'date'),
                'tags': self._get_property(properties, 'Tags', 'multi_select'),
                'url_slug': self._get_property(properties, 'URL Slug', 'rich_text'),
                'image_url': self._get_property(properties, 'Image URL', 'url'),
                'external_link': self._get_property(properties, 'External Link', 'url'),
                'created_time': page.get('created_time'),
                'last_edited_time': page.get('last_edited_time')
            }
            
            # Get page content (blocks)
            try:
                blocks = self.client.blocks.children.list(block_id=page['id'])
                content['content'] = self._extract_blocks_content(blocks['results'])
            except:
                content['content'] = ""
            
            return content
            
        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            return None
    
    def _extract_blocks_content(self, blocks: List[Dict]) -> str:
        """
        Extract text content from a list of Notion blocks.

        Args:
            blocks (List[Dict]): A list of Notion block objects.

        Returns:
            str: The extracted text content.
        """
        content = []
        
        for block in blocks:
            block_type = block['type']
            
            if block_type == 'paragraph':
                text = self._get_text_from_block(block['paragraph'])
                if text:
                    content.append(text)
            elif block_type == 'heading_1':
                text = self._get_text_from_block(block['heading_1'])
                if text:
                    content.append(f"# {text}")
            elif block_type == 'heading_2':
                text = self._get_text_from_block(block['heading_2'])
                if text:
                    content.append(f"## {text}")
            elif block_type == 'heading_3':
                text = self._get_text_from_block(block['heading_3'])
                if text:
                    content.append(f"### {text}")
            elif block_type == 'bulleted_list_item':
                text = self._get_text_from_block(block['bulleted_list_item'])
                if text:
                    content.append(f"• {text}")
            elif block_type == 'numbered_list_item':
                text = self._get_text_from_block(block['numbered_list_item'])
                if text:
                    content.append(f"- {text}")
            elif block_type == 'quote':
                text = self._get_text_from_block(block['quote'])
                if text:
                    content.append(f"> {text}")
        
        return "\n\n".join(content)
    
    def _get_text_from_block(self, block_data: Dict) -> str:
        """
        Extract text from a Notion block's data.

        Args:
            block_data (Dict): The data of the Notion block.

        Returns:
            str: The extracted text.
        """
        if 'rich_text' in block_data:
            return ''.join([text['plain_text'] for text in block_data['rich_text']])
        return ""
    
    def _get_property(self, properties: Dict, name: str, prop_type: str) -> Any:
        """
        Get the value of a property from a Notion page's properties.

        Args:
            properties (Dict): The properties of the Notion page.
            name (str): The name of the property.
            prop_type (str): The type of the property.

        Returns:
            Any: The value of the property, or None if not found.
        """
        if name not in properties:
            return None
            
        prop = properties[name]
        
        if prop_type == 'title' and prop.get('title'):
            return ''.join([text['plain_text'] for text in prop['title']])
        elif prop_type == 'rich_text' and prop.get('rich_text'):
            return ''.join([text['plain_text'] for text in prop['rich_text']])
        elif prop_type == 'select' and prop.get('select'):
            return prop['select']['name']
        elif prop_type == 'multi_select' and prop.get('multi_select'):
            return [option['name'] for option in prop['multi_select']]
        elif prop_type == 'number':
            return prop.get('number')
        elif prop_type == 'checkbox':
            return prop.get('checkbox', False)
        elif prop_type == 'date' and prop.get('date'):
            return prop['date'].get('start')
        elif prop_type == 'url':
            return prop.get('url')
        elif prop_type == 'email':
            return prop.get('email')
        
        return None

# Singleton instance
notion_cms = NotionCMS()

def get_services_from_notion():
    """
    Get services content from Notion.

    Returns:
        List[Dict]: A list of dictionaries representing the services.
    """
    return notion_cms.get_services_content()

def get_news_from_notion():
    """
    Get news content from Notion.

    Returns:
        List[Dict]: A list of dictionaries representing the news articles.
    """
    return notion_cms.get_news_content()

def get_testimonials_from_notion():
    """
    Get testimonials from Notion.

    Returns:
        List[Dict]: A list of dictionaries representing the testimonials.
    """
    return notion_cms.get_testimonials()

def get_featured_content():
    """
    Get featured content from Notion.

    Returns:
        List[Dict]: A list of dictionaries representing the featured content.
    """
    return notion_cms.get_featured_content()

def create_sample_content():
    """
    Create sample content in Notion for demonstration purposes.

    Returns:
        bool: True if the sample content was created successfully, False
              otherwise.
    """
    if not notion_cms.client:
        return False
    
    try:
        # Create sample service content
        notion_cms.create_content(
            title="Advanced Threat Monitoring",
            content_type="Service",
            content="Our 24/7 threat monitoring service provides comprehensive protection against cyber threats. We use advanced AI and machine learning to detect and prevent attacks before they happen.",
            status="Published",
            category=["Cybersecurity"],
            featured=True,
            priority=1,
            seo_description="Professional 24/7 threat monitoring and cybersecurity services"
        )
        
        # Create sample news
        notion_cms.create_content(
            title="GEM Enterprise Expands Cybersecurity Division",
            content_type="News",
            content="We are excited to announce the expansion of our cybersecurity division with new threat intelligence capabilities and expert team members.",
            status="Published",
            category=["Cybersecurity"],
            author="GEM Enterprise Team",
            publish_date=datetime.now().isoformat()
        )
        
        # Create sample testimonial
        notion_cms.create_content(
            title="Outstanding Security Services",
            content_type="Testimonial",
            content="GEM Enterprise has transformed our security posture. Their team is professional, responsive, and highly skilled.",
            status="Published",
            author="John Smith, CEO of TechCorp",
            featured=True,
            priority=1
        )
        
        logger.info("Sample content created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating sample content: {e}")
        return False
