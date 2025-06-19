// Progress Calculation and Badge System Utility

class ProgressManager {
  constructor() {
    this.BADGE_THRESHOLDS = {
      BRONZE: 25,
      SILVER: 50, 
      GOLD: 75,
      COMPLETE: 100
    };
    
    this.VISIT_COUNT_BADGES = {
      STARTER: 50,
      EXPLORER: 100,
      ADVENTURER: 200,
      MASTER: 500
    };
    
    this.storeData = null;
    this.visitedStores = [];
  }

  // Initialize with store data
  async init(storeData) {
    this.storeData = storeData;
    this.visitedStores = window.storageManager.getVisitedStores();
    return this;
  }

  // Update visited stores from storage
  updateVisitedStores() {
    this.visitedStores = window.storageManager.getVisitedStores();
  }

  // Calculate overall progress
  getOverallProgress() {
    if (!this.storeData) return { visited: 0, total: 0, percentage: 0 };
    
    const totalStores = this.storeData.stores.length;
    const visitedCount = this.visitedStores.length;
    const percentage = totalStores > 0 ? Math.round((visitedCount / totalStores) * 100) : 0;
    
    return {
      visited: visitedCount,
      total: totalStores,
      percentage: percentage,
      badge: this.getBadgeByPercentage(percentage)
    };
  }

  // Calculate prefecture progress
  getPrefectureProgress(prefectureId) {
    if (!this.storeData) return { visited: 0, total: 0, percentage: 0 };
    
    const prefectureStores = this.storeData.stores.filter(store => 
      (store.location?.prefecture || store.prefecture) === prefectureId
    );
    const visitedInPrefecture = prefectureStores.filter(store => 
      this.visitedStores.includes(store.storeInfo?.id || store.id)
    );
    
    const total = prefectureStores.length;
    const visited = visitedInPrefecture.length;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    
    return {
      visited: visited,
      total: total,
      percentage: percentage,
      badge: this.getBadgeByPercentage(percentage)
    };
  }

  // Calculate area progress
  getAreaProgress(prefectureId, areaId) {
    if (!this.storeData) return { visited: 0, total: 0, percentage: 0 };
    
    const areaStores = this.storeData.stores.filter(store => 
      (store.location?.prefecture || store.prefecture) === prefectureId && 
      (store.location?.area || store.area) === areaId
    );
    const visitedInArea = areaStores.filter(store => 
      this.visitedStores.includes(store.storeInfo?.id || store.id)
    );
    
    const total = areaStores.length;
    const visited = visitedInArea.length;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    
    return {
      visited: visited,
      total: total,
      percentage: percentage,
      badge: this.getBadgeByPercentage(percentage)
    };
  }

  // Calculate favorite areas progress
  getFavoriteAreasProgress() {
    const favoriteAreas = window.storageManager.getFavoriteAreas();
    const results = [];
    
    favoriteAreas.forEach(areaKey => {
      // Parse area key (format: "prefecture_area")
      const [prefectureId, areaId] = areaKey.split('_');
      if (prefectureId && areaId) {
        const progress = this.getAreaProgress(prefectureId, areaId);
        const areaName = this.getAreaName(prefectureId, areaId);
        
        results.push({
          key: areaKey,
          prefecture: prefectureId,
          area: areaId,
          name: areaName,
          ...progress
        });
      }
    });
    
    return results;
  }

  // Calculate favorite prefectures progress
  getFavoritePrefecturesProgress() {
    console.log('📊 Getting favorite prefectures progress...');
    
    if (!window.storageManager) {
      console.error('❌ storageManager not available in getFavoritePrefecturesProgress');
      return [];
    }
    
    const favoritePrefectures = window.storageManager.getFavoritePrefectures();
    console.log('📋 Favorite prefectures for progress:', favoritePrefectures);
    
    if (!this.storeData) {
      console.error('❌ storeData not available in getFavoritePrefecturesProgress');
      return [];
    }
    
    const results = [];
    
    favoritePrefectures.forEach(prefectureId => {
      console.log(`📍 Processing prefecture: ${prefectureId}`);
      
      const progress = this.getPrefectureProgress(prefectureId);
      const prefectureName = this.getPrefectureName(prefectureId);
      
      console.log(`📊 Progress for ${prefectureId}:`, progress, 'Name:', prefectureName);
      
      results.push({
        key: prefectureId,
        prefecture: prefectureId,
        name: prefectureName,
        ...progress
      });
    });
    
    console.log('✅ Final favorite prefectures progress results:', results);
    return results;
  }

  // Calculate prefecture completion rate (how many prefectures have 100% completion)
  getPrefectureCompletionProgress() {
    if (!this.storeData) return { completed: 0, total: 0, percentage: 0 };
    
    const prefectures = Object.keys(this.storeData.prefectures);
    let completedPrefectures = 0;
    
    prefectures.forEach(prefectureId => {
      const progress = this.getPrefectureProgress(prefectureId);
      if (progress.percentage === 100) {
        completedPrefectures++;
      }
    });
    
    const total = prefectures.length;
    const percentage = total > 0 ? Math.round((completedPrefectures / total) * 100) : 0;
    
    return {
      completed: completedPrefectures,
      total: total,
      percentage: percentage,
      badge: this.getBadgeByPercentage(percentage)
    };
  }

