// Google Maps Integration Component

class MapManager {
  constructor() {
    this.map = null;
    this.achievementMap = null;
    this.markers = [];
    this.markerCluster = null;
    this.infoWindow = null;
    this.storeData = null;
    this.isLoaded = false;
    this.pendingOperations = [];
    
    this.defaultCenter = { lat: 35.6762, lng: 139.6503 }; // Tokyo
    this.defaultZoom = 10;
    
    this.init();
  }

  async init() {
    // Wait for Google Maps API to load
    await this.waitForGoogleMaps();
    this.isLoaded = true;
    
    // Process any pending operations
    this.processPendingOperations();
  }

  async initialize() {
    await this.init();
    return this;
  }

  waitForGoogleMaps() {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            resolve();
          }
        }, 100);
      }
    });
  }

  async loadStoreData() {
    if (this.storeData) return this.storeData;

    try {
      const response = await fetch('./data/store_list.json');
      this.storeData = await response.json();
      return this.storeData;
    } catch (error) {
      console.error('Error loading store data:', error);
      return null;
    }
  }

  async initializeMainMap() {
    if (!this.isLoaded) {
      this.pendingOperations.push('initializeMainMap');
      return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: this.getMapStyles()
    });

    // Create info window without close button
    this.infoWindow = new google.maps.InfoWindow({
      disableAutoPan: false,
      headerDisabled: true // This removes the close button
    });

    // Load and display stores
    await this.loadAndDisplayStores();

    // Setup click handler for map
    this.map.addListener('click', () => {
      this.infoWindow.close();
    });
  }

  async initializeAchievementMap() {
    if (!this.isLoaded) {
      this.pendingOperations.push('initializeAchievementMap');
      return;
    }

    const mapElement = document.getElementById('achievementMap');
    if (!mapElement) return;

    this.achievementMap = new google.maps.Map(mapElement, {
      center: this.defaultCenter,
      zoom: 6, // Show more of Japan
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: this.getMapStyles()
    });

    // Load achievement map data
    await this.loadAchievementMapData();
  }

  async loadAchievementMapData() {
    if (!window.progressManager) {
      console.warn('Progress manager not available for achievement map');
      return;
    }

    // Get prefecture map data with progress
    const prefectureMapData = window.progressManager.getPrefectureMapData();
    
    // Load Japan prefecture boundaries (GeoJSON)
    await this.loadPrefectureBoundaries(prefectureMapData);
    
    // Add map legend
    this.addMapLegend();
  }

  async loadPrefectureBoundaries(prefectureMapData) {
    try {
      // In a real implementation, you would load actual GeoJSON data
      // For now, we'll create simplified prefecture overlays
      this.createPrefectureOverlays(prefectureMapData);
    } catch (error) {
      console.error('Error loading prefecture boundaries:', error);
      this.showSimplifiedPrefectureView(prefectureMapData);
    }
  }

  createPrefectureOverlays(prefectureMapData) {
    // Simplified prefecture representation using circles
    // In a real implementation, this would use actual prefecture boundary GeoJSON
    const prefectureCoordinates = this.getPrefectureCoordinates();

    Object.keys(prefectureMapData).forEach(prefectureId => {
      const data = prefectureMapData[prefectureId];
      const coordinates = prefectureCoordinates[prefectureId];
      
      if (!coordinates) return;

      // Create circle overlay for prefecture
      const circle = new google.maps.Circle({
        strokeColor: data.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: data.color,
        fillOpacity: 0.35,
        map: this.achievementMap,
        center: coordinates,
        radius: 50000, // 50km radius
        clickable: true
      });

      // Add click listener
      circle.addListener('click', () => {
        this.showPrefectureInfoWindow(coordinates, data);
      });

      // Store reference
      circle.prefectureData = data;
    });
  }

  getPrefectureCoordinates() {
    // Approximate center coordinates for each prefecture
    return {
      hokkaido: { lat: 43.064, lng: 141.347 },
      aomori: { lat: 40.824, lng: 140.740 },
      iwate: { lat: 39.704, lng: 141.153 },
      miyagi: { lat: 38.269, lng: 140.872 },
      akita: { lat: 39.719, lng: 140.102 },
      yamagata: { lat: 38.240, lng: 140.363 },
      fukushima: { lat: 37.750, lng: 140.468 },
      ibaraki: { lat: 36.342, lng: 140.447 },
      tochigi: { lat: 36.566, lng: 139.884 },
      gunma: { lat: 36.391, lng: 139.061 },
      saitama: { lat: 35.857, lng: 139.649 },
      chiba: { lat: 35.605, lng: 140.123 },
      tokyo: { lat: 35.676, lng: 139.650 },
      kanagawa: { lat: 35.448, lng: 139.643 },
      niigata: { lat: 37.902, lng: 139.023 },
      toyama: { lat: 36.696, lng: 137.212 },
      ishikawa: { lat: 36.595, lng: 136.626 },
      fukui: { lat: 35.944, lng: 136.188 },
      yamanashi: { lat: 35.664, lng: 138.568 },
      nagano: { lat: 36.651, lng: 138.181 },
      gifu: { lat: 35.391, lng: 136.722 },
      shizuoka: { lat: 34.977, lng: 138.383 },
      aichi: { lat: 35.180, lng: 136.907 },
      mie: { lat: 34.730, lng: 136.509 },
      shiga: { lat: 35.004, lng: 135.869 },
      kyoto: { lat: 35.021, lng: 135.756 },
      osaka: { lat: 34.686, lng: 135.520 },
      hyogo: { lat: 34.691, lng: 135.183 },
      nara: { lat: 34.685, lng: 135.833 },
      wakayama: { lat: 34.226, lng: 135.167 },
      tottori: { lat: 35.504, lng: 134.238 },
      shimane: { lat: 35.472, lng: 133.051 },
      okayama: { lat: 34.662, lng: 133.935 },
      hiroshima: { lat: 34.396, lng: 132.460 },
      yamaguchi: { lat: 34.186, lng: 131.471 },
      tokushima: { lat: 34.066, lng: 134.559 },
      kagawa: { lat: 34.340, lng: 134.043 },
      ehime: { lat: 33.842, lng: 132.766 },
      kochi: { lat: 33.560, lng: 133.531 },
      fukuoka: { lat: 33.607, lng: 130.418 },
      saga: { lat: 33.249, lng: 130.299 },
      nagasaki: { lat: 32.745, lng: 129.874 },
      kumamoto: { lat: 32.790, lng: 130.742 },
      oita: { lat: 33.238, lng: 131.613 },
      miyazaki: { lat: 31.911, lng: 131.424 },
      kagoshima: { lat: 31.560, lng: 130.558 },
      okinawa: { lat: 26.212, lng: 127.679 }
    };
  }

  showPrefectureInfoWindow(position, data) {
    const content = `
      <div class="prefecture-info-window" style="min-width: 200px; padding: 0.75rem;">
        <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">${data.name}</h4>
        <div class="prefecture-stats" style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span>達成率:</span>
            <span style="font-weight: 600; color: var(--primary-color);">${data.percentage}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span>訪問済み:</span>
            <span>${data.visited}店舗</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>総店舗数:</span>
            <span>${data.total}店舗</span>
          </div>
        </div>
        <div class="prefecture-badge" style="text-align: center;">
          <span style="background: ${data.badge.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
            ${data.badge.icon} ${data.badge.name}
          </span>
        </div>
      </div>
    `;

    if (!this.infoWindow) {
      this.infoWindow = new google.maps.InfoWindow();
    }

    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(this.achievementMap);
  }

  addMapLegend() {
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.style.cssText = `
      background: var(--surface-elevated);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      margin: 10px;
      box-shadow: 0 2px 8px var(--shadow-color);
      font-size: 0.875rem;
      min-width: 200px;
    `;

    legend.innerHTML = `
      <h4 style="margin-bottom: 0.75rem; color: var(--text-primary);">達成度</h4>
      <div class="legend-items">
        <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 20px; height: 20px; background: var(--primary-color); border-radius: 3px; margin-right: 0.5rem;"></div>
          <span>100% (完全制覇)</span>
        </div>
        <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 20px; height: 20px; background: rgba(0, 112, 74, 0.7); border-radius: 3px; margin-right: 0.5rem;"></div>
          <span>75-99%</span>
        </div>
        <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 20px; height: 20px; background: rgba(0, 112, 74, 0.4); border-radius: 3px; margin-right: 0.5rem;"></div>
          <span>25-74%</span>
        </div>
        <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 20px; height: 20px; background: rgba(0, 112, 74, 0.1); border-radius: 3px; margin-right: 0.5rem;"></div>
          <span>1-24%</span>
        </div>
        <div class="legend-item" style="display: flex; align-items: center;">
          <div style="width: 20px; height: 20px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 3px; margin-right: 0.5rem;"></div>
          <span>未訪問</span>
        </div>
      </div>
    `;

    this.achievementMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(legend);
  }

  showSimplifiedPrefectureView(prefectureMapData) {
    // Fallback: show prefecture data as markers if boundaries can't be loaded
    const prefectureCoordinates = this.getPrefectureCoordinates();

    Object.keys(prefectureMapData).forEach(prefectureId => {
      const data = prefectureMapData[prefectureId];
      const coordinates = prefectureCoordinates[prefectureId];
      
      if (!coordinates) return;

      const marker = new google.maps.Marker({
        position: coordinates,
        map: this.achievementMap,
        title: `${data.name} - ${data.percentage}%`,
        icon: {
          url: this.createPrefectureMarkerIcon(data.percentage),
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        }
      });

      marker.addListener('click', () => {
        this.showPrefectureInfoWindow(coordinates, data);
      });
    });
  }

  createPrefectureMarkerIcon(percentage) {
    const size = Math.max(20, Math.min(40, percentage / 2.5)); // Size based on percentage
    const color = this.getColorByPercentage(percentage);
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" 
              fill="white" font-size="${size/3}" font-weight="bold">${percentage}%</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  getColorByPercentage(percentage) {
    const baseColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color').trim() || '#00704A';
    
    if (percentage === 0) {
      return '#ffffff';
    } else if (percentage === 100) {
      return baseColor;
    } else {
      // Calculate opacity based on percentage
      const opacity = Math.max(0.1, percentage / 100);
      return this.hexToRgba(baseColor, opacity);
    }
  }

  hexToRgba(hex, opacity) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  async loadAndDisplayStores() {
    const storeData = await this.loadStoreData();
    if (!storeData || !this.map) return;

    // Clear existing markers
    this.clearMarkers();

    // Create markers for each store
    const visitedStores = window.storageManager.getVisitedStores();
    
    storeData.stores.forEach(store => {
      const isVisited = visitedStores.includes(store.storeInfo?.id || store.id);
      const marker = this.createStoreMarker(store, isVisited);
      if (marker) { // nullチェック
        this.markers.push(marker);
      }
    });

    // Initialize marker clustering
    this.initializeMarkerClustering();
  }

  createStoreMarker(store, isVisited) {
    // 新しいデータ構造に対応した座標取得
    if (!store.location?.coordinates?.lat || !store.location?.coordinates?.lng) {
      console.warn(`Store ${store.storeInfo?.name || store.name} has no valid coordinates`);
      return null;
    }
    
    const position = { 
      lat: store.location.coordinates.lat, 
      lng: store.location.coordinates.lng 
    };
    
    const marker = new google.maps.Marker({
      position: position,
      map: this.map,
      title: store.storeInfo?.name || store.name,
      icon: {
        url: this.getMarkerIcon(isVisited),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 24)
      }
    });

    // Add click listener to show info window
    marker.addListener('click', () => {
      this.showStoreInfoWindow(marker, store, isVisited);
    });

    marker.storeData = store;
    return marker;
  }

  getMarkerIcon(isVisited) {
    const color = isVisited ? '#00704A' : '#D4145A'; // Green for visited, Magenta for unvisited
    
    // Create SVG marker
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  showStoreInfoWindow(marker, store, isVisited) {
    const content = this.createInfoWindowContent(store, isVisited);
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
    
    // スマートな位置調整: ピンを画面の中央やや下に配置
    this.centerMarkerOptimally(marker);
    
    // Setup info window event listeners
    setTimeout(() => {
      this.setupInfoWindowEvents(store);
    }, 100);
  }

  centerMarkerOptimally(marker) {
    const markerPosition = marker.getPosition();
    const mapDiv = this.map.getDiv();
    
    if (!mapDiv) return;
    
    // 画面の高さの15%分のオフセットを計算
    const mapHeight = mapDiv.offsetHeight;
    const offsetY = mapHeight * 0.15;
    
    // マーカーの位置から、オフセット分だけ上（北）にずらした位置を計算
    const projection = this.map.getProjection();
    if (!projection) {
      // プロジェクションが使用できない場合は、近似計算
      const latOffset = offsetY / (mapHeight / (this.map.getBounds().getNorthEast().lat() - this.map.getBounds().getSouthWest().lat()));
      const targetPosition = new google.maps.LatLng(
        markerPosition.lat() + latOffset,
        markerPosition.lng()
      );
      this.map.panTo(targetPosition);
    } else {
      // Google Maps APIのプロジェクションを使用してピクセル座標で正確に計算
      const mapCenter = this.map.getCenter();
      const zoom = this.map.getZoom();
      const scale = Math.pow(2, zoom);
      
      // メルカトル投影法での座標変換
      const worldCoordinate = this.latLngToWorldCoordinate(markerPosition);
      const pixelCoordinate = {
        x: worldCoordinate.x * scale,
        y: worldCoordinate.y * scale
      };
      
      // Y座標をオフセット分移動
      const newPixelCoordinate = {
        x: pixelCoordinate.x,
        y: pixelCoordinate.y - offsetY
      };
      
      // ワールド座標に戻す
      const newWorldCoordinate = {
        x: newPixelCoordinate.x / scale,
        y: newPixelCoordinate.y / scale
      };
      
      // 緯度経度に変換
      const targetPosition = this.worldCoordinateToLatLng(newWorldCoordinate);
      
      // 直線的に移動
      this.map.panTo(targetPosition);
    }
  }
  
  // メルカトル投影での座標変換関数
  latLngToWorldCoordinate(latLng) {
    const siny = Math.sin(latLng.lat() * Math.PI / 180);
    const x = (latLng.lng() / 360 + 0.5) * 256;
    const y = (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * 256;
    return { x: x, y: y };
  }
  
  worldCoordinateToLatLng(worldCoordinate) {
    const x = worldCoordinate.x / 256 - 0.5;
    const y = 0.5 - worldCoordinate.y / 256;
    const lat = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;
    const lng = 360 * x;
    return new google.maps.LatLng(lat, lng);
  }

  createInfoWindowContent(store, isVisited) {
    const buttonText = isVisited ? '訪問済み' : '未訪問';
    const buttonClass = isVisited ? 'btn-accent' : 'btn-primary';
    
    // 新しいデータ構造に対応
    const storeName = store.storeInfo?.name || store.name;
    const storeAddress = store.location?.address || store.address;
    const storeId = store.storeInfo?.id || store.id;
    
    return `
      <div class="info-window" style="min-width: 200px; max-width: 280px; padding: 0.75rem;">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: 600; line-height: 1.3;">${storeName}</h4>
        <p style="margin: 0 0 0.75rem 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.2;">
          ${storeAddress}
        </p>
        <div style="display: flex; justify-content: center;">
          <button class="${buttonClass}" id="toggleVisit_${storeId}" 
                  style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border: none; border-radius: 4px; cursor: pointer; 
                  background: ${isVisited ? 'var(--primary-color)' : '#D4145A'}; color: white; 
                  transition: background-color 0.2s ease;">
            ${buttonText}
          </button>
        </div>
      </div>
    `;
  }

  updateInfoWindowContent(store, isVisited) {
    // Update only the content without closing the info window
    const content = this.createInfoWindowContent(store, isVisited);
    this.infoWindow.setContent(content);
    
    // Re-setup event listeners for the updated content
    setTimeout(() => {
      this.setupInfoWindowEvents(store);
    }, 50);
  }

  setupInfoWindowEvents(store) {
    const storeId = store.storeInfo?.id || store.id;
    const toggleBtn = document.getElementById(`toggleVisit_${storeId}`);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleStoreVisited(store);
      });
    }
  }

  toggleStoreVisited(store) {
    const storeId = store.storeInfo?.id || store.id;
    const storeName = store.storeInfo?.name || store.name;
    const success = window.storageManager.toggleStoreVisited(storeId);
    
    if (success) {
      // Update marker icon
      const marker = this.markers.find(m => {
        const markerStoreId = m.storeData?.storeInfo?.id || m.storeData?.id;
        return markerStoreId === storeId;
      });
      if (marker) {
        const isVisited = window.storageManager.isStoreVisited(storeId);
        marker.setIcon({
          url: this.getMarkerIcon(isVisited),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 24)
        });
        
        // Update info window content without closing
        this.updateInfoWindowContent(store, isVisited);
      }
      
      // Update progress manager
      if (window.progressManager) {
        window.progressManager.updateVisitedStores();
      }
      
      // Update marker clustering to reflect color changes
      this.initializeMarkerClustering();
      
      // Trigger data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { source: 'map-toggle', storeId: storeId }
      }));
      
      // Show toast
      const message = window.storageManager.isStoreVisited(storeId) 
        ? `${storeName} を訪問済みにマークしました`
        : `${storeName} を未訪問にマークしました`;
      
      this.showToast(message);
    }
  }

  initializeMarkerClustering() {
    if (typeof window.markerClusterer === 'undefined') {
      // Fallback if MarkerClusterer is not available
      console.warn('MarkerClusterer not available, using fallback');
      return;
    }

    // Clear existing cluster
    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
    }

    // Create custom renderer for dynamic cluster colors
    const renderer = {
      render: (cluster, stats) => {
        // Get actual markers in this cluster from MarkerClusterer
        const clusterMarkers = cluster.markers || [];
        const clusterColor = this.determineClusterColor(clusterMarkers);
        const count = clusterMarkers.length;
        
        // Create custom cluster marker
        return new google.maps.Marker({
          position: cluster.position,
          icon: {
            url: this.createDynamicClusterIcon(clusterColor, count),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25)
          },
          title: `${count}件の店舗`,
          zIndex: 1000
        });
      }
    };

    // Create new cluster with custom renderer
    this.markerCluster = new window.markerClusterer.MarkerClusterer({
      map: this.map,
      markers: this.markers,
      renderer: renderer,
      algorithm: new window.markerClusterer.GridAlgorithm({ maxZoom: 15, gridSize: 60 })
    });
  }

  // 削除：getMarkersInCluster - MarkerClustererから直接取得するため不要
  // 削除：calculateDistance - 上記関数で使用していたため不要

  // クラスターの色を決定する関数
  determineClusterColor(clusterMarkers) {
    if (!clusterMarkers || clusterMarkers.length === 0) {
      return '#00704A'; // デフォルト：緑
    }

    let visitedCount = 0;
    let unvisitedCount = 0;

    clusterMarkers.forEach(marker => {
      if (marker.storeData) {
        const isVisited = window.storageManager.isStoreVisited(
          marker.storeData.storeInfo?.id || marker.storeData.id
        );
        if (isVisited) {
          visitedCount++;
        } else {
          unvisitedCount++;
        }
      }
    });

    // 色の決定ロジック
    if (visitedCount === 0) {
      return '#D4145A'; // 全て未訪問：マゼンタ
    } else if (unvisitedCount === 0) {
      return '#00704A'; // 全て訪問済み：緑
    } else {
      return '#D4145A'; // 混成：マゼンタ（未訪問店舗があることを強調）
    }
  }

  // 動的クラスターアイコンを作成
  createDynamicClusterIcon(color, count) {
    const size = Math.max(40, Math.min(60, 30 + count * 2)); // カウントに応じてサイズ調整
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" 
                fill="${color}" stroke="white" stroke-width="3" opacity="0.8"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-8}" 
                fill="none" stroke="white" stroke-width="1" opacity="0.6"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" 
              fill="white" font-size="${Math.max(10, size/4)}" font-weight="bold">${count}</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  getClusterStyles() {
    const baseColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color').trim() || '#00704A';
    
    return [
      {
        textColor: 'white',
        url: this.createClusterIcon(baseColor, 53),
        height: 53,
        width: 53
      },
      {
        textColor: 'white',
        url: this.createClusterIcon(baseColor, 56),
        height: 56,
        width: 56
      },
      {
        textColor: 'white',
        url: this.createClusterIcon(baseColor, 66),
        height: 66,
        width: 66
      }
    ];
  }

  createClusterIcon(color, size) {
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  async loadAchievementMapData() {
    if (!window.progressManager || !this.achievementMap) return;

    await window.progressManager.init(await this.loadStoreData());
    const mapData = window.progressManager.getPrefectureMapData();
    
    // Load Japan prefecture boundaries (simplified)
    this.loadPrefectureBoundaries(mapData);
  }

  loadPrefectureBoundaries(mapData) {
    // This would typically load actual prefecture boundary data
    // For now, we'll show prefecture markers with achievement info
    
    const prefectureLocations = {
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'kanagawa': { lat: 35.4478, lng: 139.6425 },
      'osaka': { lat: 34.6937, lng: 135.5023 }
    };

    Object.keys(prefectureLocations).forEach(prefId => {
      if (mapData[prefId]) {
        this.createAchievementMarker(prefectureLocations[prefId], mapData[prefId]);
      }
    });
  }

  createAchievementMarker(position, data) {
    const marker = new google.maps.Marker({
      position: position,
      map: this.achievementMap,
      title: `${data.name}: ${data.percentage}%`,
      icon: {
        url: this.createAchievementIcon(data.percentage),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      }
    });

    marker.addListener('click', () => {
      this.showAchievementInfoWindow(marker, data);
    });
  }

  createAchievementIcon(percentage) {
    const color = this.getAchievementColor(percentage);
    
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">
          ${percentage}%
        </text>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  getAchievementColor(percentage) {
    if (percentage === 100) return '#FFD700'; // Gold
    if (percentage >= 75) return '#C0C0C0'; // Silver
    if (percentage >= 50) return '#CD7F32'; // Bronze
    if (percentage >= 25) return '#00704A'; // Green
    return '#6c757d'; // Gray
  }

  showAchievementInfoWindow(marker, data) {
    const content = `
      <div style="min-width: 200px; padding: 0.5rem;">
        <h4 style="margin-bottom: 0.5rem;">${data.name}</h4>
        <p style="margin-bottom: 0.25rem;">訪問済み: ${data.visited}/${data.total} 店舗</p>
        <p style="margin-bottom: 0.5rem;">達成率: ${data.percentage}%</p>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${data.badge.icon} <span>${data.badge.name}</span>
        </div>
      </div>
    `;
    
    if (!this.infoWindow) {
      this.infoWindow = new google.maps.InfoWindow();
    }
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.achievementMap, marker);
  }

  // Navigate to specific store on map
  showStoreOnMap(storeId) {
    const store = this.storeData?.stores.find(s => {
      const id = s.storeInfo?.id || s.id;
      return id === storeId;
    });
    if (!store || !this.map) return false;

    const marker = this.markers.find(m => {
      const markerStoreId = m.storeData?.storeInfo?.id || m.storeData?.id;
      return markerStoreId === storeId;
    });
    if (!marker) return false;

    // Pan to store location
    this.map.panTo(marker.getPosition());
    this.map.setZoom(16);

    // Show info window
    const isVisited = window.storageManager.isStoreVisited(storeId);
    this.showStoreInfoWindow(marker, store, isVisited);

    return true;
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];

    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
    }
  }

  refreshMarkers() {
    this.loadAndDisplayStores();
  }

  getMapStyles() {
    // Minimal style for clean, simplified map appearance
    const minimalStyle = [
      // Hide POI labels and icons for cleaner look
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      },
      // Simplify road styling
      {
        featureType: 'road',
        elementType: 'labels',
        stylers: [
          { visibility: 'simplified' },
          { saturation: -100 }
        ]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#e8e8e8' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#fafafa' }]
      },
      // Simplify landscape
      {
        featureType: 'landscape',
        stylers: [
          { saturation: -100 },
          { lightness: 65 }
        ]
      },
      // Clean water styling
      {
        featureType: 'water',
        stylers: [
          { color: '#c9dff0' },
          { saturation: -25 }
        ]
      },
      // Minimize transit visibility
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      },
      // Clean administrative boundaries
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [
          { color: '#c9b2a6' },
          { weight: 0.8 }
        ]
      }
    ];

    const theme = window.storageManager.getTheme();
    
    if (theme === 'dark') {
      // Dark minimal style
      return [
        { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#2c2c2c' }]
        },
        {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'simplified' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0a0a0a' }]
        },
        {
          featureType: 'landscape',
          stylers: [{ color: '#111111' }]
        }
      ];
    }
    
    return minimalStyle;
  }

  processPendingOperations() {
    this.pendingOperations.forEach(operation => {
      if (typeof this[operation] === 'function') {
        this[operation]();
      }
    });
    this.pendingOperations = [];
  }

  showToast(message) {
    if (window.qrManager) {
      window.qrManager.showSuccess(message);
    }
  }

  // Public API methods
  async initialize() {
    await this.init();
    await this.initializeMainMap();
  }

  async initializeAchievements() {
    await this.init();
    await this.initializeAchievementMap();
  }

  refresh() {
    this.refreshMarkers();
  }

  resize() {
    if (this.map) {
      google.maps.event.trigger(this.map, 'resize');
    }
    if (this.achievementMap) {
      google.maps.event.trigger(this.achievementMap, 'resize');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mapManager = new MapManager();
});