# GEM Enterprise

GEM Enterprise is a comprehensive web application that provides a range of services, including cybersecurity, real estate, and automated Telegram bot workflows. The application is built with a Python Flask backend, a JavaScript frontend, and integrates with various third-party services like Notion for content management.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)

## Features

- **Cybersecurity Services**: Provides threat monitoring and other cybersecurity services.
- **Real Estate Services**: Offers real estate investment advisory and property management.
- **Telegram Bot Automation**: Implements specialized Telegram bots for various business operations.
- **Notion as a CMS**: Uses Notion for content management, allowing for easy updates to website content.
- **AI-Powered Media Generation**: Includes a media server for generating images, videos, and text-to-speech audio.
- **Database Integration**: Uses SQLAlchemy for database operations, with models for testimonials, contact submissions, and more.

## Architecture

The application is composed of a Python Flask backend and a JavaScript frontend. The backend is responsible for handling business logic, serving web pages, and interacting with the database and external APIs. The frontend is built with standard HTML, CSS, and JavaScript.

- **Backend**: Python (Flask)
- **Frontend**: JavaScript, HTML, CSS
- **Database**: SQLAlchemy (compatible with PostgreSQL, SQLite, etc.)
- **Third-Party Integrations**:
  - Notion
  - Telegram
  - OpenAI
  - ElevenLabs
  - Replicate
  - Twilio
  - AWS S3

## Setup

### Prerequisites

- Python 3.8+
- Node.js and npm
- A Notion account and API key
- A Telegram account and bot token
- API keys for other third-party services (OpenAI, ElevenLabs, etc.)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory and add the necessary environment variables. You can use `.env.example` as a template.

## Usage

### Running the Application

1. **Start the Flask backend**:
   ```bash
   python app.py
   ```

2. **Start the media server**:
   ```bash
   node server-media.js
   ```

The application will be available at `http://localhost:5000`.

## Project Structure

```
.
├── app.py                  # Main Flask application
├── gem_notion_client.py    # Notion client for leadership data
├── gem_telegram_workflows.py # Telegram bot workflows
├── main.py                 # Entry point for the application
├── media_server.py         # Media generation server (Python)
├── models.py               # SQLAlchemy database models
├── notion_cms.py           # Notion CMS integration
├── notion_content_sync.py  # Notion content synchronization
├── rss_aggregator.py       # RSS feed aggregator
├── server-media.js         # Media generation server (JavaScript)
├── static/                 # Static assets (CSS, JS, images)
├── templates/              # HTML templates
├── package.json            # Node.js dependencies
└── requirements.txt        # Python dependencies
```
