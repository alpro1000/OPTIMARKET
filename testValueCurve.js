/**
 * Тестовый скрипт для проверки модуля valueCurve.js
 * Использует демо-данные категории "дрели" из data/products.json
 */

import fs from 'fs';
import { calculateValueCurve, explainValueCurve, exportValueCurveData } from './modules/valueCurve.js';

// Загружаем демо-данные
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

// Находим категорию "Аккумуляторные дрели"
const drillCategory = productsData.find(cat => cat.category === 'Аккумуляторные дрели');

if (!drillCategory) {
  console.error('❌ Категория "Аккумуляторные дрели" не найдена');
  process.exit(1);
}

console.log('📊 Тест модуля Value Curve');
console.log('=' .repeat(60));
console.log(`📦 Категория: ${drillCategory.category}`);
console.log(`🔢 Товаров: ${drillCategory.items.length}`);
console.log('');

try {
  // Вычисляем кривую ценности
  const curveData = calculateValueCurve(drillCategory.items);

  console.log('✅ Кривая ценности рассчитана!\n');
  console.log('=' .repeat(60));

  // Статистика
  console.log('\n📈 СТАТИСТИКА:');
  console.log(`   Диапазон цен: ${curveData.stats.minPrice.toFixed(0)}€ - ${curveData.stats.maxPrice.toFixed(0)}€`);
  console.log(`   Средняя цена: ${curveData.stats.avgPrice.toFixed(0)}€`);
  console.log(`   Диапазон ценности: ${curveData.stats.minValue.toFixed(1)} - ${curveData.stats.maxValue.toFixed(1)}`);
  console.log(`   Средняя ценность: ${curveData.stats.avgValue.toFixed(2)}`);

  // Точка перегиба
  console.log('\n🔄 ТОЧКА ПЕРЕГИБА:');
  if (curveData.inflectionPoint) {
    console.log(`   Товар: ${curveData.inflectionPoint.product}`);
    console.log(`   Цена: ${curveData.inflectionPoint.price.toFixed(0)}€`);
    console.log(`   Объяснение: ${curveData.inflectionPoint.explanation}`);
  } else {
    console.log('   Не найдена (ценность растет пропорционально цене)');
  }

  // Выделенные точки
  console.log('\n🎯 ВЫДЕЛЕННЫЕ ТОЧКИ (E/O/P):');

  if (curveData.highlights.economy) {
    const e = curveData.highlights.economy;
    console.log(`   💚 Economy: ${e.product}`);
    console.log(`      Цена: ${e.price.toFixed(0)}€`);
    console.log(`      Value Score: ${e.value_score.toFixed(2)}`);
    console.log(`      Value per €: ${(e.valuePerDollar * 100).toFixed(1)}%`);
  }

  if (curveData.highlights.optimum) {
    const o = curveData.highlights.optimum;
    console.log(`   💙 Optimum: ${o.product}`);
    console.log(`      Цена: ${o.price.toFixed(0)}€`);
    console.log(`      Value Score: ${o.value_score.toFixed(2)}`);
    console.log(`      Value per €: ${(o.valuePerDollar * 100).toFixed(1)}%`);
  }

  if (curveData.highlights.premium) {
    const p = curveData.highlights.premium;
    console.log(`   💛 Premium: ${p.product}`);
    console.log(`      Цена: ${p.price.toFixed(0)}€`);
    console.log(`      Value Score: ${p.value_score.toFixed(2)}`);
    console.log(`      Value per €: ${(p.valuePerDollar * 100).toFixed(1)}%`);
  }

  // Все точки данных
  console.log('\n📋 ВСЕ ТОЧКИ ДАННЫХ (сортировка по цене):');
  curveData.dataPoints.forEach((p, i) => {
    const levelEmoji = {
      'Economy': '💚',
      'Optimum': '💙',
      'Premium': '💛'
    }[p.level] || '⚪';

    console.log(`   ${i + 1}. ${levelEmoji} ${p.product}`);
    console.log(`      ${p.price.toFixed(0)}€ | Value: ${p.value_score.toFixed(2)} | Per €: ${(p.valuePerDollar * 100).toFixed(1)}%`);
  });

  // Генерируем объяснения
  console.log('\n\n' + '='.repeat(60));
  console.log('💬 ОБЪЯСНЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ');
  console.log('='.repeat(60));

  const explanations = explainValueCurve(curveData);

  console.log(`\n📝 Обзор:`);
  console.log(`   ${explanations.overview}`);

  console.log(`\n🔄 Перегиб:`);
  console.log(`   ${explanations.inflection}`);

  console.log(`\n⭐ Sweet Spot:`);
  console.log(`   ${explanations.sweetSpot}`);

  console.log(`\n🎯 Выбор по уровням:`);
  if (explanations.choices.economy) {
    console.log(`   💚 ${explanations.choices.economy}`);
  }
  if (explanations.choices.optimum) {
    console.log(`   💙 ${explanations.choices.optimum}`);
  }
  if (explanations.choices.premium) {
    console.log(`   💛 ${explanations.choices.premium}`);
  }

  // Chart.js данные
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 ДАННЫЕ ДЛЯ CHART.JS');
  console.log('='.repeat(60));
  console.log(`\n✅ Datasets: ${curveData.chartData.datasets.length}`);
  console.log('   Структура готова для визуализации в браузере');
  console.log('   Используйте: <canvas id="valueCurve"></canvas>');

  // Экспортируем полные данные
  const exportData = exportValueCurveData(curveData, explanations);
  const outputPath = './reports/value_curve_output.json';
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');

  console.log(`\n📄 Полный вывод сохранен в: ${outputPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Тест завершен успешно!');
  console.log('\n💡 Следующие шаги:');
  console.log('   1. Интегрировать в runMVP.js');
  console.log('   2. Добавить Chart.js визуализацию в frontend');
  console.log('   3. Показывать explanations на странице выбора');

} catch (error) {
  console.error('\n❌ Ошибка при расчете кривой ценности:');
  console.error(error);
  process.exit(1);
}
