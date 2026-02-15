/**
 * Notion CMS JavaScript Module
 * Handles dynamic content management and interactions
 */

// Notion CMS Manager
const NotionCMS = {
  // Initialize the CMS features
  init: function () {
    this.setupEventListeners();
    this.checkSyncStatus();
  },

  // Setup event listeners
  setupEventListeners: function () {
    // Sync button
    const syncBtn = document.getElementById("syncNotionContent");
    if (syncBtn) {
      syncBtn.addEventListener("click", () => this.syncContent());
    }

    // Auto-sync toggle
    const autoSyncToggle = document.getElementById("autoSyncToggle");
    if (autoSyncToggle) {
      autoSyncToggle.addEventListener("change", (e) => {
        this.toggleAutoSync(e.target.checked);
      });
    }

    // Clear cache button
    const clearCacheBtn = document.getElementById("clearCacheBtn");
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener("click", () => this.clearCache());
    }
  },

  // Sync content from Notion
  syncContent: async function () {
    const btn = document.getElementById("syncNotionContent");
    const originalText = btn ? btn.innerHTML : "";

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Syncing...';
    }

    try {
      const response = await fetch("/api/notion/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification("Content synced successfully!", "success");
        this.updateContentStats(data.content_counts);

        // Reload page after successful sync
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        this.showNotification(
          "Error syncing content: " + (data.error || "Unknown error"),
          "error",
        );
      }
    } catch (error) {
      this.showNotification("Network error: " + error.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  // Clear cached content
  clearCache: async function () {
    if (!confirm("Are you sure you want to clear the content cache?")) {
      return;
    }

    try {
      const response = await fetch("/api/notion/clear-cache", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification("Cache cleared successfully!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        this.showNotification(
          "Failed to clear cache: " + (data.message || "Unknown error"),
          "warning",
        );
      }
    } catch (error) {
      this.showNotification("Error: " + error.message, "error");
    }
  },

  // Check sync status
  checkSyncStatus: async function () {
    try {
      const response = await fetch("/api/notion/cached-content");
      const data = await response.json();

      if (data.last_sync) {
        this.updateSyncStatus(data.last_sync, data.sync_status);
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
    }
  },

  // Update sync status display
  updateSyncStatus: function (lastSync, status) {
    const statusElement = document.getElementById("syncStatus");
    if (statusElement) {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const timeDiff = Math.floor((now - syncDate) / 1000 / 60); // minutes

      let statusText = `Last sync: ${timeDiff} minutes ago`;
      if (timeDiff > 60) {
        statusText = `Last sync: ${Math.floor(timeDiff / 60)} hours ago`;
      }
      if (timeDiff > 1440) {
        statusText = `Last sync: ${Math.floor(timeDiff / 1440)} days ago`;
      }

      statusElement.innerHTML = `
                <span class="badge bg-${status === "success" ? "success" : "warning"}">
                    ${statusText}
                </span>
            `;
    }
  },

  // Update content statistics
  updateContentStats: function (stats) {
    if (stats.services !== undefined) {
      const servicesCount = document.getElementById("servicesCount");
      if (servicesCount) servicesCount.textContent = stats.services;
    }
    if (stats.news !== undefined) {
      const newsCount = document.getElementById("newsCount");
      if (newsCount) newsCount.textContent = stats.news;
    }
    if (stats.testimonials !== undefined) {
      const testimonialsCount = document.getElementById("testimonialsCount");
      if (testimonialsCount) testimonialsCount.textContent = stats.testimonials;
    }
  },

  // Toggle auto-sync
  toggleAutoSync: function (enabled) {
    localStorage.setItem("notionAutoSync", enabled);

    if (enabled) {
      this.startAutoSync();
      this.showNotification("Auto-sync enabled", "success");
    } else {
      this.stopAutoSync();
      this.showNotification("Auto-sync disabled", "info");
    }
  },

  // Start auto-sync
  startAutoSync: function () {
    // Sync every 30 minutes
    this.autoSyncInterval = setInterval(
      () => {
        this.syncContent();
      },
      30 * 60 * 1000,
    );
  },

  // Stop auto-sync
  stopAutoSync: function () {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
  },

  // Show notification
  showNotification: function (message, type = "info") {
    const container =
      document.getElementById("notificationContainer") || document.body;
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} alert-dismissible fade show notion-notification`;
    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    container.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  },

  // Initialize sample content
  initializeSampleContent: async function () {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Creating content...';

    try {
      const response = await fetch("/admin/notion-setup/initialize", {
        method: "POST",
      });

      if (response.ok) {
        this.showNotification(
          "Sample content created successfully!",
          "success",
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        this.showNotification("Failed to create sample content", "error");
      }
    } catch (error) {
      this.showNotification("Error: " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  NotionCMS.init();
});

// Add CSS for notifications
const notionStyle = document.createElement("style");
notionStyle.textContent = `
.notion-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(notionStyle);
