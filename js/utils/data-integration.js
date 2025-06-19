// Store Data Integration Manager - 情報源とアプリ内データの統合管理

class DataIntegrationManager {
  constructor() {
    this.sourceData = null;      // 情報源データ（GitHub）
    this.userStateData = null;   // ユーザー状態データ（ローカル）
    this.integratedData = null;  // 統合データ
    this.migrationNeeded = false;
  }

  // メインデータ統合処理
  async integrateStoreData(sourceData) {
    console.log('🔄 店舗データ統合を開始...');
    
    this.sourceData = sourceData;
    this.userStateData = this.loadUserStateData();
    
    // バージョン互換性チェック
    await this.checkCompatibility();
    
    // 必要に応じてマイグレーション実行
    if (this.migrationNeeded) {
      await this.performMigration();
    }
    
    // データ統合
    this.integratedData = this.mergeSourceAndUserData();
    
    // 統合データの保存
    this.saveIntegratedData();
    
    console.log('✅ データ統合完了');
    return this.integratedData;
  }

  // 情報源データとユーザー状態データの統合
  mergeSourceAndUserData() {
    const integrated = JSON.parse(JSON.stringify(this.sourceData));
    
    // 各店舗にユーザー状態を追加
    integrated.stores = integrated.stores.map(store => {
      const userState = this.getUserStateForStore(store.storeInfo.id);
      
      return {
        ...store,
        userState: {
          visited: userState.visited || false,
          visitDate: userState.visitDate || null,
          visitCount: userState.visitCount || 0,
          favorite: userState.favorite || false,
          personalNotes: userState.personalNotes || '',
          photos: userState.photos || [],
          rating: userState.rating || null,
          lastVisited: userState.lastVisited || null,
          tags: userState.tags || []
        }
      };
    });

    // メタデータに統合情報追加
    integrated.metadata.integration = {
      integratedAt: new Date().toISOString(),
      sourceVersion: this.sourceData.metadata.dataVersion.current,
      userDataVersion: this.userStateData.version || '1.0.0',
      totalVisited: this.countVisitedStores(),
      totalFavorites: this.countFavoriteStores()
    };

    return integrated;
  }

  // 特定店舗のユーザー状態取得
  getUserStateForStore(storeId) {
    if (!this.userStateData || !this.userStateData.stores) {
      return {};
    }

    return this.userStateData.stores[storeId] || {};
  }

  // ユーザー状態データの読み込み
  loadUserStateData() {
    try {
      // 既存のstorageManagerデータを新形式に変換
      const visitedStores = window.storageManager.getVisitedStores() || [];
      const favoriteAreas = window.storageManager.getFavoriteAreas() || [];
      const favoritePrefectures = window.storageManager.getFavoritePrefectures() || [];
      
      // 新形式のユーザー状態データ構造
      const userStateData = {
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        stores: {},
        preferences: {
          favoriteAreas: favoriteAreas,
          favoritePrefectures: favoritePrefectures,
          theme: window.storageManager.getTheme(),
          notifications: true
        }
      };

      // 訪問済み店舗の状態設定
      visitedStores.forEach(storeId => {
        userStateData.stores[storeId] = {
          visited: true,
          visitDate: new Date().toISOString(), // 実際の訪問日は不明
          visitCount: 1,
          favorite: false,
          personalNotes: '',
          photos: [],
          rating: null,
          lastVisited: new Date().toISOString(),
          tags: []
        };
      });

      return userStateData;
    } catch (error) {
      console.error('ユーザー状態データ読み込みエラー:', error);
      return this.getDefaultUserStateData();
    }
  }

  // デフォルトユーザー状態データ
  getDefaultUserStateData() {
    return {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      stores: {},
      preferences: {
        favoriteAreas: [],
        favoritePrefectures: [],
        theme: 'light',
        notifications: true
      }
    };
  }

  // バージョン互換性チェック
  async checkCompatibility() {
    const sourceVersion = this.sourceData.metadata.dataVersion.current;
    const userVersion = this.userStateData.version || '1.0.0';
    
    // バージョン比較ロジック
    const sourceVer = this.parseVersion(sourceVersion);
    const userVer = this.parseVersion(userVersion);
    
    // メジャーバージョンが異なる場合はマイグレーション必要
    if (sourceVer.major !== userVer.major) {
      this.migrationNeeded = true;
      console.log(`🔄 マイグレーションが必要: ${userVersion} → ${sourceVersion}`);
    }
    
    // 店舗IDの変更チェック
    if (this.sourceData.migrationSupport) {
      const legacyMapping = this.sourceData.migrationSupport.legacyIdMapping;
      if (legacyMapping && Object.keys(legacyMapping).length > 0) {
        this.migrationNeeded = true;
        console.log('🔄 店舗IDマイグレーションが必要');
      }
    }
  }

  // マイグレーション実行
  async performMigration() {
    console.log('🔄 データマイグレーションを実行中...');
    
    // 店舗IDの移行
    if (this.sourceData.migrationSupport?.legacyIdMapping) {
      this.migrateStoreIds();
    }
    
    // データ構造の移行
    this.migrateDataStructure();
    
    // マイグレーション履歴記録
    this.recordMigrationHistory();
    
    console.log('✅ マイグレーション完了');
  }

