// Achievements Page Component

class AchievementsPage {
  constructor() {
    this.achievementsNav = null;
    this.progressTab = null;
    this.mapTab = null;
    this.currentTab = 'progress';
    this.isInitialized = false;
  }

  async init() {
    this.setupElements();
    this.setupEventListeners();
    this.isInitialized = true;
    
    // Show initial tab
    this.showProgressTab();
    
    console.log('🏆 Achievements page initialized');
  }

  setupElements() {
    this.achievementsNav = document.querySelector('.achievements-nav');
    this.progressTab = document.getElementById('progress-tab');
    this.mapTab = document.getElementById('map-tab');
  }

  setupEventListeners() {
    // Tab navigation
    if (this.achievementsNav) {
      this.achievementsNav.addEventListener('click', (e) => {
        const tab = e.target.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    }

    // Listen for data updates
    window.addEventListener('dataUpdated', () => {
      this.refresh();
    });

    // Listen for section changes
    window.addEventListener('sectionChange', (e) => {
      if (e.detail.to === 'achievements') {
        this.onSectionActivated();
      }
    });

    // Listen for resize events to switch SVG maps
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 300);
    });
  }

  async refresh() {
    if (!this.isInitialized) return;
    
    if (this.currentTab === 'progress') {
      this.refreshProgressTab();
    } else if (this.currentTab === 'map') {
      this.refreshMapTab();
    }
  }

  onSectionActivated() {
    // Refresh current tab when section becomes active
    this.refresh();
  }

  switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    // Update tab buttons
    this.achievementsNav.querySelectorAll('.achievement-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.achievement-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    this.currentTab = tabName;
    
    // Load tab content
    if (tabName === 'progress') {
      this.showProgressTab();
    } else if (tabName === 'map') {
      this.showMapTab();
    }
  }

  showProgressTab() {
    this.currentTab = 'progress';
    this.refreshProgressTab();
  }

  refreshProgressTab() {
    if (!this.progressTab || !window.progressManager) {
      this.showProgressLoading();
      return;
    }

    const summary = window.progressManager.getAchievementsSummary();
    
    let html = '<div class="achievement-grid-modern">';
    
    // 全店制覇 (formerly 訪問数バッジ)
    const visitBadge = summary.visitCountBadge;
    const totalStores = summary.overall.total; // 総店舗数を使用
    const visitedStores = window.storageManager.getVisitedStores().length;
    const visitProgress = {
      visited: visitedStores,
      total: totalStores, // 総店舗数に変更
      percentage: Math.round((visitedStores / totalStores) * 100),
      badge: visitBadge
    };
    
    html += this.createModernAchievementCard(
      '全店制覇',
      visitProgress,
      'left'
    );
    
    // 全国制覇 (formerly 都道府県制覇)
    const completedPrefectures = summary.prefectureCompletion.completed || 0;
    const prefectureProgress = {
      visited: completedPrefectures,
      total: 47, // 固定値：日本の都道府県数
      percentage: Math.round((completedPrefectures / 47) * 100),
      badge: summary.prefectureCompletion.badge || { icon: '', name: '', color: 'var(--text-muted)' }
    };
    
    html += this.createModernAchievementCard(
      '全国制覇',
      prefectureProgress,
      'right'
    );
    
    html += '</div>';
    
    // Regional Progress
    if (summary.regional.length > 0) {
      html += '<div class="regional-progress" style="margin-top: 2rem;">';
      html += '<h3 style="margin-bottom: 1rem;">地方別達成状況</h3>';
      html += '<div class="regional-grid">';
      
      summary.regional.forEach(region => {
        html += `
          <div class="regional-item">
            <div class="regional-header">
              <h4>${region.name}</h4>
              <span class="regional-badge">${region.badge.icon} ${region.badge.name}</span>
            </div>
            <div class="regional-stats">
              <div class="progress">
                <div class="progress-bar" style="width: ${region.percentage}%"></div>
              </div>
              <span class="regional-percentage">${region.percentage}% (${region.visited}/${region.total})</span>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    }
    
    // Favorite Areas Progress
    if (summary.favoriteAreas.length > 0) {
      html += '<div class="favorite-areas-progress" style="margin-top: 2rem;">';
      html += '<h3 style="margin-bottom: 1rem;">マイエリア達成状況</h3>';
      html += '<div class="favorite-areas-grid">';
      
      summary.favoriteAreas.forEach(area => {
        html += `
          <div class="favorite-area-item">
            <div class="favorite-area-header">
              <h4>${area.name}</h4>
              <span class="favorite-area-badge">${area.badge.icon} ${area.badge.name}</span>
            </div>
            <div class="favorite-area-stats">
              <div class="progress">
                <div class="progress-bar" style="width: ${area.percentage}%"></div>
              </div>
              <span class="favorite-area-percentage">${area.percentage}% (${area.visited}/${area.total})</span>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    }
    
    // Achievement Actions
    html += '<div class="achievement-actions" style="margin-top: 2rem; text-align: center;">';
    html += '<button class="btn-primary" id="generateCard">実績カードを生成</button>';
    html += '</div>';
    
    this.progressTab.innerHTML = html;
    
    // Setup event handlers
    const generateCardBtn = document.getElementById('generateCard');
    if (generateCardBtn) {
      generateCardBtn.addEventListener('click', () => {
        this.generateAchievementCard();
      });
    }
  }

  createModernAchievementCard(title, progress, position) {
    const badge = progress.badge || { icon: '', name: '', color: 'var(--text-muted)' };
    const unit = title.includes('全国制覇') ? '都道府県' : '店舗';
    
    // バッジ進行状況の計算
    let nextBadgeInfo = this.getNextBadgeInfo(title, progress);
    
    return `
      <div class="achievement-card-modern ${position}">
        <div class="achievement-card-badge-overlay">
          ${badge.icon}
        </div>
        <div class="achievement-card-header">
          <h3 class="achievement-card-title">${title}</h3>
        </div>
        <div class="achievement-card-stats">
          <div class="achievement-stat-main">
            <span class="stat-number">${progress.visited}</span>
            <span class="stat-separator">/</span>
            <span class="stat-total">${progress.total}</span>
            <span class="achievement-stat-unit">${unit}</span>
          </div>
        </div>
        <div class="achievement-card-next-badge">
          <div class="next-badge-text">次のバッジまで${nextBadgeInfo.remaining}${title.includes('全国制覇') ? '県' : '店舗'}</div>
          <div class="next-badge-progress">
            <div class="next-badge-bar" style="width: ${nextBadgeInfo.progressToNext}%"></div>
          </div>
        </div>
        <div class="achievement-card-progress">
          <div class="progress-circle" style="--progress: ${progress.percentage}%">
            <span class="progress-percentage">${progress.percentage}%</span>
          </div>
        </div>
      </div>
    `;
  }

  getNextBadgeInfo(title, progress) {
    if (title.includes('全店制覇')) {
      // 全店制覇の場合：訪問数ベースのバッジ
      const visitCount = progress.visited;
      const visitBadgeThresholds = [50, 100, 200, 500];
      
      for (let threshold of visitBadgeThresholds) {
        if (visitCount < threshold) {
          const remaining = threshold - visitCount;
          const progressToNext = Math.round((visitCount / threshold) * 100);
          return { remaining, progressToNext };
        }
      }
      
      // 最高バッジに到達済み
      return { remaining: 0, progressToNext: 100 };
      
    } else if (title.includes('全国制覇')) {
      // 全国制覇の場合：都道府県完全制覇数ベースのバッジ
      const completedPrefectures = progress.visited;
      const prefectureBadgeThresholds = [5, 15, 30, 47]; // 5県、15県、30県、47県完全制覇
      
      for (let threshold of prefectureBadgeThresholds) {
        if (completedPrefectures < threshold) {
          const remaining = threshold - completedPrefectures;
          const progressToNext = Math.round((completedPrefectures / threshold) * 100);
          return { remaining, progressToNext };
        }
      }
      
      // 最高バッジに到達済み
      return { remaining: 0, progressToNext: 100 };
    }
    
    return { remaining: 0, progressToNext: 100 };
  }

  showMapTab() {
    this.currentTab = 'map';
    this.refreshMapTab();
  }

  refreshMapTab() {
    if (!this.mapTab) return;
    
    // Initialize SVG achievement map
    this.initializeSVGAchievementMap();
  }

  // リサイズ時のSVG切り替え
  handleResize() {
    if (this.currentTab === 'map') {
      // モバイルとデスクトップ間で切り替わった場合のみ再描画
      const mapContainer = document.getElementById('achievementMap');
      if (mapContainer && mapContainer.innerHTML) {
        this.initializeSVGAchievementMap();
      }
    }
  }

  initializeSVGAchievementMap() {
    if (!window.progressManager) {
      console.warn('Progress manager not available for achievement map');
      return;
    }

    // Get prefecture progress data
    const prefectureData = this.getPrefectureProgressData();
    
    // Create SVG map
    this.renderSVGJapanMap(prefectureData);
  }

  getPrefectureProgressData() {
    const data = {};
    const prefectures = this.getJapanPrefectures();
    
    Object.keys(prefectures).forEach(prefId => {
      const progress = window.progressManager.getPrefectureProgress(prefId);
      data[prefId] = {
        name: prefectures[prefId].name,
        percentage: progress.percentage || 0,
        visited: progress.visited || 0,
        total: progress.total || 0
      };
    });
    
    return data;
  }

  getJapanPrefectures() {
    // 実際の位置関係を反映した都道府県リスト（簡略化された長方形・多角形）
    return {
      // 北海道・東北
      hokkaido: { name: '北海道', path: 'M240,20 L300,20 L300,70 L240,70 Z' },
      aomori: { name: '青森県', path: 'M265,90 L285,90 L285,110 L265,110 Z' },
      iwate: { name: '岩手県', path: 'M285,90 L305,90 L305,130 L285,130 Z' },
      miyagi: { name: '宮城県', path: 'M285,130 L305,130 L305,150 L285,150 Z' },
      akita: { name: '秋田県', path: 'M245,100 L265,100 L265,140 L245,140 Z' },
      yamagata: { name: '山形県', path: 'M245,140 L265,140 L265,170 L245,170 Z' },
      fukushima: { name: '福島県', path: 'M265,150 L305,150 L305,190 L265,190 Z' },
      
      // 関東
      ibaraki: { name: '茨城県', path: 'M305,170 L325,170 L325,210 L305,210 Z' },
      tochigi: { name: '栃木県', path: 'M285,190 L305,190 L305,220 L285,220 Z' },
      gunma: { name: '群馬県', path: 'M265,190 L285,190 L285,220 L265,220 Z' },
      saitama: { name: '埼玉県', path: 'M285,220 L305,220 L305,240 L285,240 Z' },
      chiba: { name: '千葉県', path: 'M305,210 L335,210 L335,250 L305,250 Z' },
      tokyo: { name: '東京都', path: 'M275,240 L295,240 L295,260 L275,260 Z' },
      kanagawa: { name: '神奈川県', path: 'M275,260 L305,260 L305,280 L275,280 Z' },
      
      // 中部
      niigata: { name: '新潟県', path: 'M215,150 L245,150 L245,200 L215,200 Z' },
      toyama: { name: '富山県', path: 'M195,200 L215,200 L215,220 L195,220 Z' },
      ishikawa: { name: '石川県', path: 'M175,190 L195,190 L195,230 L175,230 Z' },
      fukui: { name: '福井県', path: 'M175,230 L195,230 L195,250 L175,250 Z' },
      yamanashi: { name: '山梨県', path: 'M245,220 L265,220 L265,250 L245,250 Z' },
      nagano: { name: '長野県', path: 'M215,200 L245,200 L245,250 L215,250 Z' },
      gifu: { name: '岐阜県', path: 'M195,250 L225,250 L225,280 L195,280 Z' },
      shizuoka: { name: '静岡県', path: 'M225,250 L275,250 L275,290 L225,290 Z' },
      aichi: { name: '愛知県', path: 'M195,280 L235,280 L235,310 L195,310 Z' },
      
      // 近畿
      mie: { name: '三重県', path: 'M235,290 L255,290 L255,330 L235,330 Z' },
      shiga: { name: '滋賀県', path: 'M175,250 L195,250 L195,280 L175,280 Z' },
      kyoto: { name: '京都府', path: 'M155,260 L185,260 L185,290 L155,290 Z' },
      osaka: { name: '大阪府', path: 'M155,290 L175,290 L175,310 L155,310 Z' },
      hyogo: { name: '兵庫県', path: 'M125,270 L155,270 L155,310 L125,310 Z' },
      nara: { name: '奈良県', path: 'M175,290 L195,290 L195,320 L175,320 Z' },
      wakayama: { name: '和歌山県', path: 'M155,310 L185,310 L185,340 L155,340 Z' },
      
      // 中国
      tottori: { name: '鳥取県', path: 'M105,280 L135,280 L135,300 L105,300 Z' },
      shimane: { name: '島根県', path: 'M75,290 L105,290 L105,320 L75,320 Z' },
      okayama: { name: '岡山県', path: 'M125,310 L155,310 L155,330 L125,330 Z' },
      hiroshima: { name: '広島県', path: 'M95,320 L125,320 L125,350 L95,350 Z' },
      yamaguchi: { name: '山口県', path: 'M65,340 L95,340 L95,360 L65,360 Z' },
      
      // 四国
      tokushima: { name: '徳島県', path: 'M155,340 L175,340 L175,360 L155,360 Z' },
      kagawa: { name: '香川県', path: 'M135,330 L155,330 L155,350 L135,350 Z' },
      ehime: { name: '愛媛県', path: 'M105,350 L135,350 L135,380 L105,380 Z' },
      kochi: { name: '高知県', path: 'M135,360 L175,360 L175,390 L135,390 Z' },
      
      // 九州
      fukuoka: { name: '福岡県', path: 'M35,360 L65,360 L65,380 L35,380 Z' },
      saga: { name: '佐賀県', path: 'M15,380 L35,380 L35,400 L15,400 Z' },
      nagasaki: { name: '長崎県', path: 'M15,400 L35,400 L35,430 L15,430 Z' },
      kumamoto: { name: '熊本県', path: 'M35,380 L55,380 L55,410 L35,410 Z' },
      oita: { name: '大分県', path: 'M55,360 L75,360 L75,390 L55,390 Z' },
      miyazaki: { name: '宮崎県', path: 'M55,390 L75,390 L75,430 L55,430 Z' },
      kagoshima: { name: '鹿児島県', path: 'M35,410 L55,410 L55,450 L35,450 Z' },
      
      // 沖縄（日本海側に配置）
      okinawa: { name: '沖縄県', path: 'M45,180 L75,180 L75,200 L45,200 Z' }
    };
  }

  async renderSVGJapanMap(prefectureData) {
    const mapContainer = document.getElementById('achievementMap');
    if (!mapContainer) return;

    try {
      // 外部SVGファイルを読み込み
      const svgContent = await this.loadExternalSVG();
      if (svgContent) {
        // 外部SVGを使用して地図を作成
        const processedSVG = this.applyProgressToExternalSVG(svgContent, prefectureData);
        mapContainer.innerHTML = processedSVG;
        this.setupSVGInteractions();
      } else {
        // フォールバック：既存の簡易SVGを使用
        console.warn('External SVG not available, using fallback');
        const svg = this.createSVGMap(prefectureData);
        mapContainer.innerHTML = svg;
      }
    } catch (error) {
      console.error('Error loading SVG map:', error);
      // エラー時のフォールバック
      const svg = this.createSVGMap(prefectureData);
      mapContainer.innerHTML = svg;
    }
  }

  async loadExternalSVG() {
    try {
      // 画面サイズに応じてSVGファイルを選択
      const svgFile = this.isMobileView() ? 'data/maps/map-mobile.svg' : 'data/maps/map-full.svg';
      const response = await fetch(svgFile);
      if (!response.ok) {
        // モバイル用がない場合はフル版をフォールバック
        if (svgFile.includes('mobile')) {
          console.warn('Mobile SVG not found, falling back to full version');
          const fallbackResponse = await fetch('data/maps/map-full.svg');
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
          }
          return await fallbackResponse.text();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Failed to load external SVG:', error);
      return null;
    }
  }

  isMobileView() {
    return window.innerWidth <= 767;
  }

  applyProgressToExternalSVG(svgContent, prefectureData) {
    // DOMParserを使用してSVGを解析
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG structure');
    }

    // はみ出し問題を解決するため、transformを除去してviewBoxを調整
    const svgMapGroup = svgDoc.querySelector('.svg-map');
    if (svgMapGroup) {
      svgMapGroup.removeAttribute('transform');
    }

    // レスポンシブ対応の設定
    svgElement.setAttribute('class', 'japan-achievement-map external-svg');
    svgElement.setAttribute('role', 'img');
    svgElement.setAttribute('aria-label', '日本地図 - 都道府県別訪問進捗');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // viewBoxを確実に設定（はみ出し防止）
    svgElement.setAttribute('viewBox', '0 0 1000 1000');
    
    // 既存のwidthとheight属性を除去
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');

    // 簡素化されたレスポンシブスタイルを追加
    const style = svgDoc.createElement('style');
    style.textContent = `
      .prefecture {
        stroke: #888888;
        stroke-width: 0.8;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .prefecture:hover {
        stroke: var(--primary-color, #00704A);
        stroke-width: 1.5;
        filter: brightness(1.05);
      }
      .license-text {
        font-size: 8px;
        fill: #999;
        opacity: 0.7;
      }
    `;
    
    const defs = svgDoc.querySelector('defs') || svgDoc.createElement('defs');
    if (!svgDoc.querySelector('defs')) {
      svgElement.insertBefore(defs, svgElement.firstChild);
    }
    defs.appendChild(style);

    // 各都道府県に進捗データを適用
    const prefectureElements = svgDoc.querySelectorAll('.prefecture');
    
    prefectureElements.forEach(element => {
      const dataCode = element.getAttribute('data-code');
      const prefectureId = this.getJISCodeToPrefectureId(dataCode);
      
      if (prefectureId && prefectureData[prefectureId]) {
        const data = prefectureData[prefectureId];
        const color = this.getProgressColor(data.percentage);
        
        // 色を適用
        element.setAttribute('fill', color);
        
        // データ属性を追加
        element.setAttribute('data-prefecture', prefectureId);
        element.setAttribute('data-percentage', data.percentage);
        element.setAttribute('data-visited', data.visited);
        element.setAttribute('data-total', data.total);
        
        // ツールチップ情報を更新
        const titleElement = element.querySelector('title');
        if (titleElement) {
          const prefectureName = titleElement.textContent.split(' / ')[0];
          titleElement.textContent = `${prefectureName}: ${data.percentage}% (${data.visited}/${data.total})`;
        }
      } else {
        // データがない場合はデフォルト色
        element.setAttribute('fill', '#f5f5f5');
      }
    });

    return svgElement.outerHTML;
  }

  // JISコード（1-47）を都道府県IDに変換
  getJISCodeToPrefectureId(code) {
    const codeMap = {
      '1': 'hokkaido', '2': 'aomori', '3': 'iwate', '4': 'miyagi', '5': 'akita',
      '6': 'yamagata', '7': 'fukushima', '8': 'ibaraki', '9': 'tochigi', '10': 'gunma',
      '11': 'saitama', '12': 'chiba', '13': 'tokyo', '14': 'kanagawa', '15': 'niigata',
      '16': 'toyama', '17': 'ishikawa', '18': 'fukui', '19': 'yamanashi', '20': 'nagano',
      '21': 'gifu', '22': 'shizuoka', '23': 'aichi', '24': 'mie', '25': 'shiga',
      '26': 'kyoto', '27': 'osaka', '28': 'hyogo', '29': 'nara', '30': 'wakayama',
      '31': 'tottori', '32': 'shimane', '33': 'okayama', '34': 'hiroshima', '35': 'yamaguchi',
      '36': 'tokushima', '37': 'kagawa', '38': 'ehime', '39': 'kochi', '40': 'fukuoka',
      '41': 'saga', '42': 'nagasaki', '43': 'kumamoto', '44': 'oita', '45': 'miyazaki',
      '46': 'kagoshima', '47': 'okinawa'
    };
    return codeMap[code] || null;
  }

  setupSVGInteractions() {
    const prefectureElements = document.querySelectorAll('.prefecture');
    
    prefectureElements.forEach(element => {
      // クリックイベント
      element.addEventListener('click', (e) => {
        const prefectureId = e.target.getAttribute('data-prefecture');
        const prefectureName = e.target.querySelector('title')?.textContent.split(':')[0];
        const percentage = e.target.getAttribute('data-percentage');
        const visited = e.target.getAttribute('data-visited');
        const total = e.target.getAttribute('data-total');
        
        if (prefectureId) {
          this.showPrefectureDetail(prefectureId, prefectureName, percentage, visited, total);
        }
      });

      // ホバーイベント（モバイル対応）
      element.addEventListener('mouseenter', (e) => {
        if (!window.matchMedia('(pointer: coarse)').matches) {
          this.showHoverTooltip(e);
        }
      });

      element.addEventListener('mouseleave', (e) => {
        this.hideHoverTooltip();
      });
    });
  }

  showPrefectureDetail(prefectureId, name, percentage, visited, total) {
    // 詳細情報モーダルを表示
    const modal = document.createElement('div');
    modal.className = 'prefecture-detail-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <h3>${name}</h3>
        <div class="progress-info">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <p>進捗率: ${percentage}% (${visited}/${total}店舗)</p>
        </div>
        <button onclick="this.closest('.prefecture-detail-modal').remove()">閉じる</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  showHoverTooltip(e) {
    // 既存のツールチップを削除
    this.hideHoverTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'svg-tooltip';
    tooltip.textContent = e.target.querySelector('title')?.textContent || '';
    
    document.body.appendChild(tooltip);
    
    // 位置調整
    const updatePosition = (event) => {
      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY - 30}px`;
    };
    
    updatePosition(e);
    e.target.addEventListener('mousemove', updatePosition);
    
    // クリーンアップ用にイベントリスナーを保存
    tooltip._updatePosition = updatePosition;
    tooltip._target = e.target;
  }

  hideHoverTooltip() {
    const tooltip = document.querySelector('.svg-tooltip');
    if (tooltip) {
      if (tooltip._target && tooltip._updatePosition) {
        tooltip._target.removeEventListener('mousemove', tooltip._updatePosition);
      }
      tooltip.remove();
    }
  }

  createSVGMap(prefectureData) {
    const prefectures = this.getJapanPrefectures();
    
    let svgContent = `
      <svg viewBox="0 0 350 470" class="japan-achievement-map fallback-map" preserveAspectRatio="xMidYMid meet">
        <defs>
          <style>
            .prefecture-path {
              stroke: #888888;
              stroke-width: 0.8;
              transition: all 0.2s ease;
              cursor: pointer;
            }
            .prefecture-path:hover {
              stroke: #00704A;
              stroke-width: 1.5;
              filter: brightness(1.05);
            }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="white"/>
    `;

    // 各都道府県のパスを描画
    Object.keys(prefectures).forEach(prefId => {
      const prefecture = prefectures[prefId];
      const data = prefectureData[prefId] || { percentage: 0 };
      const color = this.getProgressColor(data.percentage);
      
      svgContent += `
        <path 
          d="${prefecture.path}" 
          class="prefecture-path" 
          fill="${color}"
          data-prefecture="${prefId}"
          data-name="${prefecture.name}"
          data-percentage="${data.percentage}"
          data-visited="${data.visited}"
          data-total="${data.total}">
          <title>${prefecture.name}: ${data.percentage}% (${data.visited}/${data.total})</title>
        </path>
      `;
    });

    svgContent += '</svg>';
    return svgContent;
  }

  getProgressColor(percentage) {
    // 白から濃い緑へのグラデーション
    const minColor = [255, 255, 255]; // 白
    const maxColor = [0, 112, 74];    // 濃い緑 (--primary-color)
    
    const ratio = percentage / 100;
    const r = Math.round(minColor[0] + (maxColor[0] - minColor[0]) * ratio);
    const g = Math.round(minColor[1] + (maxColor[1] - minColor[1]) * ratio);
    const b = Math.round(minColor[2] + (maxColor[2] - minColor[2]) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  generateAchievementCard() {
    if (!window.progressManager) {
      this.showToast('データが読み込まれていません', 'error');
      return;
    }

    const summary = window.progressManager.getAchievementsSummary();
    const favoritePrefectures = window.storageManager.getFavoritePrefectures();
    
    // Get my area progress data
    const myAreaProgress = this.getMyAreaProgressData(favoritePrefectures);
    
    // Create achievement card content
    const cardData = {
      title: 'Cafe★Log',
      date: new Date().toLocaleDateString('ja-JP'),
      // 全店制覇データ
      allStores: {
        visited: window.storageManager.getVisitedStores().length,
        total: summary.overall.total,
        percentage: summary.overall.percentage,
        badge: summary.visitCountBadge
      },
      // 全国制覇データ
      allPrefectures: {
        completed: summary.prefectureCompletion.completed,
        total: 47,
        percentage: Math.round((summary.prefectureCompletion.completed / 47) * 100),
        badge: summary.prefectureCompletion.badge
      },
      // マイエリア進捗データ
      myAreas: myAreaProgress
    };
    
    this.showAchievementCardModal(cardData);
  }

  getMyAreaProgressData(favoritePrefectures) {
    if (!favoritePrefectures || favoritePrefectures.length === 0) {
      return [];
    }

    const myAreas = [];
    
    favoritePrefectures.forEach(prefectureId => {
      const progress = window.progressManager.getPrefectureProgress(prefectureId);
      
      if (progress) {
        const areaData = {
          name: this.getPrefectureName(prefectureId),
          visited: progress.visited || 0,
          total: progress.total || 0,
          percentage: progress.percentage || 0
        };
        myAreas.push(areaData);
      }
    });

    return myAreas;
  }

  getPrefectureName(prefectureId) {
    const prefectureNames = {
      'hokkaido': '北海道',
      'aomori': '青森県',
      'iwate': '岩手県',
      'miyagi': '宮城県',
      'akita': '秋田県',
      'yamagata': '山形県',
      'fukushima': '福島県',
      'ibaraki': '茨城県',
      'tochigi': '栃木県',
      'gunma': '群馬県',
      'saitama': '埼玉県',
      'chiba': '千葉県',
      'tokyo': '東京都',
      'kanagawa': '神奈川県',
      'niigata': '新潟県',
      'toyama': '富山県',
      'ishikawa': '石川県',
      'fukui': '福井県',
      'yamanashi': '山梨県',
      'nagano': '長野県',
      'gifu': '岐阜県',
      'shizuoka': '静岡県',
      'aichi': '愛知県',
      'mie': '三重県',
      'shiga': '滋賀県',
      'kyoto': '京都府',
      'osaka': '大阪府',
      'hyogo': '兵庫県',
      'nara': '奈良県',
      'wakayama': '和歌山県',
      'tottori': '鳥取県',
      'shimane': '島根県',
      'okayama': '岡山県',
      'hiroshima': '広島県',
      'yamaguchi': '山口県',
      'tokushima': '徳島県',
      'kagawa': '香川県',
      'ehime': '愛媛県',
      'kochi': '高知県',
      'fukuoka': '福岡県',
      'saga': '佐賀県',
      'nagasaki': '長崎県',
      'kumamoto': '熊本県',
      'oita': '大分県',
      'miyazaki': '宮崎県',
      'kagoshima': '鹿児島県',
      'okinawa': '沖縄県'
    };
    
    return prefectureNames[prefectureId] || prefectureId;
  }

  showAchievementCardModal(cardData) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content achievement-card-modal">
        <h3>実績カード</h3>
        <div class="achievement-card-preview" id="achievementCardPreview">
          ${this.renderAchievementCard(cardData)}
        </div>
        <div class="achievement-card-actions" style="margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: center;">
          <button class="btn-secondary" id="downloadCard" style="flex: 1; white-space: nowrap; font-size: 0.9rem;">画像保存</button>
          <button class="btn-primary" id="closeCardModal" style="flex: 1; white-space: nowrap; font-size: 0.9rem;">閉じる</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    modal.querySelector('#downloadCard').addEventListener('click', () => {
      this.downloadAchievementCard();
    });
    
    
    modal.querySelector('#closeCardModal').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // マイエリアタブ切り替えのイベントリスナー
    const areaTabs = modal.querySelectorAll('.area-tab');
    areaTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const sortBy = e.target.getAttribute('data-sort');
        
        // タブの見た目を更新
        areaTabs.forEach(t => {
          t.classList.remove('active');
          t.style.background = 'var(--surface-color)';
          t.style.color = 'var(--text-primary)';
        });
        e.target.classList.add('active');
        e.target.style.background = 'var(--primary-color)';
        e.target.style.color = 'white';
        
        // リストを更新
        const myAreasList = modal.querySelector('#myAreasList');
        if (myAreasList && cardData.myAreas) {
          myAreasList.innerHTML = this.renderMyAreasList(cardData.myAreas, sortBy);
        }
      });
    });
  }

  renderAchievementCard(cardData) {
    return `
      <div class="achievement-card-new" style="
        background: var(--surface-elevated);
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 500px;
        margin: 0 auto;
        border: 1px solid var(--border-color);
      ">
        <!-- ヘッダー -->
        <div class="card-header" style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 0.5rem; 
          margin-bottom: 1rem;
          padding: 0.5rem;
        ">
          <img src="images/logo.svg" alt="ロゴ" style="width: 24px; height: 24px;">
          <h2 style="margin: 0; color: var(--primary-color); font-size: 1rem;">${cardData.title}</h2>
          <span style="color: var(--text-secondary); font-size: 0.75rem;">|</span>
          <p style="margin: 0; color: var(--text-secondary); font-size: 0.75rem;">${cardData.date}</p>
        </div>
        
        <!-- 上段：全店制覇・全国制覇（コンパクトカード） -->
        <div class="card-main-stats" style="margin-bottom: 1.5rem;">
          <!-- 全店制覇 -->
          <div class="main-stat-card" style="
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          ">
            <div style="z-index: 2; position: relative;">
              <h3 style="margin: 0 0 0.125rem 0; font-size: 0.85rem; color: var(--text-secondary);">全店制覇</h3>
              <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${cardData.allStores.percentage}%</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${cardData.allStores.visited}/${cardData.allStores.total} 店舗</div>
            </div>
            <div style="font-size: 1.5rem; opacity: 0.7; z-index: 2; position: relative;">☕</div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 2.5rem;
              z-index: 1;
              pointer-events: none;
            ">${this.getBadgeEmoji(cardData.allStores.badge, cardData.allStores.visited, 'stores')}</div>
          </div>
          
          <!-- 全国制覇 -->
          <div class="main-stat-card" style="
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 0.75rem;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          ">
            <div style="z-index: 2; position: relative;">
              <h3 style="margin: 0 0 0.125rem 0; font-size: 0.85rem; color: var(--text-secondary); text-align: left;">全国制覇</h3>
              <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${cardData.allPrefectures.percentage}%</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${cardData.allPrefectures.completed}/47 都道府県</div>
            </div>
            <div style="font-size: 1.5rem; opacity: 0.7; z-index: 2; position: relative;">🗾</div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 2.5rem;
              z-index: 1;
              pointer-events: none;
            ">${this.getBadgeEmoji(cardData.allPrefectures.badge, cardData.allPrefectures.percentage, 'prefectures')}</div>
          </div>
        </div>
        
        <!-- 下段：マイエリア進捗 -->
        ${cardData.myAreas && cardData.myAreas.length > 0 ? `
          <div class="card-my-areas" style="margin-bottom: 0.75rem;">
            <div class="my-areas-header" style="
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 0.5rem;
              padding: 0.375rem 0.5rem;
              background: var(--surface-color);
              border: 1px solid var(--border-color);
              border-radius: 6px;
            ">
              <h4 style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">マイエリア進捗</h4>
              <div class="area-sort-tabs" style="display: flex;">
                <button class="area-tab active" data-sort="percentage" style="
                  padding: 0.125rem 0.375rem;
                  font-size: 0.7rem;
                  border: 1px solid var(--border-color);
                  border-radius: 4px 0 0 4px;
                  border-right: none;
                  background: var(--primary-color);
                  color: white;
                  cursor: pointer;
                ">達成率順</button>
                <button class="area-tab" data-sort="visited" style="
                  padding: 0.125rem 0.375rem;
                  font-size: 0.7rem;
                  border: 1px solid var(--border-color);
                  border-radius: 0 4px 4px 0;
                  background: var(--surface-elevated);
                  color: var(--text-primary);
                  cursor: pointer;
                ">達成数順</button>
              </div>
            </div>
            <div class="my-areas-list" id="myAreasList">
              ${this.renderMyAreasList(cardData.myAreas, 'percentage')}
            </div>
          </div>
        ` : ''}
        
        <div class="card-footer" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--divider-color); text-align: center;">
          <p style="font-size: 0.7rem; color: var(--text-muted);">
            Cafe★Logアプリ
          </p>
        </div>
      </div>
    `;
  }

  getBadgeEmoji(badge, value, type) {
    // 実績カード専用のバッジ判定
    if (type === 'stores') {
      // 全店制覇: 0-49店舗は🔰
      if (value >= 0 && value < 50) {
        return '🔰';
      }
    } else if (type === 'prefectures') {
      // 全国制覇: 25%未満は🔰
      if (value >= 0 && value < 25) {
        return '🔰';
      }
    }
    
    // 🔰条件に該当しない場合は実績に応じたバッジ
    const badgeMap = {
      'bronze': '🥉',
      'silver': '🥈', 
      'gold': '🥇',
      'master': '🌟'
    };
    return badgeMap[badge] || '🥉';
  }

  renderMyAreasList(myAreas, sortBy = 'percentage') {
    // ソート処理
    const sortedAreas = [...myAreas].sort((a, b) => {
      if (sortBy === 'percentage') {
        return b.percentage - a.percentage; // 達成率の降順
      } else {
        return b.visited - a.visited; // 達成数の降順
      }
    });

    return sortedAreas.map(area => `
      <div class="my-area-item" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.375rem 0.75rem;
        margin-bottom: 0.375rem;
        background: var(--surface-color);
        border-radius: 6px;
        border: 1px solid var(--border-color);
      ">
        <div>
          <div style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${area.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${area.visited}/${area.total} 店舗</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1rem; font-weight: bold; color: var(--primary-color);">${area.percentage}%</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${area.visited}店舗</div>
        </div>
      </div>
    `).join('');
  }

  downloadAchievementCard() {
    // This would typically use html2canvas or similar library
    // For now, show a message about the feature
    this.showToast('実績カードの画像保存機能は開発中です', 'info');
  }

  shareAchievementCard(cardData) {
    const shareText = `Cafe★Log\n\n全店舗達成率: ${cardData.overall.percentage}%\n完全制覇: ${cardData.prefectureCompletion.completed}県\n総訪問店舗数: ${cardData.visitCount}店舗\n\n#CafeLog #訪問記録`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Cafe★Log',
        text: shareText
      }).catch(() => {
        this.fallbackShare(shareText);
      });
    } else {
      this.fallbackShare(shareText);
    }
  }

  fallbackShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('実績をクリップボードにコピーしました');
      });
    } else {
      this.showToast('共有機能はこのブラウザでは利用できません', 'error');
    }
  }

  showProgressLoading() {
    if (this.progressTab) {
      this.progressTab.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 2rem;">
          <div class="loading" style="margin: 0 auto 1rem; width: 32px; height: 32px; border: 3px solid var(--border-color); border-top: 3px solid var(--primary-color); border-radius: 50%;"></div>
          <p>実績データを計算しています...</p>
        </div>
      `;
    }
  }

  showToast(message, type = 'success') {
    if (window.qrManager) {
      if (type === 'error') {
        window.qrManager.showError(message);
      } else if (type === 'info') {
        window.qrManager.showInfo(message);
      } else {
        window.qrManager.showSuccess(message);
      }
    }
  }
}

// Create global instance
window.achievementsPage = new AchievementsPage();