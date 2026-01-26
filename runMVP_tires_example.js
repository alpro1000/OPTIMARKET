// ПРИМЕР: Адаптация pipeline для сотен товаров (автошины)
// Демонстрирует Top-N выбор в каждом уровне

import fs from 'fs';

// ===== MOCK DATA: Генерируем 100 шин для примера =====
function generateMockTires(count = 100) {
  const brands = {
    premium: ['Michelin', 'Continental', 'Bridgestone', 'Pirelli'],
    midrange: ['Nokian', 'Goodyear', 'Dunlop', 'Yokohama'],
    budget: ['Hankook', 'Kumho', 'Matador', 'Nexen']
  };

  const sizes = ['225/45 R17', '205/55 R16', '195/65 R15'];
  const euLabels = ['A', 'B', 'C'];

  const tires = [];

  for (let i = 0; i < count; i++) {
    // Определяем уровень бренда
    const levelRand = Math.random();
    let brandLevel, priceRange;

    if (levelRand < 0.25) {
      brandLevel = 'premium';
      priceRange = [10000, 15000];
    } else if (levelRand < 0.65) {
      brandLevel = 'midrange';
      priceRange = [6000, 10000];
    } else {
      brandLevel = 'budget';
      priceRange = [3500, 6000];
    }

    const brand = brands[brandLevel][Math.floor(Math.random() * brands[brandLevel].length)];
    const price = Math.floor(Math.random() * (priceRange[1] - priceRange[0]) + priceRange[0]);

    // Рейтинг коррелирует с уровнем бренда
    const baseRating = brandLevel === 'premium' ? 4.5 : brandLevel === 'midrange' ? 4.2 : 3.9;
    const rating = Math.min(5.0, baseRating + (Math.random() * 0.5 - 0.1));

    tires.push({
      id: `tire_${i}`,
      name: `${brand} Model ${String.fromCharCode(65 + Math.floor(i / 4))}`,
      brand,
      brandLevel,
      price,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      season: 'summer',
      specs: {
        fuel_efficiency: euLabels[Math.floor(Math.random() * 3)],
        wet_grip: euLabels[Math.floor(Math.random() * 3)],
        noise: 68 + Math.floor(Math.random() * 6), // 68-73 dB
        speed_index: 'Y',
        load_index: '94'
      },
      rating: parseFloat(rating.toFixed(1)),
      reviews_count: Math.floor(50 + Math.random() * 500),
      in_stock: Math.random() > 0.1 // 90% в наличии
    });
  }

  return tires;
}

// ===== VALUE SCORE: Адаптирован для шин =====
function calculateValueScore(tire, maxPrice, avgRating) {
  // Факторы специфичные для шин
  const euLabelScore = calculateEULabelScore(tire.specs);
  const brandScore = getBrandScore(tire.brandLevel);

  return (
    0.30 * (1 - tire.price / maxPrice) +           // Цена (30%)
    0.25 * (tire.rating / 5.0) +                    // Отзывы (25%)
    0.25 * euLabelScore +                           // EU Label (25%)
    0.20 * brandScore                               // Бренд (20%)
  );
}

function calculateEULabelScore(specs) {
  const scores = {
    'A': 1.0, 'B': 0.75, 'C': 0.5, 'D': 0.3, 'E': 0.1
  };

  const fuelScore = scores[specs.fuel_efficiency] || 0.5;
  const wetScore = scores[specs.wet_grip] || 0.5;
  const noiseScore = specs.noise <= 68 ? 1.0 : specs.noise <= 71 ? 0.7 : 0.4;

  return (fuelScore + wetScore + noiseScore) / 3;
}

function getBrandScore(brandLevel) {
  return {
    'premium': 1.0,
    'midrange': 0.7,
    'budget': 0.4
  }[brandLevel] || 0.5;
}

