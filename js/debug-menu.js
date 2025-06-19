// Debug Hamburger Menu - Simple Implementation

(function() {
  'use strict';
  
  console.log('🐛 Debug menu script loaded');
  
  function initDebugMenu() {
    console.log('🐛 Initializing debug menu...');
    
    // Find elements
    const hamburgerBtn = document.getElementById('hamburger');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    console.log('🐛 Elements found:', {
      hamburgerBtn: !!hamburgerBtn,
      hamburgerMenu: !!hamburgerMenu,
      menuOverlay: !!menuOverlay
    });
    
    if (!hamburgerBtn || !hamburgerMenu) {
      console.error('🐛 Required elements not found!');
      return;
    }
    
    let isMenuOpen = false;
    
    // Toggle menu function
    function toggleMenu() {
      console.log('🐛 Toggle menu called, current state:', isMenuOpen);
      isMenuOpen = !isMenuOpen;
      
      if (isMenuOpen) {
        hamburgerMenu.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('🐛 Menu opened');
      } else {
        hamburgerMenu.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
        console.log('🐛 Menu closed');
      }
    }
    
    // Close menu function
    function closeMenu() {
      if (isMenuOpen) {
        console.log('🐛 Closing menu');
        toggleMenu();
      }
    }
    
    // Add click listener to hamburger button
    hamburgerBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🐛 Hamburger button clicked!');
      toggleMenu();
    });
    
    // Add click listener to overlay
    if (menuOverlay) {
      menuOverlay.addEventListener('click', function(e) {
        console.log('🐛 Menu overlay clicked');
        closeMenu();
      });
    }
    
    // Add click listeners to menu items
    document.addEventListener('click', function(e) {
      const action = e.target.getAttribute('data-action');
      if (action) {
        console.log('🐛 Menu action clicked:', action);
        
        // テーマ以外の場合のみメニューを閉じる
        if (action !== 'theme') {
          closeMenu();
        }
        
        // 全てのメニューアクションをheader.jsに委任（重複防止）
        // header.jsのHeaderManagerが適切に処理します
        return;
      }
    });
    
    // Simple theme modal - 無効化（header.jsに委任）
    function showThemeModal() {
      // この関数は使用されません
      return;
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: var(--surface-elevated);
        padding: 2rem;
        border-radius: 12px;
        max-width: 300px;
        width: 90%;
        text-align: center;
      `;
      
      content.innerHTML = `
        <h3 style="margin-bottom: 1rem;">テーマ選択</h3>
        <button data-theme="light" style="display: block; width: 100%; margin: 0.5rem 0; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-color); cursor: pointer;">ライト</button>
        <button data-theme="dark" style="display: block; width: 100%; margin: 0.5rem 0; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-color); cursor: pointer;">ダーク</button>
        <button data-theme="starbucks" style="display: block; width: 100%; margin: 0.5rem 0; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-color); cursor: pointer;">スタバ緑</button>
        <button id="closeTheme" style="display: block; width: 100%; margin: 1rem 0 0 0; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary-color); color: white; cursor: pointer;">閉じる</button>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Theme change handlers
      content.addEventListener('click', function(e) {
        const theme = e.target.getAttribute('data-theme');
        if (theme) {
          document.body.setAttribute('data-theme', theme);
          localStorage.setItem('starbucks_theme', theme);
          console.log('🐛 Theme changed to:', theme);
        }
        
        if (e.target.id === 'closeTheme' || theme) {
          modal.remove();
        }
      });
      
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
    
    // Escape key handler
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    });
    
    console.log('🐛 Debug menu initialized successfully!');
  }

  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugMenu);
  } else {
    initDebugMenu();
  }
  
})();