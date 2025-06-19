// Stores Page Component

class StoresPage {
  constructor() {
    this.breadcrumb = null;
    this.storeContent = null;
    this.storeSearch = null;
    this.currentView = 'regions'; // regions, prefecture, area, stores
    this.currentRegion = null;
    this.currentPrefecture = null;
    this.currentArea = null;
    this.searchResults = [];
    this.isInitialized = false;
    this.navigationHistory = [];
  }

  async init() {
    this.setupElements();
    this.setupEventListeners();
    this.isInitialized = true;
    
    // Show initial view
    this.showRegions();
    
    console.log('🏪 Stores page initialized');
  }

  setupElements() {
    this.breadcrumb = document.getElementById('breadcrumb');
    this.storeContent = document.getElementById('storeContent');
    this.storeSearch = document.getElementById('storeSearch');
  }

  setupEventListeners() {
    // Search input
    if (this.storeSearch) {
      this.storeSearch.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Listen for navigation events
    window.addEventListener('navigateToArea', (e) => {
      this.navigateToSpecificArea(e.detail);
    });

    window.addEventListener('navigateToPrefecture', (e) => {
      this.navigateToSpecificPrefecture(e.detail);
    });

    // Listen for data updates
    window.addEventListener('dataUpdated', () => {
      this.refresh();
    });

    // Listen for section changes
    window.addEventListener('sectionChange', (e) => {
      if (e.detail.to === 'stores') {
        this.onSectionActivated();
      }
    });
  }


  async refresh() {
    if (!this.isInitialized) return;
    
    // Refresh current view
    switch (this.currentView) {
      case 'regions':
        this.showRegions();
        break;
      case 'prefecture':
        this.showPrefecture(this.currentPrefecture);
        break;
      case 'area':
        this.showArea(this.currentPrefecture, this.currentArea);
        break;
      case 'stores':
        this.showStores(this.currentPrefecture, this.currentArea);
        break;
      case 'search':
        this.handleSearch(this.storeSearch.value);
        break;
    }
  }

  showRegions() {
    this.currentView = 'regions';
    this.currentRegion = null;
    this.currentPrefecture = null;
    this.currentArea = null;
    this.updateBreadcrumb(['地方選択']);
    
    if (!window.starbucksApp || !window.starbucksApp.getStoreData()) {
      this.showLoading();
      return;
    }

    const storeData = window.starbucksApp.getStoreData();
    const regions = storeData.regions;
    
    let html = '<div class="region-grid">';
    
    Object.keys(regions).forEach(regionId => {
      const region = regions[regionId];
      const stats = this.getRegionStats(regionId);
      
      html += `
        <div class="region-item" data-region="${regionId}">
          <div class="region-info">
            <h3 class="region-name">${region.name}</h3>
            <div class="region-stats">
              <div class="progress">
                <div class="progress-bar" style="width: ${stats.percentage}%"></div>
              </div>
              <span class="region-percentage">${stats.percentage}% (${stats.visited}/${stats.total})</span>
            </div>
          </div>
          <div class="region-chevron">›</div>
        </div>
      `;
    });
    
    html += '</div>';
    this.storeContent.innerHTML = html;
    
    // Add click handlers
    this.storeContent.querySelectorAll('.region-item').forEach(item => {
      item.addEventListener('click', () => {
        const regionId = item.getAttribute('data-region');
        this.showRegionPrefectures(regionId);
      });
    });
  }

  showRegionPrefectures(regionId) {
    this.currentView = 'prefecture';
    this.currentRegion = regionId;
    this.currentPrefecture = null;
    this.currentArea = null;
    
    const storeData = window.starbucksApp.getStoreData();
    const region = storeData.regions[regionId];
    
    this.updateBreadcrumb(['地方選択', region.name]);
    
    let html = '<div class="prefecture-grid">';
    
    region.prefectures.forEach(prefectureId => {
      const prefecture = storeData.prefectures[prefectureId];
      if (!prefecture) return;
      
      const stats = this.getPrefectureStats(prefectureId);
      
      html += `
        <div class="prefecture-item" data-prefecture="${prefectureId}">
          <div class="prefecture-info">
            <h3 class="prefecture-name">${prefecture.name}</h3>
            <div class="prefecture-stats">
              <div class="progress">
                <div class="progress-bar" style="width: ${stats.percentage}%"></div>
              </div>
              <span class="prefecture-percentage">${stats.percentage}% (${stats.visited}/${stats.total})</span>
            </div>
          </div>
          <div class="prefecture-actions">
            <button class="favorite-btn ${this.isPrefectureFavorite(prefectureId) ? 'active' : ''}" 
                    data-prefecture="${prefectureId}" title="マイエリアに追加">
              ❤
            </button>
            <div class="prefecture-chevron">›</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    this.storeContent.innerHTML = html;
    
    // Add click handlers
    this.setupPrefectureEventHandlers();
  }

  showPrefecture(prefectureId) {
    this.currentView = 'area';
    this.currentPrefecture = prefectureId;
    this.currentArea = null;
    
    const storeData = window.starbucksApp.getStoreData();
    const prefecture = storeData.prefectures[prefectureId];
    
    // Find the region for this prefecture to build proper breadcrumb
    let regionName = '';
    Object.keys(storeData.regions).forEach(regionId => {
      const region = storeData.regions[regionId];
      if (region.prefectures.includes(prefectureId)) {
        regionName = region.name;
        this.currentRegion = regionId;
      }
    });
    
    this.updateBreadcrumb(['地方選択', regionName, prefecture.name]);
    
    let html = '<div class="area-grid">';
    
    Object.keys(prefecture.areas).forEach(areaId => {
      const area = prefecture.areas[areaId];
      const stats = this.getAreaStats(prefectureId, areaId);
      
      html += `
        <div class="area-item" data-prefecture="${prefectureId}" data-area="${areaId}">
          <div class="area-info">
            <h3 class="area-name">${area.name}</h3>
            <div class="area-stats">
              <div class="progress">
                <div class="progress-bar" style="width: ${stats.percentage}%"></div>
              </div>
              <span class="area-percentage">${stats.percentage}% (${stats.visited}/${stats.total})</span>
            </div>
          </div>
          <div class="area-actions">
            <div class="area-chevron">›</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    this.storeContent.innerHTML = html;
    
    // Add click handlers
    this.setupAreaEventHandlers();
  }

  showArea(prefectureId, areaId) {
    this.currentView = 'stores';
    this.currentPrefecture = prefectureId;
    this.currentArea = areaId;
    
    const storeData = window.starbucksApp.getStoreData();
    const prefecture = storeData.prefectures[prefectureId];
    const area = prefecture.areas[areaId];
    
    // Find the region for this prefecture to build proper breadcrumb
    let regionName = '';
    Object.keys(storeData.regions).forEach(regionId => {
      const region = storeData.regions[regionId];
      if (region.prefectures.includes(prefectureId)) {
        regionName = region.name;
        this.currentRegion = regionId;
      }
    });
    
    this.updateBreadcrumb(['地方選択', regionName, prefecture.name, area.name]);
    
    // Get stores in this area
    const stores = storeData.stores.filter(store => 
      store.location?.prefecture === prefectureId && store.location?.area === areaId
    );
    
    this.renderStores(stores);
  }

  showStores(prefectureId, areaId) {
    this.showArea(prefectureId, areaId);
  }

  renderStores(stores) {
    if (stores.length === 0) {
      this.storeContent.innerHTML = `
        <div class="empty-state">
          <p>この地域には店舗がありません</p>
        </div>
      `;
      return;
    }

    const visitedStores = window.storageManager.getVisitedStores();
    
    let html = '<div class="store-grid">';
    
    stores.forEach(store => {
      // 新しいデータ構造に対応
      const storeId = store.storeInfo?.id || store.id;
      const storeName = store.storeInfo?.name || store.name;
      const storeAddress = store.location?.address || store.address;
      const isVisited = visitedStores.includes(storeId);
      
      html += `
        <div class="store-item ${isVisited ? 'visited' : ''} clickable" data-store-id="${storeId}" 
             title="${isVisited ? 'タップして未訪問にする' : 'タップして訪問済みにする'}">
          <div class="store-info">
            <h3 class="store-name">${storeName}</h3>
            <p class="store-address">${storeAddress}</p>
          </div>
          <div class="store-status">
            <div class="visit-status">
              <span class="status-icon">${isVisited ? '✓' : '○'}</span>
              <span class="status-text">${isVisited ? '訪問済み' : '未訪問'}</span>
            </div>
            <button class="map-pin-btn" data-store-id="${storeId}" title="地図で表示" onclick="event.stopPropagation();">
              📍
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    this.storeContent.innerHTML = html;
    
    // Add click handlers
    this.setupStoreEventHandlers();
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.showRegions();
      return;
    }

    this.currentView = 'search';
    this.updateBreadcrumb(['検索結果', `"${query}"`]);
    
    const storeData = window.starbucksApp.getStoreData();
    const results = storeData.stores.filter(store => {
      const storeName = store.storeInfo?.name || store.name;
      const storeAddress = store.location?.address || store.address;
      return storeName.toLowerCase().includes(query.toLowerCase()) ||
             storeAddress.toLowerCase().includes(query.toLowerCase());
    });
    
    this.searchResults = results;
    this.renderStores(results);
  }

  setupPrefectureEventHandlers() {
    // Prefecture navigation
    this.storeContent.querySelectorAll('.prefecture-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-btn')) return;
        
        const prefectureId = item.getAttribute('data-prefecture');
        this.showPrefecture(prefectureId);
      });
    });

    // Favorite buttons
    this.storeContent.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prefectureId = btn.getAttribute('data-prefecture');
        this.togglePrefectureFavorite(prefectureId);
      });
    });
  }

  setupAreaEventHandlers() {
    // Area navigation
    this.storeContent.querySelectorAll('.area-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-btn')) return;
        
        const prefectureId = item.getAttribute('data-prefecture');
        const areaId = item.getAttribute('data-area');
        this.showArea(prefectureId, areaId);
      });
    });

    // Favorite buttons
    this.storeContent.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const areaKey = btn.getAttribute('data-area-key');
        this.toggleAreaFavorite(areaKey);
      });
    });
  }

  setupStoreEventHandlers() {
    // Store item click to toggle visit status
    this.storeContent.querySelectorAll('.store-item.clickable').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking the map pin button
        if (e.target.classList.contains('map-pin-btn') || e.target.closest('.map-pin-btn')) {
          return;
        }
        
        const storeId = item.getAttribute('data-store-id');
        this.toggleStoreVisited(storeId);
      });
    });

    // Map pin buttons
    this.storeContent.querySelectorAll('.map-pin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storeId = btn.getAttribute('data-store-id');
        this.showStoreOnMap(storeId);
      });
    });
  }

  toggleStoreVisited(storeId) {
    const success = window.storageManager.toggleStoreVisited(storeId);
    
    if (success) {
      // Update UI immediately
      const storeItem = this.storeContent.querySelector(`[data-store-id="${storeId}"]`);
      const statusIcon = storeItem.querySelector('.status-icon');
      const statusText = storeItem.querySelector('.status-text');
      const isVisited = window.storageManager.isStoreVisited(storeId);
      
      storeItem.classList.toggle('visited', isVisited);
      storeItem.title = isVisited ? 'タップして未訪問にする' : 'タップして訪問済みにする';
      
      if (statusIcon) {
        statusIcon.textContent = isVisited ? '✓' : '○';
      }
      if (statusText) {
        statusText.textContent = isVisited ? '訪問済み' : '未訪問';
      }
      
      // Dispatch data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { source: 'stores-toggle', storeId }
      }));
      
      // Show toast
      const storeData = window.starbucksApp.getStoreData();
      const store = storeData.stores.find(s => s.id === storeId);
      const message = isVisited 
        ? `${store.name} を訪問済みにマークしました`
        : `${store.name} を未訪問にマークしました`;
      
      this.showToast(message);
    }
  }

  toggleAreaFavorite(areaKey) {
    const success = window.storageManager.toggleAreaFavorite(areaKey);
    
    if (success) {
      // Update UI
      const btn = this.storeContent.querySelector(`[data-area-key="${areaKey}"]`);
      if (btn) {
        btn.classList.toggle('active');
      }
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('favoriteAreasUpdated'));
      
      const isNowFavorite = window.storageManager.isAreaFavorite(areaKey);
      const message = isNowFavorite ? 'お気に入りに追加しました' : 'お気に入りから削除しました';
      this.showToast(message);
    }
  }

  togglePrefectureFavorite(prefectureId) {
    const success = window.storageManager.toggleFavoritePrefecture(prefectureId);
    
    if (success) {
      // Update UI immediately - find the specific favorite button
      const favoriteBtn = this.storeContent.querySelector(`.favorite-btn[data-prefecture="${prefectureId}"]`);
      if (favoriteBtn) {
        const isNowFavorite = window.storageManager.isFavoritePrefecture(prefectureId);
        favoriteBtn.classList.toggle('active', isNowFavorite);
      }
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('favoritePrefecturesUpdated'));
      
      const isNowFavorite = window.storageManager.isFavoritePrefecture(prefectureId);
      const prefectureName = window.starbucksApp.getStoreData().prefectures[prefectureId]?.name || '都道府県';
      const message = isNowFavorite ? `${prefectureName}をマイエリアに追加しました` : `${prefectureName}をマイエリアから削除しました`;
      this.showToast(message);
    }
  }

  showStoreOnMap(storeId) {
    // Navigate to top page
    window.navigationManager.navigate('top');
    
    // Show store on map after navigation
    setTimeout(() => {
      if (window.mapManager) {
        window.mapManager.showStoreOnMap(storeId);
      }
    }, 300);
  }

  isPrefectureFavorite(prefectureId) {
    return window.storageManager.isFavoritePrefecture(prefectureId);
  }

  isAreaFavorite(areaKey) {
    return window.storageManager.isAreaFavorite(areaKey);
  }

  updateBreadcrumb(items) {
    if (!this.breadcrumb) return;
    
    // Build breadcrumb items
    const breadcrumbItems = items.map((item, index) => {
      const isLast = index === items.length - 1;
      const clickable = !isLast ? 'breadcrumb-clickable' : '';
      return `
        <span class="breadcrumb-item ${isLast ? 'active' : ''} ${clickable}" data-breadcrumb-index="${index}">${item}</span>
        ${!isLast ? '<span class="breadcrumb-separator">›</span>' : ''}
      `;
    }).join('');
    
    // Add back button if not at top level
    const showBackButton = this.currentView !== 'regions';
    const backButtonHtml = showBackButton ? `
      <button class="breadcrumb-back-btn" title="1つ上のレベルに戻る">
        戻る
      </button>
    ` : '';
    
    // Create breadcrumb container with flexbox layout
    this.breadcrumb.innerHTML = `
      <div class="breadcrumb-content">
        ${breadcrumbItems}
      </div>
      ${backButtonHtml}
    `;
    
    // Style the breadcrumb container
    this.breadcrumb.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    `;
    
    // Style the breadcrumb content
    const breadcrumbContent = this.breadcrumb.querySelector('.breadcrumb-content');
    if (breadcrumbContent) {
      breadcrumbContent.style.cssText = `
        display: flex;
        align-items: center;
        flex: 1;
      `;
    }
    
    // Style the back button
    const backButton = this.breadcrumb.querySelector('.breadcrumb-back-btn');
    if (backButton) {
      backButton.style.cssText = `
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        margin-left: 1rem;
        white-space: nowrap;
        transition: background-color 0.2s;
      `;
      
      // Add hover effect
      backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = 'var(--primary-dark)';
      });
      backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = 'var(--primary-color)';
      });
      
      // Add click handler
      backButton.addEventListener('click', () => {
        this.goBack();
      });
    }
    
    // Add click handlers to breadcrumb items
    this.breadcrumb.querySelectorAll('.breadcrumb-clickable').forEach(item => {
      item.style.cursor = 'pointer';
      item.style.color = 'var(--primary-color)';
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-breadcrumb-index'));
        this.navigateToBreadcrumbLevel(index);
      });
    });
  }

  navigateToSpecificArea(detail) {
    const { prefecture, area } = detail;
    this.showArea(prefecture, area);
  }

  navigateToSpecificPrefecture(detail) {
    const { prefecture } = detail;
    this.showPrefecture(prefecture);
  }

  navigateToSpecificPrefectureFromMyAreas(prefectureId) {
    // Special navigation from My Areas - go directly to prefecture area list
    // This will set the proper breadcrumb and region context
    this.showPrefecture(prefectureId);
  }

  navigateToBreadcrumbLevel(index) {
    switch (index) {
      case 0: // 地方選択
        this.showRegions();
        break;
      case 1: // Region name (go to prefecture list)
        if (this.currentRegion) {
          this.showRegionPrefectures(this.currentRegion);
        }
        break;
      case 2: // Prefecture name (go to area list)
        if (this.currentPrefecture) {
          this.showPrefecture(this.currentPrefecture);
        }
        break;
      default:
        break;
    }
  }

  goBack() {
    switch (this.currentView) {
      case 'regions':
        // Already at top level, do nothing
        break;
      case 'prefecture':
        // Go back to region prefecture list, or regions if no region set
        this.showRegions();
        break;
      case 'area':
        // Go back to region prefecture list 
        if (this.currentRegion) {
          this.showRegionPrefectures(this.currentRegion);
        } else {
          this.showRegions();
        }
        break;
      case 'stores':
        // Go back to prefecture area list
        if (this.currentPrefecture) {
          this.showPrefecture(this.currentPrefecture);
        } else {
          this.showRegions();
        }
        break;
      case 'search':
        this.showRegions();
        break;
      default:
        this.showRegions();
        break;
    }
  }


  getRegionStats(regionId) {
    if (!window.progressManager) return { visited: 0, total: 0, percentage: 0 };
    
    const regional = window.progressManager.getRegionalProgress();
    const region = regional.find(r => r.id === regionId);
    
    return region || { visited: 0, total: 0, percentage: 0 };
  }

  getPrefectureStats(prefectureId) {
    if (!window.progressManager) return { visited: 0, total: 0, percentage: 0 };
    
    return window.progressManager.getPrefectureProgress(prefectureId);
  }

  getAreaStats(prefectureId, areaId) {
    if (!window.progressManager) return { visited: 0, total: 0, percentage: 0 };
    
    return window.progressManager.getAreaProgress(prefectureId, areaId);
  }

  showLoading() {
    this.storeContent.innerHTML = `
      <div class="loading-state" style="text-align: center; padding: 2rem;">
        <div class="loading" style="margin: 0 auto 1rem; width: 32px; height: 32px; border: 3px solid var(--border-color); border-top: 3px solid var(--primary-color); border-radius: 50%;"></div>
        <p>データを読み込んでいます...</p>
      </div>
    `;
  }

  onSectionActivated() {
    // Refresh view when section becomes active
    this.refresh();
  }

  showToast(message) {
    if (window.qrManager) {
      window.qrManager.showSuccess(message);
    }
  }
}

// Create global instance
window.storesPage = new StoresPage();