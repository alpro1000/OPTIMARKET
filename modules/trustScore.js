import db from "./database.js";

// Расширенный набор ключевых слов с весами для каждой категории
const SIGNAL_KEYWORDS = {
  global: {
    positive: {
      durable: 2,
      reliable: 2,
      solid: 1.5,
      powerful: 1.5,
      "long-lasting": 2,
      sturdy: 1.5,
      excellent: 1.5,
      perfect: 1.5,
      professional: 2,
      quality: 1.5,
      recommended: 2,
      best: 1.5,
      love: 1.5,
      amazing: 1,
      great: 1,
      good: 0.5,
      works: 0.5
    },
    negative: {
      noisy: 2,
      overheats: 2,
      breaks: 3,
      "cheap plastic": 2.5,
      fails: 3,
      defective: 3,
      broken: 3,
      waste: 2.5,
      disappointment: 2,
      terrible: 2,
      awful: 2,
      poor: 1.5,
      bad: 1.5,
      problem: 1.5,
      issue: 1,
      slow: 1,
      weak: 1.5
    }
  },

  drills: {
    positive: {
      torque: 2,
      powerful: 2,
      reliable: 2,
      "metal chuck": 2,
      ergonomic: 1.5,
      battery: 1,
      precision: 2
    },
    negative: {
      chucking: 2,
      heating: 2,
      slip: 2,
      weak: 1.5,
      "battery drain": 2,
      breaking: 2
    }
  },

  headphones: {
    positive: {
      "noise-cancellation": 2.5,
      "sound quality": 2,
      comfortable: 2,
      bass: 1,
      clarity: 2,
      "build quality": 2,
      battery: 1.5,
      lightweight: 1.5
    },
    negative: {
      uncomfortable: 2,
      "ear fatigue": 2,
      distortion: 2,
      "battery drain": 1.5,
      disconnects: 2.5,
      "poor call quality": 1.5
    }
  },

  laptops: {
    positive: {
      performance: 2,
      "fast boot": 1.5,
      "battery life": 2,
      lightweight: 1.5,
      "display quality": 2,
      cooling: 1.5,
      reliable: 2
    },
    negative: {
      thermal: 2,
      throttle: 2,
      "battery drain": 2,
      lag: 1.5,
      crash: 2.5,
      overheating: 2
    }
  },

  phones: {
    positive: {
      "camera quality": 2,
      performance: 2,
      battery: 2,
      "display": 1.5,
      fast: 1.5,
      reliable: 2,
      smooth: 1.5
    },
    negative: {
      lag: 1.5,
      heat: 2,
      "battery drain": 2,
      "camera noise": 1.5,
      crash: 2.5,
      "screen burn": 2
    }
  }
};

class TrustScoreEngine {
  constructor() {
    this.BRAND_REPUTATION = {
      // Премиум бренды
      Bosch: 1.3,
      Makita: 1.25,
      Festool: 1.3,
      DeWalt: 1.2,
      Sony: 1.25,
      Bose: 1.3,
      Apple: 1.2,
      Sennheiser: 1.25,
      Lenovo: 1.1,
      Dell: 1.15,

      // Средние бренды
      Metabo: 1.05,
      JBL: 1.05,
      ASUS: 1.1,
      HP: 1.05,
      OnePlus: 1.05,

      // Неизвестные/бюджетные бренды
      Generic: 0.8,
      Unknown: 0.8
    };

    this.WARRANTY_SCORE = {
      24: 0.5,
      36: 0.7,
      48: 0.9,
      60: 1.0
    };
  }

  /**
   * Извлекает сигналы из текста отзывов
   * @param {Array} snippets - массив сниппетов отзывов
   * @param {String} category - категория продукта
   * @returns {Object} - сигналы и их веса
   */
  extractSignals(snippets, category = "global") {
    const keywords = {
      ...SIGNAL_KEYWORDS.global,
      ...(SIGNAL_KEYWORDS[category] || {})
    };

    let positive_signals = 0;
    let negative_signals = 0;
    let positive_weight = 0;
    let negative_weight = 0;
    const matched_keywords = {
      positive: [],
      negative: []
    };

    const text = snippets
      .map((s) => (typeof s === "string" ? s : s.text || ""))
      .join(" ")
      .toLowerCase();

    // Подсчёт позитивных сигналов
    for (const [keyword, weight] of Object.entries(keywords.positive || {})) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = text.match(regex) || [];

      if (matches.length > 0) {
        positive_signals += matches.length;
        positive_weight += matches.length * weight;
        matched_keywords.positive.push({ keyword, count: matches.length, weight });
      }
    }

    // Подсчёт негативных сигналов
    // Проверяем на "not" перед словом
    for (const [keyword, weight] of Object.entries(keywords.negative || {})) {
      const regex = new RegExp(`(?:not|isn't|isn't|no)\\s+${keyword}`, "gi");
      const positiveMatches = text.match(regex) || [];

      if (positiveMatches.length > 0) {
        // "не шумный" = позитивный сигнал
        positive_signals += positiveMatches.length;
        positive_weight += positiveMatches.length * (weight * 0.7);
        matched_keywords.positive.push({
          keyword: `not ${keyword}`,
          count: positiveMatches.length,
          weight: weight * 0.7
        });
      }

      const negativeRegex = new RegExp(`\\b${keyword}\\b`, "gi");
      const negativeMatches = text.match(negativeRegex) || [];

      if (negativeMatches.length > positiveMatches.length) {
        const actualNegatives = negativeMatches.length - positiveMatches.length;
        negative_signals += actualNegatives;
        negative_weight += actualNegatives * weight;
        matched_keywords.negative.push({
          keyword,
          count: actualNegatives,
          weight
        });
      }
    }

