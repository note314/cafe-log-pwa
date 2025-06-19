// Performance Optimization Utilities

class PerformanceManager {
  constructor() {
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.lazyLoadElements = new Set();
    this.preloadedResources = new Set();
    
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupPerformanceMonitoring();
    this.optimizeImages();
    this.prefetchCriticalResources();
    
    // Setup performance metrics
    if ('performance' in window) {
      this.logPerformanceMetrics();
    }
  }

  // Debounce utility
  debounce(func, wait, immediate = false) {
    return (...args) => {
      const callNow = immediate && !this.debounceTimers.has(func);
      
      if (this.debounceTimers.has(func)) {
        clearTimeout(this.debounceTimers.get(func));
      }
      
      this.debounceTimers.set(func, setTimeout(() => {
        this.debounceTimers.delete(func);
        if (!immediate) func.apply(this, args);
      }, wait));
      
      if (callNow) func.apply(this, args);
    };
  }

  // Throttle utility
  throttle(func, limit) {
    return (...args) => {
      if (!this.throttleTimers.has(func)) {
        func.apply(this, args);
        this.throttleTimers.set(func, setTimeout(() => {
          this.throttleTimers.delete(func);
        }, limit));
      }
    };
  }

  // Request Animation Frame based throttle
  rafThrottle(func) {
    let rafId = null;
    return (...args) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          func.apply(this, args);
          rafId = null;
        });
      }
    };
  }

  // Intersection Observer for lazy loading
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    // Lazy loading observer
    this.lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target);
          this.lazyLoadObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // Visibility observer for analytics
    this.visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.trackElementVisibility(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });
  }

  // Lazy load elements
  lazyLoad(element) {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.observe(element);
      this.lazyLoadElements.add(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadElement(element);
    }
  }

  loadElement(element) {
    // Load images
    if (element.dataset.src) {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }
    
    // Load background images
    if (element.dataset.backgroundImage) {
      element.style.backgroundImage = `url(${element.dataset.backgroundImage})`;
      element.removeAttribute('data-background-image');
    }
    
    // Execute lazy scripts
    if (element.dataset.script) {
      const script = document.createElement('script');
      script.src = element.dataset.script;
      script.async = true;
      document.head.appendChild(script);
      element.removeAttribute('data-script');
    }
    
    // Trigger custom load event
    element.dispatchEvent(new CustomEvent('lazyLoaded'));
  }

  // Optimize images
  optimizeImages() {
    // Add loading="lazy" to images
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.loading = 'lazy';
    });
    
    // Setup responsive images based on device
    this.setupResponsiveImages();
  }

  setupResponsiveImages() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isHighDPI = devicePixelRatio > 1;
    
    document.querySelectorAll('img[data-responsive]').forEach(img => {
      const baseSrc = img.dataset.responsive;
      const suffix = isHighDPI ? '@2x' : '';
      const [name, ext] = baseSrc.split('.');
      img.src = `${name}${suffix}.${ext}`;
    });
  }

  // Prefetch critical resources
  prefetchCriticalResources() {
    const criticalResources = [
      './data/store_list.json',
      './images/logo.svg'
    ];
    
    criticalResources.forEach(resource => {
      this.prefetchResource(resource);
    });
  }

  prefetchResource(url) {
    if (this.preloadedResources.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.onload = () => this.preloadedResources.add(url);
    document.head.appendChild(link);
  }

  preloadResource(url, type = 'fetch') {
    if (this.preloadedResources.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    link.onload = () => this.preloadedResources.add(url);
    document.head.appendChild(link);
  }

  // Virtual scrolling for large lists
  createVirtualScroller(container, items, renderItem, itemHeight = 60) {
    const containerHeight = container.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer items
    let startIndex = 0;
    
    const virtualContent = document.createElement('div');
    virtualContent.style.height = `${items.length * itemHeight}px`;
    virtualContent.style.position = 'relative';
    
    const visibleItems = document.createElement('div');
    visibleItems.style.position = 'absolute';
    visibleItems.style.top = '0';
    visibleItems.style.width = '100%';
    
    virtualContent.appendChild(visibleItems);
    container.innerHTML = '';
    container.appendChild(virtualContent);
    
    const updateVisible = this.throttle(() => {
      const scrollTop = container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        renderVisible();
      }
    }, 16); // ~60fps
    
    const renderVisible = () => {
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      const fragment = document.createDocumentFragment();
      
      visibleItems.innerHTML = '';
      visibleItems.style.transform = `translateY(${startIndex * itemHeight}px)`;
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.style.height = `${itemHeight}px`;
        fragment.appendChild(item);
      }
      
      visibleItems.appendChild(fragment);
    };
    
    container.addEventListener('scroll', updateVisible, { passive: true });
    renderVisible();
    
    return {
      update: (newItems) => {
        items = newItems;
        virtualContent.style.height = `${items.length * itemHeight}px`;
        renderVisible();
      },
      scrollToIndex: (index) => {
        container.scrollTop = index * itemHeight;
      }
    };
  }

  // Optimize DOM manipulation
  batchDOMUpdates(callback) {
    requestAnimationFrame(() => {
      callback();
    });
  }

  // Memory management
  cleanup() {
    // Clear observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
    
    // Clear lazy load elements
    this.lazyLoadElements.clear();
    this.preloadedResources.clear();
  }

  // Performance monitoring
  setupPerformanceMonitoring() {
    if (!('performance' in window)) return;
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) { // Task longer than 50ms
              console.warn('Long task detected:', entry.duration + 'ms');
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Some browsers don't support longtask
      }
      
      // Monitor layout shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.value > 0.1) { // CLS threshold
              console.warn('Layout shift detected:', entry.value);
            }
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', clsObserver);
      } catch (e) {
        // Some browsers don't support layout-shift
      }
    }
  }

  logPerformanceMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          // Core Web Vitals
          FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
          LCP: this.getLargestContentfulPaint(),
          FID: this.getFirstInputDelay(),
          CLS: this.getCumulativeLayoutShift(),
          
          // Navigation timing
          DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
          Connect: navigation.connectEnd - navigation.connectStart,
          TTFB: navigation.responseStart - navigation.requestStart,
          DOMLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          WindowLoad: navigation.loadEventEnd - navigation.navigationStart,
          
          // Resource counts
          Resources: performance.getEntriesByType('resource').length,
          
          // Memory usage (if available)
          Memory: this.getMemoryUsage()
        };
        
        console.log('Performance Metrics:', metrics);
        
        // Send metrics to analytics if needed
        this.sendMetricsToAnalytics(metrics);
      }, 1000);
    });
  }

  getLargestContentfulPaint() {
    if (!('PerformanceObserver' in window)) return null;
    
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }

  getFirstInputDelay() {
    if (!('PerformanceObserver' in window)) return null;
    
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0];
        resolve(firstEntry.processingStart - firstEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }

  getCumulativeLayoutShift() {
    if (!('PerformanceObserver' in window)) return null;
    
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    
    setTimeout(() => {
      observer.disconnect();
    }, 5000);
    
    return clsValue;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
      };
    }
    return null;
  }

  sendMetricsToAnalytics(metrics) {
    // Send to analytics service if configured
    // This is where you'd integrate with Google Analytics, etc.
    console.log('Metrics ready for analytics:', metrics);
  }

  trackElementVisibility(element) {
    // Track which elements are being viewed
    const elementId = element.id || element.className || 'unknown';
    console.log('Element viewed:', elementId);
  }

  // Image optimization helpers
  convertToWebP(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.8);
    });
  }

  // Optimized event listeners
  addOptimizedEventListener(element, event, handler, options = {}) {
    const optimizedHandler = this.rafThrottle(handler);
    element.addEventListener(event, optimizedHandler, { passive: true, ...options });
    
    return () => {
      element.removeEventListener(event, optimizedHandler);
    };
  }

  // Critical resource hints
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://maps.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://api.qrserver.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ];
    
    hints.forEach(hint => {
      const link = document.createElement('link');
      Object.assign(link, hint);
      document.head.appendChild(link);
    });
  }

  // Public API
  optimizeForMobile() {
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      document.body.classList.add('reduce-animations');
    }
    
    // Optimize for slow connections
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.body.classList.add('slow-connection');
        this.reduceFunctionality();
      }
    }
  }

  reduceFunctionality() {
    // Disable non-essential animations
    const style = document.createElement('style');
    style.textContent = `
      .slow-connection * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize performance manager
document.addEventListener('DOMContentLoaded', () => {
  window.performanceManager = new PerformanceManager();
  
  // Optimize for mobile devices
  if (window.touchManager && window.touchManager.isSupported()) {
    window.performanceManager.optimizeForMobile();
  }
  
  // Add resource hints
  window.performanceManager.addResourceHints();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.performanceManager) {
    window.performanceManager.cleanup();
  }
});