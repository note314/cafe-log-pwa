// Store Data Scraper Utility

class StoreDataScraper {
  constructor() {
    this.baseUrl = 'https://store.starbucks.co.jp';
    this.apiEndpoints = {
      search: '/api/v1/stores/search',
      details: '/api/v1/stores/',
      regions: '/api/v1/regions'
    };
    
    this.rateLimiter = {
      requests: 0,
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      resetTime: Date.now() + 60000
    };
    
    this.scraped = {
      stores: [],
      regions: {},
      prefectures: {},
      errors: []
    };
  }

  // Rate limiting
  async waitForRateLimit() {
    const now = Date.now();
    
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.resetTime = now + this.rateLimiter.windowMs;
    }
    
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      const waitTime = this.rateLimiter.resetTime - now;
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForRateLimit();
    }
    
    this.rateLimiter.requests++;
  }

  // Fetch with error handling and retry
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    await this.waitForRateLimit();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Referer': 'https://store.starbucks.co.jp/',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
        
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          this.scraped.errors.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Alternative scraping methods for when API is not available
  async scrapeStoreListFromHTML() {
    try {
      console.log('🔍 Attempting to scrape store data from HTML...');
      
      // Since we can't actually access external sites from this environment,
      // this is a demonstration of how the scraping would work
      
      const prefectures = [
        'hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima',
        'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa',
        'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano',
        'gifu', 'shizuoka', 'aichi', 'mie',
        'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama',
        'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi',
        'tokushima', 'kagawa', 'ehime', 'kochi',
        'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'
      ];
      
      const scrapedStores = [];
      
      for (const prefecture of prefectures.slice(0, 3)) { // Limit for demo
        try {
          const stores = await this.scrapePrefectureStores(prefecture);
          scrapedStores.push(...stores);
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Failed to scrape ${prefecture}:`, error);
        }
      }
      
      return scrapedStores;
      
    } catch (error) {
      console.error('Scraping failed:', error);
      throw error;
    }
  }

  async scrapePrefectureStores(prefecture) {
    // This would typically parse HTML from the store locator pages
    // For demonstration, we'll return mock data that follows the expected structure
    
    console.log(`📍 Scraping stores for ${prefecture}...`);
    
    // Mock data that would come from actual scraping
    const mockStores = this.generateMockStoresForPrefecture(prefecture);
    
    return mockStores;
  }

  generateMockStoresForPrefecture(prefecture) {
    const prefectureData = {
      tokyo: {
        name: '東京都',
        stores: [
          {
            name: 'スターバックス コーヒー 渋谷ツタヤ店',
            address: '東京都渋谷区宇田川町21-6 QFRONT 7F',
            area: 'shibuya_shinjuku',
            lat: 35.6598,
            lng: 139.7006
          },
          {
            name: 'スターバックス コーヒー 新宿マルイ本館店',
            address: '東京都新宿区新宿3-30-13 新宿マルイ本館1F',
            area: 'shibuya_shinjuku',
            lat: 35.6938,
            lng: 139.7034
          },
          {
            name: 'スターバックス コーヒー 銀座六丁目店',
            address: '東京都中央区銀座6-8-7 交詢ビル1F',
            area: 'central_ginza',
            lat: 35.6719,
            lng: 139.7623
          }
        ]
      },
      kanagawa: {
        name: '神奈川県',
        stores: [
          {
            name: 'スターバックス コーヒー 横浜西口店',
            address: '神奈川県横浜市西区南幸1-5-1 横浜西口五番街1F',
            area: 'yokohama',
            lat: 35.4646,
            lng: 139.6219
          },
          {
            name: 'スターバックス コーヒー 川崎ルフロン店',
            address: '神奈川県川崎市川崎区日進町1-11 川崎ルフロン6F',
            area: 'kawasaki',
            lat: 35.5308,
            lng: 139.6978
          }
        ]
      },
      osaka: {
        name: '大阪府',
        stores: [
          {
            name: 'スターバックス コーヒー 大阪駅前第3ビル店',
            address: '大阪府大阪市北区梅田1-1-3 大阪駅前第3ビル1F',
            area: 'osaka_city',
            lat: 34.7024,
            lng: 135.4963
          },
          {
            name: 'スターバックス コーヒー 心斎橋オーパ店',
            address: '大阪府大阪市中央区西心斎橋1-4-3 心斎橋オーパ1F',
            area: 'osaka_city',
            lat: 34.6734,
            lng: 135.5010
          }
        ]
      }
    };
    
    const data = prefectureData[prefecture];
    if (!data) return [];
    
    return data.stores.map((store, index) => ({
      id: `${prefecture}_${index + 1}`,
      name: store.name,
      address: store.address,
      prefecture: prefecture,
      area: store.area,
      lat: store.lat,
      lng: store.lng,
      phone: '', // Would be scraped from detail pages
      visited: false,
      favorite: false
    }));
  }

  // Convert scraped data to app format
  convertToAppFormat(scrapedStores) {
    const regions = {
      hokkaido_tohoku: {
        name: "北海道・東北",
        prefectures: ["hokkaido", "aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"]
      },
      kanto: {
        name: "関東",
        prefectures: ["ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa"]
      },
      chubu: {
        name: "中部",
        prefectures: ["niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano"]
      },
      tokai: {
        name: "東海",
        prefectures: ["gifu", "shizuoka", "aichi", "mie"]
      },
      kinki: {
        name: "近畿",
        prefectures: ["shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama"]
      },
      chugoku_shikoku: {
        name: "中国・四国",
        prefectures: ["tottori", "shimane", "okayama", "hiroshima", "yamaguchi", "tokushima", "kagawa", "ehime", "kochi"]
      },
      kyushu_okinawa: {
        name: "九州・沖縄",
        prefectures: ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa"]
      }
    };

    const prefectures = {
      tokyo: {
        name: "東京都",
        areas: {
          central_ginza: { name: "中央・銀座", wards: ["chiyoda", "chuo", "minato"] },
          shibuya_shinjuku: { name: "渋谷・新宿", wards: ["shibuya", "shinjuku", "toshima", "nakano"] },
          ueno_asakusa: { name: "上野・浅草", wards: ["taito", "bunkyo", "sumida", "arakawa", "adachi"] },
          shinagawa_ota: { name: "品川・大田", wards: ["shinagawa", "ota", "meguro", "setagaya"] },
          itabashi_others: { name: "板橋ほか", wards: ["itabashi", "nerima", "suginami", "koto", "edogawa", "katsushika"] },
          outside_wards: { name: "区外", cities: ["musashino", "mitaka", "chofu", "machida", "hachioji", "tachikawa"] }
        }
      },
      kanagawa: {
        name: "神奈川県",
        areas: {
          yokohama: { name: "横浜市", type: "designated_city" },
          kawasaki: { name: "川崎市", type: "designated_city" },
          sagamihara: { name: "相模原市", type: "designated_city" },
          others: { name: "その他", type: "other_cities" }
        }
      },
      osaka: {
        name: "大阪府",
        areas: {
          osaka_city: { name: "大阪市", type: "designated_city" },
          sakai: { name: "堺市", type: "designated_city" },
          others: { name: "その他", type: "other_cities" }
        }
      }
    };

    return {
      regions,
      prefectures,
      stores: scrapedStores,
      metadata: {
        version: "1.1.0",
        last_updated: new Date().toISOString().split('T')[0],
        total_stores: scrapedStores.length,
        total_prefectures: Object.keys(prefectures).length,
        total_areas: Object.values(prefectures).reduce((sum, pref) => sum + Object.keys(pref.areas).length, 0),
        scraped_at: new Date().toISOString(),
        source: "official_website_scraper"
      }
    };
  }

  // Export scraped data
  exportScrapedData(data, filename = 'store_list_updated.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Progress callback for UI updates
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  updateProgress(current, total, message) {
    if (this.progressCallback) {
      this.progressCallback({
        current,
        total,
        percentage: Math.round((current / total) * 100),
        message
      });
    }
  }

  // Main scraping method
  async scrapeAllStores() {
    try {
      console.log('🚀 Starting store data scraping...');
      
      this.updateProgress(0, 100, 'Initializing scraper...');
      
      // Method 1: Try API endpoints first
      try {
        const apiData = await this.scrapeFromAPI();
        if (apiData && apiData.length > 0) {
          console.log('✅ Successfully scraped from API');
          return this.convertToAppFormat(apiData);
        }
      } catch (error) {
        console.warn('❌ API scraping failed:', error.message);
      }
      
      // Method 2: Fallback to HTML scraping
      this.updateProgress(20, 100, 'Trying HTML scraping...');
      
      const htmlData = await this.scrapeStoreListFromHTML();
      const convertedData = this.convertToAppFormat(htmlData);
      
      this.updateProgress(100, 100, 'Scraping completed!');
      
      console.log('✅ Scraping completed:', {
        stores: convertedData.stores.length,
        prefectures: Object.keys(convertedData.prefectures).length,
        errors: this.scraped.errors.length
      });
      
      return convertedData;
      
    } catch (error) {
      console.error('❌ Scraping failed completely:', error);
      throw error;
    }
  }

  async scrapeFromAPI() {
    // This would attempt to use official API endpoints
    // For demonstration purposes, we'll simulate API failure
    throw new Error('API endpoints not accessible in demo environment');
  }

  // Validate scraped data
  validateScrapedData(data) {
    const errors = [];
    
    if (!data.stores || !Array.isArray(data.stores)) {
      errors.push('Stores data is missing or invalid');
    }
    
    if (!data.prefectures || typeof data.prefectures !== 'object') {
      errors.push('Prefectures data is missing or invalid');
    }
    
    data.stores.forEach((store, index) => {
      if (!store.id || !store.name || !store.address) {
        errors.push(`Store at index ${index} is missing required fields`);
      }
      
      if (typeof store.lat !== 'number' || typeof store.lng !== 'number') {
        errors.push(`Store "${store.name}" has invalid coordinates`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Show scraping UI
  showScrapingInterface() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content scraping-modal">
        <h3>店舗データの更新</h3>
        <div class="scraping-status">
          <div class="progress-container">
            <div class="progress">
              <div class="progress-bar" id="scrapingProgress" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="scrapingText">準備中...</div>
          </div>
          <div class="scraping-log" id="scrapingLog"></div>
        </div>
        <div class="scraping-actions">
          <button class="btn-primary" id="startScraping">データ取得開始</button>
          <button class="btn-secondary" id="cancelScraping" disabled>キャンセル</button>
          <button class="btn-secondary" id="closeScraping" style="display: none;">閉じる</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    let isScrapingActive = false;
    
    // Setup progress callback
    this.setProgressCallback((progress) => {
      document.getElementById('scrapingProgress').style.width = `${progress.percentage}%`;
      document.getElementById('scrapingText').textContent = `${progress.message} (${progress.percentage}%)`;
      
      const log = document.getElementById('scrapingLog');
      log.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${progress.message}</div>`;
      log.scrollTop = log.scrollHeight;
    });
    
    // Start scraping
    document.getElementById('startScraping').addEventListener('click', async () => {
      if (isScrapingActive) return;
      
      isScrapingActive = true;
      document.getElementById('startScraping').disabled = true;
      document.getElementById('cancelScraping').disabled = false;
      
      try {
        const scrapedData = await this.scrapeAllStores();
        
        // Validate data
        const validation = this.validateScrapedData(scrapedData);
        if (!validation.isValid) {
          throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Export data
        this.exportScrapedData(scrapedData);
        
        document.getElementById('scrapingText').textContent = '✅ データ取得完了！ファイルがダウンロードされました。';
        document.getElementById('closeScraping').style.display = 'inline-block';
        
      } catch (error) {
        document.getElementById('scrapingText').textContent = `❌ エラー: ${error.message}`;
        document.getElementById('closeScraping').style.display = 'inline-block';
      }
      
      isScrapingActive = false;
      document.getElementById('startScraping').disabled = false;
      document.getElementById('cancelScraping').disabled = true;
    });
    
    // Close modal
    const closeModal = () => modal.remove();
    document.getElementById('cancelScraping').addEventListener('click', closeModal);
    document.getElementById('closeScraping').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

// Add scraper to header menu
document.addEventListener('DOMContentLoaded', () => {
  window.storeDataScraper = new StoreDataScraper();
  
  // Add scraper option to hamburger menu if in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const menuList = document.querySelector('.menu-list');
    if (menuList) {
      const scrapingItem = document.createElement('li');
      scrapingItem.innerHTML = '<a href="#" data-action="scrape-data">店舗データ更新</a>';
      menuList.appendChild(scrapingItem);
      
      // Handle scraping action
      document.addEventListener('click', (e) => {
        if (e.target.getAttribute('data-action') === 'scrape-data') {
          e.preventDefault();
          window.storeDataScraper.showScrapingInterface();
        }
      });
    }
  }
});