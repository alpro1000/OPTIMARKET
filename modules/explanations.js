/**
 * LLM-генерация объяснений для выбора товаров
 *
 * Философия:
 * - Спокойный инженер-консультант
 * - Фактический тон, без маркетинга
 * - Только данные из реальных источников
 * - LLM объясняет, НЕ решает
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Инициализация Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Быстрая и дешевая модель для MVP
  generationConfig: {
    temperature: 0.3, // Низкая температура = более фактический стиль
    maxOutputTokens: 800,
  }
});

/**
 * Генерирует объяснение для одного уровня выбора
 *
 * @param {Object} params
 * @param {Object} params.product - Товар (name, price, specs, pros, cons)
 * @param {String} params.level - Уровень: "Economy" | "Optimum" | "Premium"
 * @param {Object} params.signals - Сигналы из отзывов (positive_mentions, negative_mentions, trust_score)
 * @param {Array} params.competitors - Другие товары E/O/P для сравнения
 * @param {String} params.category - Категория товара (drill, headphones, laptop, phone)
 * @returns {Promise<Object>} - {why, tradeoffs, bestFor}
 */
export async function generateExplanation({ product, level, signals, competitors, category }) {

  // Валидация обязательных полей
  if (!product || !level || !signals) {
    throw new Error('Missing required parameters: product, level, signals');
  }

  // Подготовка данных о конкурентах
  const competitorsList = competitors
    ?.map(c => `- ${c.level}: ${c.product} (${c.price})`)
    .join('\n') || 'Нет данных о конкурентах';

  // Маппинг уровней на русский для промпта
  const levelNames = {
    'Economy': 'Economy (бюджетный)',
    'Optimum': 'Optimum (оптимальный)',
    'Premium': 'Premium (премиум)'
  };

  const prompt = `Ты — спокойный инженер-консультант, который помогает выбрать товар на основе реальных данных.

**ВАЖНО:**
- Используй только факты из предоставленных данных
- Не придумывай характеристики или отзывы
- Тон: фактический, инженерный, без маркетинга
- НЕ используй слова: "идеальный", "лучший", "невероятный", "потрясающий"
- Используй: "подходит для", "компромисс", "разумный выбор", "достаточно для"

**ТОВАР:**
Название: ${product.product || product.name}
Цена: ${product.price}
Уровень: ${levelNames[level]}

**ХАРАКТЕРИСТИКИ:**
${Object.entries(product.specs || {}).map(([key, val]) => `- ${key}: ${val}`).join('\n')}

**ПЛЮСЫ:**
${(product.pros || []).map(p => `- ${p}`).join('\n')}

**МИНУСЫ:**
${(product.cons || []).map(c => `- ${c}`).join('\n')}

**СИГНАЛЫ ИЗ ОТЗЫВОВ:**
- Положительные упоминания: ${signals.positive_mentions || 0}
- Негативные упоминания: ${signals.negative_mentions || 0}
- Доверие к источникам: ${(signals.trust_score || 0).toFixed(2)}

**КОНКУРЕНТЫ НА ДРУГИХ УРОВНЯХ:**
${competitorsList}

**ЗАДАЧА:**
Напиши объяснение в формате JSON со следующими полями:

{
  "why": "1-2 предложения: почему этот товар находится на уровне ${level}",
  "tradeoffs": "2-3 конкретных пункта: что получаем и что теряем, выбирая этот уровень. Формат: массив строк",
  "bestFor": "1 предложение: для кого/какого сценария подходит этот выбор"
}

**ПРИМЕРЫ ХОРОШЕГО СТИЛЯ:**
- "Bosch попал в Premium, потому что имеет самый высокий крутящий момент (110 Н·м) и металлический патрон."
- "Подходит для профессионалов, которые работают с инструментом каждый день."
- "Компромисс: высокая цена (+150€ к Optimum), но служит в 2-3 раза дольше."

**ПРИМЕРЫ ПЛОХОГО СТИЛЯ (НЕ ДЕЛАЙ ТАК):**
- "Это идеальный выбор для всех!" ❌
- "Невероятная производительность!" ❌
- "Лучший на рынке!" ❌

Верни только JSON, без дополнительного текста.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Извлечение JSON из ответа (может быть обернут в markdown блок)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Валидация структуры ответа
    if (!parsed.why || !parsed.tradeoffs || !parsed.bestFor) {
      throw new Error('Invalid response structure from LLM');
    }

    // Убедимся, что tradeoffs - это массив
    if (typeof parsed.tradeoffs === 'string') {
      parsed.tradeoffs = [parsed.tradeoffs];
    }

    return {
      why: parsed.why.trim(),
      tradeoffs: Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs : [String(parsed.tradeoffs)],
      bestFor: parsed.bestFor.trim()
    };

  } catch (error) {
    console.error('Error generating explanation:', error);

    // Fallback на базовое объяснение
    return {
      why: `${product.product} находится на уровне ${level} на основе анализа ${signals.positive_mentions + signals.negative_mentions} отзывов.`,
      tradeoffs: [
        `Цена: ${product.price}`,
        `Отзывы: ${signals.positive_mentions} положительных, ${signals.negative_mentions} негативных`
      ],
      bestFor: `Подходит для использования в категории ${category}.`
    };
  }
}

/**
 * Генерирует сравнение компромиссов между уровнями
 *
 * @param {Object} params
 * @param {Object} params.economy - Товар Economy
 * @param {Object} params.optimum - Товар Optimum
 * @param {Object} params.premium - Товар Premium
 * @param {String} params.category - Категория товара
 * @returns {Promise<Object>} - {economyVsOptimum, optimumVsPremium}
 */
export async function generateTradeoffComparison({ economy, optimum, premium, category }) {

  if (!economy || !optimum || !premium) {
    throw new Error('Missing required parameters: economy, optimum, premium');
  }

  // Вычисляем разницу в цене (парсим числа из строк типа "249€")
  const parsePrice = (priceStr) => {
    return parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0;
  };

  const priceEconomy = parsePrice(economy.price);
  const priceOptimum = parsePrice(optimum.price);
  const pricePremium = parsePrice(premium.price);

  const prompt = `Ты — спокойный инженер-консультант. Объясни компромиссы между уровнями выбора.

**ТОВАРЫ:**

**Economy:** ${economy.product} (${economy.price})
Плюсы: ${(economy.pros || []).join(', ')}
Минусы: ${(economy.cons || []).join(', ')}

**Optimum:** ${optimum.product} (${optimum.price})
Плюсы: ${(optimum.pros || []).join(', ')}
Минусы: ${(optimum.cons || []).join(', ')}

**Premium:** ${premium.product} (${premium.price})
Плюсы: ${(premium.pros || []).join(', ')}
Минусы: ${(premium.cons || []).join(', ')}

**РАЗНИЦА В ЦЕНЕ:**
- Optimum дороже Economy на ${(priceOptimum - priceEconomy).toFixed(0)}€
- Premium дороже Optimum на ${(pricePremium - priceOptimum).toFixed(0)}€

**ЗАДАЧА:**
Верни JSON со следующей структурой:

{
  "economyVsOptimum": {
    "priceDiff": "+${(priceOptimum - priceEconomy).toFixed(0)}€",
    "valueGain": "что конкретно получаем за эту переплату",
    "breakEven": "в каком случае это окупается"
  },
  "optimumVsPremium": {
    "priceDiff": "+${(pricePremium - priceOptimum).toFixed(0)}€",
    "valueGain": "что конкретно получаем за эту переплату",
    "breakEven": "в каком случае это окупается"
  }
}

**СТИЛЬ:**
- Фактический, с конкретными цифрами
- Без слов "идеальный", "лучший", "невероятный"
- Формат: "За +70€ получаем металлический патрон и в 2 раза больший ресурс"

Верни только JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      economyVsOptimum: parsed.economyVsOptimum || {
        priceDiff: `+${(priceOptimum - priceEconomy).toFixed(0)}€`,
        valueGain: 'Данные недоступны',
        breakEven: 'Требуется дополнительный анализ'
      },
      optimumVsPremium: parsed.optimumVsPremium || {
        priceDiff: `+${(pricePremium - priceOptimum).toFixed(0)}€`,
        valueGain: 'Данные недоступны',
        breakEven: 'Требуется дополнительный анализ'
      }
    };

  } catch (error) {
    console.error('Error generating tradeoff comparison:', error);

    // Fallback на базовое сравнение
    return {
      economyVsOptimum: {
        priceDiff: `+${(priceOptimum - priceEconomy).toFixed(0)}€`,
        valueGain: `${optimum.product} предлагает улучшенные характеристики`,
        breakEven: 'Для регулярного использования'
      },
      optimumVsPremium: {
        priceDiff: `+${(pricePremium - priceOptimum).toFixed(0)}€`,
        valueGain: `${premium.product} обеспечивает максимальную надежность`,
        breakEven: 'Для профессионального использования'
      }
    };
  }
}

