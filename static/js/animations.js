// Interactive Micro-Animations for GEM Enterprise

document.addEventListener("DOMContentLoaded", function () {
  // Initialize only essential animations for performance
  initScrollAnimations();
  initHoverEffects();
  initCounterAnimations();

  // Add page load animation class
  document.body.classList.add("animate-on-load");
});

// Page Transition System
function initPageTransitions() {
  // Create transition overlay
  const overlay = document.createElement("div");
  overlay.className = "page-transition-overlay";
  document.body.appendChild(overlay);

  // Intercept all internal links
  const links = document.querySelectorAll('a[href^="/"], a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Skip if it's a hash link on the same page
      if (href && href.startsWith("#") && href.length > 1) {
        smoothScrollToElement(href);
        e.preventDefault();
        return;
      }

      // Animate page transition for internal links
      if (!this.target && !this.hasAttribute("download")) {
        e.preventDefault();
        overlay.classList.add("active");

        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    });
  });
}

// Scroll-triggered Animations
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(
    ".scroll-animate, .scroll-animate-left, .scroll-animate-right",
  );

  if (animatedElements.length === 0) {
    // Add scroll animation classes to existing elements
    addScrollAnimationClasses();
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");

        // Stagger animations for children
        const children = entry.target.querySelectorAll(".animate-child");
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add("visible");
          }, index * 100);
        });
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document
    .querySelectorAll(
      ".scroll-animate, .scroll-animate-left, .scroll-animate-right",
    )
    .forEach((el) => {
      observer.observe(el);
    });
}

// Add scroll animation classes to existing elements
function addScrollAnimationClasses() {
  // Add to cards
  document
    .querySelectorAll(".card, .service-card, .team-card, .testimonial-card")
    .forEach((card, index) => {
      card.classList.add("scroll-animate");
      card.style.animationDelay = `${index * 0.1}s`;
    });

  // Add to sections
  document.querySelectorAll("section").forEach((section) => {
    if (!section.classList.contains("hero-section")) {
      section.classList.add("scroll-animate");
    }
  });
}

// Interactive Hover Effects
function initHoverEffects() {
  // Add hover lift effect to cards
  document
    .querySelectorAll(".card, .service-card, .bot-card")
    .forEach((card) => {
      card.classList.add("hover-lift");

      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-10px) scale(1.02)";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) scale(1)";
      });
    });

  // Add magnetic effect to buttons
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translate(0, 0)";
    });
  });
}

// Parallax Effects
function initParallaxEffects() {
  const parallaxElements = document.querySelectorAll(".parallax-element");

  if (parallaxElements.length === 0) {
    // Add parallax to hero sections
    document.querySelectorAll(".hero-section, .page-header").forEach((el) => {
      el.classList.add("parallax-element");
    });
  }

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;

    document.querySelectorAll(".parallax-element").forEach((el) => {
      const speed = el.dataset.speed || 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  });
}

// Counter Animations
function initCounterAnimations() {
  const counters = document.querySelectorAll(".stat-number, .metric-value");

  const observerOptions = {
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
        animateCounter(entry.target);
        entry.target.classList.add("counted");
      }
    });
  }, observerOptions);

  counters.forEach((counter) => {
    observer.observe(counter);
  });
}

function animateCounter(element) {
  const target = parseInt(element.innerText.replace(/[^0-9]/g, "")) || 100;
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    const suffix = element.innerText.match(/[^0-9]+$/);
    element.innerText = Math.floor(current) + (suffix ? suffix[0] : "");
  }, 16);
}

// Ripple Effects for Buttons
function initRippleEffects() {
  document.querySelectorAll(".btn, .nav-link").forEach((element) => {
    element.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.className = "ripple";

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";

      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Text Animation Effects
function initTextAnimations() {
  // Add typewriter effect to hero titles
  const heroTitles = document.querySelectorAll(".hero-title, .hero-section h1");
  heroTitles.forEach((title) => {
    if (title.dataset.typewriter !== "false") {
      typewriterEffect(title);
    }
  });

  // Animate text on hover
  document.querySelectorAll(".animated-text").forEach((text) => {
    const letters = text.innerText.split("");
    text.innerHTML = letters
      .map(
        (letter) =>
          `<span style="display: inline-block; transition: all 0.3s;">${letter}</span>`,
      )
      .join("");

    text.addEventListener("mouseenter", function () {
      this.querySelectorAll("span").forEach((span, index) => {
        setTimeout(() => {
          span.style.transform = "translateY(-5px)";
          span.style.color = "var(--primary-color)";
        }, index * 30);
      });
    });

    text.addEventListener("mouseleave", function () {
      this.querySelectorAll("span").forEach((span) => {
        span.style.transform = "translateY(0)";
        span.style.color = "";
      });
    });
  });
}

function typewriterEffect(element) {
  const text = element.innerText;
  element.innerText = "";
  element.style.visibility = "visible";

  let index = 0;
  const speed = 50;

  function type() {
    if (index < text.length) {
      element.innerText += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }

  // Start typing after a short delay
  setTimeout(type, 500);
}

// Loading Animations
function initLoadingAnimations() {
  // Add loading animation to forms
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const submitBtn = this.querySelector('[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerText;
        submitBtn.innerHTML =
          '<span class="loading-spinner"></span> Processing...';
        submitBtn.disabled = true;

        // Re-enable after 3 seconds (for demo)
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  });
}

// Smooth Scroll to Element
function smoothScrollToElement(selector) {
  // Fix for invalid selector error
  if (!selector || selector === "#" || selector.length < 2) {
    return;
  }

  try {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  } catch (error) {
    console.warn("Invalid selector:", selector);
  }
}

// Add stagger animation to lists
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("ul li, .grid > *").forEach((item, index) => {
    item.style.animationDelay = `${index * 0.05}s`;
  });
});

// Performance optimization: Remove animation classes after completion
document.addEventListener("animationend", function (e) {
  if (e.target.classList.contains("animating")) {
    e.target.classList.remove("animating");
  }
});

// Mobile optimization: Reduce animations on mobile
if (window.innerWidth < 768) {
  document.body.classList.add("reduce-motion");
}

// Add smooth reveal for images
document.querySelectorAll("img").forEach((img) => {
  img.style.opacity = "0";
  img.style.transition = "opacity 0.5s ease-in-out";

  if (img.complete) {
    img.style.opacity = "1";
  } else {
    img.addEventListener("load", function () {
      this.style.opacity = "1";
    });
  }
});

// Export functions for external use
window.GEMAnimations = {
  triggerPageTransition: function () {
    const overlay = document.querySelector(".page-transition-overlay");
    if (overlay) {
      overlay.classList.add("active");
    }
  },

  animateElement: function (element, animationType = "fadeInUp") {
    element.style.animation = `${animationType} 0.6s ease-out`;
  },

  resetAnimations: function () {
    document.querySelectorAll(".visible").forEach((el) => {
      el.classList.remove("visible");
    });
  },
};
