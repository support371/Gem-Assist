# Custom Domain Setup for Google Cloud Run

This document provides instructions for mapping your custom domain (`gemcybersecurityassist.com`) to your Google Cloud Run service.

## Prerequisites

1.  **Deployed Services:** Ensure that your Flask and Node.js services are successfully deployed to Google Cloud Run.
2.  **Domain Ownership:** You must have ownership of the `gemcybersecurityassist.com` domain and access to its DNS settings.

## Instructions

### 1. Add Custom Domain to Cloud Run

1.  **Go to the Cloud Run console:** [https://console.cloud.google.com/run](https://console.cloud.google.com/run)
2.  **Select your project.**
3.  **Click on "Manage custom domains".**
4.  **Click "Add mapping".**
5.  **Select the service you want to map your domain to.** This will typically be your Flask application (`gem-enterprise-flask`).
6.  **Enter the domain you want to map.** In this case, it will be `gemcybersecurityassist.com`.
7.  **Click "Continue".**
8.  **Verify domain ownership.** Google will provide you with a verification record to add to your DNS settings. This is usually a `TXT` record.

### 2. Update DNS Records

1.  **Go to your domain registrar's website.** This is where you purchased your domain (e.g., GoDaddy, Namecheap, Google Domains).
2.  **Find the DNS management page for your domain.**
3.  **Add the `TXT` record provided by Google to verify your domain ownership.**
4.  **Add the `A` and `AAAA` records provided by Google to point your domain to the Cloud Run service.** These records will look something like this:

| Type  | Host | Value           |
| :---- | :--- | :-------------- |
| A     | @    | `216.239.32.21` |
| A     | @    | `216.239.34.21` |
| A     | @    | `216.239.36.21` |
| A     | @    | `216.239.38.21` |
| AAAA  | @    | `2001:4860:4802:32::15` |
| AAAA  | @    | `2001:4860:4802:34::15` |
| AAAA  | @    | `2001:4860:4802:36::15` |
| AAAA  | @    | `2001:4860:4802:38::15` |

**Note:** The IP addresses provided by Google may be different. Use the ones provided in the Cloud Run console.

5.  **Save your changes.**

### 3. Wait for DNS Propagation

It can take up to 24 hours for DNS changes to propagate across the internet. Once the propagation is complete, your custom domain will point to your Google Cloud Run service.

## Important Notes

*   **SSL Certificate:** Google Cloud Run automatically provisions an SSL certificate for your custom domain, so you don't need to worry about setting one up yourself.
*   **Multiple Services:** If you want to route different subdomains to different services (e.g., `api.gemcybersecurityassist.com` to your Node.js media server), you can repeat the process for each subdomain.