/**
 * Генерирует полный набор объяснений для всех трех уровней
 *
 * @param {Object} params
 * @param {Object} params.choices - {economy, optimum, premium} объекты товаров
 * @param {Object} params.signals - {economy, optimum, premium} сигналы для каждого
 * @param {String} params.category - Категория товара
 * @returns {Promise<Object>} - Объяснения для всех уровней + сравнения
 */
export async function generateAllExplanations({ choices, signals, category }) {

  const { economy, optimum, premium } = choices;
  const competitors = [economy, optimum, premium];

  // Генерируем объяснения параллельно для скорости
  const [economyExpl, optimumExpl, premiumExpl, tradeoffs] = await Promise.all([
    generateExplanation({
      product: economy,
      level: 'Economy',
      signals: signals.economy,
      competitors: [optimum, premium],
      category
    }),
    generateExplanation({
      product: optimum,
      level: 'Optimum',
      signals: signals.optimum,
      competitors: [economy, premium],
      category
    }),
    generateExplanation({
      product: premium,
      level: 'Premium',
      signals: signals.premium,
      competitors: [economy, optimum],
      category
    }),
    generateTradeoffComparison({
      economy,
      optimum,
      premium,
      category
    })
  ]);

  return {
    economy: {
      ...economy,
      explanation: economyExpl
    },
    optimum: {
      ...optimum,
      explanation: optimumExpl
    },
    premium: {
      ...premium,
      explanation: premiumExpl
    },
    tradeoffs
  };
}