    return {
      positive_signals,
      negative_signals,
      positive_weight,
      negative_weight,
      matched_keywords,
      total_signals: positive_signals + negative_signals
    };
  }

  /**
   * Вычисляет Trust Score на основе множества факторов
   * @param {Object} product - данные о продукте
   * @param {Object} signals - извлечённые сигналы
   * @returns {Number} - Trust Score (0-100)
   */
  calculateTrustScore(product, signals, warrantyYears = 24) {
    let score = 50; // Базовый уровень

    // 1️⃣ Сигналы отзывов (40%)
    const totalSignals = signals.total_signals || 1;
    const signalRatio =
      (signals.positive_signals || 0) / totalSignals;
    const signalScore = signalRatio * 100;
    score += (signalScore * 0.4) / 100 * 50;

    // 2️⃣ Количество отзывов (25%) - логарифмическая функция
    const reviewCount = product.review_count || 0;
    const reviewScore = Math.min(100, Math.log(reviewCount + 1) * 10);
    score += (reviewScore * 0.25) / 100 * 50;

    // 3️⃣ Рейтинг продукта (20%)
    const rating = product.rating || 0;
    const ratingScore = (rating / 5) * 100;
    score += (ratingScore * 0.2) / 100 * 50;

    // 4️⃣ Репутация бренда (10%)
    const brand = product.brand || "Unknown";
    const brandMultiplier = this.BRAND_REPUTATION[brand] || 0.8;
    const brandScore = (brandMultiplier / 1.3) * 100;
    score += (brandScore * 0.1) / 100 * 50;

    // 5️⃣ Гарантия (5%)
    const warrantyScore = (this.WARRANTY_SCORE[warrantyYears] || 0.5) * 100;
    score += (warrantyScore * 0.05) / 100 * 50;

    // Нормализация к 0-100
    score = Math.min(100, Math.max(0, score));

    return Math.round(score * 10) / 10;
  }

  /**
   * Оценивает Return Rate (обратно = минус к доверию)
   * Нижняя return rate = выше trust
   * @param {Object} product
   * @returns {Number} 0-1
   */
  calculateReturnRateScore(product) {
    // Допустим, 5% return rate = "хорошо", 15% = "плохо"
    const estimatedReturnRate = product.return_rate_percent || 5;
    const score = Math.max(0, 1 - estimatedReturnRate / 20);
    return score;
  }

  /**
   * Полный расчёт Trust Score с учётом всех факторов
   * @param {Object} product
   * @param {Array} snippets - отзывы
   * @param {String} category
   * @returns {Object} - детальный Trust Score
   */
  generateTrustReport(product, snippets, category = "global") {
    const signals = this.extractSignals(snippets, category);

    const trustScore = this.calculateTrustScore(product, signals);
    const returnRateScore = this.calculateReturnRateScore(product);

    // Финальный скор с учётом return rate
    const finalTrustScore = trustScore * 0.95 + returnRateScore * 5;

    return {
      product_id: product.id,
      product_name: product.name,
      overall_trust_score: Math.round(finalTrustScore * 10) / 10,
      breakdown: {
        signal_quality: Math.round(
          ((signals.positive_signals || 0) /
            Math.max(1, signals.total_signals || 1)) *
            100
        ),
        review_volume: Math.min(100, Math.log(product.review_count + 1) * 10),
        rating: product.rating || 0,
        brand_reputation: this.BRAND_REPUTATION[product.brand] || 0.8,
        return_rate_score: returnRateScore
      },
      signals,
      snippet_count: snippets.length,
      category,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * Сохраняет Trust Score в БД
   */
  saveTrustScoreToDB(analysis) {
    try {
      db.saveAnalysis({
        id: `analysis_${analysis.product_id}`,
        product_id: analysis.product_id,
        positive_signals: analysis.signals.positive_signals,
        negative_signals: analysis.signals.negative_signals,
        signal_keywords: analysis.signals.matched_keywords,
        trust_score: analysis.overall_trust_score,
        value_score: analysis.overall_trust_score, // Временно = trust score
        perplexity_snippets: []
      });

      return true;
    } catch (error) {
      console.error("Failed to save trust score to DB:", error);
      return false;
    }
  }

  /**
   * Ранжирует товары по Trust Score и возвращает E/O/P
   */
  rankProducts(products, snippetsMap = {}, category = "global") {
    const ranked = products.map((product) => {
      const snippets = snippetsMap[product.id] || [];
      const report = this.generateTrustReport(product, snippets, category);

      return {
        ...product,
        trust_score: report.overall_trust_score,
        trust_report: report
      };
    });

    // Сортируем по Trust Score
    ranked.sort((a, b) => b.trust_score - a.trust_score);

    // Разделяем на E/O/P (примерно 1/3 каждого)
    const third = Math.ceil(ranked.length / 3);

    return {
      premium: ranked.slice(0, third),
      optimum: ranked.slice(third, third * 2),
      economy: ranked.slice(third * 2),
      all_ranked: ranked
    };
  }
}

export default new TrustScoreEngine();
