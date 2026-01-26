/**
 * Signal Extraction - анализ отзывов для извлечения сигналов о качестве
 *
 * Версия 2.0: Расширенные словари (50+ keywords) + категориальные сигналы
 */

// ============================================================================
// ОБЩИЕ СИГНАЛЫ (применимы ко всем категориям)
// ============================================================================

const GENERAL_POSITIVE = [
  // Качество и надежность
  "durable", "reliable", "solid", "sturdy", "well-built", "quality",
  "robust", "heavy-duty", "long-lasting", "dependable",

  // Производительность
  "powerful", "efficient", "fast", "strong", "effective",
  "consistent", "smooth", "stable",

  // Ценность
  "value", "worth", "recommend", "excellent", "great", "amazing",
  "perfect", "best", "love", "happy", "satisfied",

  // Простота использования
  "easy", "simple", "intuitive", "user-friendly", "convenient",
  "comfortable", "ergonomic", "lightweight"
];

const GENERAL_NEGATIVE = [
  // Проблемы качества
  "breaks", "broken", "fails", "failed", "defective", "faulty",
  "poor quality", "cheap", "flimsy", "weak",

  // Проблемы производительности
  "slow", "weak", "underperforms", "disappointing", "useless",
  "doesn't work", "stopped working",

  // Проблемы дизайна
  "noisy", "loud", "overheats", "hot", "heavy", "bulky",
  "uncomfortable", "awkward", "difficult",

  // Негативные эмоции
  "waste", "regret", "disappointed", "frustrated", "terrible",
  "horrible", "worst", "avoid", "don't buy", "returned"
];

// ============================================================================
// КАТЕГОРИАЛЬНЫЕ СИГНАЛЫ
// ============================================================================

const CATEGORY_SIGNALS = {

  // ДРЕЛИ / DRILLS
  drill: {
    positive: [
      // Крутящий момент и мощность
      "high torque", "powerful motor", "plenty of power",
      "strong torque", "no stalling",

      // Батарея
      "long battery life", "battery lasts", "good battery",
      "quick charge", "holds charge", "battery performance",

      // Патрон и точность
      "tight chuck", "secure chuck", "accurate", "precise",
      "no wobble", "stable",

      // Эргономика
      "comfortable grip", "well-balanced", "easy to handle",
      "not too heavy", "compact", "manageable weight"
    ],
    negative: [
      // Проблемы мощности
      "weak torque", "not enough power", "struggles", "stalls",
      "underpowered", "lacks power",

      // Проблемы батареи
      "battery dies quickly", "short battery life", "won't hold charge",
      "battery drains fast", "needs constant charging",

      // Проблемы патрона
      "chuck slips", "loose chuck", "bits fall out",
      "chuck wobbles", "poor chuck",

      // Проблемы эргономики
      "too heavy", "unbalanced", "awkward to hold",
      "uncomfortable grip", "bulky", "hard to maneuver"
    ]
  },

  // НАУШНИКИ / HEADPHONES
  headphones: {
    positive: [
      // Качество звука
      "great sound", "excellent audio", "clear sound", "rich bass",
      "balanced sound", "crisp", "detailed", "immersive",

      // Шумоподавление
      "great ANC", "excellent noise cancellation", "blocks noise well",
      "effective ANC", "quiet", "isolates well",

      // Комфорт
      "comfortable", "soft earpads", "lightweight", "no pressure",
      "can wear for hours", "doesn't hurt", "good fit",

      // Батарея
      "long battery life", "battery lasts", "great battery",
      "all-day battery", "quick charge"
    ],
    negative: [
      // Проблемы звука
      "poor sound", "tinny", "muddy bass", "distorted",
      "lacks detail", "harsh treble", "quiet", "low volume",

      // Проблемы ANC
      "weak ANC", "poor noise cancellation", "doesn't block noise",
      "ANC barely works", "disappointing ANC",

      // Проблемы комфорта
      "uncomfortable", "hurts ears", "too tight", "pressure headache",
      "can't wear long", "heavy", "poor fit", "falls off",

      // Проблемы батареи
      "short battery life", "battery drains fast", "dies quickly",
      "needs frequent charging"
    ]
  },

  // НОУТБУКИ / LAPTOPS
  laptop: {
    positive: [
      // Производительность
      "fast", "responsive", "powerful", "handles multitasking",
      "no lag", "smooth performance", "quick boot",

      // Батарея
      "great battery life", "all-day battery", "long battery",
      "battery lasts", "doesn't drain fast",

      // Дисплей
      "bright screen", "sharp display", "vibrant colors",
      "beautiful screen", "good viewing angles", "crisp",

      // Качество сборки
      "solid build", "premium feel", "sturdy", "well-built",
      "aluminum body", "quality construction",

      // Клавиатура/тачпад
      "great keyboard", "comfortable typing", "responsive trackpad",
      "good key travel", "accurate touchpad"
    ],
    negative: [
      // Проблемы производительности
      "slow", "lags", "stutters", "freezes", "overheats",
      "thermal throttling", "noisy fans", "struggles",

      // Проблемы батареи
      "poor battery life", "drains fast", "barely lasts",
      "needs to be plugged in", "battery dies quickly",

      // Проблемы дисплея
      "dim screen", "washed out", "poor colors", "grainy",
      "bad viewing angles", "screen bleed",

      // Проблемы сборки
      "flimsy", "creaks", "flexes", "cheap plastic",
      "poor build quality", "gaps in construction",

      // Проблемы ввода
      "mushy keyboard", "sticky keys", "poor trackpad",
      "inaccurate touchpad", "uncomfortable typing"
    ]
  },

  // СМАРТФОНЫ / PHONES
  phone: {
    positive: [
      // Камера
      "great camera", "excellent photos", "sharp pictures",
      "good in low light", "detailed photos", "natural colors",
      "fast autofocus", "good video",

      // Производительность
      "fast", "smooth", "responsive", "no lag", "handles games",
      "multitasks well", "quick app loading",

      // Батарея
      "great battery life", "all-day battery", "lasts long",
      "battery endurance", "fast charging", "wireless charging",

      // Дисплей
      "bright screen", "vivid display", "smooth scrolling",
      "high refresh rate", "beautiful screen", "sharp",

      // Качество сборки
      "premium feel", "solid build", "good weight", "slim",
      "elegant design", "quality materials"
    ],
    negative: [
      // Проблемы камеры
      "poor camera", "blurry photos", "bad in low light",
      "overprocessed", "slow autofocus", "washed out colors",
      "grainy video",

      // Проблемы производительности
      "slow", "lags", "stutters", "overheats", "crashes",
      "freezes", "struggles with apps",

      // Проблемы батареи
      "poor battery life", "dies quickly", "drains fast",
      "barely lasts", "needs charging twice a day",

      // Проблемы дисплея
      "dim screen", "poor viewing angles", "washed out",
      "low brightness", "touch issues", "unresponsive",

      // Проблемы сборки
      "cheap feel", "plastic", "slippery", "too big",
      "too heavy", "fragile", "scratches easily"
    ]
  }
};

