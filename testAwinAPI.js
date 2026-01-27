// Тест Awin Product Feed API Integration
// testAwinAPI.js

import dotenv from 'dotenv';
import { fetchAwinProducts } from './modules/shopParser.js';

dotenv.config();

console.log('🧪 ТЕСТ AWIN PRODUCT FEED API\n');
console.log('━'.repeat(70));

async function testAwinIntegration() {
  // 1. Проверяем environment variables
  console.log('\n📋 ШАГ 1: ПРОВЕРКА ENVIRONMENT VARIABLES\n');

  const awinKey = process.env.AWIN_API_KEY;
  const advertiserTools = process.env.AWIN_ADVERTISER_TOOLS;
  const advertiserElectronics = process.env.AWIN_ADVERTISER_ELECTRONICS;

  if (awinKey) {
    console.log(`   ✅ AWIN_API_KEY найден: ${awinKey.substring(0, 10)}...`);
  } else {
    console.log(`   ⚠️  AWIN_API_KEY не настроен (будут использованы demo данные)`);
  }

  console.log(`\n   Advertiser IDs:`);
  console.log(`   • AWIN_ADVERTISER_TOOLS: ${advertiserTools || 'не настроен'}`);
  console.log(`   • AWIN_ADVERTISER_ELECTRONICS: ${advertiserElectronics || 'не настроен'}`);

  // 2. Тест для категории "drills"
  console.log('\n━'.repeat(70));
  console.log('\n📡 ШАГ 2: ЗАГРУЗКА ТОВАРОВ (drills)\n');

  try {
    const drills = await fetchAwinProducts({
      category: 'drills',
      advertiserId: advertiserTools ? parseInt(advertiserTools) : null,
      limit: 10
    });

    if (drills.length === 0) {
      console.log('   ⚠️  Товары не найдены (проверьте API key и advertiser ID)');
    } else {
      console.log(`   ✅ Получено ${drills.length} товаров\n`);
      console.log(`   Примеры:`);
      drills.slice(0, 5).forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.product} - ${product.price} (${product.brand || 'N/A'})`);
        console.log(`      Source: ${product.source}, In Stock: ${product.in_stock}`);
      });
    }

    // Проверяем структуру первого товара
    if (drills[0]) {
      console.log(`\n   📦 Структура товара (первый товар):`);
      console.log(`   ${JSON.stringify(drills[0], null, 2)}`);
    }

  } catch (error) {
    console.error(`   ❌ Ошибка при загрузке товаров:`, error.message);
  }

  // 3. Тест для категории "headphones"
  console.log('\n━'.repeat(70));
  console.log('\n📡 ШАГ 3: ЗАГРУЗКА ТОВАРОВ (headphones)\n');

  try {
    const headphones = await fetchAwinProducts({
      category: 'headphones',
      advertiserId: advertiserElectronics ? parseInt(advertiserElectronics) : null,
      limit: 5
    });

    console.log(`   ✅ Получено ${headphones.length} товаров\n`);
    if (headphones.length > 0) {
      headphones.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.product} - ${product.price}`);
      });
    }

  } catch (error) {
    console.error(`   ❌ Ошибка:`, error.message);
  }

  // 4. Проверяем affiliate links
  console.log('\n━'.repeat(70));
  console.log('\n🔗 ШАГ 4: ПРОВЕРКА AFFILIATE ССЫЛОК\n');

  const testProducts = await fetchAwinProducts({
    category: 'drills',
    advertiserId: advertiserTools ? parseInt(advertiserTools) : null,
    limit: 3
  });

  if (testProducts.length > 0) {
    const firstProduct = testProducts[0];
    console.log(`   Товар: ${firstProduct.product}`);
    console.log(`   URL: ${firstProduct.url || 'N/A'}`);

    if (firstProduct.url && firstProduct.url.includes('awin')) {
      console.log(`   ✅ Affiliate ссылка найдена (содержит 'awin')`);
    } else if (firstProduct.source === 'awin') {
      console.log(`   ✅ Товар из Awin (ссылка должна быть affiliate)`);
    } else {
      console.log(`   ⚠️  Demo данные (не affiliate)`);
    }
  }

  // 5. Summary
  console.log('\n━'.repeat(70));
  console.log('\n📊 РЕЗЮМЕ\n');

  const hasApiKey = !!awinKey;
  const hasAdvertiserIds = !!advertiserTools || !!advertiserElectronics;
  const canLoadProducts = testProducts.length > 0;

  console.log(`   ✅ API Key настроен: ${hasApiKey ? 'ДА' : 'НЕТ (используются demo данные)'}`);
  console.log(`   ✅ Advertiser IDs настроены: ${hasAdvertiserIds ? 'ДА' : 'НЕТ (используются demo)'}`);
  console.log(`   ✅ Товары загружаются: ${canLoadProducts ? 'ДА' : 'НЕТ'}`);

  if (hasApiKey && hasAdvertiserIds) {
    console.log(`\n   🎉 PRODUCTION MODE: Используются реальные данные из Awin!`);
  } else {
    console.log(`\n   🧪 DEMO MODE: Используются тестовые данные`);
    console.log(`\n   Для production режима:`);
    console.log(`   1. Зарегистрируйтесь в Awin (см. AWIN_API_SETUP.md)`);
    console.log(`   2. Получите API Key`);
    console.log(`   3. Добавьте в .env:`);
    console.log(`      AWIN_API_KEY=your_key_here`);
    console.log(`      AWIN_ADVERTISER_TOOLS=1228`);
    console.log(`      AWIN_ADVERTISER_ELECTRONICS=5678`);
  }

  console.log('\n━'.repeat(70));
  console.log('\n✅ ТЕСТ ЗАВЕРШЁН!\n');
}

// Запуск
testAwinIntegration().catch(error => {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  console.error(error.stack);
  process.exit(1);
});
