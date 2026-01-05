"""
GitHub OAuth Authentication Module for GEM Enterprise
Handles secure GitHub login and user management
"""

import os
import secrets
from urllib.parse import urlencode, parse_qs
from urllib.request import urlopen
import json
import logging

logger = logging.getLogger(__name__)


class GitHubAuth:
    """GitHub OAuth 2.0 authentication handler"""

    def __init__(self):
        self.client_id = os.environ.get("GITHUB_OAUTH_CLIENT_ID")
        self.client_secret = os.environ.get("GITHUB_OAUTH_CLIENT_SECRET")
        self.authorize_url = "https://github.com/login/oauth/authorize"
        self.token_url = "https://github.com/login/oauth/access_token"
        self.user_url = "https://api.github.com/user"

        if not self.client_id or not self.client_secret:
            logger.warning("GitHub OAuth credentials not configured")

    def is_configured(self):
        """Check if GitHub OAuth is properly configured"""
        return bool(self.client_id and self.client_secret)

    def get_authorize_url(self, redirect_uri, state=None):
        """Generate GitHub OAuth authorization URL"""
        if not self.is_configured():
            return None

        if state is None:
            state = secrets.token_urlsafe(32)

        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": "user:email read:user",
            "allow_signup": "true",
        }

        return f"{self.authorize_url}?{urlencode(params)}", state

    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        if not self.is_configured():
            return None

        try:
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "accept": "application/json",
            }

            req = urlopen(self.token_url, urlencode(data).encode("utf-8"), timeout=10)

            response = json.loads(req.read())
            return response.get("access_token")
        except Exception as e:
            logger.error(f"Error exchanging code for token: {e}")
            return None

    def get_user_info(self, access_token):
        """Get authenticated user's GitHub information"""
        if not access_token:
            return None

        try:
            from urllib.request import Request

            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
            }

            req = Request(self.user_url, headers=headers)
            response = urlopen(req, timeout=10)

            user_data = json.loads(response.read())
            return {
                "id": user_data.get("id"),
                "login": user_data.get("login"),
                "name": user_data.get("name"),
                "email": user_data.get("email"),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
                "company": user_data.get("company"),
                "location": user_data.get("location"),
                "public_repos": user_data.get("public_repos"),
                "followers": user_data.get("followers"),
                "following": user_data.get("following"),
            }
        except Exception as e:
            logger.error(f"Error fetching user info: {e}")
            return None


# Global instance
github_auth = GitHubAuth()
