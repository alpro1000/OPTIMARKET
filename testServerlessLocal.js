// Локальный тест Serverless Function
// Симулирует работу api/generate.js без деплоя на Vercel

import dotenv from 'dotenv';
import { parseShopCatalog, addAffiliateLinks } from './modules/shopParser.js';
import { fetchReviewSnippets } from './modules/perplexity.js';
import { extractSignals } from './modules/reviewSignals.js';
import { generateExplanation } from './modules/explanations.js';
import { calculateValueCurve } from './modules/valueCurve.js';

dotenv.config();

console.log('🧪 ТЕСТ SERVERLESS FUNCTION (локально)\n');
console.log('━'.repeat(60));

async function testServerlessFlow() {
  console.log('\n📋 ШАГИ:\n');
  console.log('1️⃣  Парсинг каталога магазина (mock данные)');
  console.log('2️⃣  Поиск отзывов через Perplexity API');
  console.log('3️⃣  Извлечение сигналов из отзывов');
  console.log('4️⃣  Расчет value_score для каждого товара');
  console.log('5️⃣  Выбор Economy/Optimum/Premium');
  console.log('6️⃣  Генерация объяснений через Gemini API');
  console.log('7️⃣  Построение кривой ценности');
  console.log('8️⃣  Возврат JSON как API endpoint\n');
  console.log('━'.repeat(60));

  // ШАГ 1: Mock данные (вместо парсинга реального магазина)
  console.log('\n1️⃣  ПАРСИНГ КАТАЛОГА (mock):');
  const mockProducts = [
    {
      id: 'drill_1',
      product: 'Einhell TE-CD 18/2',
      price: '€99',
      brand: 'Einhell',
      specs: { voltage: '18V', torque: '42Nm', battery: '2.0Ah' },
      url: 'https://example.com/einhell-te-cd-18-2',
      in_stock: true
    },
    {
      id: 'drill_2',
      product: 'Makita DDF484',
      price: '€169',
      brand: 'Makita',
      specs: { voltage: '18V', torque: '54Nm', battery: '5.0Ah' },
      url: 'https://example.com/makita-ddf484',
      in_stock: true
    },
    {
      id: 'drill_3',
      product: 'Bosch GSR 18V-110 C',
      price: '€249',
      brand: 'Bosch',
      specs: { voltage: '18V', torque: '110Nm', battery: '5.0Ah' },
      url: 'https://example.com/bosch-gsr-18v-110',
      in_stock: true
    }
  ];

  console.log(`✅ Получено ${mockProducts.length} товаров из каталога\n`);
  mockProducts.forEach(p => {
    console.log(`   • ${p.product} - ${p.price} (${p.specs.torque})`);
  });

  // ШАГ 2-4: Обработка каждого товара
  console.log('\n2️⃣  ОБРАБОТКА ТОВАРОВ (Perplexity + Signals):\n');

  const enrichedProducts = [];
  for (const product of mockProducts) {
    console.log(`   🔍 ${product.product}...`);

    // Поиск отзывов
    const query = `${product.product} drill reviews pros cons`;
    const snippets = await fetchReviewSnippets(query, { maxSnippets: 3 });

    // Извлечение сигналов
    const signals = extractSignals(
      snippets.map(s => s.snippet),
      'drill'
    );

    // Расчет value_score
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const maxPrice = 300; // Предполагаемая максимальная цена

    const value_score = (
      0.30 * (1 - priceNum / maxPrice) +              // Цена (30%)
      0.25 * (signals.trust_score || 0.5) +           // Доверие к отзывам (25%)
      0.25 * Math.min(signals.sentiment_ratio / 10, 1) + // Sentiment (25%)
      0.20 * 0.7                                       // Бренд (20%)
    );

    enrichedProducts.push({
      ...product,
      snippets,
      signals,
      value_score: parseFloat(value_score.toFixed(2))
    });

    console.log(`      ✓ Отзывов: ${snippets.length}, Trust: ${signals.trust_score?.toFixed(2)}, Value: ${value_score.toFixed(2)}`);
  }

  // ШАГ 5: Выбор уровней
  console.log('\n5️⃣  ВЫБОР УРОВНЕЙ:\n');

  // Сортируем по value_score
  const sorted = [...enrichedProducts].sort((a, b) => b.value_score - a.value_score);

  // Economy: самый дешевый с приемлемым value_score
  const economyCandidates = enrichedProducts
    .filter(p => p.value_score >= 0.45)
    .sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
  const economy = economyCandidates[0];

  // Optimum: лучшее соотношение цена/качество
  const optimum = sorted[0];

  // Premium: максимальный value_score среди дорогих
  const premiumCandidates = enrichedProducts
    .filter(p => {
      const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
      const maxPriceInSet = Math.max(...enrichedProducts.map(x => parseFloat(x.price.replace(/[^0-9.]/g, ''))));
      return price >= maxPriceInSet * 0.75;
    })
    .sort((a, b) => b.value_score - a.value_score);
  const premium = premiumCandidates[0];

  const choices = { economy, optimum, premium };

  console.log(`   💰 Economy:  ${economy.product} (${economy.price}) - Value: ${economy.value_score}`);
  console.log(`   ⚖️  Optimum:  ${optimum.product} (${optimum.price}) - Value: ${optimum.value_score}`);
  console.log(`   ✨ Premium:  ${premium.product} (${premium.price}) - Value: ${premium.value_score}`);

  // ШАГ 6: Генерация объяснений
  console.log('\n6️⃣  ГЕНЕРАЦИЯ ОБЪЯСНЕНИЙ (Gemini):\n');

  const explanations = {};
  for (const [level, product] of Object.entries(choices)) {
    console.log(`   🤖 Генерирую для ${level}...`);

    const explanation = await generateExplanation({
      product,
      level,
      signals: product.signals,
      competitors: Object.values(choices).filter(p => p.id !== product.id),
      category: 'drill',
      snippets: product.snippets.map(s => s.snippet)
    });

    explanations[level] = explanation;
    console.log(`      ✓ ${explanation.why.substring(0, 80)}...`);
  }

  // ШАГ 7: Кривая ценности
  console.log('\n7️⃣  ПОСТРОЕНИЕ КРИВОЙ ЦЕННОСТИ:\n');

  const valueCurve = calculateValueCurve(enrichedProducts);
  console.log(`   ✓ Scatter plot data: ${valueCurve.scatter_data.length} точек`);
  console.log(`   ✓ Inflection point: ~€${valueCurve.inflection_point?.toFixed(0) || 'N/A'}`);

  // ШАГ 8: Формируем ответ API
  console.log('\n8️⃣  ФОРМИРОВАНИЕ JSON ОТВЕТА:\n');

  const apiResponse = {
    category: 'drills',
    generated_at: new Date().toISOString(),
    choices: {
      economy: {
        ...economy,
        explanation: explanations.economy
      },
      optimum: {
        ...optimum,
        explanation: explanations.optimum
      },
      premium: {
        ...premium,
        explanation: explanations.premium
      }
    },
    value_curve: valueCurve,
    metadata: {
      total_products_analyzed: enrichedProducts.length,
      api_used: {
        perplexity: !!process.env.PERPLEXITY_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY
      }
    }
  };

  console.log('━'.repeat(60));
  console.log('\n✅ API RESPONSE (пример):');
  console.log('━'.repeat(60));
  console.log(JSON.stringify(apiResponse, null, 2));
  console.log('━'.repeat(60));

  console.log('\n📊 ИТОГО:\n');
  console.log(`   ✅ Проанализировано товаров: ${enrichedProducts.length}`);
  console.log(`   ✅ Отзывов обработано: ${enrichedProducts.reduce((sum, p) => sum + p.snippets.length, 0)}`);
  console.log(`   ✅ Объяснений сгенерировано: ${Object.keys(explanations).length}`);
  console.log(`   ✅ API используют ключи: Perplexity=${!!process.env.PERPLEXITY_API_KEY}, Gemini=${!!process.env.GEMINI_API_KEY}`);

  console.log('\n🚀 ГОТОВО! Serverless Function работает корректно.\n');
  console.log('📝 Следующие шаги:');
  console.log('   1. Deploy на Vercel (git push → auto-deploy)');
  console.log('   2. Протестировать: https://your-app.vercel.app/api/generate?category=drills');
  console.log('   3. Обновить frontend для использования API');
  console.log('   4. Настроить реальный парсер магазина (см. SERVERLESS_SETUP.md)\n');
}

// Запуск
testServerlessFlow().catch(error => {
  console.error('\n❌ ОШИБКА:', error.message);
  console.error(error.stack);
});
