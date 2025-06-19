// Store Data Update UI Manager - Updated 2025.06.20

class UpdateManagerUI {
  constructor() {
    this.updateModal = null;
    this.isVisible = false;
    this.autoCheckEnabled = true;
    this.autoCheckInterval = null;
    this.isUpdating = false; // 更新中フラグ
  }

  // UI初期化
  init() {
    this.createUpdateModal();
    this.setupAutoCheck();
    // キーボードショートカット削除済み
    
    // ヘッダーボタンは削除済み
    
    console.log('🔄 Update Manager UI initialized - Version 2025.06.20');
  }

  // 更新モーダル作成
  createUpdateModal() {
    const modal = document.createElement('div');
    modal.id = 'updateModal';
    modal.className = 'update-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div class="update-modal-content" style="
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
      ">
        <div class="update-header" style="margin-bottom: 1.5rem;">
          <h2 style="margin: 0; color: var(--primary-color);">
            📱 店舗データ更新
          </h2>
          <button class="close-btn" style="
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
          ">×</button>
        </div>

        <div class="update-content">
          <div class="version-info" style="
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
          ">
            <div class="current-version">
              現在のバージョン: <span id="currentVersionText">確認中...</span>
            </div>
            <div class="latest-version">
              最新バージョン: <span id="latestVersionText">確認中...</span>
            </div>
            <div class="update-status">
              状態: <span id="updateStatusText">確認中...</span>
            </div>
          </div>

          <div class="update-details" id="updateDetails" style="
            margin-bottom: 1.5rem;
            display: none;
          ">
            <h3>更新内容</h3>
            <div id="updateChanges"></div>
          </div>

          <div class="update-progress" id="updateProgress" style="
            display: none;
            margin-bottom: 1rem;
          ">
            <div class="progress-bar" style="
              width: 100%;
              height: 20px;
              background: #eee;
              border-radius: 10px;
              overflow: hidden;
            ">
              <div class="progress-fill" id="progressFill" style="
                height: 100%;
                background: var(--primary-color);
                width: 0%;
                transition: width 0.3s;
              "></div>
            </div>
            <div class="progress-text" id="progressText" style="
              text-align: center;
              margin-top: 0.5rem;
              font-size: 0.9rem;
            "></div>
          </div>

          <div class="update-actions">
            <button id="checkUpdateBtn" class="btn btn-secondary" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 0.5rem;
            ">更新確認</button>
            
            <button id="updateBtn" class="btn btn-primary" style="
              background: var(--primary-color);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 0.5rem;
            " disabled>更新実行</button>
            
            <button id="forceUpdateBtn" class="btn btn-warning" style="
              background: #ffc107;
              color: #212529;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 0.5rem;
            ">強制更新</button>
            
            <button id="cancelBtn" class="btn btn-cancel" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
            ">閉じる</button>
          </div>

          <div class="update-options" style="
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
          ">
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="autoCheckToggle" checked style="margin-right: 0.5rem;">
              自動更新チェック（30分間隔）
            </label>
          </div>

          <div class="update-history" style="margin-top: 1rem;">
            <details>
              <summary style="cursor: pointer; font-weight: bold;">更新履歴</summary>
              <div id="updateHistoryList" style="
                max-height: 150px;
                overflow-y: auto;
                margin-top: 0.5rem;
                font-size: 0.85rem;
              "></div>
            </details>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.updateModal = modal;

    // イベントリスナー設定
    this.setupEventListeners();
  }

