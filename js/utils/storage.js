// Local Storage Management Utility

class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      VISITED_STORES: 'starbucks_visited_stores',
      FAVORITE_AREAS: 'starbucks_favorite_areas',
      FAVORITE_PREFECTURES: 'starbucks_favorite_prefectures',
      THEME: 'starbucks_theme',
      STORE_DATA: 'starbucks_store_data',
      APP_VERSION: 'starbucks_app_version',
      LAST_UPDATE: 'starbucks_last_update'
    };
    
    this.DEFAULT_THEME = 'light';
    this.APP_VERSION = '1.0.0';
    
    this.init();
  }

  init() {
    // Check if first time user
    if (!this.getAppVersion()) {
      this.initializeFirstTimeUser();
    }
    
    // Check for app updates
    this.checkForUpdates();
  }

  // First Time User Setup
  initializeFirstTimeUser() {
    console.log('Initializing first time user...');
    this.setAppVersion(this.APP_VERSION);
    this.setTheme(this.DEFAULT_THEME);
    this.setVisitedStores([]);
    this.setFavoriteAreas([]);
    this.setFavoritePrefectures([]);
    this.setLastUpdate(new Date().toISOString());
  }

  // App Version Management
  getAppVersion() {
    return localStorage.getItem(this.STORAGE_KEYS.APP_VERSION);
  }

  setAppVersion(version) {
    localStorage.setItem(this.STORAGE_KEYS.APP_VERSION, version);
  }

  checkForUpdates() {
    const currentVersion = this.getAppVersion();
    if (currentVersion !== this.APP_VERSION) {
      console.log(`App updated from ${currentVersion} to ${this.APP_VERSION}`);
      this.handleAppUpdate(currentVersion, this.APP_VERSION);
    }
  }

  handleAppUpdate(oldVersion, newVersion) {
    // Handle any migration logic here if needed
    this.setAppVersion(newVersion);
    this.setLastUpdate(new Date().toISOString());
  }

  // Theme Management
  getTheme() {
    return localStorage.getItem(this.STORAGE_KEYS.THEME) || this.DEFAULT_THEME;
  }

  setTheme(theme) {
    const validThemes = ['light', 'dark', 'starbucks'];
    if (validThemes.includes(theme)) {
      localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
      document.body.setAttribute('data-theme', theme);
      return true;
    }
    return false;
  }

  // Visited Stores Management
  getVisitedStores() {
    try {
      const visited = localStorage.getItem(this.STORAGE_KEYS.VISITED_STORES);
      return visited ? JSON.parse(visited) : [];
    } catch (error) {
      console.error('Error parsing visited stores:', error);
      return [];
    }
  }

  setVisitedStores(storeIds) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.VISITED_STORES, JSON.stringify(storeIds));
      return true;
    } catch (error) {
      console.error('Error saving visited stores:', error);
      return false;
    }
  }

  addVisitedStore(storeId) {
    const visitedStores = this.getVisitedStores();
    if (!visitedStores.includes(storeId)) {
      visitedStores.push(storeId);
      return this.setVisitedStores(visitedStores);
    }
    return true;
  }

  removeVisitedStore(storeId) {
    const visitedStores = this.getVisitedStores();
    const filteredStores = visitedStores.filter(id => id !== storeId);
    return this.setVisitedStores(filteredStores);
  }

  isStoreVisited(storeId) {
    return this.getVisitedStores().includes(storeId);
  }

  toggleStoreVisited(storeId) {
    if (this.isStoreVisited(storeId)) {
      return this.removeVisitedStore(storeId);
    } else {
      return this.addVisitedStore(storeId);
    }
  }

  // Favorite Areas Management
  getFavoriteAreas() {
    try {
      const favorites = localStorage.getItem(this.STORAGE_KEYS.FAVORITE_AREAS);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error parsing favorite areas:', error);
      return [];
    }
  }

  setFavoriteAreas(areaIds) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.FAVORITE_AREAS, JSON.stringify(areaIds));
      return true;
    } catch (error) {
      console.error('Error saving favorite areas:', error);
      return false;
    }
  }

  addFavoriteArea(areaId) {
    const favoriteAreas = this.getFavoriteAreas();
    if (!favoriteAreas.includes(areaId)) {
      favoriteAreas.push(areaId);
      return this.setFavoriteAreas(favoriteAreas);
    }
    return true;
  }

  removeFavoriteArea(areaId) {
    const favoriteAreas = this.getFavoriteAreas();
    const filteredAreas = favoriteAreas.filter(id => id !== areaId);
    return this.setFavoriteAreas(filteredAreas);
  }

  isAreaFavorite(areaId) {
    return this.getFavoriteAreas().includes(areaId);
  }

  toggleAreaFavorite(areaId) {
    if (this.isAreaFavorite(areaId)) {
      return this.removeFavoriteArea(areaId);
    } else {
      return this.addFavoriteArea(areaId);
    }
  }

  // Favorite Prefectures Management (for My Areas)
  getFavoritePrefectures() {
    try {
      const favorites = localStorage.getItem(this.STORAGE_KEYS.FAVORITE_PREFECTURES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error parsing favorite prefectures:', error);
      return [];
    }
  }

  setFavoritePrefectures(prefectureIds) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.FAVORITE_PREFECTURES, JSON.stringify(prefectureIds));
      return true;
    } catch (error) {
      console.error('Error saving favorite prefectures:', error);
      return false;
    }
  }

  addFavoritePrefecture(prefectureId) {
    const favoritePrefectures = this.getFavoritePrefectures();
    if (!favoritePrefectures.includes(prefectureId)) {
      favoritePrefectures.push(prefectureId);
      return this.setFavoritePrefectures(favoritePrefectures);
    }
    return true;
  }

  removeFavoritePrefecture(prefectureId) {
    const favoritePrefectures = this.getFavoritePrefectures();
    const filteredPrefectures = favoritePrefectures.filter(id => id !== prefectureId);
    return this.setFavoritePrefectures(filteredPrefectures);
  }

  isFavoritePrefecture(prefectureId) {
    return this.getFavoritePrefectures().includes(prefectureId);
  }

  toggleFavoritePrefecture(prefectureId) {
    if (this.isFavoritePrefecture(prefectureId)) {
      return this.removeFavoritePrefecture(prefectureId);
    } else {
      return this.addFavoritePrefecture(prefectureId);
    }
  }

  // Store Data Caching (統合データ対応)
  getStoredStoreData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.STORE_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing stored store data:', error);
      return null;
    }
  }

  setStoredStoreData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.STORE_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing store data:', error);
      return false;
    }
  }

  // 新形式での店舗状態管理
  updateStoreState(storeId, stateUpdates) {
    if (window.dataIntegrationManager) {
      return window.dataIntegrationManager.updateUserState(storeId, stateUpdates);
    } else {
      // フォールバック: 従来方式
      return this.legacyUpdateStoreState(storeId, stateUpdates);
    }
  }

  // 従来方式のフォールバック
  legacyUpdateStoreState(storeId, stateUpdates) {
    if (stateUpdates.visited !== undefined) {
      if (stateUpdates.visited) {
        this.addVisitedStore(storeId);
      } else {
        this.removeVisitedStore(storeId);
      }
    }
    return true;
  }

  // 新形式での店舗状態取得
  getStoreState(storeId) {
    if (window.dataIntegrationManager) {
      return window.dataIntegrationManager.getUserStateForStore(storeId);
    } else {
      // フォールバック: 従来方式
      return {
        visited: this.isStoreVisited(storeId),
        favorite: false,
        visitCount: this.isStoreVisited(storeId) ? 1 : 0
      };
    }
  }

  // Last Update Timestamp
  getLastUpdate() {
    return localStorage.getItem(this.STORAGE_KEYS.LAST_UPDATE);
  }

  setLastUpdate(timestamp) {
    localStorage.setItem(this.STORAGE_KEYS.LAST_UPDATE, timestamp);
  }

  // Export Data (for QR code functionality)
  exportData() {
    const data = {
      visited: this.getVisitedStores(),
      favoriteAreas: this.getFavoriteAreas(),
      favoritePrefectures: this.getFavoritePrefectures(),
      version: this.getAppVersion(),
      timestamp: new Date().toISOString()
    };
    
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Import Data (for QR code functionality)
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!this.validateImportData(data)) {
        throw new Error('Invalid data structure');
      }
      
      // Import visited stores
      if (data.visited && Array.isArray(data.visited)) {
        this.setVisitedStores(data.visited);
      }
      
      // Import favorite areas (legacy support)
      if (data.favorites && Array.isArray(data.favorites)) {
        this.setFavoriteAreas(data.favorites);
      }
      if (data.favoriteAreas && Array.isArray(data.favoriteAreas)) {
        this.setFavoriteAreas(data.favoriteAreas);
      }
      
      // Import favorite prefectures
      if (data.favoritePrefectures && Array.isArray(data.favoritePrefectures)) {
        this.setFavoritePrefectures(data.favoritePrefectures);
      }
      
      // Update timestamp
      this.setLastUpdate(new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  validateImportData(data) {
    // Basic validation
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    // Check if at least visited, favorites, or prefectures exist
    const hasVisited = data.visited && Array.isArray(data.visited);
    const hasFavorites = (data.favorites && Array.isArray(data.favorites)) || 
                        (data.favoriteAreas && Array.isArray(data.favoriteAreas));
    const hasPrefectures = data.favoritePrefectures && Array.isArray(data.favoritePrefectures);
    
    return hasVisited || hasFavorites || hasPrefectures;
  }

  // Clear All Data
  clearAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reinitialize
      this.initializeFirstTimeUser();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Storage Statistics
  getStorageInfo() {
    const info = {
      visitedStoresCount: this.getVisitedStores().length,
      favoriteAreasCount: this.getFavoriteAreas().length,
      favoritePrefecturesCount: this.getFavoritePrefectures().length,
      theme: this.getTheme(),
      version: this.getAppVersion(),
      lastUpdate: this.getLastUpdate()
    };
    
    // Calculate storage usage
    let totalSize = 0;
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });
    
    info.storageSize = totalSize;
    info.storageSizeKB = Math.round(totalSize / 1024 * 100) / 100;
    
    return info;
  }

  // Event System for Storage Changes
  addEventListener(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }
    
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners && this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  dispatchEvent(event, data) {
    if (this.eventListeners && this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}

// Create global instance
window.storageManager = new StorageManager();