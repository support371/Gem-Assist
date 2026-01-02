"""
Vercel serverless function wrapper for GEM Enterprise Flask application
This file allows the Flask app to run as a Vercel serverless function
"""

import os
import sys

# Add parent directory to path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app
from app import app

# Vercel expects a WSGI application
handler = app
