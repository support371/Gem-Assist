/**
 * GEM Enterprise - Modern Interactive Features
 * Advanced animations and interactions for enterprise website
 */

class ModernEnterpriseFeatures {
    constructor() {
        this.initializeOnLoad();
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupInteractiveElements();
        this.setupParallaxEffects();
    }

    initializeOnLoad() {
        // Initialize all features when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.animateHeroElements();
            this.setupIntersectionObserver();
            this.initializeDashboardInteractions();
        });
    }

    // Hero Animation Sequence
    animateHeroElements() {
        const heroElements = [
            '.hero-badge-container',
            '.hero-title-modern .title-line-1',
            '.hero-title-modern .title-line-2', 
            '.hero-title-modern .title-line-3',
            '.hero-description-modern',
            '.hero-metrics-grid',
            '.hero-cta-section'
        ];

        heroElements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200 + 500);
            }
        });

        // Dashboard slide-in animation
        const dashboard = document.querySelector('.dashboard-container');
        if (dashboard) {
            dashboard.style.opacity = '0';
            dashboard.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                dashboard.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                dashboard.style.opacity = '1';
                dashboard.style.transform = 'translateX(0)';
            }, 1000);
        }
    }

    // Intersection Observer for scroll animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe service cards
        document.querySelectorAll('.service-card-modern').forEach(card => {
            observer.observe(card);
        });

        // Observe metric cards
        document.querySelectorAll('.metric-card').forEach(card => {
            observer.observe(card);
        });

        // Observe dashboard cards
        document.querySelectorAll('.dashboard-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.classList.add('animate-in');
    }

    // Counter Animations
    setupCounterAnimations() {
        const counterElements = document.querySelectorAll('[data-animate="counter"]');
        
        const animateCounter = (element) => {
            const countElement = element.querySelector('[data-count]');
            if (!countElement) return;

            const targetValue = parseFloat(countElement.dataset.count);
            const duration = 2000; // 2 seconds
            const stepTime = 50; // Update every 50ms
            const steps = duration / stepTime;
            const increment = targetValue / steps;
            
            let currentValue = 0;
            const timer = setInterval(() => {
                currentValue += increment;
                
                if (currentValue >= targetValue) {
                    currentValue = targetValue;
                    clearInterval(timer);
                }
                
                // Format number based on type
                if (targetValue < 10) {
                    countElement.textContent = currentValue.toFixed(1);
                } else {
                    countElement.textContent = Math.floor(currentValue).toLocaleString();
                }
            }, stepTime);
        };

        // Setup intersection observer for counters
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counterElements.forEach(element => {
            counterObserver.observe(element);
        });
    }

    // Interactive Elements
    setupInteractiveElements() {
        // Dashboard control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Add visual feedback
                this.createRippleEffect(e.target, e);
            });
        });

        // Service card hover effects
        document.querySelectorAll('.service-card-modern').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.enhanceCardHover(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetCardHover(card);
            });
        });

        // Metric card interactions
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('click', () => {
                this.pulseMetricCard(card);
            });
        });

        // CTA button effects
        document.querySelectorAll('.cta-primary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createButtonWave(e.target, e);
            });
        });
    }

    enhanceCardHover(card) {
        const icon = card.querySelector('.service-icon-modern');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        const features = card.querySelectorAll('.feature-tag');
        features.forEach((tag, index) => {
            setTimeout(() => {
                tag.style.transform = 'translateY(-2px)';
                tag.style.transition = 'all 0.2s ease';
            }, index * 50);
        });
    }

    resetCardHover(card) {
        const icon = card.querySelector('.service-icon-modern');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }

        const features = card.querySelectorAll('.feature-tag');
        features.forEach(tag => {
            tag.style.transform = 'translateY(0)';
        });
    }

    pulseMetricCard(card) {
        card.style.transform = 'scale(1.05)';
        card.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 200);
    }

    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = x - 10 + 'px';
        ripple.style.top = y - 10 + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    createButtonWave(button, event) {
        const wave = button.querySelector('::before');
        if (wave) {
            // Trigger the wave animation
            button.style.setProperty('--wave-x', event.offsetX + 'px');
            button.style.setProperty('--wave-y', event.offsetY + 'px');
        }
    }

    // Parallax Effects
    setupParallaxEffects() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrollY = window.pageYOffset;
            
            // Hero background elements
            const particles = document.querySelector('.floating-particles');
            const orbs = document.querySelector('.gradient-orbs');
            
            if (particles) {
                particles.style.transform = `translateY(${scrollY * 0.3}px)`;
            }
            
            if (orbs) {
                orbs.style.transform = `translateY(${scrollY * 0.2}px)`;
            }
            
            // Dashboard elements
            const dashboard = document.querySelector('.dashboard-container');
            if (dashboard) {
                const rect = dashboard.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                    dashboard.style.transform = `translateY(${Math.max(0, (1 - progress) * 50)}px)`;
                }
            }
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick);
    }

    // Dashboard Interactions
    initializeDashboardInteractions() {
        // Animate chart bars
        this.animateChartBars();
        
        // Animate network nodes
        this.animateNetworkTopology();
        
        // Animate progress circle
        this.animateProgressCircle();
        
        // Live data simulation
        this.simulateLiveData();
    }

    animateChartBars() {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            const value = bar.dataset.value;
            bar.style.height = '0%';
            bar.style.transition = 'height 1s ease-out';
            
            setTimeout(() => {
                bar.style.height = value + '%';
            }, index * 200 + 500);
        });
    }

    animateNetworkTopology() {
        const connections = document.querySelectorAll('.connection');
        connections.forEach((connection, index) => {
            connection.style.width = '0%';
            connection.style.transition = 'width 0.8s ease-out';
            
            setTimeout(() => {
                const originalWidth = connection.style.width || '25%';
                connection.style.width = originalWidth;
            }, index * 300 + 1000);
        });
    }

    animateProgressCircle() {
        const circle = document.querySelector('.circle');
        if (circle) {
            const percent = document.querySelector('.progress-circle').dataset.percent || 98.7;
            circle.style.strokeDasharray = `0, 100`;
            circle.style.transition = 'stroke-dasharray 2s ease-out';
            
            setTimeout(() => {
                circle.style.strokeDasharray = `${percent}, 100`;
            }, 1500);
        }
    }

    simulateLiveData() {
        // Simulate live threat counter
        const threatCounter = document.querySelector('.threat-stats strong[data-count="1247"]');
        if (threatCounter) {
            setInterval(() => {
                const currentValue = parseInt(threatCounter.textContent.replace(',', ''));
                const newValue = currentValue + Math.floor(Math.random() * 3);
                threatCounter.textContent = newValue.toLocaleString();
            }, 5000);
        }

        // Pulse live indicator
        const pulseIndicator = document.querySelector('.pulse-dot');
        if (pulseIndicator) {
            setInterval(() => {
                pulseIndicator.style.animation = 'none';
                setTimeout(() => {
                    pulseIndicator.style.animation = 'pulse-dot 2s ease-in-out infinite';
                }, 10);
            }, 3000);
        }

        // Update network stats
        const latencyElement = document.querySelector('.network-stats .text-success');
        if (latencyElement) {
            const updateNetworkStats = () => {
                const latency = Math.floor(Math.random() * 10) + 8; // 8-18ms
                latencyElement.textContent = latency + 'ms';
            };
            
            setInterval(updateNetworkStats, 4000);
        }
    }

    // Scroll-triggered animations
    setupScrollAnimations() {
        const sections = document.querySelectorAll('.modern-services-section, .dashboard-container');
        
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-animate');
                    
                    // Stagger child animations
                    const children = entry.target.querySelectorAll('.service-card-modern, .dashboard-card');
                    children.forEach((child, index) => {
                        setTimeout(() => {
                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
            });
        }, { threshold: 0.2 });
        
        sections.forEach(section => {
            scrollObserver.observe(section);
        });
    }
}

