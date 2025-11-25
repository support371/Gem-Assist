# Google Cloud Deployment Instructions

This document provides instructions for deploying the GEM Enterprise application to Google Cloud Run using Google Cloud Build.

## Prerequisites

1.  **Google Cloud Project:** Create a new Google Cloud project or use an existing one.
2.  **gcloud CLI:** Install and initialize the [Google Cloud CLI](https://cloud.google.com/sdk/install).
3.  **Enable APIs:** Enable the Cloud Build, Cloud Run, and Container Registry APIs for your project. You can do this by running the following commands:

    ```bash
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    ```

## Configuration

1.  **Project ID:** Set your Google Cloud project ID as an environment variable:

    ```bash
    export PROJECT_ID=[YOUR_PROJECT_ID]
    gcloud config set project $PROJECT_ID
    ```

2.  **Environment Variables:** Create a `.env` file in the root of the repository and add the following environment variables:

    ```
    # Flask application
    DATABASE_URL=[YOUR_DATABASE_URL]
    SESSION_SECRET=[YOUR_SESSION_SECRET]

    # Notion integration
    NOTION_INTEGRATION_SECRET=[YOUR_NOTION_INTEGRATION_SECRET]
    NOTION_DATABASE_ID=[YOUR_NOTION_DATABASE_ID]

    # Telegram integration
    TELEGRAM_BOT_TOKEN=[YOUR_TELEGRAM_BOT_TOKEN]
    GEMASSIST_BOT_TOKEN=[YOUR_GEMASSIST_BOT_TOKEN]
    GEMCYBERASSIST_BOT_TOKEN=[YOUR_GEMCYBERASSIST_BOT_TOKEN]
    CYBERGEMSECURE_BOT_TOKEN=[YOUR_CYBERGEMSECURE_BOT_TOKEN]
    REALESTATE_BOT_TOKEN=[YOUR_REALESTATE_BOT_TOKEN]
    SECURITY_CHANNEL_ID=[YOUR_SECURITY_CHANNEL_ID]
    REALESTATE_CHANNEL_ID=[YOUR_REALESTATE_CHANNEL_ID]
    CLIENT_CHANNEL_ID=[YOUR_CLIENT_CHANNEL_ID]

    # Media server
    OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
    ELEVENLABS_KEY=[YOUR_ELEVENLABS_KEY]
    REPLICATE_API_TOKEN=[YOUR_REPLICATE_API_TOKEN]
    TWILIO_SID=[YOUR_TWILIO_SID]
    TWILIO_TOKEN=[YOUR_TWILIO_TOKEN]
    TWILIO_PHONE=[YOUR_TWILIO_PHONE]
    AWS_ACCESS_KEY_ID=[YOUR_AWS_ACCESS_KEY_ID]
    AWS_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET_ACCESS_KEY]
    AWS_BUCKET_NAME=[YOUR_AWS_BUCKET_NAME]
    AWS_REGION=[YOUR_AWS_REGION]
    ```

## Deployment

1.  **Submit the build:** Trigger the deployment by submitting the build to Google Cloud Build:

    ```bash
    gcloud builds submit --config cloudbuild.yaml .
    ```

    This command will build the Docker images for both the Flask and Node.js services, push them to Google Container Registry, and deploy them to Google Cloud Run.

2.  **Verify the deployment:** Once the build is complete, you can find the URLs for your deployed services in the Google Cloud Console under the Cloud Run section.

## Accessing the Services

*   **Flask Application:** `https://gem-enterprise-flask-[HASH]-[REGION].a.run.app`
*   **Node.js Media Server:** `https://gem-enterprise-node-[HASH]-[REGION].a.run.app`

Replace `[HASH]` and `[REGION]` with the values from your deployment.