  // Get regional progress
  getRegionalProgress() {
    if (!this.storeData) return [];
    
    const regions = this.storeData.regions;
    const results = [];
    
    Object.keys(regions).forEach(regionId => {
      const region = regions[regionId];
      let totalStores = 0;
      let visitedStores = 0;
      
      region.prefectures.forEach(prefectureId => {
        const prefectureProgress = this.getPrefectureProgress(prefectureId);
        totalStores += prefectureProgress.total;
        visitedStores += prefectureProgress.visited;
      });
      
      const percentage = totalStores > 0 ? Math.round((visitedStores / totalStores) * 100) : 0;
      
      results.push({
        id: regionId,
        name: region.name,
        visited: visitedStores,
        total: totalStores,
        percentage: percentage,
        badge: this.getBadgeByPercentage(percentage),
        prefectures: region.prefectures
      });
    });
    
    return results;
  }

  // Get badge by percentage
  getBadgeByPercentage(percentage) {
    if (percentage >= this.BADGE_THRESHOLDS.COMPLETE) {
      return { type: 'complete', icon: '⭐', name: '完全制覇', color: 'var(--primary-color)' };
    } else if (percentage >= this.BADGE_THRESHOLDS.GOLD) {
      return { type: 'gold', icon: '🥇', name: '金メダル', color: 'var(--badge-gold)' };
    } else if (percentage >= this.BADGE_THRESHOLDS.SILVER) {
      return { type: 'silver', icon: '🥈', name: '銀メダル', color: 'var(--badge-silver)' };
    } else if (percentage >= this.BADGE_THRESHOLDS.BRONZE) {
      return { type: 'bronze', icon: '🥉', name: '銅メダル', color: 'var(--badge-bronze)' };
    } else {
      return { type: 'none', icon: '', name: '', color: 'var(--text-muted)' };
    }
  }

  // Get visit count badge
  getVisitCountBadge() {
    const visitCount = this.visitedStores.length;
    
    if (visitCount >= this.VISIT_COUNT_BADGES.MASTER) {
      return { type: 'master', icon: '👑', name: 'マスター', count: this.VISIT_COUNT_BADGES.MASTER };
    } else if (visitCount >= this.VISIT_COUNT_BADGES.ADVENTURER) {
      return { type: 'adventurer', icon: '🗺️', name: 'アドベンチャー', count: this.VISIT_COUNT_BADGES.ADVENTURER };
    } else if (visitCount >= this.VISIT_COUNT_BADGES.EXPLORER) {
      return { type: 'explorer', icon: '🧭', name: 'エクスプローラー', count: this.VISIT_COUNT_BADGES.EXPLORER };
    } else if (visitCount >= this.VISIT_COUNT_BADGES.STARTER) {
      return { type: 'starter', icon: '🌟', name: 'スターター', count: this.VISIT_COUNT_BADGES.STARTER };
    } else {
      const nextBadge = this.VISIT_COUNT_BADGES.STARTER;
      const remaining = nextBadge - visitCount;
      return { 
        type: 'none', 
        icon: '', 
        name: `スターターまであと${remaining}店舗`, 
        count: 0,
        nextTarget: nextBadge,
        remaining: remaining
      };
    }
  }

  // Get area name by IDs
  getAreaName(prefectureId, areaId) {
    if (!this.storeData || !this.storeData.prefectures[prefectureId]) {
      return 'Unknown Area';
    }
    
    const prefecture = this.storeData.prefectures[prefectureId];
    const area = prefecture.areas[areaId];
    
    if (area) {
      return `${prefecture.name} ${area.name}`;
    }
    
    return 'Unknown Area';
  }

  // Get prefecture name by ID
  getPrefectureName(prefectureId) {
    if (!this.storeData || !this.storeData.prefectures[prefectureId]) {
      return 'Unknown Prefecture';
    }
    
    return this.storeData.prefectures[prefectureId].name;
  }

  // Get all achievements summary
  getAchievementsSummary() {
    return {
      overall: this.getOverallProgress(),
      prefectureCompletion: this.getPrefectureCompletionProgress(),
      visitCountBadge: this.getVisitCountBadge(),
      favoriteAreas: this.getFavoriteAreasProgress(),
      regional: this.getRegionalProgress()
    };
  }

  // Calculate progress for map visualization (prefecture level)
  getPrefectureMapData() {
    if (!this.storeData) return {};
    
    const mapData = {};
    
    Object.keys(this.storeData.prefectures).forEach(prefectureId => {
      const progress = this.getPrefectureProgress(prefectureId);
      mapData[prefectureId] = {
        name: this.getPrefectureName(prefectureId),
        percentage: progress.percentage,
        visited: progress.visited,
        total: progress.total,
        color: this.getMapColor(progress.percentage),
        badge: progress.badge
      };
    });
    
    return mapData;
  }

  // Get color for map visualization based on percentage
  getMapColor(percentage) {
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

  // Convert hex color to rgba with opacity
  hexToRgba(hex, opacity) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Generate progress report text for achievements card
  generateProgressReport() {
    const summary = this.getAchievementsSummary();
    
    let report = [];
    
    // Overall progress
    report.push(`全店舗: ${summary.overall.visited}/${summary.overall.total} (${summary.overall.percentage}%)`);
    
    // Prefecture completion
    report.push(`都道府県制覇: ${summary.prefectureCompletion.completed}/${summary.prefectureCompletion.total}県`);
    
    // Visit count badge
    const visitBadge = summary.visitCountBadge;
    if (visitBadge.type !== 'none') {
      report.push(`${visitBadge.icon} ${visitBadge.name}バッジ獲得`);
    } else {
      report.push(`${visitBadge.name}`);
    }
    
    // Favorite areas (top 3)
    if (summary.favoriteAreas.length > 0) {
      report.push('');
      report.push('マイエリア:');
      summary.favoriteAreas.slice(0, 3).forEach(area => {
        report.push(`${area.name}: ${area.visited}/${area.total} (${area.percentage}%)`);
      });
    }
    
    return report.join('\n');
  }
}

// Create global instance
window.progressManager = new ProgressManager();