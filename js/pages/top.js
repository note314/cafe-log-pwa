// Top Page Component

class TopPage {
  constructor() {
    this.myAreasGrid = null;
    this.mapContainer = null;
    this.isInitialized = false;
  }

  async init() {
    this.setupElements();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('📍 Top page initialized');
  }

  setupElements() {
    this.myAreasGrid = document.getElementById('myAreasGrid');
    this.mapContainer = document.getElementById('map');
  }

  setupEventListeners() {
    // Listen for data updates
    window.addEventListener('dataUpdated', () => {
      this.refresh();
    });

    // Listen for section changes
    window.addEventListener('sectionChange', (e) => {
      if (e.detail.to === 'top') {
        this.onSectionActivated();
      }
    });

    // Listen for favorite prefecture updates
    window.addEventListener('favoritePrefecturesUpdated', () => {
      this.refreshMyAreas();
    });
  }

  async refresh() {
    if (!this.isInitialized) return;
    
    await this.refreshMyAreas();
    this.refreshMap();
  }

  async refreshMyAreas() {
    if (!this.myAreasGrid || !window.progressManager) return;

    // Get favorite prefectures from storage
    const favoritePrefectures = window.storageManager.getFavoritePrefectures();
    
    if (favoritePrefectures.length === 0) {
      this.showEmptyMyAreas();
      return;
    }

    // Get progress for favorite prefectures
    const favoritePrefecturesProgress = window.progressManager.getFavoritePrefecturesProgress();
    
    // Clear existing content
    this.myAreasGrid.innerHTML = '';
    
    // Create prefecture cards
    favoritePrefecturesProgress.forEach(prefecture => {
      const card = this.createAreaCard(prefecture);
      this.myAreasGrid.appendChild(card);
    });
  }

  showEmptyMyAreas() {
    this.myAreasGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🌟</div>
        <h3 style="margin-bottom: 0.5rem;">マイエリアを設定しましょう</h3>
        <p style="margin-bottom: 1.5rem;">店舗リストからお気に入りの都道府県を選択してください</p>
        <button class="btn-primary" onclick="window.navigationManager.navigate('stores')">
          店舗リストへ
        </button>
      </div>
    `;
  }

  createAreaCard(area) {
    const card = document.createElement('div');
    card.className = 'area-card';
    card.setAttribute('data-area', area.key);
    
    const badge = area.badge || { icon: '', name: '' };
    
    card.innerHTML = `
      <h3>${area.name}</h3>
      <div class="area-progress">
        <div class="progress">
          <div class="progress-bar" style="width: ${area.percentage}%"></div>
        </div>
      </div>
      <div class="area-stats">
        <span class="area-percentage">${area.percentage}%</span>
        <span class="area-count">(${area.visited}/${area.total})</span>
      </div>
      ${badge.icon ? `<div class="area-badge">${badge.icon} ${badge.name}</div>` : ''}
    `;

    // Add click handler
    card.addEventListener('click', () => {
      this.navigateToPrefecture(area);
    });

    return card;
  }

  navigateToPrefecture(prefecture) {
    // Navigate to stores page with this prefecture pre-selected
    window.navigationManager.navigate('stores');
    
    // Dispatch event to stores page to show this prefecture
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigateToPrefecture', {
        detail: { prefecture: prefecture.prefecture }
      }));
    }, 100);
  }

  refreshMap() {
    if (window.mapManager) {
      window.mapManager.refresh();
    }
  }

  onSectionActivated() {
    // Initialize map if not already done
    if (window.mapManager && this.mapContainer) {
      setTimeout(() => {
        window.mapManager.resize();
      }, 100);
    }
    
    // Refresh data
    this.refresh();
  }

  // Show sample data for demo purposes
  showSampleMyAreas() {
    if (!this.myAreasGrid) return;

    const samplePrefectures = [
      {
        key: 'tokyo',
        prefecture: 'tokyo',
        name: '東京都',
        visited: 15,
        total: 25,
        percentage: 60,
        badge: { icon: '🥈', name: '銀メダル' }
      },
      {
        key: 'kanagawa',
        prefecture: 'kanagawa',
        name: '神奈川県',
        visited: 8,
        total: 12,
        percentage: 67,
        badge: { icon: '🥈', name: '銀メダル' }
      }
    ];

    this.myAreasGrid.innerHTML = '';
    
    samplePrefectures.forEach(prefecture => {
      const card = this.createAreaCard(prefecture);
      this.myAreasGrid.appendChild(card);
    });
  }

  // Public methods
  addToMyAreas(prefectureKey) {
    window.storageManager.addFavoritePrefecture(prefectureKey);
    this.refreshMyAreas();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('favoritePrefecturesUpdated'));
  }

  removeFromMyAreas(prefectureKey) {
    window.storageManager.removeFavoritePrefecture(prefectureKey);
    this.refreshMyAreas();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('favoritePrefecturesUpdated'));
  }

  getMyAreas() {
    return window.storageManager.getFavoritePrefectures();
  }
}

// Create global instance
window.topPage = new TopPage();