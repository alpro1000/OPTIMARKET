import { v4 as uuidv4 } from "uuid";
import db from "./database.js";
import productFetcher from "./productFetcher.js";
import trustScore from "./trustScore.js";
import priceTracker from "./priceTracker.js";

class OptimarketPipeline {
  constructor() {
    this.initialized = false;
  }

  /**
   * Инициализирует систему
   */
  async initialize() {
    console.log("🚀 Initializing OPTIMARKET Pipeline...");

    // Проверяем наличие товаров в БД
    const categories = ["drills", "headphones", "laptops", "phones"];
    let totalProducts = 0;

    for (const category of categories) {
      const count = db.getProductsByCategory(category, 1).length;
      totalProducts += count;
    }

    if (totalProducts === 0) {
      console.log("📦 First run detected. Populating database with initial products...");
      await this.populateInitialData();
    }

    this.initialized = true;
    console.log("✅ Pipeline initialized!");
  }

  /**
   * Заполняет БД начальными данными
   */
  async populateInitialData() {
    const categories = ["drills", "headphones", "laptops", "phones"];

    for (const category of categories) {
      console.log(`  Fetching ${category}...`);
      await productFetcher.fetchAndSave(category, false);
    }

    console.log("✅ Initial data loaded!");
  }

  /**
   * Полный поиск с рекомендациями
   */
  async search(query, category) {
    if (!this.initialized) await this.initialize();

    console.log(`\n🔍 Searching: "${query}" in "${category}"`);

    // Получаем все товары в категории
    let products = db.getProductsByCategory(category, 100);

    // Если фильтра нет - берем все, иначе фильтруем по названию/бренду
    if (query && query.length > 0) {
      const queryLower = query.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.brand.toLowerCase().includes(queryLower)
      );
    }

    if (products.length === 0) {
      console.log(`  ❌ No products found, showing all ${category}s`);
      products = db.getProductsByCategory(category, 100);
    }

    console.log(`  Found ${products.length} products`);

    // Генерируем Trust Scores
    const snippetsMap = this._generateMockSnippets(products, category);

    const ranked = trustScore.rankProducts(products, snippetsMap, category);

    // Выбираем по одному из каждого уровня для вывода
    const recommendations = {
      premium: ranked.premium[0] || null,
      optimum: ranked.optimum[0] || null,
      economy: ranked.economy[0] || null
    };

    // Логируем поиск в БД
    const searchId = uuidv4();
    const userId = "anonymous"; // Или получить из сессии

    db.logSearch({
      id: searchId,
      user_id: userId,
      query,
      category,
      results_count: products.length
    });

    return {
      search_id: searchId,
      query,
      category,
      recommendations,
      all_ranked: ranked.all_ranked.slice(0, 20), // Top 20
      total_found: products.length
    };
  }

  /**
   * Получить детальную информацию о продукте
   */
  getProductDetails(productId) {
    const product = db.getProductById(productId);

    if (!product) {
      return { error: "Product not found" };
    }

    // Получаем анализ Trust Score
    const analysis = db.getAnalysisByProductId(productId);

    // Получаем историю цен
    const priceHistory = priceTracker.getPriceHistory(productId);

    // Получаем отзывы пользователей
    const feedback = this._getProductFeedback(productId);

    return {
      product,
      analysis,
      price_history: priceHistory,
      user_feedback: feedback
    };
  }

  /**
   * Сохранить отзыв пользователя
   */
  submitFeedback(userId, searchId, productId, level, rating, comment) {
    const feedbackId = uuidv4();

    db.saveFeedback({
      id: feedbackId,
      search_id: searchId,
      user_id: userId,
      product_id: productId,
      level,
      rating,
      comment
    });

    console.log(`✅ Feedback saved: ${rating}/5 for product ${productId}`);

    return { success: true, feedback_id: feedbackId };
  }

  /**
   * Подписаться на обновления цены
   */
  subscribeToPriceAlert(userId, productId, thresholdPrice) {
    const product = db.getProductById(productId);

    if (!product) {
      return { error: "Product not found" };
    }

    const result = priceTracker.subscribeToAlert(userId, productId, thresholdPrice);

    return {
      success: result,
      message: `Alert set for €${thresholdPrice} on ${product.name}`
    };
  }

  /**
   * Генерирует статистику для админ-панели
   */
  getAnalytics() {
    const categories = ["drills", "headphones", "laptops", "phones"];
    const stats = {};

    for (const category of categories) {
      const products = db.getProductsByCategory(category, 100);
      const rating = db.getAverageRatingByCategory(category);

      stats[category] = {
        product_count: products.length,
        average_rating: rating?.avg_rating || 0,
        average_price:
          products.length > 0
            ? Math.round(
                (products.reduce((sum, p) => sum + p.price_eur, 0) /
                  products.length) *
                  100
              ) / 100
            : 0
      };
    }

    const topSearched = db.getTopSearchedCategories(5);

    return {
      categories: stats,
      top_searched_categories: topSearched,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Генерирует отчёт об изменении цен
   */
  getPriceReport(category) {
    return priceTracker.generatePriceReport(category);
  }

  /**
   * ВНУТРЕННИЕ МЕТОДЫ ===
   */

  _generateMockSnippets(products, category) {
    const snippetsLibrary = {
      drills: [
        ["Excellent durability", "Reliable motor", "Professional quality"],
        ["Good value", "Solid construction", "Powerful drill"],
        ["Budget option", "Basic but functional", "Acceptable quality"],
        ["Cheap materials", "weak torque", "breaks easily"],
        ["Precise drilling", "durable metal chuck", "professional grade"]
      ],
      headphones: [
        ["Amazing noise cancellation", "Comfortable fit", "Great sound quality"],
        ["Good balance", "Solid build", "Nice comfort"],
        ["Budget friendly", "Basic features", "Average quality"],
        ["Poor isolation", "uncomfortable", "weak bass"],
        ["Premium sound", "excellent clarity", "exceptional comfort"]
      ],
      laptops: [
        ["Fast performance", "Great battery", "Excellent display"],
        ["Good value", "Solid performance", "Nice design"],
        ["Budget laptop", "Basic performance", "Acceptable display"],
        ["Thermal issues", "slow SSD", "heating problems"],
        ["Professional workstation", "powerful processor", "reliable performance"]
      ],
      phones: [
        ["Amazing camera", "Fast processor", "Great display"],
        ["Good value", "Solid camera", "Fast performance"],
        ["Budget option", "Basic features", "Average camera"],
        ["Poor camera", "lag issues", "heating"],
        ["Premium phone", "excellent performance", "professional camera"]
      ]
    };

    const snippets = snippetsLibrary[category] || snippetsLibrary.drills;
    const snippetsMap = {};

    for (const product of products) {
      const randomSnippets =
        snippets[Math.floor(Math.random() * snippets.length)];
      snippetsMap[product.id] = randomSnippets;
    }

    return snippetsMap;
  }

  _getProductFeedback(productId) {
    // В production получать из БД
    return [];
  }

  /**
   * Начать отслеживание цен
   */
  startPriceTracking() {
    console.log("🕐 Starting price tracking system...");

    // Проверяем цены каждые 4 часа
    priceTracker.startPriceCheckSchedule("0 */4 * * *");

    // Обновляем товары каждый день в полночь
    priceTracker.startProductUpdateSchedule("0 0 * * *");

    console.log("✅ Price tracking started!");
  }

  /**
   * Остановить отслеживание цен
   */
  stopPriceTracking() {
    priceTracker.stopSchedules();
    console.log("✅ Price tracking stopped!");
  }
}

export default new OptimarketPipeline();
