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
