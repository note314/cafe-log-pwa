// Header and Hamburger Menu Component

class HeaderManager {
  constructor() {
    this.hamburgerBtn = null;
    this.hamburgerMenu = null;
    this.menuOverlay = null;
    this.isMenuOpen = false;
    this.themeModal = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.applyStoredTheme();
  }

  setupElements() {
    this.hamburgerBtn = document.getElementById('hamburger');
    this.hamburgerMenu = document.getElementById('hamburgerMenu');
    this.menuOverlay = document.getElementById('menuOverlay');
    this.themeModal = document.getElementById('themeModal');
    
    // Debug logging
    console.log('Header elements found:', {
      hamburgerBtn: !!this.hamburgerBtn,
      hamburgerMenu: !!this.hamburgerMenu,
      menuOverlay: !!this.menuOverlay,
      themeModal: !!this.themeModal
    });
    
    if (!this.hamburgerBtn) {
      console.error('❌ Hamburger button not found! Check element ID.');
    }
    if (!this.hamburgerMenu) {
      console.error('❌ Hamburger menu not found! Check element ID.');
    }
  }

  setupEventListeners() {
    // Hamburger button click
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', () => {
        this.toggleMenu();
      });
    }

    // Menu overlay click (close menu)
    if (this.menuOverlay) {
      this.menuOverlay.addEventListener('click', () => {
        this.closeMenu();
      });
    }

    // Menu item clicks
    document.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action) {
        this.handleMenuAction(action);
      }
    });

    // Escape key to close menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isMenuOpen) {
          this.closeMenu();
        }
        this.closeAllModals();
      }
    });

    // Theme modal events
    this.setupThemeModalEvents();

    // Window resize handling
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (!this.hamburgerMenu || !this.hamburgerBtn) return;

    this.isMenuOpen = true;
    this.hamburgerBtn.classList.add('active');
    this.hamburgerMenu.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus management
    this.trapFocus();
  }

  closeMenu() {
    if (!this.hamburgerMenu || !this.hamburgerBtn) return;

    this.isMenuOpen = false;
    this.hamburgerBtn.classList.remove('active');
    this.hamburgerMenu.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to hamburger button
    setTimeout(() => {
      this.hamburgerBtn.focus();
    }, 300);
  }

  handleMenuAction(action) {
    // Close menu first for most actions
    if (action !== 'theme') {
      this.closeMenu();
    }

    switch (action) {
      case 'theme':
        this.showThemeModal();
        break;
      case 'qr':
        this.showQRModal();
        break;
      case 'notices':
        this.showNoticesModal();
        break;
      case 'disclaimer':
        this.showDisclaimerModal();
        break;
      case 'privacy':
        this.showPrivacyModal();
        break;
      case 'licenses':
        this.showLicensesModal();
        break;
      case 'credits':
        this.showCreditsModal();
        break;
      case 'store-update':
        this.showStoreUpdateModal();
        break;
      case 'reset':
        this.showResetConfirmation();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  // Theme Modal Management
  setupThemeModalEvents() {
    if (!this.themeModal) return;

    // Theme selection buttons
    this.themeModal.addEventListener('click', (e) => {
      const theme = e.target.getAttribute('data-theme');
      if (theme) {
        this.setTheme(theme);
        this.updateThemeButtons();
      }
    });

    // Close modal button
    const closeBtn = this.themeModal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeThemeModal();
      });
    }

    // Close on overlay click
    this.themeModal.addEventListener('click', (e) => {
      if (e.target === this.themeModal) {
        this.closeThemeModal();
      }
    });
  }

  showThemeModal() {
    if (!this.themeModal) return;

    this.themeModal.classList.add('active');
    this.updateThemeButtons();
    
    // Focus first theme button
    const firstBtn = this.themeModal.querySelector('.theme-btn');
    if (firstBtn) {
      setTimeout(() => firstBtn.focus(), 100);
    }
  }

  closeThemeModal() {
    if (!this.themeModal) return;

    this.themeModal.classList.remove('active');
    this.closeMenu(); // Also close the hamburger menu
  }

  updateThemeButtons() {
    const currentTheme = window.storageManager.getTheme();
    const themeButtons = this.themeModal.querySelectorAll('.theme-btn');
    
    themeButtons.forEach(btn => {
      const theme = btn.getAttribute('data-theme');
      if (theme === currentTheme) {
        btn.style.backgroundColor = 'var(--primary-color)';
        btn.style.color = 'var(--text-on-primary)';
        btn.style.borderColor = 'var(--primary-color)';
      } else {
        btn.style.backgroundColor = 'var(--surface-color)';
        btn.style.color = 'var(--text-primary)';
        btn.style.borderColor = 'var(--border-color)';
      }
    });
  }

  setTheme(theme) {
    const success = window.storageManager.setTheme(theme);
    if (success) {
      this.showToast(`テーマを「${this.getThemeName(theme)}」に変更しました`);
    }
  }

  applyStoredTheme() {
    const theme = window.storageManager.getTheme();
    document.body.setAttribute('data-theme', theme);
  }

  getThemeName(theme) {
    const themeNames = {
      'light': 'ライト',
      'dark': 'ダーク', 
      'starbucks': 'スタバ緑'
    };
    return themeNames[theme] || theme;
  }

  // QR Modal
  showQRModal() {
    const modal = this.createModal('QRコード', `
      <div style="text-align: center;">
        <div style="margin-bottom: 1.5rem;">
          <button class="btn-primary" id="exportQR" style="width: 100%; margin-bottom: 1rem;">
            📤 データをエクスポート
          </button>
          <button class="btn-secondary" id="importQR" style="width: 100%;">
            📥 データをインポート
          </button>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          QRコードを使って訪問記録とお気に入りエリアを他のデバイスと共有できます。
        </p>
      </div>
    `);

    // Setup QR modal events
    modal.querySelector('#exportQR').addEventListener('click', () => {
      this.closeModal(modal);
      window.qrManager.showExportQRModal();
    });

    modal.querySelector('#importQR').addEventListener('click', () => {
      this.closeModal(modal);
      window.qrManager.showImportQRScanner();
    });
  }

  // Notices Modal
  showNoticesModal() {
    const modal = this.createModal('お知らせ', `
      <div>
        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--divider-color);">
          <h4 style="margin-bottom: 0.5rem;">2025/06/20</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary);">
            アプリをリリースしました。日本全国のチェーン系人気カフェの訪問記録を管理できます。
          </p>
        </div>
        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--divider-color);">
          <h4 style="margin-bottom: 0.5rem;">今後の予定</h4>
          <ul style="font-size: 0.875rem; color: var(--text-secondary); list-style: disc; margin-left: 1.5rem;">
            <li>実店舗データの追加</li>
            <li>QRコード読み取り機能の向上</li>
            <li>実績カード機能の改善</li>
          </ul>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center;">
          このアプリはいかなる企業の公認またはスポンサリングを受けるものではありません。
        </p>
      </div>
    `);
  }

  // Disclaimer Modal
  showDisclaimerModal() {
    const modal = this.createModal('免責事項', `
      <div style="font-size: 0.875rem; line-height: 1.6;">
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-color); border-radius: 8px; border-left: 4px solid var(--primary-color);">
          <p style="margin: 0;">
            このアプリは個人開発アプリです。<strong>いかなる企業の公認またはスポンサリングを受けるものではありません。</strong>
          </p>
        </div>
        
        <h4 style="margin-bottom: 1rem;">重要事項</h4>
        <ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>店舗情報は正確性を保証するものではありません</li>
          <li>営業時間や店舗の営業状況は各公式情報でご確認ください</li>
          <li>データは端末内のみに保存され、外部には送信されません</li>
        </ul>
        
        <h4 style="margin-bottom: 1rem;">お問い合わせについて</h4>
        <p style="margin-bottom: 1.5rem;">
          当アプリの掲載店舗および企業へのお問い合わせは控えてください。
        </p>
        
        <p style="color: var(--text-muted); text-align: center; font-size: 0.75rem;">
          ©2025 Cafe★Log
        </p>
      </div>
    `);
  }

  // Privacy Policy Modal
  showPrivacyModal() {
    const modal = this.createModal('プライバシーポリシー', `
      <div style="font-size: 0.875rem; line-height: 1.6;">
        <h4 style="margin-bottom: 1rem;">データの取り扱い</h4>
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-color); border-radius: 8px;">
          <p style="margin: 0 0 0.5rem 0;">
            <strong>ローカルストレージのみ使用</strong>
          </p>
          <p style="margin: 0;">
            このアプリは訪問記録を端末内のローカルストレージにのみ保存し、外部サーバーへの送信は行いません。
          </p>
        </div>
        
        <h4 style="margin-bottom: 1rem;">収集する情報</h4>
        <ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>店舗訪問記録（訪問済み/未訪問のステータス）</li>
          <li>お気に入りエリア設定</li>
          <li>アプリ設定（テーマ選択など）</li>
        </ul>
        
        <h4 style="margin-bottom: 1rem;">第三者サービス</h4>
        <ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 1.5rem;">
          <li>Google Maps API（地図表示用）</li>
          <li>QRコード生成API（データエクスポート用）</li>
        </ul>
        
        <p style="margin-bottom: 1.5rem; font-size: 0.8rem; color: var(--text-muted);">
          これらのサービスは各社のプライバシーポリシーに従って動作します。
        </p>
        
        <p style="color: var(--text-muted); text-align: center; font-size: 0.75rem;">
          最終更新：2025年6月20日
        </p>
      </div>
    `);
  }

  // Licenses Modal
  showLicensesModal() {
    const modal = this.createModal('ライセンス情報', `
      <div style="font-size: 0.875rem; line-height: 1.6;">
        <h4 style="margin-bottom: 1rem;">オープンソースライセンス</h4>
        
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-color); border-radius: 8px;">
          <h5 style="margin: 0 0 0.5rem 0;">日本地図データ</h5>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.8rem;">
            提供: Geolonia (https://geolonia.com/)
          </p>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">
            GNU Free Documentation License (GFDL)<br>
            https://www.gnu.org/licenses/fdl.html
          </p>
        </div>
        
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-color); border-radius: 8px;">
          <h5 style="margin: 0 0 0.5rem 0;">アプリ開発</h5>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.8rem;">
            Generated with Claude Code
          </p>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">
            Co-Authored-By: Claude &lt;noreply@anthropic.com&gt;
          </p>
        </div>
        
        <h4 style="margin-bottom: 1rem;">使用技術</h4>
        <ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; font-size: 0.8rem;">
          <li>Progressive Web App (PWA)</li>
          <li>Google Maps JavaScript API</li>
          <li>Vanilla JavaScript (ES6+)</li>
          <li>CSS Grid & Flexbox</li>
          <li>Service Worker API</li>
        </ul>
        
        <p style="color: var(--text-muted); text-align: center; font-size: 0.75rem;">
          すべてのライセンスを尊重し、適切に表示しています
        </p>
      </div>
    `);
  }

  // Credits Modal
  showCreditsModal() {
    const modal = this.createModal('クレジット', `
      <div style="font-size: 0.875rem; line-height: 1.6; text-align: center;">
        <div style="margin-bottom: 2rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">☕️</div>
          <h3 style="margin: 0; color: var(--primary-color);">Cafe★Log</h3>
          <p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--text-muted);">
            カフェ店舗訪問記録PWA
          </p>
        </div>
        
        <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--surface-color); border-radius: 8px;">
          <h4 style="margin-bottom: 1rem;">開発</h4>
          <p style="margin: 0; font-size: 0.9rem;">
            🤖 Generated with <strong>Claude Code</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              AI-Powered Development Assistant
            </span>
          </p>
        </div>
        
        <div style="margin-bottom: 2rem;">
          <h4 style="margin-bottom: 1rem;">特別な感謝</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            <p>🗾 Geolonia - 日本地図データ提供</p>
            <p>🗺️ Google Maps - 地図サービス</p>
            <p>⭐ GitHub - コード管理</p>
            <p>🌐 PWA技術 - モダンWeb体験</p>
          </div>
        </div>
        
        <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <p>このアプリは個人開発プロジェクトです</p>
          <p>©2025 Cafe★Log - All rights reserved</p>
        </div>
      </div>
    `);
  }

  // Store Update Modal
  showStoreUpdateModal() {
    if (window.updateManagerUI) {
      window.updateManagerUI.showModal();
    } else {
      this.showToast('店舗データ更新機能が利用できません', 'error');
    }
  }

  // Reset Confirmation
  showResetConfirmation() {
    const modal = this.createModal('データ初期化', `
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h4 style="margin-bottom: 1rem; color: var(--error-color);">データ初期化の確認</h4>
        <p style="margin-bottom: 1.5rem; font-size: 0.875rem;">
          すべての訪問記録とお気に入りエリアが削除されます。<br>
          この操作は取り消せません。
        </p>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn-secondary" id="cancelReset" style="flex: 1;">
            キャンセル
          </button>
          <button class="btn-accent" id="confirmReset" style="flex: 1;">
            初期化する
          </button>
        </div>
      </div>
    `);

    modal.querySelector('#cancelReset').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.querySelector('#confirmReset').addEventListener('click', () => {
      this.performReset();
      this.closeModal(modal);
    });
  }

  // Utility Methods
  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${title}</h3>
        ${content}
        <button class="modal-close" style="width: 100%; margin-top: 1.5rem;">閉じる</button>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Setup close events
    modal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      this.closeModal(modal);
    });
  }

  copyDebugInfo() {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      appVersion: window.storageManager.getAppVersion(),
      theme: window.storageManager.getTheme(),
      storageInfo: window.storageManager.getStorageInfo(),
      url: window.location.href,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`
    };

    const debugText = JSON.stringify(debugInfo, null, 2);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(debugText).then(() => {
        this.showToast('デバッグ情報をクリップボードにコピーしました');
      }).catch(() => {
        this.showDebugInfoModal(debugText);
      });
    } else {
      this.showDebugInfoModal(debugText);
    }
  }

  showDebugInfoModal(debugText) {
    const modal = this.createModal('デバッグ情報', `
      <textarea readonly style="width: 100%; height: 200px; font-family: monospace; font-size: 0.75rem; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px;">${debugText}</textarea>
      <p style="font-size: 0.875rem; margin-top: 1rem;">上記の情報を手動でコピーしてください。</p>
    `);
  }

  performReset() {
    const success = window.storageManager.clearAllData();
    if (success) {
      this.showToast('データを初期化しました');
      // Reload page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      this.showToast('データの初期化に失敗しました', 'error');
    }
  }

  trapFocus() {
    const focusableElements = this.hamburgerMenu.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Clean up event listener when menu closes
    const cleanup = () => {
      document.removeEventListener('keydown', handleTabKey);
    };

    setTimeout(cleanup, 100);
  }


  showToast(message, type = 'success') {
    // Use the same toast system as QR manager
    if (window.qrManager) {
      if (type === 'error') {
        window.qrManager.showError(message);
      } else {
        window.qrManager.showSuccess(message);
      }
    }
  }
}

// Initialize when DOM is loaded
function initializeHeaderManager() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.headerManager = new HeaderManager();
      console.log('✅ HeaderManager initialized on DOMContentLoaded');
    });
  } else {
    // DOM is already loaded
    window.headerManager = new HeaderManager();
    console.log('✅ HeaderManager initialized immediately');
  }
}

// Initialize immediately
initializeHeaderManager();