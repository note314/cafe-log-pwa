// QR Code Generation and Reading Utility

class QRManager {
  constructor() {
    this.qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
    this.scannerActive = false;
    this.stream = null;
  }

  // Generate QR Code for data export
  generateQRCode(data, size = 300) {
    try {
      // Create standardized export format
      const exportFormat = this.createExportFormat(data);
      const jsonData = JSON.stringify(exportFormat);
      
      // Check data size - QR codes have limits
      if (jsonData.length > 2900) {
        console.warn('Data too large for QR code, compressing...');
        const compressedData = this.compressData(exportFormat);
        const compressedJson = JSON.stringify(compressedData);
        
        if (compressedJson.length > 2900) {
          throw new Error('データが大きすぎてQRコードに収まりません');
        }
        
        const encodedData = encodeURIComponent(compressedJson);
        return `${this.qrApiUrl}?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
      }
      
      const encodedData = encodeURIComponent(jsonData);
      return `${this.qrApiUrl}?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Create standardized export format
  createExportFormat(data) {
    const visitedStores = window.storageManager.getVisitedStores();
    const favoriteAreas = window.storageManager.getFavoriteAreas();
    
    return {
      version: "2.0",
      app: "starbucks-visit-tracker",
      exported_at: new Date().toISOString(),
      data: {
        visited_stores: visitedStores,
        favorite_areas: favoriteAreas,
        statistics: {
          total_visited: visitedStores.length,
          total_favorites: favoriteAreas.length,
          export_date: new Date().toISOString().split('T')[0]
        }
      },
      checksum: this.calculateChecksum(visitedStores, favoriteAreas)
    };
  }

  // Compress data for large datasets
  compressData(exportFormat) {
    // Simple compression by removing unnecessary data
    return {
      v: exportFormat.version,
      a: "sbvt", // shortened app name
      e: exportFormat.exported_at,
      d: {
        vs: exportFormat.data.visited_stores,
        fa: exportFormat.data.favorite_areas,
        s: {
          tv: exportFormat.data.statistics.total_visited,
          tf: exportFormat.data.statistics.total_favorites
        }
      },
      c: exportFormat.checksum
    };
  }

  // Calculate checksum for data integrity
  calculateChecksum(visitedStores, favoriteAreas) {
    const combined = [...visitedStores, ...favoriteAreas].sort().join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Create QR Code modal for export
  showExportQRModal() {
    const exportData = window.storageManager.exportData();
    if (!exportData) {
      this.showError('データのエクスポートに失敗しました');
      return;
    }

    const qrUrl = this.generateQRCode(exportData);
    if (!qrUrl) {
      this.showError('QRコードの生成に失敗しました');
      return;
    }

    this.createQRModal('データエクスポート', qrUrl, exportData);
  }

  // Create QR Code modal
  createQRModal(title, qrUrl, data) {
    // Remove existing modal
    const existingModal = document.getElementById('qrModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'qrModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${title}</h3>
        <div class="qr-container" style="text-align: center; margin: 1.5rem 0;">
          <img src="${qrUrl}" alt="QR Code" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px var(--shadow-color);">
        </div>
        <div class="qr-info">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            このQRコードを読み取ることで、訪問記録とお気に入りエリアを他のデバイスに引き継ぐことができます。
          </p>
          <div class="qr-actions" style="display: flex; gap: 0.75rem;">
            <button class="btn-secondary" id="downloadQR">画像保存</button>
            <button class="btn-secondary" id="shareQR">共有</button>
            <button class="btn-primary" id="closeQRModal">閉じる</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Event listeners
    document.getElementById('closeQRModal').addEventListener('click', () => {
      this.closeModal(modal);
    });

    document.getElementById('downloadQR').addEventListener('click', () => {
      this.downloadQRImage(qrUrl);
    });

    document.getElementById('shareQR').addEventListener('click', () => {
      this.shareQRCode(data);
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
  }

  // Download QR Code image
  async downloadQRImage(qrUrl) {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafe-log-data-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showSuccess('QRコードを保存しました');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      this.showError('画像の保存に失敗しました');
    }
  }

  // Share QR Code data
  async shareQRCode(data) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cafe★Log',
          text: '私のCafe★Log訪問記録を共有します',
          url: `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          this.fallbackShare(data);
        }
      }
    } else {
      this.fallbackShare(data);
    }
  }

  // Fallback share method
  fallbackShare(data) {
    try {
      navigator.clipboard.writeText(data);
      this.showSuccess('データをクリップボードにコピーしました');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showTextModal('データコピー', data);
    }
  }

  // Show import QR scanner
  showImportQRScanner() {
    this.createScannerModal();
  }

  // Create QR scanner modal
  createScannerModal() {
    // Remove existing modal
    const existingModal = document.getElementById('scannerModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'scannerModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>データインポート</h3>
        <div class="scanner-container">
          <div class="scanner-options" style="margin-bottom: 1.5rem;">
            <button class="btn-primary" id="startCamera" style="width: 100%; margin-bottom: 1rem;">
              📷 カメラでQRコードを読み取り
            </button>
            <button class="btn-secondary" id="uploadImage" style="width: 100%; margin-bottom: 1rem;">
              🖼️ 画像からQRコードを読み取り
            </button>
            <button class="btn-secondary" id="manualInput" style="width: 100%;">
              ✏️ データを手動入力
            </button>
          </div>
          <div id="videoContainer" style="display: none;">
            <video id="qrVideo" style="width: 100%; max-width: 400px; border-radius: 8px;"></video>
            <div style="margin-top: 1rem;">
              <button class="btn-secondary" id="stopCamera">カメラを停止</button>
            </div>
          </div>
          <input type="file" id="qrImageInput" accept="image/*" style="display: none;">
          <textarea id="manualDataInput" placeholder="エクスポートしたデータを貼り付けてください..." style="display: none; width: 100%; height: 120px; margin-top: 1rem; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
        </div>
        <div class="scanner-actions" style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
          <button class="btn-primary" id="importData" style="display: none;">インポート</button>
          <button class="btn-secondary" id="closeScannerModal">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Event listeners
    this.setupScannerEventListeners(modal);
  }

  // Setup scanner event listeners
  setupScannerEventListeners(modal) {
    const startCameraBtn = document.getElementById('startCamera');
    const uploadImageBtn = document.getElementById('uploadImage');
    const manualInputBtn = document.getElementById('manualInput');
    const stopCameraBtn = document.getElementById('stopCamera');
    const qrImageInput = document.getElementById('qrImageInput');
    const manualDataInput = document.getElementById('manualDataInput');
    const importDataBtn = document.getElementById('importData');
    const closeBtn = document.getElementById('closeScannerModal');

    startCameraBtn.addEventListener('click', () => this.startCameraScanner());
    uploadImageBtn.addEventListener('click', () => qrImageInput.click());
    manualInputBtn.addEventListener('click', () => this.showManualInput());
    stopCameraBtn.addEventListener('click', () => this.stopCameraScanner());
    qrImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    importDataBtn.addEventListener('click', () => this.importManualData());
    closeBtn.addEventListener('click', () => this.closeModal(modal));

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
  }

  // Start camera scanner (simplified version without external library)
  async startCameraScanner() {
    try {
      const videoContainer = document.getElementById('videoContainer');
      const video = document.getElementById('qrVideo');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      video.srcObject = this.stream;
      video.play();
      
      videoContainer.style.display = 'block';
      this.scannerActive = true;
      
      this.showInfo('QRコードをカメラで読み取ってください。実際の実装では、QRコード読み取りライブラリが必要です。');
      
    } catch (error) {
      console.error('Error starting camera:', error);
      this.showError('カメラにアクセスできませんでした');
    }
  }

  // Stop camera scanner
  stopCameraScanner() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
      videoContainer.style.display = 'none';
    }
    
    this.scannerActive = false;
  }

  // Handle image upload for QR scanning
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.showInfo('画像からのQRコード読み取りには、追加のライブラリが必要です。現在は手動入力をご利用ください。');
  }

  // Show manual input
  showManualInput() {
    const manualDataInput = document.getElementById('manualDataInput');
    const importDataBtn = document.getElementById('importData');
    
    manualDataInput.style.display = 'block';
    importDataBtn.style.display = 'inline-block';
    
    manualDataInput.focus();
  }

  // Import manual data
  importManualData() {
    const manualDataInput = document.getElementById('manualDataInput');
    const data = manualDataInput.value.trim();
    
    if (!data) {
      this.showError('データを入力してください');
      return;
    }

    const importResult = this.processImportData(data);
    
    if (importResult.success) {
      this.showSuccess(`データのインポートに成功しました (訪問済み: ${importResult.stats.visitedCount}店舗, お気に入り: ${importResult.stats.favoriteCount}エリア)`);
      
      // Update UI
      if (window.progressManager) {
        window.progressManager.updateVisitedStores();
      }
      
      // Refresh current page
      this.refreshCurrentPage();
      
      // Close modal
      const modal = document.getElementById('scannerModal');
      if (modal) {
        this.closeModal(modal);
      }
    } else {
      this.showError(`インポートエラー: ${importResult.error}`);
    }
  }

  // Process import data with validation
  processImportData(rawData) {
    try {
      let importData;
      
      // Try to parse JSON
      try {
        importData = JSON.parse(rawData);
      } catch (e) {
        return { success: false, error: 'JSONの形式が正しくありません' };
      }

      // Validate data format
      const validation = this.validateImportData(importData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Extract data (handle both compressed and normal formats)
      const extractedData = this.extractImportData(importData);
      
      // Verify checksum if available
      if (importData.checksum || importData.c) {
        const expectedChecksum = this.calculateChecksum(
          extractedData.visitedStores, 
          extractedData.favoriteAreas
        );
        const actualChecksum = importData.checksum || importData.c;
        
        if (expectedChecksum !== actualChecksum) {
          console.warn('Checksum mismatch - data may be corrupted');
        }
      }

      // Import the data
      const success = window.storageManager.importData(rawData);
      
      if (success) {
        return {
          success: true,
          stats: {
            visitedCount: extractedData.visitedStores.length,
            favoriteCount: extractedData.favoriteAreas.length
          }
        };
      } else {
        return { success: false, error: 'データの保存に失敗しました' };
      }

    } catch (error) {
      console.error('Import processing error:', error);
      return { success: false, error: 'データの処理中にエラーが発生しました' };
    }
  }

  // Validate import data format
  validateImportData(data) {
    // Check for required fields (normal format)
    if (data.version && data.app && data.data) {
      if (!data.data.visited_stores || !data.data.favorite_areas) {
        return { isValid: false, error: '必要なデータフィールドが見つかりません' };
      }
      return { isValid: true };
    }

    // Check for compressed format
    if (data.v && data.a && data.d) {
      if (!data.d.vs || !data.d.fa) {
        return { isValid: false, error: '圧縮データの形式が正しくありません' };
      }
      return { isValid: true };
    }

    // Check for legacy format (direct storage manager export)
    if (data.visitedStores && data.favoriteAreas) {
      return { isValid: true };
    }

    return { isValid: false, error: 'サポートされていないデータ形式です' };
  }

  // Extract data from import (handle different formats)
  extractImportData(data) {
    // Normal format
    if (data.version && data.data) {
      return {
        visitedStores: data.data.visited_stores || [],
        favoriteAreas: data.data.favorite_areas || []
      };
    }

    // Compressed format
    if (data.v && data.d) {
      return {
        visitedStores: data.d.vs || [],
        favoriteAreas: data.d.fa || []
      };
    }

    // Legacy format
    if (data.visitedStores && data.favoriteAreas) {
      return {
        visitedStores: data.visitedStores,
        favoriteAreas: data.favoriteAreas
      };
    }

    return { visitedStores: [], favoriteAreas: [] };
  }

  // Close modal
  closeModal(modal) {
    this.stopCameraScanner();
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  // Show text modal for copying data
  showTextModal(title, text) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${title}</h3>
        <textarea readonly style="width: 100%; height: 120px; margin: 1rem 0; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: monospace; font-size: 0.875rem;">${text}</textarea>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
          上記のテキストを手動でコピーしてください。
        </p>
        <button class="btn-primary modal-close" style="width: 100%;">閉じる</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });
  }

  // Refresh current page data
  refreshCurrentPage() {
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('dataUpdated', {
      detail: { source: 'qr-import' }
    }));
  }

  // Show success message
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  // Show error message
  showError(message) {
    this.showToast(message, 'error');
  }

  // Show info message
  showInfo(message) {
    this.showToast(message, 'info');
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 1rem;
      background: var(--surface-elevated);
      color: var(--text-primary);
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px var(--shadow-color);
      z-index: 3000;
      max-width: 300px;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      border-left: 4px solid ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Hide toast
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Create global instance
window.qrManager = new QRManager();