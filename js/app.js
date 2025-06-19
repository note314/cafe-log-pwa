// Main Application Controller

class StarbucksApp {
  constructor() {
    this.isInitialized = false;
    this.storeData = null;
    this.components = {};
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing Starbucks PWA...');
      
      // Initialize core systems first
      await this.initializeCore();
      
      // Load store data
      await this.loadStoreData();
      
      // Initialize components
      await this.initializeComponents();
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('✅ Starbucks PWA initialized successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('appReady'));
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showErrorMessage('アプリの初期化に失敗しました');
    }
  }

  async initializeCore() {
    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Initialize storage manager (already done in storage.js)
    if (!window.storageManager) {
      throw new Error('Storage manager not available');
    }

    // Apply stored theme
    const theme = window.storageManager.getTheme();
    document.body.setAttribute('data-theme', theme);
  }

  async loadStoreData() {
    try {
      console.log('🔄 Loading store data from ./data/store_list.json...');
      const response = await fetch('./data/store_list.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const sourceData = await response.json();
      console.log(`📊 Successfully loaded source data:`, {
        stores: sourceData.stores?.length || 0,
        regions: Object.keys(sourceData.regions || {}).length,
        prefectures: Object.keys(sourceData.prefectures || {}).length,
        version: sourceData.metadata?.dataVersion?.current || sourceData.metadata?.version
      });
      
      // データ統合処理
      if (window.dataIntegrationManager) {
        console.log('🔄 Integrating source data with user state...');
        this.storeData = await window.dataIntegrationManager.integrateStoreData(sourceData);
        console.log(`✅ Data integration completed:`, {
          totalStores: this.storeData.stores?.length || 0,
          visitedStores: this.storeData.metadata?.integration?.totalVisited || 0,
          favoriteStores: this.storeData.metadata?.integration?.totalFavorites || 0
        });
      } else {
        // フォールバック: 従来方式
        this.storeData = sourceData;
        window.storageManager.setStoredStoreData(this.storeData);
      }
      
      // Initialize progress manager with store data
      if (window.progressManager) {
        console.log('📈 Initializing progress manager...');
        await window.progressManager.init(this.storeData);
      }
      
    } catch (error) {
      console.error('❌ Error loading store data:', error);
      
      // Try to load from cache
      this.storeData = window.storageManager.getStoredStoreData();
      if (!this.storeData) {
        throw new Error('Could not load store data');
      }
      
      console.log('📦 Using cached store data');
    }
  }

  async initializeComponents() {
    // Wait for page components to be available
    await this.waitForPageComponents();
    
    // Initialize page components
    this.components.topPage = window.topPage || new TopPage();
    this.components.storesPage = window.storesPage || new StoresPage();  
    this.components.achievementsPage = window.achievementsPage || new AchievementsPage();
    
    // Wait for components to be ready
    await Promise.all([
      this.components.topPage.init(),
      this.components.storesPage.init(),
      this.components.achievementsPage.init()
    ]);
    
    // Initialize map last (requires Google Maps API)
    if (window.mapManager) {
      await window.mapManager.initializeMainMap();
      
      // Force map resize after CSS is fully applied
      setTimeout(() => {
        window.mapManager.resize();
        console.log('🗺️ Map resized after initialization');
      }, 200);
    }
    
    // Ensure all components refresh their data after initialization
    console.log('🔄 Refreshing component data after initialization...');
    if (this.components.topPage) {
      await this.components.topPage.refresh();
    }
  }

  async waitForPageComponents() {
    // Wait for page component scripts to load and define classes
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (attempts < maxAttempts) {
      if (window.topPage && window.storesPage && window.achievementsPage) {
        console.log('✅ All page components loaded');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.warn('⚠️ Some page components may not be loaded');
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  setupGlobalEventListeners() {
    // Handle data updates
    window.addEventListener('dataUpdated', (e) => {
      this.handleDataUpdate(e.detail);
    });

    // Handle section changes
    window.addEventListener('sectionChange', (e) => {
      this.handleSectionChange(e.detail);
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.handleOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatus(false);
    });

    // Handle app installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.handleInstallPrompt(e);
    });

    // Handle visibility changes (for background sync)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeyboard(e);
    });
  }

  handleDataUpdate(detail) {
    console.log('📝 Data updated:', detail);
    
    // Update progress manager
    if (window.progressManager) {
      window.progressManager.updateVisitedStores();
    }
    
    // Refresh current page
    const currentSection = window.navigationManager?.getCurrentSection();
    if (currentSection && this.components[currentSection + 'Page']) {
      const page = this.components[currentSection + 'Page'];
      if (typeof page.refresh === 'function') {
        page.refresh();
      }
    }
    
    // Update map markers if map is visible
    if (window.mapManager && currentSection === 'top') {
      window.mapManager.refresh();
    }
  }

  handleSectionChange(detail) {
    console.log('🔄 Section changed:', detail);
    
    // Handle section-specific initialization
    const { to } = detail;
    
    if (to === 'top' && window.mapManager) {
      setTimeout(() => {
        window.mapManager.resize();
      }, 300);
    }
    
    if (to === 'achievements') {
      // SVG地図は個別に初期化されるため、Google Maps呼び出しは不要
      // achievements.jsのrefreshMapTabが直接SVG地図を描画
    }
  }

