// フォールバック機能のデモンストレーション

class CoordinateFallbackSystem {
  constructor() {
    // 都道府県の中心座標 (正確な位置)
    this.prefectureCenters = {
      'hokkaido': { lat: 43.2203, lng: 142.8635, name: '北海道' },
      'aomori': { lat: 40.5606, lng: 140.6401, name: '青森県' },
      'tokyo': { lat: 35.6762, lng: 139.6503, name: '東京都' },
      'osaka': { lat: 34.6937, lng: 135.5023, name: '大阪府' },
      'fukuoka': { lat: 33.5904, lng: 130.4017, name: '福岡県' },
      'okinawa': { lat: 26.2123, lng: 127.6792, name: '沖縄県' }
      // 全47都道府県分
    };

    // 都道府県の境界範囲 (座標妥当性検証用)
    this.prefectureBounds = {
      'tokyo': { 
        north: 35.9, south: 35.5, 
        east: 140.0, west: 139.0 
      },
      'osaka': { 
        north: 34.8, south: 34.3, 
        east: 135.8, west: 135.1 
      },
      'fukuoka': { 
        north: 33.8, south: 33.4, 
        east: 130.7, west: 130.2 
      }
      // 他の都道府県も追加
    };
  }

  // メイン処理: 段階的フォールバック
  async getValidCoordinates(store) {
    console.log(`🔍 店舗座標の検証開始: ${store.name}`);
    
    // === STEP 1: 元の座標の妥当性検証 ===
    if (this.validateCoordinates(store)) {
      console.log(`✅ 元の座標が有効: ${store.lat}, ${store.lng}`);
      return {
        lat: store.lat,
        lng: store.lng,
        source: 'original',
        accuracy: 'high'
      };
    }

    console.log(`❌ 元の座標が無効: ${store.lat}, ${store.lng}`);
    
    // === STEP 2: Geocoding API (オプション) ===
    try {
      if (window.google && window.google.maps) {
        console.log(`🌐 Geocoding APIで座標取得を試行...`);
        const geocodedCoords = await this.getGeocodedCoordinates(store);
        
        if (this.validateCoordinates({...store, ...geocodedCoords})) {
          console.log(`✅ Geocoding成功: ${geocodedCoords.lat}, ${geocodedCoords.lng}`);
          return {
            ...geocodedCoords,
            source: 'geocoded',
            accuracy: 'medium'
          };
        }
      }
    } catch (error) {
      console.log(`⚠️ Geocoding失敗: ${error.message}`);
    }

    // === STEP 3: 都道府県中心座標フォールバック ===
    const prefectureCenter = this.prefectureCenters[store.prefecture];
    if (prefectureCenter) {
      console.log(`📍 都道府県中心座標を使用: ${prefectureCenter.name}`);
      return {
        lat: prefectureCenter.lat,
        lng: prefectureCenter.lng,
        source: 'prefecture-center',
        accuracy: 'low',
        fallbackUsed: true
      };
    }

    // === STEP 4: 最終フォールバック (日本中心) ===
    console.log(`🗾 最終フォールバック: 日本中心座標を使用`);
    return {
      lat: 36.2048, // 日本の地理的中心
      lng: 138.2529,
      source: 'japan-center',
      accuracy: 'very-low',
      fallbackUsed: true,
      error: true
    };
  }

  // 座標の妥当性検証
  validateCoordinates(store) {
    const bounds = this.prefectureBounds[store.prefecture];
    if (!bounds) return false;

    // 基本的な数値チェック
    if (typeof store.lat !== 'number' || typeof store.lng !== 'number') {
      return false;
    }

    // 範囲チェック
    return (
      store.lat >= bounds.south && 
      store.lat <= bounds.north &&
      store.lng >= bounds.west && 
      store.lng <= bounds.east
    );
  }

  // Geocoding API (実際の住所から座標取得)
  async getGeocodedCoordinates(store) {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const query = `${store.name} ${store.address}`;
      
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          });
        } else {
          reject(new Error(`Geocoding失敗: ${status}`));
        }
      });
    });
  }

  // バッチ処理: 全店舗の座標を修正
  async processAllStores(stores) {
    const results = {
      processed: 0,
      fixed: 0,
      fallbackUsed: 0,
      errors: []
    };

    for (const store of stores) {
      try {
        const coords = await this.getValidCoordinates(store);
        
        // 元の座標を更新
        store.lat = coords.lat;
        store.lng = coords.lng;
        store.coordinateSource = coords.source;
        store.coordinateAccuracy = coords.accuracy;

        results.processed++;
        
        if (coords.fallbackUsed) {
          results.fallbackUsed++;
        }
        
        if (coords.source !== 'original') {
          results.fixed++;
        }
        
      } catch (error) {
        results.errors.push({
          store: store.name,
          error: error.message
        });
      }
    }

    return results;
  }
}

// === 使用例 ===

// 実際の問題データの例
const problemStores = [
  {
    id: "fukuoka_001",
    name: "スターバックス コーヒー 天神店",
    address: "福岡市中央区天神2-1-1",
    prefecture: "fukuoka",
    lat: 35.510219,  // ❌ 東京の座標！
    lng: 139.768694  // ❌ 東京の座標！
  },
  {
    id: "osaka_001", 
    name: "スターバックス コーヒー 梅田店",
    address: "大阪市北区梅田1-1-1",
    prefecture: "osaka",
    lat: 0,          // ❌ 無効な座標
    lng: 0           // ❌ 無効な座標
  }
];

// フォールバック処理の実行例
async function demonstrateFallback() {
  const fallbackSystem = new CoordinateFallbackSystem();
  
  console.log("=== フォールバック処理のデモンストレーション ===\n");
  
  for (const store of problemStores) {
    console.log(`\n--- ${store.name} の処理 ---`);
    console.log(`元の座標: ${store.lat}, ${store.lng}`);
    
    const result = await fallbackSystem.getValidCoordinates(store);
    
    console.log(`修正後座標: ${result.lat}, ${result.lng}`);
    console.log(`データソース: ${result.source}`);
    console.log(`精度: ${result.accuracy}`);
    
    if (result.fallbackUsed) {
      console.log(`🔄 フォールバック機能が使用されました`);
    }
  }
}

// 実行
// demonstrateFallback();