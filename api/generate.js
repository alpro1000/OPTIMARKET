// Vercel Serverless Function: Generate product recommendations
// api/generate.js

import { fetchReviewSnippets } from '../modules/perplexity.js';
import { extractSignals } from '../modules/reviewSignals.js';
import { calculateValueCurve, explainValueCurve } from '../modules/valueCurve.js';
import { generateAllExplanations } from '../modules/explanations.js';
import { fetchAwinProducts } from '../modules/shopParser.js';

// Маппинг категорий на Awin advertiser IDs (нужно заполнить после регистрации)
const AWIN_ADVERTISERS = {
  'drills': parseInt(process.env.AWIN_ADVERTISER_TOOLS) || null,
  'headphones': parseInt(process.env.AWIN_ADVERTISER_ELECTRONICS) || null,
  'laptops': parseInt(process.env.AWIN_ADVERTISER_COMPUTERS) || null,
  'phones': parseInt(process.env.AWIN_ADVERTISER_MOBILE) || null,
  'tires': parseInt(process.env.AWIN_ADVERTISER_AUTO) || null
};

// Основная функция
export default async function handler(req, res) {
  const { category = 'tires' } = req.query;

  try {
    console.log(`🔧 Generating recommendations for: ${category}`);

    // 1. Получаем товары через Awin Product Feed API
    const advertiserId = AWIN_ADVERTISERS[category];
    const products = await fetchAwinProducts({
      category,
      advertiserId,
      limit: 50 // Для MVP достаточно 50 товаров
    });
    console.log(`📦 Found ${products.length} products from Awin`);

    // 2. Для каждого товара ищем отзывы (Perplexity)
    const enrichedProducts = [];
    for (const product of products) {
      const query = `${product.product} reviews pros cons`;
      const snippets = await fetchReviewSnippets(query, { maxSnippets: 5 });

      // Извлекаем сигналы из отзывов
      const signals = extractSignals(snippets, category);

      enrichedProducts.push({
        ...product,
        snippets,
        signals,
        value_score: calculateValueScore(product, signals)
      });
    }

    // 3. Сортируем и выбираем Top-3 в каждом уровне
    const choices = selectTopChoices(enrichedProducts, 3);

    // 4. Генерируем объяснения (Gemini)
    const explanations = await generateAllExplanations({
      choices,
      signals: extractSignalsForLevels(choices),
      category
    });

    // 5. Строим кривую ценности
    const valueCurve = calculateValueCurve(enrichedProducts);
    const valueCurveExplanations = explainValueCurve(valueCurve);

    // 6. Возвращаем результат
    const result = {
      category,
      generated_at: new Date().toISOString(),
      choices: {
        economy: { ...choices.economy, explanation: explanations.economy },
        optimum: { ...choices.optimum, explanation: explanations.optimum },
        premium: { ...choices.premium, explanation: explanations.premium }
      },
      value_curve: {
        ...valueCurve,
        explanations: valueCurveExplanations
      },
      tradeoffs: calculateTradeoffs(choices),
      metadata: {
        total_products_analyzed: products.length,
        data_source: products[0]?.source || 'unknown',
        awin_advertiser_id: advertiserId || 'demo',
        api_keys_used: {
          perplexity: !!process.env.PERPLEXITY_API_KEY,
          gemini: !!process.env.GEMINI_API_KEY,
          awin: !!process.env.AWIN_API_KEY
        }
      }
    };

    // Cache для снижения API costs (в production добавить Redis)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper: Calculate value score
function calculateValueScore(product, signals) {
  const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));

  return (
    0.30 * (1 - priceNum / 200) + // Цена (30%)
    0.25 * (signals.trust_score || 0.5) + // Отзывы (25%)
    0.25 * (signals.sentiment_ratio / 10) + // Sentiment (25%)
    0.20 * 0.7 // Бренд (20%, TODO: добавить реальный расчет)
  );
}

// Helper: Select top choices
function selectTopChoices(products, topN) {
  const sorted = products.sort((a, b) => b.value_score - a.value_score);

  const prices = sorted.map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')));
  const q33 = prices[Math.floor(prices.length * 0.33)];
  const q66 = prices[Math.floor(prices.length * 0.66)];

  const economy = sorted.filter(p => {
    const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
    return price <= q33 && p.value_score >= 0.40;
  }).slice(0, topN);

  const optimum = sorted.filter(p => {
    const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
    return price > q33 && price < q66;
  }).slice(0, topN);

  const premium = sorted.filter(p => {
    const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
    return price >= q66;
  }).slice(0, topN);

  return {
    economy: economy[0],
    optimum: optimum[0],
    premium: premium[0]
  };
}

// Helper: Extract signals for levels
function extractSignalsForLevels(choices) {
  return {
    economy: choices.economy?.signals || {},
    optimum: choices.optimum?.signals || {},
    premium: choices.premium?.signals || {}
  };
}

// Helper: Calculate tradeoffs
function calculateTradeoffs(choices) {
  const economyPrice = parseFloat(choices.economy.price.replace(/[^0-9.]/g, ''));
  const optimumPrice = parseFloat(choices.optimum.price.replace(/[^0-9.]/g, ''));
  const premiumPrice = parseFloat(choices.premium.price.replace(/[^0-9.]/g, ''));

  return {
    economyVsOptimum: {
      priceDiff: `+€${(optimumPrice - economyPrice).toFixed(0)}`,
      valueGain: `${((choices.optimum.value_score - choices.economy.value_score) * 100).toFixed(0)}% better value`,
      breakEven: 'For regular use (15-25k km/year)'
    },
    optimumVsPremium: {
      priceDiff: `+€${(premiumPrice - optimumPrice).toFixed(0)}`,
      valueGain: `${((choices.premium.value_score - choices.optimum.value_score) * 100).toFixed(0)}% better value`,
      breakEven: 'For intensive use (25k+ km/year)'
    }
  };
}
