// Touch and Gesture Utilities

class TouchManager {
  constructor() {
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.gestures = {
      swipe: new Map(),
      pinch: new Map(),
      longPress: new Map()
    };
    
    this.swipeThreshold = 50; // Minimum distance for swipe
    this.swipeVelocity = 0.3; // Minimum velocity
    this.longPressDelay = 500; // Long press duration
    
    this.init();
  }

  init() {
    if (!this.isTouch) return;
    
    // Add touch classes to body
    document.body.classList.add('touch-device');
    
    // Disable context menu on long press for better UX
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.disable-context-menu')) {
        e.preventDefault();
      }
    });
    
    // Improve touch scrolling
    this.setupSmoothScrolling();
    
    // Setup gesture recognition
    this.setupGestureRecognition();
    
    // Setup touch feedback
    this.setupTouchFeedback();
  }

  setupSmoothScrolling() {
    // Enable momentum scrolling on iOS
    const scrollableElements = document.querySelectorAll('.section, .menu-content, .modal-content');
    scrollableElements.forEach(element => {
      element.style.webkitOverflowScrolling = 'touch';
    });
  }

  setupGestureRecognition() {
    let startTouch = null;
    let currentTouch = null;
    let longPressTimer = null;

    document.addEventListener('touchstart', (e) => {
      startTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
        target: e.target
      };
      
      // Setup long press detection
      longPressTimer = setTimeout(() => {
        this.handleLongPress(e);
      }, this.longPressDelay);
      
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!startTouch) return;
      
      // Cancel long press on move
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      currentTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
      
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (!startTouch || !currentTouch) {
        startTouch = null;
        currentTouch = null;
        return;
      }
      
      this.handleSwipe(startTouch, currentTouch);
      
      startTouch = null;
      currentTouch = null;
    }, { passive: true });
  }

  handleSwipe(start, end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.time - start.time;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Check if it's a valid swipe
    if (distance < this.swipeThreshold || velocity < this.swipeVelocity) {
      return;
    }
    
    // Determine swipe direction
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    let direction;
    
    if (angle >= -45 && angle <= 45) {
      direction = 'right';
    } else if (angle >= 45 && angle <= 135) {
      direction = 'down';
    } else if (angle >= -135 && angle <= -45) {
      direction = 'up';
    } else {
      direction = 'left';
    }
    
    // Dispatch swipe event
    this.dispatchSwipeEvent(start.target, direction, { deltaX, deltaY, velocity });
  }

  handleLongPress(e) {
    // Dispatch long press event
    const event = new CustomEvent('longpress', {
      detail: {
        target: e.target,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    });
    
    e.target.dispatchEvent(event);
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  dispatchSwipeEvent(target, direction, data) {
    const event = new CustomEvent('swipe', {
      detail: {
        direction,
        target,
        ...data
      }
    });
    
    target.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  setupTouchFeedback() {
    // Add visual feedback for touch interactions
    const interactiveElements = 'button, .btn, .card, .store-item, .area-item, .region-item, .prefecture-item, .section-btn, .achievement-tab, .menu-list a';
    
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest(interactiveElements);
      if (target) {
        target.classList.add('touch-active');
        
        // Remove after a short delay
        setTimeout(() => {
          target.classList.remove('touch-active');
        }, 150);
      }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const target = e.target.closest(interactiveElements);
      if (target) {
        target.classList.remove('touch-active');
      }
    }, { passive: true });
    
    document.addEventListener('touchcancel', (e) => {
      const target = e.target.closest(interactiveElements);
      if (target) {
        target.classList.remove('touch-active');
      }
    }, { passive: true });
  }

  // Enhanced swipe navigation for sections
  setupSectionSwipeNavigation() {
    document.addEventListener('swipe', (e) => {
      // Only handle swipes on main content area
      if (!e.detail.target.closest('.main-content')) return;
      
      // Ignore swipes on specific elements
      if (e.detail.target.closest('.map-container, .modal, .hamburger-menu')) return;
      
      const direction = e.detail.direction;
      
      if (direction === 'left') {
        // Swipe left - next section
        if (window.navigationManager) {
          window.navigationManager.navigateToNextSection();
        }
      } else if (direction === 'right') {
        // Swipe right - previous section
        if (window.navigationManager) {
          window.navigationManager.navigateToPreviousSection();
        }
      }
    });
  }

  // Pull-to-refresh functionality
  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    const threshold = 100;
    let isPulling = false;
    
    const refreshIndicator = this.createRefreshIndicator();
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!isPulling || window.scrollY > 0) {
        isPulling = false;
        return;
      }
      
      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;
      
      if (pullDistance > 0) {
        e.preventDefault();
        
        // Update refresh indicator
        this.updateRefreshIndicator(refreshIndicator, pullDistance, threshold);
      }
    });
    
    document.addEventListener('touchend', () => {
      if (isPulling && pullDistance > threshold) {
        this.triggerRefresh();
      }
      
      // Reset
      isPulling = false;
      pullDistance = 0;
      this.resetRefreshIndicator(refreshIndicator);
    });
  }

  createRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'pull-refresh-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: var(--surface-elevated);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px var(--shadow-color);
      transition: all 0.3s ease;
      z-index: 1001;
    `;
    indicator.innerHTML = '↓';
    document.body.appendChild(indicator);
    
    return indicator;
  }

  updateRefreshIndicator(indicator, distance, threshold) {
    const progress = Math.min(distance / threshold, 1);
    const translateY = Math.min(distance * 0.5, 60);
    
    indicator.style.transform = `translateX(-50%) translateY(${translateY}px) rotate(${progress * 180}deg)`;
    indicator.style.opacity = progress;
    
    if (progress >= 1) {
      indicator.style.background = 'var(--primary-color)';
      indicator.style.color = 'white';
    } else {
      indicator.style.background = 'var(--surface-elevated)';
      indicator.style.color = 'var(--text-primary)';
    }
  }

  resetRefreshIndicator(indicator) {
    indicator.style.transform = 'translateX(-50%) translateY(-60px) rotate(0deg)';
    indicator.style.opacity = '0';
    indicator.style.background = 'var(--surface-elevated)';
    indicator.style.color = 'var(--text-primary)';
  }

  triggerRefresh() {
    // Dispatch refresh event
    window.dispatchEvent(new CustomEvent('pullRefresh'));
    
    // Show loading state briefly
    if (window.qrManager) {
      window.qrManager.showInfo('データを更新しています...');
    }
    
    // Trigger app refresh
    setTimeout(() => {
      if (window.starbucksApp) {
        window.starbucksApp.refresh();
      }
    }, 500);
  }

  // Improved touch targets
  enhanceTouchTargets() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-device .touch-active {
        background-color: var(--surface-color) !important;
        transform: scale(0.98) !important;
        transition: all 0.1s ease !important;
      }
      
      .touch-device button:active,
      .touch-device .btn:active {
        transform: scale(0.96) !important;
      }
      
      .touch-device .card:active {
        transform: scale(0.98) !important;
      }
      
      /* Improve touch scrolling */
      .touch-device .section,
      .touch-device .menu-content,
      .touch-device .modal-content {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* Hide scrollbars on touch devices */
      .touch-device ::-webkit-scrollbar {
        display: none;
      }
      
      .touch-device {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Prevent zoom on double tap
  preventDoubleTabZoom() {
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // Public API
  isSupported() {
    return this.isTouch;
  }

  enableSwipeNavigation() {
    this.setupSectionSwipeNavigation();
  }

  enablePullToRefresh() {
    this.setupPullToRefresh();
  }

  addSwipeListener(element, callback) {
    element.addEventListener('swipe', callback);
  }

  addLongPressListener(element, callback) {
    element.addEventListener('longpress', callback);
  }
}

// Initialize touch manager
document.addEventListener('DOMContentLoaded', () => {
  window.touchManager = new TouchManager();
  
  // Enable features based on device
  if (window.touchManager.isSupported()) {
    window.touchManager.enhanceTouchTargets();
    window.touchManager.preventDoubleTabZoom();
    
    // Enable after navigation manager is ready
    setTimeout(() => {
      window.touchManager.enableSwipeNavigation();
      window.touchManager.enablePullToRefresh();
    }, 1000);
  }
});