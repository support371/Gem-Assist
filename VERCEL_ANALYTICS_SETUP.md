# Getting Started with Vercel Web Analytics

This guide helps you get started with Vercel Web Analytics on the Gem-Assist project. It covers enabling analytics, understanding the current implementation, deploying your app to Vercel, and viewing your data in the dashboard.

## Prerequisites

- A Vercel account. If you don't have one, you can [sign up for free](https://vercel.com/signup).
- A Vercel project. If you don't have one, you can [create a new project](https://vercel.com/new).
- The Vercel CLI installed. If you don't have it, you can install it using the following command:

```bash
# Using npm
npm install vercel

# Using yarn
yarn add vercel

# Using pnpm
pnpm add vercel

# Using bun
bun add vercel
```

## Enable Web Analytics in Vercel

1. Visit the [Vercel dashboard](/dashboard)
2. Select your Project
3. Click the **Analytics** tab
4. Click **Enable** from the dialog

> **💡 Note:** Enabling Web Analytics will add new routes (scoped at `/_vercel/insights/*`) after your next deployment.

## Current Implementation in Gem-Assist

The Gem-Assist project already has Vercel Analytics integrated. Here's what's already set up:

### Package Installation

The `@vercel/analytics` package is already included in `package.json`:

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.6.1"
  }
}
```

### Client-Side Integration

The analytics are integrated on the client side through a dedicated JavaScript module at `static/js/vercel-analytics.js`.

**How it works:**

```javascript
/**
 * Vercel Web Analytics Integration
 *
 * This module initializes Vercel Web Analytics on the client side.
 * It must run on the client side and does not include route support.
 *
 * Reference: https://vercel.com/docs/analytics
 */

(function () {
  "use strict";

  /**
   * Initialize Vercel Web Analytics
   * This function dynamically imports and injects the analytics
   */
  function initVercelAnalytics() {
    // Import the inject function from @vercel/analytics
    import("@vercel/analytics")
      .then(function (module) {
        // Call the inject function to initialize analytics
        if (module.inject && typeof module.inject === "function") {
          module.inject();
          console.log("Vercel Web Analytics initialized successfully");
        } else {
          console.warn("Vercel Analytics inject function not found");
        }
      })
      .catch(function (error) {
        console.warn("Failed to load Vercel Analytics:", error);
        // Analytics failure should not break the application
      });
  }

  /**
   * Initialize when DOM is ready or immediately if already loaded
   */
  if (document.readyState === "loading") {
    // DOM is still loading
    document.addEventListener("DOMContentLoaded", initVercelAnalytics);
  } else {
    // DOM is already loaded
    initVercelAnalytics();
  }
})();
```

**Key Features:**

- ✅ Uses dynamic imports for better performance
- ✅ Handles both DOM loading states (early and late initialization)
- ✅ Includes error handling to prevent analytics failures from breaking the app
- ✅ Provides console logging for debugging

### Integration in Templates

The analytics script is loaded in the main template (`templates/base.html`) at the bottom of the page:

```html
<!-- Vercel Web Analytics -->
<script src="{{ url_for('static', filename='js/vercel-analytics.js') }}"></script>
```

This ensures analytics are loaded after all page content and other scripts, improving page load performance.

## Deploying Your App to Vercel

### Using Git Connection (Recommended)

1. [Connect your GitHub repository to Vercel](/docs/git#deploying-a-git-repository)
2. Vercel will automatically deploy your latest commits to main
3. Your app will start tracking visitors and page views after deployment

### Using Vercel CLI

Deploy your app using:

```bash
vercel deploy
```

### Verification After Deployment

After deployment, verify that analytics are working:

1. Visit any page of your app
2. Open your browser's Developer Tools (F12 or Ctrl+Shift+I)
3. Go to the **Network** tab
4. You should see a Fetch/XHR request to `/_vercel/insights/view`

This confirms analytics are being collected.

## Viewing Your Data in the Dashboard

Once your app is deployed and users have visited your site:

1. Go to your [Vercel dashboard](/dashboard)
2. Select your project
3. Click the **Analytics** tab
4. After a few days of visitors, you'll see data visualization of:
   - Page views
   - Unique visitors
   - Core Web Vitals
   - Geographic distribution
   - Device/Browser information

### Filtering Data

You can filter analytics by:

- Date range
- Device type (mobile, desktop, tablet)
- Browser
- Geographic location
- Page URL

## For Pro and Enterprise Plans

Users on Pro and Enterprise plans can add custom events to track:

- Button clicks
- Form submissions
- Purchases
- Custom user interactions

See [Custom Events Documentation](/docs/analytics/custom-events) for implementation details.

## Important Notes

- **No Route Support:** The current implementation uses the `inject()` function which does not have route support. This means analytics are collected globally but not tracked per-route.
- **Client-Side Only:** Analytics are loaded on the client side, so they require JavaScript to be enabled in user browsers.
- **Privacy Compliance:** Vercel Web Analytics is GDPR compliant. See [Privacy and Data Compliance](/docs/analytics/privacy-policy) for more details.

## Next Steps

Now that Vercel Web Analytics is set up, explore these resources:

1. [Learn about the `@vercel/analytics` package](/docs/analytics/package)
2. [Set up custom events](/docs/analytics/custom-events)
3. [Learn about filtering data](/docs/analytics/filtering)
4. [Read about privacy and compliance](/docs/analytics/privacy-policy)
5. [Explore pricing and limits](/docs/analytics/limits-and-pricing)
6. [Troubleshooting common issues](/docs/analytics/troubleshooting)

## Troubleshooting

### Analytics Not Showing

**Check the following:**

1. **Verify deployment:** Make sure your app is deployed to Vercel
2. **Check analytics are enabled:** Go to Vercel dashboard → Project → Analytics tab
3. **Check console for errors:** Open Developer Tools and check for JavaScript errors
4. **Wait for data:** Analytics may take a few minutes to appear after first deployment
5. **Check Network tab:** Verify `/_vercel/insights/view` requests are being sent

### Performance Concerns

The analytics script uses dynamic imports and lazy initialization to minimize impact on page load:

- Script loads after page content
- Uses async import to avoid blocking
- Includes error handling that doesn't break the app
- No route support keeps implementation lightweight

## Related Documentation

- [Vercel Analytics Overview](https://vercel.com/analytics)
- [Analytics Package Documentation](/docs/analytics/package)
- [Vercel CLI Documentation](/docs/cli)
- [Deployment Documentation](/docs/deployments)

---

**Last Updated:** January 2026  
**Gem-Assist Version:** Current  
**Status:** ✅ Active and Operational
