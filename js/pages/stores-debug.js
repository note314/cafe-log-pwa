// Debug Stores Page - Simple Implementation

(function() {
  'use strict';
  
  console.log('🏪 Debug stores page loaded');
  
  class DebugStoresPage {
    constructor() {
      this.storeContent = null;
      this.breadcrumb = null;
      this.storeSearch = null;
      this.currentView = 'regions';
      this.storeData = null;
      this.isInitialized = false;
    }

    async init() {
      console.log('🏪 Initializing debug stores page...');
      
      this.setupElements();
      this.setupEventListeners();
      
      // Wait for store data
      await this.waitForStoreData();
      
      this.isInitialized = true;
      this.showRegions();
      
      console.log('🏪 Debug stores page initialized');
    }

    setupElements() {
      this.storeContent = document.getElementById('storeContent');
      this.breadcrumb = document.getElementById('breadcrumb');
      this.storeSearch = document.getElementById('storeSearch');
      
      console.log('🏪 Store elements found:', {
        storeContent: !!this.storeContent,
        breadcrumb: !!this.breadcrumb,
        storeSearch: !!this.storeSearch
      });
    }

    setupEventListeners() {
      // Search input
      if (this.storeSearch) {
        this.storeSearch.addEventListener('input', (e) => {
          this.handleSearch(e.target.value);
        });
      }

      // Listen for section changes
      window.addEventListener('sectionChange', (e) => {
        if (e.detail && e.detail.to === 'stores') {
          console.log('🏪 Stores section activated');
          this.onSectionActivated();
        }
      });
    }

    async waitForStoreData() {
      console.log('🏪 Waiting for store data...');
      
      // Try to get data from app
      if (window.starbucksApp && window.starbucksApp.getStoreData) {
        this.storeData = window.starbucksApp.getStoreData();
        if (this.storeData) {
          console.log('🏪 Store data found from app:', this.storeData);
          return;
        }
      }
      
      // Try to load data directly
      try {
        const response = await fetch('./data/store_list.json');
        this.storeData = await response.json();
        console.log('🏪 Store data loaded directly:', this.storeData);
        return;
      } catch (error) {
        console.error('🏪 Failed to load store data:', error);
      }
      
      // Fallback to sample data
      this.storeData = this.getSampleData();
      console.log('🏪 Using sample data');
    }

    getSampleData() {
      return {
        regions: {
          kanto: {
            name: "関東",
            prefectures: ["tokyo", "kanagawa"]
          }
        },
        prefectures: {
          tokyo: {
            name: "東京都",
            areas: {
              shibuya_shinjuku: { name: "渋谷・新宿" },
              central_ginza: { name: "中央・銀座" }
            }
          },
          kanagawa: {
            name: "神奈川県",
            areas: {
              yokohama: { name: "横浜市" }
            }
          }
        },
        stores: [
          {
            id: "tokyo_shibuya_001",
            name: "スターバックス コーヒー 渋谷スカイ店",
            address: "東京都渋谷区渋谷2-24-12",
            prefecture: "tokyo",
            area: "shibuya_shinjuku",
            visited: false
          },
          {
            id: "tokyo_ginza_001", 
            name: "スターバックス コーヒー 銀座マロニエゲート店",
            address: "東京都中央区銀座3-2-1",
            prefecture: "tokyo",
            area: "central_ginza",
            visited: false
          }
        ]
      };
    }

    showRegions() {
      if (!this.storeData) {
        this.showError('店舗データが読み込まれていません');
        return;
      }

      console.log('🏪 Showing regions');
      this.currentView = 'regions';
      this.updateBreadcrumb(['地方選択']);
      
      const regions = this.storeData.regions;
      let html = '<div class="region-grid">';
      
      Object.keys(regions).forEach(regionId => {
        const region = regions[regionId];
        const stats = this.getRegionStats(regionId);
        
        html += `
          <div class="region-item" data-region="${regionId}" style="
            background: var(--surface-elevated);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div class="region-info">
              <h3 class="region-name" style="margin-bottom: 0.5rem;">${region.name}</h3>
              <div class="region-stats">
                <div class="progress" style="
                  width: 100%;
                  height: 8px;
                  background: var(--progress-bg);
                  border-radius: 4px;
                  margin-bottom: 0.5rem;
                ">
                  <div class="progress-bar" style="
                    width: ${stats.percentage}%;
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 4px;
                  "></div>
                </div>
                <span class="region-percentage">${stats.percentage}% (${stats.visited}/${stats.total})</span>
              </div>
            </div>
            <div class="region-chevron" style="font-size: 1.5rem; color: var(--text-secondary);">›</div>
          </div>
        `;
      });
      
      html += '</div>';
      this.storeContent.innerHTML = html;
      
      // Add click handlers
      this.storeContent.querySelectorAll('.region-item').forEach(item => {
        item.addEventListener('click', () => {
          const regionId = item.getAttribute('data-region');
          console.log('🏪 Region clicked:', regionId);
          this.showPrefectures(regionId);
        });
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'translateY(-2px)';
          item.style.boxShadow = '0 4px 12px var(--shadow-color)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'translateY(0)';
          item.style.boxShadow = 'none';
        });
      });
    }

    showPrefectures(regionId) {
      console.log('🏪 Showing prefectures for region:', regionId);
      
      const region = this.storeData.regions[regionId];
      this.updateBreadcrumb(['地方選択', region.name]);
      
      let html = '<div class="prefecture-grid">';
      
      region.prefectures.forEach(prefectureId => {
        const prefecture = this.storeData.prefectures[prefectureId];
        if (!prefecture) return;
        
        const stats = this.getPrefectureStats(prefectureId);
        
        html += `
          <div class="prefecture-item" data-prefecture="${prefectureId}" style="
            background: var(--surface-elevated);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div class="prefecture-info" style="flex: 1;">
              <h3 class="prefecture-name" style="margin-bottom: 0.5rem;">${prefecture.name}</h3>
              <div class="prefecture-stats">
                <div class="progress" style="
                  width: 100%;
                  height: 6px;
                  background: var(--progress-bg);
                  border-radius: 3px;
                  margin-bottom: 0.25rem;
                ">
                  <div class="progress-bar" style="
                    width: ${stats.percentage}%;
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 3px;
                  "></div>
                </div>
                <span class="prefecture-percentage" style="font-size: 0.875rem;">${stats.percentage}% (${stats.visited}/${stats.total})</span>
              </div>
            </div>
            <div class="prefecture-chevron" style="font-size: 1.2rem; color: var(--text-secondary);">›</div>
          </div>
        `;
      });
      
      html += '</div>';
      this.storeContent.innerHTML = html;
      
      // Add click handlers
      this.storeContent.querySelectorAll('.prefecture-item').forEach(item => {
        item.addEventListener('click', () => {
          const prefectureId = item.getAttribute('data-prefecture');
          console.log('🏪 Prefecture clicked:', prefectureId);
          this.showAreas(prefectureId);
        });
      });
    }

    showAreas(prefectureId) {
      console.log('🏪 Showing areas for prefecture:', prefectureId);
      
      const prefecture = this.storeData.prefectures[prefectureId];
      this.updateBreadcrumb(['地方選択', '関東', prefecture.name]);
      
      let html = '<div class="area-grid">';
      
      Object.keys(prefecture.areas).forEach(areaId => {
        const area = prefecture.areas[areaId];
        const stats = this.getAreaStats(prefectureId, areaId);
        
        html += `
          <div class="area-item" data-prefecture="${prefectureId}" data-area="${areaId}" style="
            background: var(--surface-elevated);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div class="area-info" style="flex: 1;">
              <h3 class="area-name" style="margin-bottom: 0.5rem;">${area.name}</h3>
              <div class="area-stats">
                <div class="progress" style="
                  width: 100%;
                  height: 6px;
                  background: var(--progress-bg);
                  border-radius: 3px;
                  margin-bottom: 0.25rem;
                ">
                  <div class="progress-bar" style="
                    width: ${stats.percentage}%;
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 3px;
                  "></div>
                </div>
                <span class="area-percentage" style="font-size: 0.875rem;">${stats.percentage}% (${stats.visited}/${stats.total})</span>
              </div>
            </div>
            <div class="area-chevron" style="font-size: 1.2rem; color: var(--text-secondary);">›</div>
          </div>
        `;
      });
      
      html += '</div>';
      this.storeContent.innerHTML = html;
      
      // Add click handlers
      this.storeContent.querySelectorAll('.area-item').forEach(item => {
        item.addEventListener('click', () => {
          const prefectureId = item.getAttribute('data-prefecture');
          const areaId = item.getAttribute('data-area');
          console.log('🏪 Area clicked:', prefectureId, areaId);
          this.showStores(prefectureId, areaId);
        });
      });
    }

    showStores(prefectureId, areaId) {
      console.log('🏪 Showing stores for:', prefectureId, areaId);
      
      const prefecture = this.storeData.prefectures[prefectureId];
      const area = prefecture.areas[areaId];
      this.updateBreadcrumb(['地方選択', '関東', prefecture.name, area.name]);
      
      // Get stores in this area
      const stores = this.storeData.stores.filter(store => 
        store.prefecture === prefectureId && store.area === areaId
      );
      
      if (stores.length === 0) {
        this.storeContent.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 2rem;">
            <p>この地域には店舗がありません</p>
            <button onclick="window.debugStoresPage.showRegions()" style="
              margin-top: 1rem;
              padding: 0.75rem 1.5rem;
              background: var(--primary-color);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">地方選択に戻る</button>
          </div>
        `;
        return;
      }

      const visitedStores = window.storageManager ? window.storageManager.getVisitedStores() : [];
      
      let html = '<div class="store-grid">';
      
      stores.forEach(store => {
        const isVisited = visitedStores.includes(store.id);
        
        html += `
          <div class="store-item ${isVisited ? 'visited' : ''}" data-store-id="${store.id}" style="
            background: ${isVisited ? 'var(--primary-color)' : 'var(--surface-elevated)'};
            color: ${isVisited ? 'white' : 'var(--text-primary)'};
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div class="store-info" style="flex: 1;">
              <h3 class="store-name" style="margin-bottom: 0.25rem; font-size: 1rem;">${store.name}</h3>
              <p class="store-address" style="font-size: 0.875rem; opacity: 0.8; margin: 0;">${store.address}</p>
            </div>
            <div class="store-actions" style="display: flex; gap: 0.5rem;">
              <button class="visit-toggle-btn" data-store-id="${store.id}" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 2px solid ${isVisited ? 'white' : 'var(--primary-color)'};
                background: ${isVisited ? 'white' : 'transparent'};
                color: ${isVisited ? 'var(--primary-color)' : 'var(--primary-color)'};
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
              " title="${isVisited ? '未訪問にする' : '訪問済みにする'}">
                ${isVisited ? '✓' : '○'}
              </button>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      this.storeContent.innerHTML = html;
      
      // Add click handlers for visit toggle
      this.storeContent.querySelectorAll('.visit-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const storeId = btn.getAttribute('data-store-id');
          this.toggleStoreVisited(storeId);
        });
      });
    }

    toggleStoreVisited(storeId) {
      console.log('🏪 Toggling store visited:', storeId);
      
      if (window.storageManager) {
        const success = window.storageManager.toggleStoreVisited(storeId);
        if (success) {
          // Refresh the current view
          this.showStores(
            this.storeContent.querySelector('.store-item').getAttribute('data-store-id').split('_')[0],
            this.storeContent.querySelector('.store-item').getAttribute('data-store-id').split('_')[1]
          );
          
          // Show notification
          this.showNotification('訪問状況を更新しました');
        }
      } else {
        console.warn('Storage manager not available');
      }
    }

    handleSearch(query) {
      if (!query.trim()) {
        this.showRegions();
        return;
      }

      console.log('🏪 Searching for:', query);
      this.updateBreadcrumb(['検索結果', `"${query}"`]);
      
      const results = this.storeData.stores.filter(store => 
        store.name.toLowerCase().includes(query.toLowerCase()) ||
        store.address.toLowerCase().includes(query.toLowerCase())
      );
      
      this.renderSearchResults(results);
    }

    renderSearchResults(stores) {
      if (stores.length === 0) {
        this.storeContent.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 2rem;">
            <p>検索結果が見つかりませんでした</p>
          </div>
        `;
        return;
      }

      // Use the same store rendering logic as showStores
      const visitedStores = window.storageManager ? window.storageManager.getVisitedStores() : [];
      
      let html = '<div class="store-grid">';
      
      stores.forEach(store => {
        const isVisited = visitedStores.includes(store.id);
        
        html += `
          <div class="store-item ${isVisited ? 'visited' : ''}" style="
            background: ${isVisited ? 'var(--primary-color)' : 'var(--surface-elevated)'};
            color: ${isVisited ? 'white' : 'var(--text-primary)'};
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
          ">
            <div class="store-info">
              <h3 class="store-name" style="margin-bottom: 0.25rem;">${store.name}</h3>
              <p class="store-address" style="font-size: 0.875rem; opacity: 0.8; margin: 0;">${store.address}</p>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      this.storeContent.innerHTML = html;
    }

    getRegionStats(regionId) {
      const region = this.storeData.regions[regionId];
      let totalStores = 0;
      let visitedStores = 0;
      
      region.prefectures.forEach(prefId => {
        const stats = this.getPrefectureStats(prefId);
        totalStores += stats.total;
        visitedStores += stats.visited;
      });
      
      return {
        visited: visitedStores,
        total: totalStores,
        percentage: totalStores > 0 ? Math.round((visitedStores / totalStores) * 100) : 0
      };
    }

    getPrefectureStats(prefectureId) {
      const stores = this.storeData.stores.filter(store => store.prefecture === prefectureId);
      const visitedList = window.storageManager ? window.storageManager.getVisitedStores() : [];
      const visited = stores.filter(store => visitedList.includes(store.id));
      
      return {
        visited: visited.length,
        total: stores.length,
        percentage: stores.length > 0 ? Math.round((visited.length / stores.length) * 100) : 0
      };
    }

    getAreaStats(prefectureId, areaId) {
      const stores = this.storeData.stores.filter(store => 
        store.prefecture === prefectureId && store.area === areaId
      );
      const visitedList = window.storageManager ? window.storageManager.getVisitedStores() : [];
      const visited = stores.filter(store => visitedList.includes(store.id));
      
      return {
        visited: visited.length,
        total: stores.length,
        percentage: stores.length > 0 ? Math.round((visited.length / stores.length) * 100) : 0
      };
    }

    updateBreadcrumb(items) {
      if (!this.breadcrumb) return;
      
      this.breadcrumb.innerHTML = items.map((item, index) => {
        const isLast = index === items.length - 1;
        return `
          <span class="breadcrumb-item ${isLast ? 'active' : ''}" style="
            color: ${isLast ? 'var(--primary-color)' : 'var(--text-secondary)'};
            font-weight: ${isLast ? '600' : '400'};
          ">${item}</span>
          ${!isLast ? '<span class="breadcrumb-separator" style="margin: 0 0.5rem; color: var(--text-muted);">›</span>' : ''}
        `;
      }).join('');
    }

    showLoading() {
      this.storeContent.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 2rem;">
          <div style="margin: 0 auto 1rem; width: 32px; height: 32px; border: 3px solid var(--border-color); border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>データを読み込んでいます...</p>
        </div>
      `;
    }

    showError(message) {
      this.storeContent.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <p style="color: var(--error-color);">${message}</p>
          <button onclick="window.debugStoresPage.init()" style="
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">再読み込み</button>
        </div>
      `;
    }

    showNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 1rem;
        background: var(--primary-color);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }

    onSectionActivated() {
      if (!this.isInitialized) {
        this.init();
      } else {
        this.showRegions();
      }
    }
  }

  // Initialize debug stores page
  function initDebugStoresPage() {
    console.log('🏪 Initializing debug stores page...');
    window.debugStoresPage = new DebugStoresPage();
    
    // Auto-initialize if stores section is already active
    const storesSection = document.getElementById('stores-section');
    if (storesSection && storesSection.classList.contains('active')) {
      window.debugStoresPage.init();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugStoresPage);
  } else {
    initDebugStoresPage();
  }

})();