// Navigation and Section Management Component

class NavigationManager {
  constructor() {
    this.currentSection = 'top';
    this.sections = {};
    this.sectionButtons = {};
    this.history = ['top'];
    this.maxHistoryLength = 10;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.handleInitialRoute();
  }

  setupElements() {
    // Get all sections
    const sectionElements = document.querySelectorAll('.section');
    sectionElements.forEach(section => {
      const id = section.id.replace('-section', '');
      this.sections[id] = section;
    });

    // Get all section buttons
    const buttonElements = document.querySelectorAll('.section-btn');
    buttonElements.forEach(button => {
      const section = button.getAttribute('data-section');
      this.sectionButtons[section] = button;
    });
  }

  setupEventListeners() {
    // Section button clicks
    document.addEventListener('click', (e) => {
      const sectionBtn = e.target.closest('.section-btn');
      if (sectionBtn) {
        const section = sectionBtn.getAttribute('data-section');
        if (section) {
          this.navigateToSection(section);
        }
      }
    });

    // Browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.section) {
        this.navigateToSection(e.state.section, false);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        this.handleKeyboardShortcuts(e);
      }
    });

    // Touch/swipe navigation for mobile
    this.setupSwipeNavigation();
  }

  navigateToSection(sectionId, addToHistory = true) {
    if (!this.sections[sectionId]) {
      console.warn('Section not found:', sectionId);
      return false;
    }

    if (this.currentSection === sectionId) {
      return true; // Already on this section
    }

    // Hide current section
    if (this.sections[this.currentSection]) {
      this.sections[this.currentSection].classList.remove('active');
    }

    // Show new section
    this.sections[sectionId].classList.add('active');

    // Update button states
    this.updateButtonStates(sectionId);

    // Update current section
    const previousSection = this.currentSection;
    this.currentSection = sectionId;

    // Add to history
    if (addToHistory) {
      this.addToHistory(sectionId);
      this.updateBrowserHistory(sectionId);
    }

    // Trigger section change event
    this.triggerSectionChangeEvent(previousSection, sectionId);

    // Update page title
    this.updatePageTitle(sectionId);

    // Handle section-specific initialization
    this.initializeSection(sectionId);

    return true;
  }

  updateButtonStates(activeSection) {
    Object.keys(this.sectionButtons).forEach(section => {
      const button = this.sectionButtons[section];
      if (section === activeSection) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
      } else {
        button.classList.remove('active');
        button.removeAttribute('aria-current');
      }
    });
  }

  addToHistory(sectionId) {
    // Remove any future history if we're not at the end
    const currentIndex = this.history.indexOf(this.currentSection);
    if (currentIndex >= 0 && currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, currentIndex + 1);
    }

    // Add new section to history
    this.history.push(sectionId);

    // Limit history length
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
  }

  updateBrowserHistory(sectionId) {
    const url = new URL(window.location);
    url.searchParams.set('section', sectionId);
    
    window.history.pushState(
      { section: sectionId },
      this.getSectionTitle(sectionId),
      url.toString()
    );
  }

  handleInitialRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedSection = urlParams.get('section');
    
    if (requestedSection && this.sections[requestedSection]) {
      this.navigateToSection(requestedSection, false);
    } else {
      // Ensure default section is properly activated
      this.navigateToSection(this.currentSection, false);
    }
  }

  triggerSectionChangeEvent(fromSection, toSection) {
    const event = new CustomEvent('sectionChange', {
      detail: {
        from: fromSection,
        to: toSection,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  initializeSection(sectionId) {
    // Call section-specific initialization functions
    switch (sectionId) {
      case 'top':
        if (window.topPage && typeof window.topPage.refresh === 'function') {
          window.topPage.refresh();
        }
        break;
      case 'stores':
        if (window.storesPage && typeof window.storesPage.refresh === 'function') {
          window.storesPage.refresh();
        }
        break;
      case 'achievements':
        if (window.achievementsPage && typeof window.achievementsPage.refresh === 'function') {
          window.achievementsPage.refresh();
        }
        break;
    }
  }

  getSectionTitle(sectionId) {
    const titles = {
      'top': 'トップ',
      'stores': '店舗リスト',
      'achievements': '実績'
    };
    return titles[sectionId] || sectionId;
  }

  updatePageTitle(sectionId) {
    const baseTitle = 'Cafe★Log';
    const sectionTitle = this.getSectionTitle(sectionId);
    document.title = `${sectionTitle} - ${baseTitle}`;
  }

  handleKeyboardShortcuts(e) {
    const key = e.key.toLowerCase();
    let targetSection = null;

    switch (key) {
      case '1':
        targetSection = 'top';
        break;
      case '2':
        targetSection = 'stores';
        break;
      case '3':
        targetSection = 'achievements';
        break;
    }

    if (targetSection) {
      e.preventDefault();
      this.navigateToSection(targetSection);
    }
  }

  setupSwipeNavigation() {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const minSwipeDistance = 50;
    const maxVerticalDistance = 100;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = Math.abs(endY - startY);

      // Only process horizontal swipes
      if (Math.abs(deltaX) > minSwipeDistance && deltaY < maxVerticalDistance) {
        if (deltaX > 0) {
          // Swipe right - go to previous section
          this.navigateToPreviousSection();
        } else {
          // Swipe left - go to next section
          this.navigateToNextSection();
        }
      }
    }, { passive: true });
  }

  navigateToNextSection() {
    const sectionOrder = ['top', 'stores', 'achievements'];
    const currentIndex = sectionOrder.indexOf(this.currentSection);
    
    if (currentIndex >= 0 && currentIndex < sectionOrder.length - 1) {
      this.navigateToSection(sectionOrder[currentIndex + 1]);
    }
  }

  navigateToPreviousSection() {
    const sectionOrder = ['top', 'stores', 'achievements'];
    const currentIndex = sectionOrder.indexOf(this.currentSection);
    
    if (currentIndex > 0) {
      this.navigateToSection(sectionOrder[currentIndex - 1]);
    }
  }

  goBack() {
    if (this.history.length > 1) {
      // Remove current section from history
      this.history.pop();
      // Get previous section
      const previousSection = this.history[this.history.length - 1];
      this.navigateToSection(previousSection, false);
      return true;
    }
    return false;
  }

  getCurrentSection() {
    return this.currentSection;
  }

  getSectionElement(sectionId) {
    return this.sections[sectionId] || null;
  }

  getAllSections() {
    return Object.keys(this.sections);
  }

  isValidSection(sectionId) {
    return this.sections.hasOwnProperty(sectionId);
  }

  // For external navigation (e.g., from links or programmatic navigation)
  navigate(sectionId, options = {}) {
    const {
      addToHistory = true,
      updateUrl = true,
      force = false
    } = options;

    if (!force && this.currentSection === sectionId) {
      return true;
    }

    return this.navigateToSection(sectionId, addToHistory);
  }

  // Get navigation state for debugging
  getNavigationState() {
    return {
      currentSection: this.currentSection,
      history: [...this.history],
      availableSections: Object.keys(this.sections)
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigationManager = new NavigationManager();
});