  // 店舗IDマイグレーション
  migrateStoreIds() {
    const mapping = this.sourceData.migrationSupport.legacyIdMapping;
    const newStores = {};
    
    Object.keys(this.userStateData.stores).forEach(oldId => {
      const mapping_info = mapping[oldId];
      if (mapping_info) {
        const newId = mapping_info.newId;
        newStores[newId] = {
          ...this.userStateData.stores[oldId],
          migratedFrom: oldId,
          migrationDate: new Date().toISOString()
        };
        console.log(`📋 ID移行: ${oldId} → ${newId}`);
      } else {
        // マッピングが見つからない場合はそのまま保持
        newStores[oldId] = this.userStateData.stores[oldId];
      }
    });
    
    this.userStateData.stores = newStores;
  }

  // データ構造マイグレーション
  migrateDataStructure() {
    // バージョン1.x → 2.x の構造変更例
    if (this.userStateData.version.startsWith('1.')) {
      // 新しいフィールドの追加
      Object.keys(this.userStateData.stores).forEach(storeId => {
        const store = this.userStateData.stores[storeId];
        
        // 新フィールドのデフォルト値設定
        if (!store.tags) store.tags = [];
        if (!store.visitCount) store.visitCount = store.visited ? 1 : 0;
        if (!store.photos) store.photos = [];
      });
      
      // バージョン更新
      this.userStateData.version = '2.0.0';
    }
  }

  // マイグレーション履歴記録
  recordMigrationHistory() {
    if (!this.userStateData.migrationHistory) {
      this.userStateData.migrationHistory = [];
    }
    
    this.userStateData.migrationHistory.push({
      date: new Date().toISOString(),
      fromVersion: this.userStateData.version,
      toVersion: this.sourceData.metadata.dataVersion.current,
      migrationType: 'automatic',
      success: true
    });
  }

  // 統合データの保存
  saveIntegratedData() {
    try {
      // 統合データをstorageManagerに保存
      window.storageManager.setStoredStoreData(this.integratedData);
      
      // ユーザー状態データを別途保存
      localStorage.setItem('starbucks_user_state', JSON.stringify(this.userStateData));
      
      console.log('💾 統合データ保存完了');
    } catch (error) {
      console.error('統合データ保存エラー:', error);
      throw error;
    }
  }

  // ユーザー状態の更新
  updateUserState(storeId, updates) {
    if (!this.userStateData.stores[storeId]) {
      this.userStateData.stores[storeId] = {};
    }
    
    // 更新内容を適用
    Object.assign(this.userStateData.stores[storeId], updates);
    this.userStateData.stores[storeId].lastUpdated = new Date().toISOString();
    
    // 統合データも更新
    if (this.integratedData) {
      const storeIndex = this.integratedData.stores.findIndex(
        store => store.storeInfo.id === storeId
      );
      
      if (storeIndex !== -1) {
        Object.assign(this.integratedData.stores[storeIndex].userState, updates);
      }
    }
    
    // 保存
    this.saveUserStateData();
    
    // イベント発火
    window.dispatchEvent(new CustomEvent('userStateUpdated', {
      detail: { storeId, updates }
    }));
  }

  // ユーザー状態データのみ保存
  saveUserStateData() {
    try {
      localStorage.setItem('starbucks_user_state', JSON.stringify(this.userStateData));
    } catch (error) {
      console.error('ユーザー状態保存エラー:', error);
    }
  }

  // 統計情報
  countVisitedStores() {
    if (!this.userStateData || !this.userStateData.stores) return 0;
    
    return Object.values(this.userStateData.stores)
      .filter(state => state.visited).length;
  }

  countFavoriteStores() {
    if (!this.userStateData || !this.userStateData.stores) return 0;
    
    return Object.values(this.userStateData.stores)
      .filter(state => state.favorite).length;
  }

  // バージョン解析
  parseVersion(versionString) {
    const [major, minor, patch] = versionString.split('.').map(Number);
    return { major: major || 0, minor: minor || 0, patch: patch || 0 };
  }

  // データエクスポート（QRコード用）
  exportUserData() {
    return {
      version: this.userStateData.version,
      exportDate: new Date().toISOString(),
      stores: this.userStateData.stores,
      preferences: this.userStateData.preferences,
      statistics: {
        totalVisited: this.countVisitedStores(),
        totalFavorites: this.countFavoriteStores()
      }
    };
  }

  // データインポート（QRコード用）
  importUserData(importData) {
    try {
      // バージョン互換性チェック
      if (!this.isImportDataValid(importData)) {
        throw new Error('インポートデータが無効です');
      }
      
      // データをマージ
      this.userStateData.stores = {
        ...this.userStateData.stores,
        ...importData.stores
      };
      
      this.userStateData.preferences = {
        ...this.userStateData.preferences,
        ...importData.preferences
      };
      
      // 保存
      this.saveUserStateData();
      
      // 統合データ再構築
      this.integratedData = this.mergeSourceAndUserData();
      this.saveIntegratedData();
      
      return true;
    } catch (error) {
      console.error('データインポートエラー:', error);
      return false;
    }
  }

  // インポートデータ妥当性チェック
  isImportDataValid(data) {
    return (
      data &&
      typeof data === 'object' &&
      data.version &&
      data.stores &&
      typeof data.stores === 'object'
    );
  }
}

// グローバルインスタンス
window.dataIntegrationManager = new DataIntegrationManager();