// ===== TOP-N SELECTION: Главное отличие от оригинального алгоритма =====
function selectTopChoices(tires, topN = 3) {
  const maxPrice = Math.max(...tires.map(t => t.price));
  const avgRating = tires.reduce((sum, t) => sum + t.rating, 0) / tires.length;

  // 1. Рассчитываем value_score для всех
  const withScores = tires
    .filter(t => t.in_stock) // Только в наличии
    .map(t => ({
      ...t,
      value_score: calculateValueScore(t, maxPrice, avgRating)
    }));

  // 2. Сортируем по value_score
  const sorted = withScores.sort((a, b) => b.value_score - a.value_score);

  // 3. Определяем ценовые квартили
  const prices = sorted.map(t => t.price).sort((a, b) => a - b);
  const q33 = prices[Math.floor(prices.length * 0.33)];
  const q66 = prices[Math.floor(prices.length * 0.66)];

  console.log(`📊 Квартили: Q33=${q33}₽, Q66=${q66}₽`);

  // 4. Выбираем Top-N в каждом уровне
  const economy = sorted
    .filter(t => t.price <= q33 && t.value_score >= 0.40) // Минимальный порог качества
    .slice(0, topN);

  const optimum = sorted
    .filter(t => t.price > q33 && t.price < q66)
    .slice(0, topN);

  const premium = sorted
    .filter(t => t.price >= q66)
    .slice(0, topN);

  return { economy, optimum, premium, all: sorted };
}

// ===== EXPLANATIONS: Генерируем объяснения для уровня =====
function generateLevelExplanation(level, choices, allTires) {
  const avgPrice = choices.reduce((sum, t) => sum + t.price, 0) / choices.length;
  const avgScore = choices.reduce((sum, t) => sum + t.value_score, 0) / choices.length;

  const explanations = {
    economy: {
      why: `Бюджетные шины с хорошим соотношением цена/качество. Средняя цена ${Math.round(avgPrice)}₽. Подходят для города и умеренной езды.`,
      tradeoffs: [
        `Цена: ${Math.round(avgPrice)}₽ (экономия 40-60% от Premium)`,
        `EU Label: преимущественно B-C (приемлемые характеристики)`,
        `Износостойкость: 40 000 - 60 000 км`,
        `Комфорт: базовый уровень шумоизоляции`
      ],
      bestFor: 'Водители с пробегом до 15 000 км/год, городская эксплуатация, ограниченный бюджет'
    },
    optimum: {
      why: `Оптимальный баланс между ценой и качеством. Средняя цена ${Math.round(avgPrice)}₽. Лучший выбор для большинства водителей.`,
      tradeoffs: [
        `Цена: ${Math.round(avgPrice)}₽ (на 60-80% дороже Economy)`,
        `EU Label: A-B (отличные характеристики)`,
        `Износостойкость: 60 000 - 80 000 км`,
        `Комфорт: низкий уровень шума, хорошая управляемость`
      ],
      bestFor: 'Ежедневная эксплуатация, город + трасса, пробег 15 000 - 25 000 км/год'
    },
    premium: {
      why: `Премиум-шины от ведущих брендов. Средняя цена ${Math.round(avgPrice)}₽. Максимальные характеристики, но с убывающей отдачей.`,
      tradeoffs: [
        `Цена: ${Math.round(avgPrice)}₽ (на 40-100% дороже Optimum)`,
        `EU Label: A (топовые характеристики)`,
        `Износостойкость: 80 000+ км`,
        `Комфорт: минимальный шум, превосходная управляемость`
      ],
      bestFor: 'Энтузиасты вождения, премиум-автомобили, активная езда, пробег 25 000+ км/год'
    }
  };

  return explanations[level];
}

// ===== VALUE CURVE DATA =====
function prepareValueCurveData(tires) {
  const dataPoints = tires.map(t => ({
    x: t.price,
    y: t.value_score,
    label: t.name
  }));

  // Находим точку перегиба (где отдача начинает падать)
  const sorted = tires.sort((a, b) => a.price - b.price);
  let maxEfficiency = 0;
  let inflectionPoint = null;

  for (let i = 1; i < sorted.length - 1; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const next = sorted[i + 1];

    const efficiency1 = (curr.value_score - prev.value_score) / (curr.price - prev.price);
    const efficiency2 = (next.value_score - curr.value_score) / (next.price - curr.price);

    if (efficiency1 > maxEfficiency && efficiency2 < efficiency1 * 0.5) {
      maxEfficiency = efficiency1;
      inflectionPoint = curr;
    }
  }

  return { dataPoints, inflectionPoint };
}

