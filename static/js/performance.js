// Performance Optimizations for GEM Enterprise

// Performance monitoring
let performanceData = {
  loadTime: 0,
  renderTime: 0,
  totalResources: 0,
};

// Initialize performance optimizations
document.addEventListener("DOMContentLoaded", function () {
  initPerformanceOptimizations();
  initLazyLoading();
  initImageOptimization();
  initVideoOptimization();
  measurePerformance();
});

// Core performance optimizations
function initPerformanceOptimizations() {
  // Debounce scroll events
  let scrollTimer = null;
  window.addEventListener(
    "scroll",
    function () {
      if (scrollTimer) return;

      scrollTimer = setTimeout(() => {
        handleOptimizedScroll();
        scrollTimer = null;
      }, 16); // ~60fps
    },
    { passive: true },
  );

  // Debounce resize events
  let resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) return;

    resizeTimer = setTimeout(() => {
      handleOptimizedResize();
      resizeTimer = null;
    }, 100);
  });

  // Optimize animations based on device capabilities
  optimizeAnimationsByDevice();

  // Remove unused event listeners on page unload
  window.addEventListener("beforeunload", cleanupEventListeners);
}

// Lazy loading for images
function initLazyLoading() {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            imageObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.1,
      },
    );

    // Observe all images with data-src
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for older browsers
    document.querySelectorAll("img[data-src]").forEach(loadImage);
  }
}

// Load individual image
function loadImage(img) {
  if (img.dataset.src) {
    img.src = img.dataset.src;
    img.classList.add("loaded");
    img.removeAttribute("data-src");
  }
}

// Image optimization
function initImageOptimization() {
  // Add responsive image classes
  document.querySelectorAll("img").forEach((img) => {
    if (!img.classList.contains("no-optimize")) {
      img.classList.add("responsive-image");

      // Add loading attribute for modern browsers
      if ("loading" in HTMLImageElement.prototype) {
        img.setAttribute("loading", "lazy");
      }
    }
  });

  // Create placeholder images for better UX
  createImagePlaceholders();
}

// Video optimization
function initVideoOptimization() {
  document.querySelectorAll("video").forEach((video) => {
    video.classList.add("optimized-video");

    // Pause videos when not in view
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.paused && video.autoplay) {
              video.play();
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    videoObserver.observe(video);
  });
}

// Create image placeholders
function createImagePlaceholders() {
  document.querySelectorAll(".image-placeholder").forEach((placeholder) => {
    // Add click handler to upload images
    placeholder.addEventListener("click", function () {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";

      input.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "responsive-image loaded";
            img.alt = file.name;

            placeholder.innerHTML = "";
            placeholder.appendChild(img);
            placeholder.classList.add("has-image");
          };
          reader.readAsDataURL(file);
        }
      });

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  });
}

// Optimized scroll handler
function handleOptimizedScroll() {
  const scrollY = window.pageYOffset;

  // Only update elements that need scroll-based animations
  document.querySelectorAll(".parallax-element").forEach((el) => {
    if (isElementInViewport(el)) {
      const speed = el.dataset.speed || 0.5;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    }
  });
}

// Optimized resize handler
function handleOptimizedResize() {
  // Update viewport-dependent calculations
  updateViewportDependentElements();
}

// Check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Update viewport-dependent elements
function updateViewportDependentElements() {
  // Update any elements that depend on viewport size
  document.querySelectorAll(".viewport-dependent").forEach((el) => {
    // Update calculations based on new viewport
    el.style.setProperty("--viewport-width", window.innerWidth + "px");
    el.style.setProperty("--viewport-height", window.innerHeight + "px");
  });
}

// Optimize animations based on device
function optimizeAnimationsByDevice() {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const isMobile = window.innerWidth < 768;
  const isSlowConnection =
    connection &&
    (connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g");

  if (isMobile || isSlowConnection) {
    document.body.classList.add("reduced-animations");

    // Disable complex animations
    document.querySelectorAll(".complex-animation").forEach((el) => {
      el.style.animation = "none";
    });
  }

  // Respect user preferences
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("no-animations");
  }
}

// Performance measurement
function measurePerformance() {
  if ("performance" in window) {
    window.addEventListener("load", function () {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0];
        performanceData.loadTime =
          perfData.loadEventEnd - perfData.loadEventStart;
        performanceData.renderTime =
          perfData.domContentLoadedEventEnd -
          perfData.domContentLoadedEventStart;

        // Count resources
        performanceData.totalResources =
          performance.getEntriesByType("resource").length;

        // Log performance data (remove in production)
        console.log("Performance Data:", performanceData);

        // Show performance monitor if needed
        if (localStorage.getItem("showPerformanceMonitor") === "true") {
          showPerformanceMonitor();
        }
      }, 1000);
    });
  }
}

// Show performance monitor
function showPerformanceMonitor() {
  const monitor = document.createElement("div");
  monitor.className = "performance-monitor show";
  monitor.innerHTML = `
        Load: ${performanceData.loadTime}ms<br>
        Render: ${performanceData.renderTime}ms<br>
        Resources: ${performanceData.totalResources}
    `;
  document.body.appendChild(monitor);
}

// Cleanup event listeners
function cleanupEventListeners() {
  // Remove any global event listeners that might cause memory leaks
  window.removeEventListener("scroll", handleOptimizedScroll);
  window.removeEventListener("resize", handleOptimizedResize);
}

// Resource preloading
function preloadCriticalResources() {
  const criticalImages = [
    "/static/images/hero-bg.jpg",
    "/static/images/logo.png",
  ];

  criticalImages.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  });
}

// Call preload on DOM ready
document.addEventListener("DOMContentLoaded", preloadCriticalResources);

// Video embedding helper
function embedVideo(container, videoUrl, options = {}) {
  const videoContainer = document.createElement("div");
  videoContainer.className = "video-container";
  videoContainer.style.cssText = `
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        border-radius: 8px;
    `;

  let videoElement;

  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    // YouTube embed
    const videoId = extractYouTubeId(videoUrl);
    videoElement = document.createElement("iframe");
    videoElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&showinfo=0`;
    videoElement.setAttribute("allowfullscreen", "");
  } else if (videoUrl.includes("vimeo.com")) {
    // Vimeo embed
    const videoId = extractVimeoId(videoUrl);
    videoElement = document.createElement("iframe");
    videoElement.src = `https://player.vimeo.com/video/${videoId}`;
    videoElement.setAttribute("allowfullscreen", "");
  } else {
    // Direct video file
    videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.className = "optimized-video";
  }

  videoElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
    `;

  videoContainer.appendChild(videoElement);
  container.appendChild(videoContainer);

  return videoElement;
}

// Extract YouTube video ID
function extractYouTubeId(url) {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

// Extract Vimeo video ID
function extractVimeoId(url) {
  const regExp = /^.*vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : false;
}

// Export functions for external use
window.GEMPerformance = {
  loadImage,
  embedVideo,
  measurePerformance,
  showPerformanceMonitor: () =>
    localStorage.setItem("showPerformanceMonitor", "true"),
  hidePerformanceMonitor: () =>
    localStorage.setItem("showPerformanceMonitor", "false"),
};
