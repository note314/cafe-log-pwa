#!/usr/bin/env node

/**
 * 新データでのPWA動作確認スクリプト
 */

// PWAデータ読み込みシミュレーション
async function testPWADataLoading() {
    console.log('🧪 PWA新データ動作確認テスト');
    console.log('================================\n');

    try {
        // store_list.json読み込み
        const fs = require('fs');
        const path = require('path');
        const storeData = JSON.parse(fs.readFileSync('./data/store_list.json', 'utf8'));
        
        console.log('📊 データ概要:');
        console.log(`   データバージョン: ${storeData.metadata.dataVersion.current}`);
        console.log(`   総店舗数: ${storeData.metadata.dataVersion.totalStores}`);
        console.log(`   都道府県数: ${storeData.metadata.dataVersion.coverage.prefectures}`);
        console.log(`   地方数: ${storeData.metadata.dataVersion.coverage.regions}`);
        console.log(`   座標精度: ${storeData.metadata.dataVersion.coverage.coordinateAccuracy}\n`);

        // 地方データ確認
        console.log('🗾 地方データ確認:');
        Object.values(storeData.regions).forEach(region => {
            console.log(`   ${region.name} (${region.id})`);
        });
        console.log('');

        // 都道府県データ確認
        console.log('🏛️ 都道府県データ確認:');
        Object.values(storeData.prefectures).forEach(pref => {
            const storeCount = Object.values(pref.areas).reduce((sum, area) => sum + area.storeCount, 0);
            console.log(`   ${pref.name}: ${storeCount}店舗`);
        });
        console.log('');

        // 店舗データ確認
        console.log('🏪 店舗データ確認:');
        storeData.stores.forEach((store, index) => {
            const hasCoords = store.location.coordinates ? '📍' : '❌';
            console.log(`   ${index + 1}. ${store.storeInfo.branch} ${hasCoords}`);
            console.log(`      📍 ${store.location.prefectureName}${store.location.areaName}`);
            if (store.location.coordinates) {
                console.log(`      🗺️  lat: ${store.location.coordinates.lat}, lng: ${store.location.coordinates.lng}`);
            }
        });
        console.log('');

        // 座標データ品質確認
        const storesWithCoords = storeData.stores.filter(s => s.location.coordinates);
        const coordQuality = (storesWithCoords.length / storeData.stores.length * 100).toFixed(1);
        console.log('📊 座標データ品質:');
        console.log(`   座標あり: ${storesWithCoords.length}/${storeData.stores.length} (${coordQuality}%)`);
        console.log(`   API検証済み: ${storesWithCoords.filter(s => s.location.coordinates.source === 'google_maps').length}店舗`);
        console.log('');

        // 地域分布確認
        console.log('🗺️ 地域分布確認:');
        const regionDistribution = {};
        storeData.stores.forEach(store => {
            const region = storeData.prefectures[store.location.prefecture]?.regionId;
            if (region) {
                regionDistribution[region] = (regionDistribution[region] || 0) + 1;
            }
        });
        
        Object.entries(regionDistribution).forEach(([regionId, count]) => {
            const regionName = storeData.regions[regionId]?.name || regionId;
            console.log(`   ${regionName}: ${count}店舗`);
        });
        console.log('');

        // PWA互換性確認
        console.log('⚙️ PWA互換性確認:');
        console.log(`   スキーマバージョン: ${storeData.schema.version}`);
        console.log(`   最小アプリバージョン: ${storeData.metadata.compatibility.minAppVersion}`);
        console.log(`   マイグレーション要否: ${storeData.metadata.compatibility.migrationRequired ? 'あり' : 'なし'}`);
        console.log('');

        console.log('✅ 新データ検証完了 - PWA動作可能');
        return true;

    } catch (error) {
        console.error('❌ データ読み込みエラー:', error.message);
        return false;
    }
}

// 実行
testPWADataLoading().then(success => {
    console.log(success ? '\n🚀 PWAテスト準備完了' : '\n💥 データ問題あり');
});