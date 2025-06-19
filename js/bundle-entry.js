// Bundle Entry Point for Cafe★Log PWA
// This file imports all necessary modules in the correct order

// Utilities (Core Dependencies)
import './debug-menu.js';
import './utils/storage.js';
import './utils/data-integration.js';
import '../tools/data-updater.js';
import './utils/progress.js';
import './utils/qr.js';
import './utils/touch.js';
import './utils/performance.js';
import './utils/scraper.js';

// Components (Depends on Utilities)
import './components/update-manager.js';
import './components/header.js';
import './components/navigation.js';
import './components/map.js';

// Pages (Depends on Components)
import './pages/top.js';
import './pages/stores.js';
import './pages/achievements.js';

// Main App (Last - depends on all above)
import './app.js';

console.log('📦 Bundle loaded successfully');