// ============================================================================
// МОДИФИКАТОРЫ И КОНТЕКСТ
// ============================================================================

const NEGATION_WORDS = ["not", "no", "never", "doesn't", "don't", "isn't", "aren't", "barely", "hardly"];

/**
 * Проверяет, есть ли отрицание перед ключевым словом
 * @param {string} text - Текст отзыва
 * @param {number} position - Позиция ключевого слова
 * @returns {boolean} - true если есть отрицание в пределах 3 слов перед keyword
 */
function hasNegationBefore(text, position) {
  const beforeText = text.substring(Math.max(0, position - 20), position);
  return NEGATION_WORDS.some(neg => beforeText.includes(neg));
}

/**
 * Извлекает сигналы из отзывов с учетом категории
 *
 * @param {Array} snippets - Массив отзывов [{snippet: string, source: string}]
 * @param {string} category - Категория: 'drill'|'headphones'|'laptop'|'phone'
 * @returns {Object} - {positive_mentions, negative_mentions, trust_score, category_signals}
 */
export function extractSignals(snippets, category = null) {
  if (!snippets || snippets.length === 0) {
    return {
      positive_mentions: 0,
      negative_mentions: 0,
      trust_score: 0,
      category_signals: {}
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;
  const categorySignals = {};

  // Получаем категориальные словари
  const categoryDict = category && CATEGORY_SIGNALS[category]
    ? CATEGORY_SIGNALS[category]
    : { positive: [], negative: [] };

  // Комбинируем общие и категориальные сигналы
  const allPositive = [...GENERAL_POSITIVE, ...categoryDict.positive];
  const allNegative = [...GENERAL_NEGATIVE, ...categoryDict.negative];

  for (const snippet of snippets) {
    const text = snippet.snippet.toLowerCase();

    // Подсчет положительных сигналов
    for (const keyword of allPositive) {
      const position = text.indexOf(keyword);
      if (position !== -1) {
        // Проверяем отрицание
        if (hasNegationBefore(text, position)) {
          // "not durable" считается как негативный сигнал
          negativeCount += 1;
        } else {
          positiveCount += 1;
        }

        // Записываем категориальный сигнал
        if (categoryDict.positive.includes(keyword)) {
          categorySignals[keyword] = (categorySignals[keyword] || 0) + 1;
        }
      }
    }

    // Подсчет негативных сигналов
    for (const keyword of allNegative) {
      const position = text.indexOf(keyword);
      if (position !== -1) {
        // Для негативных слов отрицание делает их позитивными
        if (hasNegationBefore(text, position)) {
          // "not slow" считается как положительный сигнал
          positiveCount += 1;
        } else {
          negativeCount += 1;
        }

        // Записываем категориальный сигнал
        if (categoryDict.negative.includes(keyword)) {
          categorySignals[keyword] = (categorySignals[keyword] || 0) + 1;
        }
      }
    }
  }

  // Trust score учитывает количество И качество источников
  const uniqueSources = new Set(snippets.map(s => s.source || s.url || 'unknown')).size;
  const trustScore = Math.log(snippets.length + 1) * (1 + uniqueSources * 0.1);

  return {
    positive_mentions: positiveCount,
    negative_mentions: negativeCount,
    trust_score: trustScore,
    category_signals: categorySignals,
    sentiment_ratio: positiveCount + negativeCount > 0
      ? positiveCount / (positiveCount + negativeCount)
      : 0.5
  };
}

/**
 * Возвращает топ-N наиболее упомянутых категориальных сигналов
 *
 * @param {Object} categorySignals - Результат extractSignals().category_signals
 * @param {number} topN - Количество топовых сигналов
 * @returns {Array} - [{keyword, count}]
 */
export function getTopCategorySignals(categorySignals, topN = 5) {
  return Object.entries(categorySignals)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Возвращает список доступных категорий
 */
export function getSupportedCategories() {
  return Object.keys(CATEGORY_SIGNALS);
}

/**
 * Возвращает количество keywords для категории
 */
export function getCategoryKeywordCount(category) {
  if (!CATEGORY_SIGNALS[category]) {
    return 0;
  }

  return CATEGORY_SIGNALS[category].positive.length +
         CATEGORY_SIGNALS[category].negative.length;
}