  handleOnlineStatus(isOnline) {
    const statusMessage = isOnline ? 'オンラインになりました' : 'オフラインです';
    this.showToast(statusMessage, isOnline ? 'success' : 'info');
    
    // Update UI elements to reflect online status
    document.body.classList.toggle('offline', !isOnline);
  }

  handleInstallPrompt(e) {
    // Store the event for later use
    this.deferredPrompt = e;
    
    // Show install banner or button
    this.showInstallPrompt();
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      // App became visible - refresh data if needed
      this.checkForUpdates();
    }
  }

  handleResize() {
    // Resize maps
    if (window.mapManager) {
      window.mapManager.resize();
    }
    
    // Update responsive elements
    this.updateResponsiveElements();
  }

  handleGlobalKeyboard(e) {
    // Handle global keyboard shortcuts
    if (e.key === 'Escape') {
      // Close all modals
      if (window.headerManager) {
        window.headerManager.closeAllModals();
      }
    }
    
    // Debug shortcut (Ctrl/Cmd + Shift + D)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      this.showDebugInfo();
    }
  }

  showUpdateAvailable() {
    const message = 'アプリの更新があります。再読み込みしますか？';
    if (confirm(message)) {
      window.location.reload();
    }
  }

  showInstallPrompt() {
    if (!this.deferredPrompt) return;
    
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.style.cssText = `
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      background: var(--primary-color);
      color: white;
      padding: 1rem;
      text-align: center;
      z-index: 1001;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;
    
    banner.innerHTML = `
      <p style="margin-bottom: 0.5rem;">このアプリをホーム画面に追加できます</p>
      <div>
        <button id="installApp" style="background: white; color: var(--primary-color); border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-right: 0.5rem;">
          インストール
        </button>
        <button id="dismissInstall" style="background: transparent; color: white; border: 1px solid white; padding: 0.5rem 1rem; border-radius: 4px;">
          後で
        </button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Show banner
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);
    
    // Handle install button
    banner.querySelector('#installApp').addEventListener('click', async () => {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('Install outcome:', outcome);
      this.deferredPrompt = null;
      banner.remove();
    });
    
    // Handle dismiss button
    banner.querySelector('#dismissInstall').addEventListener('click', () => {
      banner.remove();
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  async checkForUpdates() {
    // Check if there are any updates to store data
    try {
      const response = await fetch('./data/store_list.json');
      if (response.ok) {
        const newData = await response.json();
        const currentVersion = this.storeData?.metadata?.version;
        const newVersion = newData?.metadata?.version;
        
        if (newVersion && currentVersion && newVersion !== currentVersion) {
          this.showDataUpdate(newData);
        }
      }
    } catch (error) {
      // Silently fail - we're offline or server is unavailable
    }
  }

  showDataUpdate(newData) {
    const message = '店舗データが更新されました。更新を適用しますか？';
    if (confirm(message)) {
      this.storeData = newData;
      window.storageManager.setStoredStoreData(newData);
      
      if (window.progressManager) {
        window.progressManager.init(newData);
      }
      
      // Refresh all components
      Object.values(this.components).forEach(component => {
        if (typeof component.refresh === 'function') {
          component.refresh();
        }
      });
      
      this.showToast('店舗データを更新しました', 'success');
    }
  }

  updateResponsiveElements() {
    // Update any responsive elements that need manual adjustment
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;
    
    document.body.classList.toggle('tablet', isTablet);
    document.body.classList.toggle('desktop', isDesktop);
  }

  showDebugInfo() {
    const debugInfo = {
      app: {
        initialized: this.isInitialized,
        version: window.storageManager?.getAppVersion(),
        components: Object.keys(this.components)
      },
      data: {
        storesLoaded: this.storeData?.stores?.length || 0,
        visitedStores: window.storageManager?.getVisitedStores()?.length || 0,
        favoriteAreas: window.storageManager?.getFavoriteAreas()?.length || 0
      },
      system: {
        online: navigator.onLine,
        serviceWorker: 'serviceWorker' in navigator,
        localStorage: 'localStorage' in window,
        theme: window.storageManager?.getTheme()
      }
    };
    
    console.table(debugInfo);
    
    if (window.qrManager) {
      window.qrManager.showInfo('デバッグ情報をコンソールに出力しました');
    }
  }

  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--error-color);
      color: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      z-index: 9999;
      max-width: 90%;
    `;
    
    errorDiv.innerHTML = `
      <h3>エラー</h3>
      <p>${message}</p>
      <button onclick="window.location.reload()" style="background: white; color: var(--error-color); border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem;">
        再読み込み
      </button>
    `;
    
    document.body.appendChild(errorDiv);
  }

  showToast(message, type = 'info') {
    if (window.qrManager) {
      if (type === 'success') {
        window.qrManager.showSuccess(message);
      } else if (type === 'error') {
        window.qrManager.showError(message);
      } else {
        window.qrManager.showInfo(message);
      }
    }
  }

  // Public API methods
  getStoreData() {
    return this.storeData;
  }

  getComponent(name) {
    return this.components[name];
  }

  isReady() {
    return this.isInitialized;
  }

  async refresh() {
    await this.checkForUpdates();
    
    // Refresh all components
    Object.values(this.components).forEach(component => {
      if (typeof component.refresh === 'function') {
        component.refresh();
      }
    });
  }
}

// Page classes are defined in separate files

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.starbucksApp = new StarbucksApp();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StarbucksApp;
}