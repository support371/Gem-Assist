# Vercel & Cloudflare Troubleshooting Guide

This guide provides solutions for common issues encountered when deploying GEM Enterprise to Vercel and managing DNS via Cloudflare.

## 1. Logging into Vercel with GitHub

If you are having trouble logging into your Vercel account:

1.  **Direct Login:** Go to [vercel.com/login](https://vercel.com/login).
2.  **Authentication:** Click the **"Continue with GitHub"** button.
3.  **Account Selection:** Ensure you are logged into the correct GitHub account in your browser before clicking the button.
4.  **Pro Tip:** Use an **Incognito/Private window** if you have multiple GitHub accounts and want to ensure you're using the right one.

## 2. Fixing Cloudflare Error 1000 ("DNS points to prohibited IP")

This error is common when using a custom domain with Vercel while having Cloudflare's proxy enabled. It happens because both Vercel and Cloudflare use similar edge infrastructure, causing a routing loop.

### How to Fix:
1.  Log in to your **Cloudflare Dashboard**.
2.  Select your domain: `gemcybersecurityassist.com`.
3.  Go to the **DNS** settings page.
4.  Locate the **A** or **CNAME** records pointing to Vercel (usually the root `@` and `www`).
5.  Change the **Proxy status** from **"Proxied" (Orange Cloud)** to **"DNS Only" (Grey Cloud)**.
6.  Save the changes. It may take a few minutes for the DNS to update globally.

## 3. Resetting or Terminating Vercel Usage

If you need to delete a project or start over with a different account:

### To Delete a Project:
1.  Go to your **Vercel Dashboard**.
2.  Select the project you wish to remove.
3.  Navigate to **Settings** > **Advanced**.
4.  Scroll to the bottom and click **"Delete Project"**. Follow the confirmation prompts.

### To Disconnect a GitHub Repository:
1.  In the project **Settings**, go to the **Git** section.
2.  Click **"Disconnect"** to remove the link between Vercel and your GitHub repository.

### To Move to a New Account:
1.  Delete the project from the current Vercel account as described above.
2.  Log out of Vercel.
3.  Log in with your new account (using GitHub).
4.  Import the repository and set up the domain again. Remember to update the DNS in Cloudflare if the Vercel deployment IP/CNAME changes.
