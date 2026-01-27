// Тест интеграции Perplexity + Gemini
// Perplexity ищет отзывы, Gemini делает резюме

import dotenv from 'dotenv';
import { fetchReviewSnippets } from './modules/perplexity.js';
import { generateExplanation } from './modules/explanations.js';

dotenv.config();

console.log('🔧 Тест интеграции Perplexity + Gemini\n');

async function testPerplexity() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 ШАГ 1: Perplexity API (поиск отзывов)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.PERPLEXITY_API_KEY) {
    console.warn('⚠️  PERPLEXITY_API_KEY не задан в .env');
    console.log('   Используются mock данные для демонстрации\n');
  }

  const query = 'Makita DDF484 cordless drill reviews pros cons';
  console.log(`🔍 Запрос: "${query}"\n`);

  try {
    const snippets = await fetchReviewSnippets(query, { maxSnippets: 5 });

    console.log(`\n✅ Получено ${snippets.length} отзывов:\n`);

    snippets.forEach((snippet, i) => {
      console.log(`${i + 1}. ${snippet.title}`);
      console.log(`   📝 ${snippet.snippet.substring(0, 150)}...`);
      console.log(`   🔗 ${snippet.source}\n`);
    });

    return snippets;

  } catch (error) {
    console.error(`❌ Ошибка Perplexity API: ${error.message}`);
    return [];
  }
}

async function testGemini(snippets) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 ШАГ 2: Gemini API (резюме отзывов)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY не задан в .env');
    console.log('   Используется fallback (базовое резюме)\n');
  }

  // Создаем тестовые данные для Gemini
  const product = {
    product: 'Makita DDF484',
    price: '169€',
    specs: {
      voltage: '18V',
      torque: '54Nm',
      battery: '5.0Ah'
    }
  };

  const signals = {
    positive_mentions: 25,
    negative_mentions: 3,
    trust_score: 0.89,
    sentiment_ratio: 8.3,
    category_signals: {
      'high torque': 12,
      'battery life': 8,
      'ergonomics': 5
    }
  };

  const competitors = [
    { product: 'Einhell TE-CD 18/2', price: '99€' },
    { product: 'Bosch GSR 18V-110', price: '249€' }
  ];

  console.log('🎯 Генерируем резюме для уровня "Optimum"...\n');

  try {
    const explanation = await generateExplanation({
      product,
      level: 'optimum',
      signals,
      competitors,
      category: 'drill',
      snippets: snippets.map(s => s.snippet) // передаем отзывы из Perplexity
    });

    console.log('✅ Резюме от Gemini:\n');
    console.log('💬 Почему этот уровень?');
    console.log(`   ${explanation.why}\n`);

    console.log('⚖️  Компромиссы:');
    explanation.tradeoffs.forEach(t => {
      console.log(`   • ${t}`);
    });
    console.log();

    console.log('👤 Для кого:');
    console.log(`   ${explanation.bestFor}\n`);

    return explanation;

  } catch (error) {
    console.error(`❌ Ошибка Gemini API: ${error.message}`);
    return null;
  }
}

async function testFullPipeline() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 ШАГ 3: Полный pipeline (Perplexity → Gemini)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 PIPELINE:');
  console.log('   1. Perplexity ищет отзывы в интернете');
  console.log('   2. Извлекаются сигналы (positive/negative mentions)');
  console.log('   3. Gemini анализирует и создает резюме');
  console.log('   4. Результат: понятное объяснение для пользователя\n');

  // Шаг 1: Perplexity
  const snippets = await testPerplexity();

  // Шаг 2: Gemini
  const explanation = await testGemini(snippets);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ИТОГОВЫЙ РЕЗУЛЬТАТ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (snippets.length > 0 && explanation) {
    console.log('✅ Pipeline работает корректно!');
    console.log(`   • Perplexity: ${snippets.length} отзывов`);
    console.log(`   • Gemini: резюме сгенерировано`);
    console.log();

    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️  Для production настройте PERPLEXITY_API_KEY');
    }
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️  Для production настройте GEMINI_API_KEY');
    }
  } else {
    console.log('⚠️  Pipeline работает частично (используется fallback)');
  }

  console.log('\n📖 Инструкция по настройке API ключей:');
  console.log('   1. Скопируйте .env.example в .env');
  console.log('   2. Perplexity: https://docs.perplexity.ai/ → получите ключ');
  console.log('   3. Gemini: https://ai.google.dev/ → получите ключ');
  console.log('   4. Добавьте ключи в .env');
  console.log('   5. Запустите: node testAPIs.js\n');
}

// Запуск теста
testFullPipeline().catch(console.error);
