import os
import logging
try:
    from notion_client import Client
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False
    Client = None

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class NotionLeadershipClient:
    def __init__(self):
        if not NOTION_AVAILABLE:
            raise ImportError("Notion client not available")
            
        self.notion_token = os.environ.get('NOTION_INTEGRATION_SECRET')
        self.database_id = os.environ.get('NOTION_DATABASE_ID')
        
        if not self.notion_token or not self.database_id:
            raise ValueError("Notion credentials not found in environment variables")
        
        self.client = Client(auth=self.notion_token)
        logger.info(f"Notion client initialized with database ID: {self.database_id[:8]}...")

    def get_leadership_data(self):
        """Fetch leadership data from Notion database"""
        try:
            # Query the database
            response = self.client.databases.query(
                database_id=self.database_id,
                sorts=[
                    {
                        "property": "Order",
                        "direction": "ascending"
                    }
                ] if self._has_property("Order") else []
            )
            
            leadership_data = []
            
            for page in response['results']:
                leader_info = self._extract_leader_info(page)
                if leader_info:
                    leadership_data.append(leader_info)
            
            logger.info(f"Successfully fetched {len(leadership_data)} leadership entries")
            return leadership_data
            
        except Exception as e:
            logger.error(f"Error fetching leadership data: {str(e)}")
            return []

    def _extract_leader_info(self, page):
        """Extract leader information from a Notion page"""
        try:
            properties = page['properties']
            
            # Get leader information
            leader = {
                'id': page['id'],
                'name': self._get_title_property(properties, ['Name', 'Full Name', 'Title']),
                'position': self._get_text_property(properties, ['Position', 'Title', 'Role']),
                'bio': self._get_text_property(properties, ['Bio', 'Biography', 'Description']),
                'email': self._get_email_property(properties, ['Email', 'Contact']),
                'linkedin': self._get_url_property(properties, ['LinkedIn', 'LinkedIn URL']),
                'experience': self._get_text_property(properties, ['Experience', 'Years Experience']),
                'expertise': self._get_multi_select_property(properties, ['Expertise', 'Specialties', 'Skills']),
                'order': self._get_number_property(properties, ['Order', 'Sort Order']),
                'photo_url': self._get_file_property(properties, ['Photo', 'Image', 'Picture']),
                'featured': self._get_checkbox_property(properties, ['Featured', 'Is Featured']),
                'status': self._get_select_property(properties, ['Status', 'Active']),
                'created_time': page.get('created_time'),
                'last_edited_time': page.get('last_edited_time')
            }
            
            # Only return if we have at least a name
            if leader['name']:
                return leader
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting leader info: {str(e)}")
            return None

    def _get_title_property(self, properties, possible_names):
        """Get title property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'title' and prop['title']:
                    return ''.join([text['plain_text'] for text in prop['title']])
        return ''

    def _get_text_property(self, properties, possible_names):
        """Get rich text property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'rich_text' and prop['rich_text']:
                    return ''.join([text['plain_text'] for text in prop['rich_text']])
        return ''

    def _get_email_property(self, properties, possible_names):
        """Get email property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'email':
                    return prop['email']
        return ''

    def _get_url_property(self, properties, possible_names):
        """Get URL property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'url':
                    return prop['url']
        return ''

    def _get_number_property(self, properties, possible_names):
        """Get number property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'number':
                    return prop['number']
        return 0

    def _get_select_property(self, properties, possible_names):
        """Get select property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'select' and prop['select']:
                    return prop['select']['name']
        return ''

    def _get_multi_select_property(self, properties, possible_names):
        """Get multi-select property values"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'multi_select':
                    return [option['name'] for option in prop['multi_select']]
        return []

    def _get_checkbox_property(self, properties, possible_names):
        """Get checkbox property value"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'checkbox':
                    return prop['checkbox']
        return False

    def _get_file_property(self, properties, possible_names):
        """Get file property URL"""
        for name in possible_names:
            if name in properties:
                prop = properties[name]
                if prop['type'] == 'files' and prop['files']:
                    # Return the first file URL
                    return prop['files'][0]['file']['url'] if prop['files'][0]['type'] == 'file' else prop['files'][0]['external']['url']
        return ''

    def _has_property(self, property_name):
        """Check if database has a specific property"""
        try:
            db_info = self.client.databases.retrieve(database_id=self.database_id)
            return property_name in db_info['properties']
        except:
            return False

    def get_database_schema(self):
        """Get database schema for debugging"""
        try:
            db_info = self.client.databases.retrieve(database_id=self.database_id)
            schema = {}
            for prop_name, prop_info in db_info['properties'].items():
                schema[prop_name] = prop_info['type']
            return schema
        except Exception as e:
            logger.error(f"Error getting database schema: {str(e)}")
            return {}

# Initialize the client
def get_notion_client():
    try:
        if not NOTION_AVAILABLE:
            logger.warning("Notion client not available")
            return None
        return NotionLeadershipClient()
    except Exception as e:
        logger.error(f"Failed to initialize Notion client: {str(e)}")
        return None

# Standalone function for getting leadership data
def get_leadership_data_from_notion():
    """Get leadership data from Notion database"""
    client = get_notion_client()
    if client:
        return client.get_leadership_data()
    return []