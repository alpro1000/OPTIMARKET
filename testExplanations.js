/**
 * Тестовый скрипт для проверки модуля explanations.js
 * Использует демо-данные категории "дрели" из data/products.json
 */

import fs from 'fs';
import { generateAllExplanations } from './modules/explanations.js';

// Загружаем демо-данные
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

// Находим категорию "Аккумуляторные дрели"
const drillCategory = productsData.find(cat => cat.category === 'Аккумуляторные дрели');

if (!drillCategory) {
  console.error('❌ Категория "Аккумуляторные дрели" не найдена');
  process.exit(1);
}

console.log('🔧 Тест модуля LLM-объяснений');
console.log('=' .repeat(60));
console.log(`📦 Категория: ${drillCategory.category}`);
console.log(`📅 Обновлено: ${drillCategory.updated_at}`);
console.log(`🔢 Товаров: ${drillCategory.items.length}`);
console.log('');

// Находим товары по уровням
const items = drillCategory.items;
const economy = items.find(i => i.level === 'Economy');
const optimum = items.find(i => i.level === 'Optimum');
const premium = items.find(i => i.level === 'Premium');

if (!economy || !optimum || !premium) {
  console.error('❌ Не найдены все три уровня (Economy/Optimum/Premium)');
  process.exit(1);
}

// Симулируем сигналы из отзывов (в реальности они приходят из reviewSignals.js)
// Для демо используем базовые значения
const signals = {
  economy: {
    positive_mentions: 15,
    negative_mentions: 8,
    trust_score: 2.5
  },
  optimum: {
    positive_mentions: 32,
    negative_mentions: 5,
    trust_score: 3.2
  },
  premium: {
    positive_mentions: 45,
    negative_mentions: 3,
    trust_score: 3.8
  }
};

console.log('⏳ Генерация объяснений...\n');

// Генерируем объяснения
generateAllExplanations({
  choices: { economy, optimum, premium },
  signals,
  category: 'drill'
})
  .then(result => {
    console.log('✅ Объяснения сгенерированы!\n');
    console.log('=' .repeat(60));

    // Выводим результаты для каждого уровня
    ['economy', 'optimum', 'premium'].forEach(level => {
      const item = result[level];
      const levelEmoji = {
        economy: '💚',
        optimum: '💙',
        premium: '💛'
      };

      console.log(`\n${levelEmoji[level]} **${level.toUpperCase()}**: ${item.product} (${item.price})`);
      console.log('─'.repeat(60));

      if (item.explanation) {
        console.log(`\n📝 Почему этот уровень:`);
        console.log(`   ${item.explanation.why}`);

        console.log(`\n⚖️  Компромиссы:`);
        item.explanation.tradeoffs.forEach((t, i) => {
          console.log(`   ${i + 1}. ${t}`);
        });

        console.log(`\n👤 Для кого:`);
        console.log(`   ${item.explanation.bestFor}`);
      } else {
        console.log('   ⚠️  Объяснение не сгенерировано');
      }
    });

    // Выводим сравнение между уровнями
    console.log('\n\n' + '='.repeat(60));
    console.log('🔄 СРАВНЕНИЕ МЕЖДУ УРОВНЯМИ');
    console.log('='.repeat(60));

    if (result.tradeoffs) {
      console.log('\n💚→💙 Economy vs Optimum:');
      console.log(`   Разница: ${result.tradeoffs.economyVsOptimum.priceDiff}`);
      console.log(`   Что получаем: ${result.tradeoffs.economyVsOptimum.valueGain}`);
      console.log(`   Когда окупается: ${result.tradeoffs.economyVsOptimum.breakEven}`);

      console.log('\n💙→💛 Optimum vs Premium:');
      console.log(`   Разница: ${result.tradeoffs.optimumVsPremium.priceDiff}`);
      console.log(`   Что получаем: ${result.tradeoffs.optimumVsPremium.valueGain}`);
      console.log(`   Когда окупается: ${result.tradeoffs.optimumVsPremium.breakEven}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Тест завершен успешно!');
    console.log('\n💡 Следующие шаги:');
    console.log('   1. Проверить качество объяснений (читаемость, фактичность)');
    console.log('   2. Интегрировать в основной pipeline (runMVP.js)');
    console.log('   3. Добавить сохранение результатов в JSON');

    // Сохраняем результаты в файл для анализа
    const outputPath = './reports/explanations_test_output.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n📄 Полный вывод сохранен в: ${outputPath}`);
  })
  .catch(error => {
    console.error('\n❌ Ошибка при генерации объяснений:');
    console.error(error);

    if (error.message?.includes('GEMINI_API_KEY')) {
      console.error('\n⚠️  НЕОБХОДИМО:');
      console.error('   1. Получить Gemini API key: https://ai.google.dev');
      console.error('   2. Добавить в .env файл:');
      console.error('      GEMINI_API_KEY=your_key_here');
    }

    process.exit(1);
  });
