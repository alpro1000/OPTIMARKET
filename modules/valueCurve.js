/**
 * Value Curve - визуализация кривой "цена ↔ ценность"
 *
 * Показывает scatter plot всех товаров с выделением Economy/Optimum/Premium
 * и объясняет "перегибы" кривой (где начинается diminishing returns)
 */

/**
 * Вычисляет данные для кривой ценности
 *
 * @param {Array} products - Массив товаров с полями: {product, price, value_score, level}
 * @returns {Object} - Данные для визуализации
 */
export function calculateValueCurve(products) {
  if (!products || products.length === 0) {
    throw new Error('Products array is empty or undefined');
  }

  // Парсинг цены из строки типа "249€"
  const parsePrice = (priceStr) => {
    return parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0;
  };

  // Подготовка данных для scatter plot
  const dataPoints = products.map(p => ({
    product: p.product || p.name,
    price: parsePrice(p.price),
    value_score: parseFloat(p.value_score) || parseFloat(p.score) || 0,
    level: p.level || 'Unknown'
  }));

  // Сортировка по цене для анализа кривой
  const sortedByPrice = [...dataPoints].sort((a, b) => a.price - b.price);

  // Вычисление value/price ratio для каждой точки
  const withRatios = sortedByPrice.map(p => ({
    ...p,
    valuePerDollar: p.price > 0 ? p.value_score / p.price : 0
  }));

  // Поиск "точки перегиба" (где value/price начинает падать)
  const inflectionPoint = findInflectionPoint(withRatios);

  // Статистика
  const stats = {
    minPrice: Math.min(...dataPoints.map(p => p.price)),
    maxPrice: Math.max(...dataPoints.map(p => p.price)),
    minValue: Math.min(...dataPoints.map(p => p.value_score)),
    maxValue: Math.max(...dataPoints.map(p => p.value_score)),
    avgPrice: dataPoints.reduce((sum, p) => sum + p.price, 0) / dataPoints.length,
    avgValue: dataPoints.reduce((sum, p) => sum + p.value_score, 0) / dataPoints.length
  };

  // Выделяем E/O/P точки
  const economy = dataPoints.find(p => p.level === 'Economy');
  const optimum = dataPoints.find(p => p.level === 'Optimum');
  const premium = dataPoints.find(p => p.level === 'Premium');

  return {
    dataPoints: withRatios,
    inflectionPoint,
    stats,
    highlights: {
      economy,
      optimum,
      premium
    },
    // Данные для Chart.js
    chartData: prepareChartData(withRatios, economy, optimum, premium)
  };
}

/**
 * Находит точку перегиба кривой (где efficiency начинает падать)
 *
 * @param {Array} sortedData - Отсортированные по цене данные с valuePerDollar
 * @returns {Object|null} - Точка перегиба или null
 */
function findInflectionPoint(sortedData) {
  if (sortedData.length < 3) return null;

  let maxEfficiencyDrop = 0;
  let inflectionIndex = -1;

  // Ищем максимальное падение efficiency
  for (let i = 1; i < sortedData.length; i++) {
    const efficiencyDrop = sortedData[i - 1].valuePerDollar - sortedData[i].valuePerDollar;

    if (efficiencyDrop > maxEfficiencyDrop) {
      maxEfficiencyDrop = efficiencyDrop;
      inflectionIndex = i;
    }
  }

  if (inflectionIndex === -1 || maxEfficiencyDrop < 0.001) {
    return null;
  }

  const point = sortedData[inflectionIndex];
  const prevPoint = sortedData[inflectionIndex - 1];

  return {
    product: point.product,
    price: point.price,
    value_score: point.value_score,
    efficiencyDrop: maxEfficiencyDrop,
    explanation: `После ${prevPoint.product} (${prevPoint.price.toFixed(0)}€) эффективность затрат падает на ${(maxEfficiencyDrop * 100).toFixed(1)}%`
  };
}

/**
 * Подготавливает данные в формате Chart.js
 *
 * @param {Array} dataPoints - Все точки данных
 * @param {Object} economy - Economy товар
 * @param {Object} optimum - Optimum товар
 * @param {Object} premium - Premium товар
 * @returns {Object} - Конфигурация для Chart.js
 */
