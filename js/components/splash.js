// Splash Screen Component

class SplashScreen {
  constructor() {
    this.splashElement = null;
    this.isFirstLaunch = this.checkFirstLaunch();
    this.duration = 750; // 0.75 seconds
  }

  checkFirstLaunch() {
    // Check if this is a fresh launch (not a resume)
    const lastHidden = sessionStorage.getItem('lastHidden');
    const now = Date.now();
    
    // If app was hidden less than 30 seconds ago, consider it a resume
    if (lastHidden && (now - parseInt(lastHidden)) < 30000) {
      return false;
    }
    
    // Track when app gets hidden for resume detection
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        sessionStorage.setItem('lastHidden', Date.now().toString());
      }
    });
    
    return true;
  }

  createSplashElement() {
    const splash = document.createElement('div');
    splash.className = 'splash-screen';
    splash.innerHTML = `
      <div class="splash-content">
        <svg class="splash-logo" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <!-- 緑背景 -->
          <circle cx="60" cy="60" r="60" fill="#00704A"/>
          
          <!-- 白いカップ (丸み強化・拡大版) -->
          <g transform="translate(60,62)">
            <!-- カップ本体 -->
            <path d="M-26 -8 Q-26 -12 -22 -12 L22 -12 Q26 -12 26 -8 L26 16 Q26 26 18 26 L-18 26 Q-26 26 -26 16 Z" fill="white"/>
            <!-- カップハンドル (拡大) -->
            <path d="M26 -4 Q35 -4 35 2 Q35 8 26 8" fill="none" stroke="white" stroke-width="4.5"/>
            <!-- カップ上部リム -->
            <ellipse cx="0" cy="-12" rx="26" ry="4" fill="white"/>
            <!-- 蒸気 -->
            <path d="M-12 -18 Q-12 -26 -10 -26 Q-8 -26 -8 -18" fill="none" stroke="white" stroke-width="2.5" opacity="0.8"/>
            <path d="M0 -18 Q0 -28 2 -28 Q4 -28 4 -18" fill="none" stroke="white" stroke-width="2.5" opacity="0.8"/>
            <path d="M12 -18 Q12 -26 14 -26 Q16 -26 16 -18" fill="none" stroke="white" stroke-width="2.5" opacity="0.8"/>
          </g>
          
          <!-- 黄色い星 (さらに拡大版) -->
          <g transform="translate(90,30)">
            <path d="M0,-16 L4.5,-4.5 L16,0 L4.5,4.5 L0,16 L-4.5,4.5 L-16,0 L-4.5,-4.5 Z" fill="#FFD700"/>
          </g>
        </svg>
        <h1 class="splash-title">Cafe★Log</h1>
        <p class="splash-subtitle">カフェ店舗訪問記録</p>
      </div>
    `;
    return splash;
  }

  async show() {
    if (!this.isFirstLaunch) {
      console.log('🔄 Resume detected - skipping splash screen');
      return Promise.resolve();
    }

    console.log('✨ First launch - showing splash screen');
    
    return new Promise((resolve) => {
      // Create and add splash screen
      this.splashElement = this.createSplashElement();
      document.body.appendChild(this.splashElement);
      
      // Force a reflow to ensure initial state
      this.splashElement.offsetHeight;
      
      // Fade in
      requestAnimationFrame(() => {
        this.splashElement.classList.add('active');
      });
      
      // Schedule fade out and removal
      setTimeout(() => {
        this.hide().then(resolve);
      }, this.duration);
    });
  }

  async hide() {
    if (!this.splashElement) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Fade out
      this.splashElement.classList.remove('active');
      
      // Remove after fade animation completes
      setTimeout(() => {
        if (this.splashElement && this.splashElement.parentNode) {
          this.splashElement.parentNode.removeChild(this.splashElement);
        }
        this.splashElement = null;
        resolve();
      }, 300); // Match CSS transition duration
    });
  }

  // Public method to manually trigger splash (for testing)
  async showForced() {
    this.isFirstLaunch = true;
    return this.show();
  }
}

// Initialize splash screen manager
function initializeSplashScreen() {
  window.splashScreen = new SplashScreen();
  
  // Show splash screen on first launch
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.splashScreen.show().then(() => {
        console.log('✅ Splash screen sequence completed');
      });
    });
  } else {
    // DOM already loaded
    window.splashScreen.show().then(() => {
      console.log('✅ Splash screen sequence completed');
    });
  }
}

// Initialize immediately
initializeSplashScreen();