// Performance monitoring
class PerformanceMonitor {
    static trackPageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`Page loaded in ${Math.round(loadTime)}ms`);
            
            // Show warning for slow loads
            if (loadTime > 3000) {
                console.warn('Slow page load detected');
            }
        });
    }

    static optimizeAnimations() {
        // Reduce animations on low-end devices
        const isLowEnd = navigator.hardwareConcurrency < 4 || 
                         navigator.deviceMemory < 4 ||
                         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isLowEnd) {
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
            document.documentElement.classList.add('reduced-motion');
        }
    }

    static prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    if (PerformanceMonitor.prefersReducedMotion()) {
        document.documentElement.classList.add('reduced-motion');
        return;
    }
    
    // Initialize performance monitoring
    PerformanceMonitor.trackPageLoad();
    PerformanceMonitor.optimizeAnimations();
    
    // Initialize modern features
    window.modernFeatures = new ModernEnterpriseFeatures();
});

// Add ripple animation CSS dynamically
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}

.scroll-animate {
    animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// Inject CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = rippleCSS;
document.head.appendChild(rippleStyle);

// Multimedia Gallery Enhancements for Enterprise Services
class MultimediaGalleryManager {
    constructor() {
        this.initializeMediaGalleries();
    }

    initializeMediaGalleries() {
        this.setupMediaTabs();
        this.setupVideoPlayers();
        this.setupInteractiveShowcases();
        this.setupMediaActions();
        this.injectMultimediaStyles();
    }

    setupMediaTabs() {
        const mediaTabs = document.querySelectorAll('.media-tab');
        
        mediaTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                const parentGallery = e.target.closest('.service-media-gallery');
                
                if (parentGallery) {
                    parentGallery.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
                    parentGallery.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    e.target.classList.add('active');
                    const targetContent = parentGallery.querySelector(`[data-content="${tabName}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                }
            });
        });
    }

    setupVideoPlayers() {
        const videoPlaceholders = document.querySelectorAll('.video-placeholder, .preview-btn');
        
        videoPlaceholders.forEach(placeholder => {
            placeholder.addEventListener('click', (e) => {
                const videoId = e.target.closest('[data-video]')?.dataset.video || 
                              e.target.closest('[data-media]')?.dataset.media || 
                              'demo-video';
                this.openVideoModal(videoId);
            });
        });
    }

    openVideoModal(videoId) {
        const modal = document.createElement('div');
        modal.className = 'multimedia-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.closest('.multimedia-modal').remove()"></div>
            <div class="modal-content-multimedia">
                <div class="modal-header-multimedia">
                    <h3>${this.getVideoTitle(videoId)}</h3>
                    <button class="modal-close-multimedia" onclick="this.closest('.multimedia-modal').remove()">×</button>
                </div>
                <div class="modal-body-multimedia">
                    <div class="video-container-multimedia">
                        <div class="video-placeholder-large">
                            <div class="video-overlay">
                                <i class="fas fa-play-circle"></i>
                                <span>Demo: ${this.getVideoTitle(videoId)}</span>
                                <small>Professional service demonstration</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content-multimedia').style.transform = 'scale(1)';
        });
    }

    getVideoTitle(videoId) {
        const videoTitles = {
            'cybersecurity-demo': 'Advanced Threat Detection',
            'telegram-demo': 'Telegram Bot Automation',
            'property-tour': 'Property Management Tour',
            'forensics-process': 'Asset Recovery Process',
            'legal-video': 'Legal Documentation Overview',
            'portfolio-video': 'Investment Portfolio Analysis',
            'partnership-video': 'Partnership Network'
        };
        return videoTitles[videoId] || 'Service Demonstration';
    }

    setupInteractiveShowcases() {
        this.animateThreaTCharts();
        this.animateBotMessages();
        this.animateRecoveryFlow();
        this.animateNetworkNodes();
    }

    animateThreaTCharts() {
        const charts = document.querySelectorAll('.threat-chart');
        
        charts.forEach(chart => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const bars = entry.target.querySelectorAll('.chart-bar');
                        bars.forEach((bar, index) => {
                            setTimeout(() => {
                                bar.style.transform = 'scaleY(1)';
                                bar.style.opacity = '1';
                            }, index * 200);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            chart.querySelectorAll('.chart-bar').forEach(bar => {
                bar.style.transform = 'scaleY(0)';
                bar.style.opacity = '0.3';
                bar.style.transformOrigin = 'bottom';
                bar.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            observer.observe(chart);
        });
    }

    animateBotMessages() {
        const botConversations = document.querySelectorAll('.bot-conversation');
        
        botConversations.forEach(conversation => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messages = entry.target.querySelectorAll('.bot-message');
                        messages.forEach((message, index) => {
                            setTimeout(() => {
                                message.style.opacity = '1';
                                message.style.transform = 'translateY(0)';
                            }, index * 500 + 1000);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            conversation.querySelectorAll('.bot-message').forEach(message => {
                message.style.opacity = '0';
                message.style.transform = 'translateY(20px)';
                message.style.transition = 'all 0.4s ease-out';
            });
            
            observer.observe(conversation);
        });
    }

    animateRecoveryFlow() {
        const recoveryFlows = document.querySelectorAll('.recovery-flow');
        
        recoveryFlows.forEach(flow => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const steps = entry.target.querySelectorAll('.flow-step');
                        steps.forEach((step, index) => {
                            setTimeout(() => {
                                if (index === 0) step.classList.add('active');
                                step.style.opacity = '1';
                                step.style.transform = 'scale(1)';
                                
                                setTimeout(() => {
                                    if (step.classList.contains('active')) {
                                        step.classList.remove('active');
                                        const nextStep = steps[index + 1];
                                        if (nextStep) nextStep.classList.add('active');
                                    }
                                }, 2000);
                            }, index * 800);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            flow.querySelectorAll('.flow-step').forEach(step => {
                step.style.opacity = '0.6';
                step.style.transform = 'scale(0.8)';
                step.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            observer.observe(flow);
        });
    }

    animateNetworkNodes() {
        const networks = document.querySelectorAll('.network-visualization');
        
        networks.forEach(network => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const nodes = entry.target.querySelectorAll('.network-node');
                        nodes.forEach((node, index) => {
                            setTimeout(() => {
                                node.style.opacity = '1';
                                node.style.transform = 'scale(1)';
                            }, index * 300);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            network.querySelectorAll('.network-node').forEach(node => {
                node.style.opacity = '0';
                node.style.transform = 'scale(0)';
                node.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
            
            observer.observe(network);
        });
    }

    setupMediaActions() {
        const mediaActionBtns = document.querySelectorAll('.media-action-btn, .preview-btn');
        
        mediaActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('button').dataset.action;
                const media = e.target.closest('button').dataset.media;
                
                if (action === 'video' || media) {
                    this.openVideoModal(media || action);
                } else if (action === 'gallery') {
                    this.openImageGallery();
                } else if (action === 'case-study') {
                    this.openCaseStudy();
                }
                
                this.addRippleEffect(e);
            });
        });
    }

    openImageGallery() {
        const modal = document.createElement('div');
        modal.className = 'multimedia-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.closest('.multimedia-modal').remove()"></div>
            <div class="gallery-content-multimedia">
                <div class="modal-header-multimedia">
                    <h3>Service Gallery</h3>
                    <button class="modal-close-multimedia" onclick="this.closest('.multimedia-modal').remove()">×</button>
                </div>
                <div class="gallery-grid-multimedia">
                    <div class="gallery-item-multimedia">
                        <div class="image-placeholder-multimedia">
                            <i class="fas fa-desktop"></i>
                            <span>Dashboard Interface</span>
                        </div>
                    </div>
                    <div class="gallery-item-multimedia">
                        <div class="image-placeholder-multimedia">
                            <i class="fas fa-shield-alt"></i>
                            <span>Security Analytics</span>
                        </div>
                    </div>
                    <div class="gallery-item-multimedia">
                        <div class="image-placeholder-multimedia">
                            <i class="fas fa-chart-line"></i>
                            <span>Performance Metrics</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('.gallery-content-multimedia').style.transform = 'scale(1)';
        });
    }

    openCaseStudy() {
        const modal = document.createElement('div');
        modal.className = 'multimedia-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.closest('.multimedia-modal').remove()"></div>
            <div class="case-study-content-multimedia">
                <div class="modal-header-multimedia">
                    <h3>Asset Recovery Case Study</h3>
                    <button class="modal-close-multimedia" onclick="this.closest('.multimedia-modal').remove()">×</button>
                </div>
                <div class="case-study-body-multimedia">
                    <div class="case-highlight-multimedia">
                        <h4>$2.3M Recovery Success</h4>
                        <p>Global Manufacturing Corp - Professional Asset Recovery</p>
                    </div>
                    <div class="case-details-multimedia">
                        <div class="detail-section-multimedia">
                            <h5>Challenge</h5>
                            <p>Complex international asset recovery requiring forensic analysis and legal coordination.</p>
                        </div>
                        <div class="detail-section-multimedia">
                            <h5>Solution</h5>
                            <p>Advanced forensic techniques with comprehensive recovery strategy execution.</p>
                        </div>
                        <div class="detail-section-multimedia">
                            <h5>Result</h5>
                            <p>Successfully recovered $2.3M in assets within 90 days, exceeding expectations.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('.case-study-content-multimedia').style.transform = 'scale(1)';
        });
    }

    addRippleEffect(event) {
        const button = event.target.closest('button');
        if (!button) return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.3);
            width: ${size}px; height: ${size}px; left: ${x}px; top: ${y}px;
            animation: ripple-multimedia 0.6s ease-out; pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    injectMultimediaStyles() {
        const multimediaStyles = `
            .multimedia-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
            .modal-backdrop { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer; }
            .modal-content-multimedia, .gallery-content-multimedia, .case-study-content-multimedia { position: relative; background: var(--bg-card); border-radius: 20px; max-width: 90vw; max-height: 90vh; overflow: auto; transform: scale(0.8); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); border: 1px solid var(--border-color); }
            .modal-header-multimedia { padding: 2rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
            .modal-header-multimedia h3 { margin: 0; color: var(--text-primary); font-size: 1.5rem; font-weight: 700; }
            .modal-close-multimedia { background: none; border: none; font-size: 2rem; color: var(--text-muted); cursor: pointer; transition: color 0.3s ease; }
            .modal-close-multimedia:hover { color: var(--text-primary); }
            .modal-body-multimedia, .gallery-grid-multimedia, .case-study-body-multimedia { padding: 2rem; }
            .video-container-multimedia { text-align: center; }
            .video-placeholder-large { background: linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.7) 100%); border-radius: 12px; height: 400px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; border: 1px solid var(--border-color); }
            .video-placeholder-large:hover { border-color: var(--primary-color); background: linear-gradient(135deg, rgba(6, 102, 204, 0.1) 0%, rgba(17, 24, 39, 0.9) 100%); }
            .gallery-grid-multimedia { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .gallery-item-multimedia { border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); transition: all 0.3s ease; }
            .gallery-item-multimedia:hover { transform: translateY(-4px); border-color: var(--primary-color); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2); }
            .image-placeholder-multimedia { height: 200px; background: linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-primary); gap: 1rem; }
            .image-placeholder-multimedia i { font-size: 3rem; color: var(--primary-color); }
            .case-highlight-multimedia { background: linear-gradient(135deg, rgba(6, 102, 204, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(6, 102, 204, 0.3); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; text-align: center; }
            .case-highlight-multimedia h4 { color: var(--text-primary); font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
            .case-details-multimedia { display: grid; gap: 2rem; }
            .detail-section-multimedia { background: rgba(17, 24, 39, 0.5); border-radius: 8px; padding: 1.5rem; border: 1px solid var(--border-color); }
            .detail-section-multimedia h5 { color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem; }
            .detail-section-multimedia p { color: var(--text-secondary); line-height: 1.6; margin: 0; }
            @keyframes ripple-multimedia { to { transform: scale(2); opacity: 0; } }
            @media (max-width: 768px) { .modal-content-multimedia, .gallery-content-multimedia, .case-study-content-multimedia { max-width: 95vw; max-height: 95vh; } .modal-header-multimedia, .modal-body-multimedia, .gallery-grid-multimedia, .case-study-body-multimedia { padding: 1rem; } .video-placeholder-large { height: 250px; } .gallery-grid-multimedia { grid-template-columns: 1fr; } }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = multimediaStyles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize multimedia gallery functionality
document.addEventListener('DOMContentLoaded', () => {
    new MultimediaGalleryManager();
});