// ===== MAIN: Запуск pipeline =====
async function main() {
  console.log('🔧 OPTIMARKET MVP для сотен товаров (пример: автошины)\n');

  // 1. Генерируем mock данные (100 шин)
  console.log('📦 Генерируем 100 шин...');
  const allTires = generateMockTires(100);

  // 2. Фильтруем по параметрам (пример: только размер 225/45 R17)
  const targetSize = '225/45 R17';
  const filtered = allTires.filter(t => t.size === targetSize);
  console.log(`🔍 Отфильтровано: ${filtered.length} шин размера ${targetSize}\n`);

  // 3. Выбираем Top-3 в каждом уровне
  console.log('🎯 Выбираем Top-3 в каждом уровне...');
  const { economy, optimum, premium, all } = selectTopChoices(filtered, 3);

  console.log(`\n💚 ECONOMY (Top-3 из ${filtered.filter(t => t.price <= all[Math.floor(all.length * 0.33)].price).length}):`);
  economy.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - ${t.price}₽ (score: ${t.value_score.toFixed(3)})`);
    console.log(`     EU: ${t.specs.fuel_efficiency}/${t.specs.wet_grip}/${t.specs.noise}dB · ⭐${t.rating}`);
  });

  console.log(`\n💙 OPTIMUM (Top-3 из ${filtered.filter(t => {
    const q33 = all[Math.floor(all.length * 0.33)].price;
    const q66 = all[Math.floor(all.length * 0.66)].price;
    return t.price > q33 && t.price < q66;
  }).length}):`);
  optimum.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - ${t.price}₽ (score: ${t.value_score.toFixed(3)}) 🏆`);
    console.log(`     EU: ${t.specs.fuel_efficiency}/${t.specs.wet_grip}/${t.specs.noise}dB · ⭐${t.rating}`);
  });

  console.log(`\n💛 PREMIUM (Top-3 из ${filtered.filter(t => t.price >= all[Math.floor(all.length * 0.66)].price).length}):`);
  premium.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - ${t.price}₽ (score: ${t.value_score.toFixed(3)})`);
    console.log(`     EU: ${t.specs.fuel_efficiency}/${t.specs.wet_grip}/${t.specs.noise}dB · ⭐${t.rating}`);
  });

  // 4. Генерируем объяснения
  console.log('\n\n💬 ОБЪЯСНЕНИЯ:\n');
  ['economy', 'optimum', 'premium'].forEach(level => {
    const choices = { economy, optimum, premium }[level];
    const expl = generateLevelExplanation(level, choices, all);
    console.log(`${level.toUpperCase()}:`);
    console.log(`  ${expl.why}`);
    console.log(`  Для кого: ${expl.bestFor}\n`);
  });

  // 5. Value Curve
  const { dataPoints, inflectionPoint } = prepareValueCurveData(all);
  console.log(`\n📊 Value Curve: ${dataPoints.length} точек`);
  if (inflectionPoint) {
    console.log(`   Точка перегиба: ${inflectionPoint.name} (${inflectionPoint.price}₽)`);
    console.log(`   После этой точки отдача от вложений снижается\n`);
  }

  // 6. Сохраняем результат
  const output = {
    category: `Летние шины ${targetSize}`,
    total_products: filtered.length,
    selected: {
      economy: economy.map(t => ({
        name: t.name,
        brand: t.brand,
        price: t.price,
        value_score: t.value_score,
        rating: t.rating,
        specs: t.specs
      })),
      optimum: optimum.map(t => ({
        name: t.name,
        brand: t.brand,
        price: t.price,
        value_score: t.value_score,
        rating: t.rating,
        specs: t.specs
      })),
      premium: premium.map(t => ({
        name: t.name,
        brand: t.brand,
        price: t.price,
        value_score: t.value_score,
        rating: t.rating,
        specs: t.specs
      }))
    },
    explanations: {
      economy: generateLevelExplanation('economy', economy, all),
      optimum: generateLevelExplanation('optimum', optimum, all),
      premium: generateLevelExplanation('premium', premium, all)
    },
    value_curve: {
      data_points: dataPoints,
      inflection_point: inflectionPoint ? {
        name: inflectionPoint.name,
        price: inflectionPoint.price,
        value_score: inflectionPoint.value_score
      } : null
    }
  };

  fs.writeFileSync(
    './reports/tires_example_output.json',
    JSON.stringify(output, null, 2)
  );

  console.log('✅ Результат сохранен: reports/tires_example_output.json');
}

main().catch(console.error);
