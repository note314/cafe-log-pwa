// Store Data Updater - GitHub連携更新システム

class StoreDataUpdater {
  constructor() {
    this.githubBaseUrl = 'https://raw.githubusercontent.com/user/starbucks-pwa/main';
    this.currentVersion = null;
    this.availableVersion = null;
    this.updateInProgress = false;
  }

  // メイン更新処理
  async updateStoreData(options = {}) {
    const { 
      force = false, 
      showProgress = true,
      validateData = true 
    } = options;

    if (this.updateInProgress) {
      throw new Error('更新処理が既に実行中です');
    }

    this.updateInProgress = true;
    
    try {
      console.log('🔄 店舗データ更新を開始します...');
      
      // 1. 現在のバージョン確認
      await this.checkCurrentVersion();
      
      // 2. 最新バージョン確認
      await this.checkLatestVersion();
      
      // 3. 更新判定
      if (!force && !this.needsUpdate()) {
        console.log('✅ 店舗データは最新です');
        return { updated: false, version: this.currentVersion };
      }
      
      // 4. バックアップ作成
      await this.createBackup();
      
      // 5. 新データダウンロード
      const newData = await this.downloadLatestData();
      
      // 6. データ検証
      if (validateData) {
        await this.validateNewData(newData);
      }
      
      // 7. データ更新適用
      await this.applyUpdate(newData);
      
      // 8. 成功通知
      await this.notifyUpdateSuccess();
      
      console.log(`✅ 店舗データを v${this.availableVersion} に更新しました`);
      
      return {
        updated: true,
        oldVersion: this.currentVersion,
        newVersion: this.availableVersion,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ 更新に失敗しました:', error.message);
      await this.rollbackIfNeeded();
      throw error;
    } finally {
      this.updateInProgress = false;
    }
  }

  // 現在のバージョン確認
  async checkCurrentVersion() {
    try {
      const storedData = window.storageManager.getStoredStoreData();
      this.currentVersion = storedData?.metadata?.version || '1.0.0';
      console.log(`📦 現在のバージョン: v${this.currentVersion}`);
    } catch (error) {
      this.currentVersion = '1.0.0';
      console.log('📦 バージョン情報なし - v1.0.0 として扱います');
    }
  }

  // 最新バージョン確認
  async checkLatestVersion() {
    try {
      const response = await fetch(`${this.githubBaseUrl}/data/stores/metadata.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const metadata = await response.json();
      this.availableVersion = metadata.dataVersion.current;
      this.latestMetadata = metadata;
      
      console.log(`🌐 最新バージョン: v${this.availableVersion}`);
    } catch (error) {
      throw new Error(`最新バージョン確認に失敗: ${error.message}`);
    }
  }

  // 更新必要性判定
  needsUpdate() {
    if (!this.currentVersion || !this.availableVersion) return true;
    
    const current = this.parseVersion(this.currentVersion);
    const available = this.parseVersion(this.availableVersion);
    
    return (
      available.major > current.major ||
      (available.major === current.major && available.minor > current.minor) ||
      (available.major === current.major && available.minor === current.minor && available.patch > current.patch)
    );
  }

  // バージョン文字列解析
  parseVersion(versionString) {
    const [major, minor, patch] = versionString.split('.').map(Number);
    return { major: major || 0, minor: minor || 0, patch: patch || 0 };
  }

  // 最新データダウンロード
  async downloadLatestData() {
    console.log('⬇️ 最新データをダウンロード中...');
    
    const dataUrl = `${this.githubBaseUrl}/data/stores/official/store_list_v${this.availableVersion}.json`;
    
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`データダウンロード失敗: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // チェックサム検証
    if (this.latestMetadata.checksums) {
      const expectedChecksum = this.latestMetadata.checksums[`store_list_v${this.availableVersion}.json`];
      if (expectedChecksum) {
        const actualChecksum = await this.calculateChecksum(JSON.stringify(data));
        if (actualChecksum !== expectedChecksum) {
          throw new Error('データの整合性チェックに失敗しました');
        }
      }
    }
    
    console.log(`✅ ダウンロード完了: ${data.stores?.length || 0} 店舗`);
    return data;
  }

  // データ検証
  async validateNewData(data) {
    console.log('🔍 データを検証中...');
    
    // 基本構造チェック
    if (!data.stores || !Array.isArray(data.stores)) {
      throw new Error('無効なデータ構造: stores配列が見つかりません');
    }
    
    if (!data.regions || !data.prefectures) {
      throw new Error('無効なデータ構造: regions/prefectures情報が見つかりません');
    }
    
    // 座標検証
    let invalidCoordinates = 0;
    for (const store of data.stores) {
      if (!this.validateStoreCoordinates(store)) {
        invalidCoordinates++;
      }
    }
    
    if (invalidCoordinates > data.stores.length * 0.1) {
      throw new Error(`座標エラーが多すぎます: ${invalidCoordinates}/${data.stores.length}`);
    }
    
    console.log(`✅ 検証完了: ${data.stores.length} 店舗 (座標エラー: ${invalidCoordinates})`);
  }

  // 座標妥当性チェック
  validateStoreCoordinates(store) {
    if (typeof store.lat !== 'number' || typeof store.lng !== 'number') {
      return false;
    }
    
    // 日本の境界内チェック
    return (
      store.lat >= 24.0 && store.lat <= 46.0 &&  // 北緯24-46度
      store.lng >= 123.0 && store.lng <= 146.0   // 東経123-146度
    );
  }

  // バックアップ作成
  async createBackup() {
    try {
      const currentData = window.storageManager.getStoredStoreData();
      if (currentData) {
        const backupKey = `starbucks_backup_${this.currentVersion}_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(currentData));
        console.log(`💾 バックアップ作成: ${backupKey}`);
      }
    } catch (error) {
      console.warn('⚠️ バックアップ作成に失敗:', error.message);
    }
  }

  // 更新適用
  async applyUpdate(newData) {
    console.log('📝 データを更新中...');
    
    // ストレージに保存
    window.storageManager.setStoredStoreData(newData);
    
    // メイン参照更新
    if (window.starbucksApp) {
      window.starbucksApp.storeData = newData;
    }
    
    // プログレスマネージャー更新
    if (window.progressManager) {
      await window.progressManager.init(newData);
    }
    
    // 全コンポーネントリフレッシュ
    window.dispatchEvent(new CustomEvent('dataUpdated', {
      detail: { 
        source: 'store-data-update',
        version: this.availableVersion,
        storeCount: newData.stores?.length || 0
      }
    }));
    
    console.log('✅ データ更新完了');
  }

  // 成功通知
  async notifyUpdateSuccess() {
    const message = `店舗データを v${this.availableVersion} に更新しました`;
    
    if (window.qrManager) {
      window.qrManager.showSuccess(message);
    }
    
    // 更新履歴を記録
    const updateHistory = JSON.parse(localStorage.getItem('starbucks_update_history') || '[]');
    updateHistory.unshift({
      version: this.availableVersion,
      timestamp: new Date().toISOString(),
      success: true
    });
    
    // 履歴は最新10件まで保持
    if (updateHistory.length > 10) {
      updateHistory.splice(10);
    }
    
    localStorage.setItem('starbucks_update_history', JSON.stringify(updateHistory));
  }

  // チェックサム計算
  async calculateChecksum(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 自動更新チェック
  async checkForUpdates() {
    try {
      await this.checkCurrentVersion();
      await this.checkLatestVersion();
      
      return {
        hasUpdate: this.needsUpdate(),
        currentVersion: this.currentVersion,
        availableVersion: this.availableVersion,
        metadata: this.latestMetadata
      };
    } catch (error) {
      console.error('自動更新チェック失敗:', error.message);
      return { hasUpdate: false, error: error.message };
    }
  }

  // 更新履歴取得
  getUpdateHistory() {
    return JSON.parse(localStorage.getItem('starbucks_update_history') || '[]');
  }
}

// グローバルインスタンス
window.storeDataUpdater = new StoreDataUpdater();