function prepareChartData(dataPoints, economy, optimum, premium) {
  // Разделяем точки по категориям
  const regularPoints = dataPoints.filter(p =>
    !['Economy', 'Optimum', 'Premium'].includes(p.level)
  );

  return {
    datasets: [
      // Обычные точки (серые)
      {
        label: 'Другие товары',
        data: regularPoints.map(p => ({ x: p.price, y: p.value_score })),
        backgroundColor: 'rgba(150, 150, 150, 0.3)',
        borderColor: 'rgba(150, 150, 150, 0.8)',
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      // Economy (зеленая)
      economy ? {
        label: `💚 Economy: ${economy.product}`,
        data: [{ x: economy.price, y: economy.value_score }],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'circle'
      } : null,
      // Optimum (синяя)
      optimum ? {
        label: `💙 Optimum: ${optimum.product}`,
        data: [{ x: optimum.price, y: optimum.value_score }],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'circle'
      } : null,
      // Premium (золотая)
      premium ? {
        label: `💛 Premium: ${premium.product}`,
        data: [{ x: premium.price, y: premium.value_score }],
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'circle'
      } : null
    ].filter(Boolean), // Убираем null значения

    // Опции для Chart.js
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Кривая "Цена ↔ Ценность"',
          font: { size: 18, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataset = context.dataset;
              const point = context.raw;
              return `${dataset.label}: ${point.x.toFixed(0)}€, Value: ${point.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Цена (€)',
            font: { size: 14, weight: 'bold' }
          },
          min: 0,
          ticks: {
            callback: function(value) {
              return value.toFixed(0) + '€';
            }
          }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Value Score',
            font: { size: 14, weight: 'bold' }
          },
          min: 0,
          max: 10,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  };
}

/**
 * Генерирует человекочитаемое объяснение кривой
 *
 * @param {Object} curveData - Результат calculateValueCurve()
 * @returns {Object} - Объяснения для пользователя
 */
export function explainValueCurve(curveData) {
  const { stats, inflectionPoint, highlights } = curveData;
  const { economy, optimum, premium } = highlights;

  // Анализ "sweet spot"
  const sweetSpot = curveData.dataPoints.reduce((best, current) => {
    return current.valuePerDollar > best.valuePerDollar ? current : best;
  }, curveData.dataPoints[0]);

  const explanations = {
    overview: generateOverview(stats, curveData.dataPoints.length),
    inflection: inflectionPoint
      ? `Перегиб кривой: ${inflectionPoint.explanation}. После этой точки каждый дополнительный евро дает меньше ценности.`
      : 'Перегиб кривой не выражен - ценность растет пропорционально цене.',
    sweetSpot: `Лучшее соотношение цена/ценность: ${sweetSpot.product} (${sweetSpot.price.toFixed(0)}€, ${(sweetSpot.valuePerDollar * 100).toFixed(1)}% value per €)`,
    choices: {
      economy: economy
        ? `Economy (${economy.product}, ${economy.price.toFixed(0)}€): минимальная цена при достаточной ценности (${economy.value_score.toFixed(1)}/10)`
        : null,
      optimum: optimum
        ? `Optimum (${optimum.product}, ${optimum.price.toFixed(0)}€): оптимальный баланс (${optimum.value_score.toFixed(1)}/10, ${(optimum.valuePerDollar * 100).toFixed(1)}% value per €)`
        : null,
      premium: premium
        ? `Premium (${premium.product}, ${premium.price.toFixed(0)}€): максимальная ценность (${premium.value_score.toFixed(1)}/10) для требовательных пользователей`
        : null
    }
  };

  return explanations;
}

/**
 * Генерирует общий обзор кривой
 */
function generateOverview(stats, count) {
  const priceRange = stats.maxPrice - stats.minPrice;
  const valueRange = stats.maxValue - stats.minValue;

  const priceSpread = priceRange / stats.avgPrice;
  const valueSpread = valueRange / stats.avgValue;

  let overview = `Проанализировано ${count} товаров. `;

  if (priceSpread > 3) {
    overview += `Широкий диапазон цен (${stats.minPrice.toFixed(0)}-${stats.maxPrice.toFixed(0)}€). `;
  } else {
    overview += `Узкий диапазон цен (${stats.minPrice.toFixed(0)}-${stats.maxPrice.toFixed(0)}€). `;
  }

  if (valueSpread > 0.5) {
    overview += `Качество товаров сильно различается (${stats.minValue.toFixed(1)}-${stats.maxValue.toFixed(1)}/10).`;
  } else {
    overview += `Товары примерно одинакового качества (${stats.minValue.toFixed(1)}-${stats.maxValue.toFixed(1)}/10).`;
  }

  return overview;
}

/**
 * Экспортирует данные кривой для сохранения
 *
 * @param {Object} curveData - Результат calculateValueCurve()
 * @param {Object} explanations - Результат explainValueCurve()
 * @returns {Object} - Полный экспорт для JSON
 */
export function exportValueCurveData(curveData, explanations) {
  return {
    metadata: {
      generated_at: new Date().toISOString(),
      products_count: curveData.dataPoints.length
    },
    statistics: curveData.stats,
    inflection_point: curveData.inflectionPoint,
    highlights: curveData.highlights,
    explanations,
    chart_data: curveData.chartData,
    raw_data: curveData.dataPoints
  };
}