  // イベントリスナー設定
  setupEventListeners() {
    const modal = this.updateModal;

    // 閉じるボタン
    modal.querySelector('.close-btn').addEventListener('click', () => {
      this.hideModal();
    });

    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    });

    // 更新確認ボタン
    modal.querySelector('#checkUpdateBtn').addEventListener('click', () => {
      this.checkForUpdates();
    });

    // 更新実行ボタン
    modal.querySelector('#updateBtn').addEventListener('click', () => {
      this.executeUpdate();
    });

    // 強制更新ボタン
    modal.querySelector('#forceUpdateBtn').addEventListener('click', () => {
      this.executeUpdate(true);
    });

    // 自動チェック切り替え
    modal.querySelector('#autoCheckToggle').addEventListener('change', (e) => {
      this.toggleAutoCheck(e.target.checked);
    });

    // キャンセルボタン（状態により機能が変わる）
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      this.handleCancelAction();
    });
  }

  // ヘッダーボタン機能削除済み

  // キーボードショートカット削除済み

  // モーダル表示
  async showModal() {
    this.updateModal.style.display = 'flex';
    this.isVisible = true;
    
    // 初期状態で更新確認実行
    await this.checkForUpdates();
    this.loadUpdateHistory();
  }

  // モーダル非表示
  hideModal() {
    this.updateModal.style.display = 'none';
    this.isVisible = false;
  }

  // 更新確認
  async checkForUpdates() {
    const statusText = this.updateModal.querySelector('#updateStatusText');
    const currentVersionText = this.updateModal.querySelector('#currentVersionText');
    const latestVersionText = this.updateModal.querySelector('#latestVersionText');
    const updateBtn = this.updateModal.querySelector('#updateBtn');
    const updateDetails = this.updateModal.querySelector('#updateDetails');

    try {
      statusText.textContent = '確認中...';
      statusText.style.color = 'orange';

      // 現在のバージョンを直接取得
      const storedData = window.storageManager.getStoredStoreData();
      console.log('🔍 Debug: storedData =', storedData);
      console.log('🔍 Debug: metadata =', storedData?.metadata);
      console.log('🔍 Debug: dataVersion =', storedData?.metadata?.dataVersion);
      
      const currentVersion = storedData?.metadata?.dataVersion?.current || 
                            storedData?.metadata?.version || '不明';
      console.log('🔍 Debug: currentVersion =', currentVersion);
      currentVersionText.textContent = `v${currentVersion}`;

      // 一時的にローカルデータのみで処理
      latestVersionText.textContent = `v${currentVersion}`;
      statusText.textContent = '最新版です（ローカル確認）';
      statusText.style.color = 'blue';
      updateBtn.disabled = true;
      updateDetails.style.display = 'none';
      return;

      // StoreDataUpdaterチェック（一時無効化）
      if (!window.storeDataUpdater) {
        latestVersionText.textContent = 'v不明';
        statusText.textContent = '更新チェックサービスが利用できません';
        statusText.style.color = 'red';
        updateBtn.disabled = true;
        return;
      }

      const result = await window.storeDataUpdater.checkForUpdates();

      currentVersionText.textContent = `v${result.currentVersion}`;
      latestVersionText.textContent = `v${result.availableVersion}`;

      if (result.hasUpdate) {
        statusText.textContent = '更新が利用可能です';
        statusText.style.color = 'green';
        updateBtn.disabled = false;
        
        // 更新内容表示
        if (result.metadata?.dataVersion?.releaseDate) {
          updateDetails.style.display = 'block';
          updateDetails.querySelector('#updateChanges').innerHTML = `
            <p><strong>リリース日:</strong> ${new Date(result.metadata.dataVersion.releaseDate).toLocaleString()}</p>
            <p><strong>店舗数:</strong> ${result.metadata.dataQuality?.totalStores || '不明'}</p>
          `;
        }
      } else {
        statusText.textContent = '最新版です';
        statusText.style.color = 'blue';
        updateBtn.disabled = true;
        updateDetails.style.display = 'none';
      }

      // ヘッダーボタンに通知バッジ
      if (result.hasUpdate && this.updateButton) {
        this.updateButton.style.position = 'relative';
        if (!this.updateButton.querySelector('.update-badge')) {
          const badge = document.createElement('span');
          badge.className = 'update-badge';
          badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: red;
            color: white;
            border-radius: 50%;
            width: 12px;
            height: 12px;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          badge.textContent = '!';
          this.updateButton.appendChild(badge);
        }
      }

    } catch (error) {
      statusText.textContent = `エラー: ${error.message}`;
      statusText.style.color = 'red';
      updateBtn.disabled = true;
    }
  }

  // 更新実行
  async executeUpdate(force = false) {
    const progressDiv = this.updateModal.querySelector('#updateProgress');
    const progressFill = this.updateModal.querySelector('#progressFill');
    const progressText = this.updateModal.querySelector('#progressText');
    const updateBtn = this.updateModal.querySelector('#updateBtn');
    const forceUpdateBtn = this.updateModal.querySelector('#forceUpdateBtn');

    try {
      // 更新中状態に変更
      this.setUpdatingState(true);
      
      // UI更新
      progressDiv.style.display = 'block';

      // プログレス表示
      this.updateProgress(10, 'バージョン確認中...');
      await new Promise(resolve => setTimeout(resolve, 500));

      this.updateProgress(30, 'データをダウンロード中...');
      
      // 更新実行
      const result = await window.storeDataUpdater.updateStoreData({
        force,
        showProgress: true,
        validateData: true
      });

      this.updateProgress(80, 'データを適用中...');
      await new Promise(resolve => setTimeout(resolve, 500));

      this.updateProgress(100, '更新完了！');

      // 成功時の処理
      setTimeout(() => {
        this.setUpdatingState(false);
        this.hideModal();
        this.removeUpdateBadge();
        
        // 成功トースト
        if (window.qrManager) {
          window.qrManager.showSuccess(
            `店舗データを v${result.newVersion} に更新しました`
          );
        }
      }, 1000);

    } catch (error) {
      progressText.textContent = `エラー: ${error.message}`;
      progressText.style.color = 'red';
      
      // 待機状態に戻す
      this.setUpdatingState(false);
    }
  }

  // プログレス更新
  updateProgress(percent, text) {
    const progressFill = this.updateModal.querySelector('#progressFill');
    const progressText = this.updateModal.querySelector('#progressText');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
  }

  // 更新履歴読み込み
  loadUpdateHistory() {
    const historyList = this.updateModal.querySelector('#updateHistoryList');
    const history = window.storeDataUpdater.getUpdateHistory();

    if (history.length === 0) {
      historyList.innerHTML = '<p>更新履歴がありません</p>';
      return;
    }

    historyList.innerHTML = history.map(entry => `
      <div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
        <strong>v${entry.version}</strong>
        <span style="float: right; color: ${entry.success ? 'green' : 'red'};">
          ${entry.success ? '✅' : '❌'}
        </span>
        <br>
        <small>${new Date(entry.timestamp).toLocaleString()}</small>
      </div>
    `).join('');
  }

  // 自動チェック切り替え
  toggleAutoCheck(enabled) {
    this.autoCheckEnabled = enabled;
    
    if (enabled) {
      this.setupAutoCheck();
    } else {
      if (this.autoCheckInterval) {
        clearInterval(this.autoCheckInterval);
        this.autoCheckInterval = null;
      }
    }
  }

  // 自動チェック設定
  setupAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }

    if (this.autoCheckEnabled) {
      // 30分間隔で自動チェック
      this.autoCheckInterval = setInterval(async () => {
        try {
          const result = await window.storeDataUpdater.checkForUpdates();
          
          if (result.hasUpdate && this.updateButton) {
            // 通知バッジ表示
            this.showUpdateNotification();
          }
        } catch (error) {
          console.error('自動更新チェックエラー:', error);
        }
      }, 30 * 60 * 1000); // 30分
    }
  }

  // 更新通知表示
  showUpdateNotification() {
    if (!this.isVisible && window.qrManager) {
      window.qrManager.showInfo('新しい店舗データが利用可能です');
    }
  }

  // 更新バッジ削除
  removeUpdateBadge() {
    if (this.updateButton) {
      const badge = this.updateButton.querySelector('.update-badge');
      if (badge) {
        badge.remove();
      }
    }
  }

  // キャンセルボタンのアクション処理（状態により分岐）
  handleCancelAction() {
    if (this.isUpdating) {
      // 更新中の場合：中断確認
      const confirmAbort = confirm('データ更新を中断しますか？\n現在の進行状況は失われます。');
      if (confirmAbort) {
        this.abortUpdate();
      }
    } else {
      // 待機中の場合：モーダルを閉じる
      this.hideModal();
    }
  }

  // 更新開始時の状態変更
  setUpdatingState(isUpdating) {
    this.isUpdating = isUpdating;
    const cancelBtn = this.updateModal.querySelector('#cancelBtn');
    const updateBtn = this.updateModal.querySelector('#updateBtn');
    const checkBtn = this.updateModal.querySelector('#checkUpdateBtn');
    const forceBtn = this.updateModal.querySelector('#forceUpdateBtn');

    if (isUpdating) {
      // 更新中：中断ボタンに変更
      cancelBtn.textContent = '中断';
      cancelBtn.style.background = '#dc3545';
      updateBtn.disabled = true;
      checkBtn.disabled = true;
      forceBtn.disabled = true;
    } else {
      // 待機中：閉じるボタンに変更
      cancelBtn.textContent = '閉じる';
      cancelBtn.style.background = '#6c757d';
      updateBtn.disabled = false;
      checkBtn.disabled = false;
      forceBtn.disabled = false;
    }
  }

  // 更新中断処理
  abortUpdate() {
    try {
      // 更新処理を停止
      if (window.storeDataUpdater && window.storeDataUpdater.abortUpdate) {
        window.storeDataUpdater.abortUpdate();
      }
      
      // UIを待機状態に戻す
      this.setUpdatingState(false);
      
      // プログレス表示をリセット
      const progressDiv = this.updateModal.querySelector('#updateProgress');
      const progressText = this.updateModal.querySelector('#progressText');
      progressDiv.style.display = 'none';
      progressText.textContent = '更新が中断されました';
      progressText.style.color = 'orange';
      
      console.log('✋ 更新が中断されました');
    } catch (error) {
      console.error('更新中断エラー:', error);
    }
  }
}

// グローバルインスタンス作成と初期化
window.updateManagerUI = new UpdateManagerUI();

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.updateManagerUI.init();
  });
} else {
  window.updateManagerUI.init();
}