import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "optimarket_data.json");

/**
 * Простая in-memory БД с JSON персистенцией
 * Альтернатива SQLite для Windows без C++ компилятора
 */
class OptimarketDB {
  constructor() {
    this.data = {
      products: [],
      analyses: [],
      users: [],
      searches: [],
      feedback: [],
      price_history: [],
      price_subscriptions: []
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      const fileData = await fs.readFile(dbPath, "utf-8");
      this.data = JSON.parse(fileData);
      console.log("✅ Database loaded from disk");
    } catch (error) {
      console.log("📝 Creating new database");
      this.data = {
        products: [],
        analyses: [],
        users: [],
        searches: [],
        feedback: [],
        price_history: [],
        price_subscriptions: []
      };
    }
    this.initialized = true;
  }

  async save() {
    try {
      await fs.writeFile(dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  // === ПРОДУКТЫ ===
  addProduct(product) {
    const existing = this.data.products.find((p) => p.id === product.id);
    if (existing) {
      Object.assign(existing, product);
    } else {
      this.data.products.push(product);
    }
    this.save();
    return { success: true };
  }

  getProductsByCategory(category, limit = 100) {
    return this.data.products
      .filter((p) => p.category === category)
      .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
      .slice(0, limit);
  }

  getProductById(id) {
    return this.data.products.find((p) => p.id === id);
  }

  updateProductPrice(productId, priceEur) {
    const product = this.getProductById(productId);
    if (product) {
      product.price_eur = priceEur;
      product.updated_at = Math.floor(Date.now() / 1000);
      this.save();
    }
    return { success: !!product };
  }

  // === АНАЛИЗЫ ===
  saveAnalysis(analysis) {
    const existing = this.data.analyses.find((a) => a.id === analysis.id);
    if (existing) {
      Object.assign(existing, analysis);
    } else {
      this.data.analyses.push(analysis);
    }
    this.save();
    return { success: true };
  }

  getAnalysisByProductId(productId) {
    return this.data.analyses.find((a) => a.product_id === productId);
  }

  // === ПОЛЬЗОВАТЕЛИ ===
  addOrUpdateUser(user) {
    const existing = this.data.users.find((u) => u.id === user.id);
    if (existing) {
      Object.assign(existing, user);
    } else {
      this.data.users.push(user);
    }
    this.save();
    return { success: true };
  }

  getUserById(userId) {
    return this.data.users.find((u) => u.id === userId);
  }

  getUserByEmail(email) {
    return this.data.users.find((u) => u.email === email);
  }

  // === ПОИСКИ ===
  logSearch(search) {
    this.data.searches.push({
      ...search,
      timestamp: Math.floor(Date.now() / 1000)
    });
    this.save();
    return { success: true };
  }

  getSearchHistory(userId, limit = 20) {
    return this.data.searches
      .filter((s) => s.user_id === userId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  }

  // === ОБРАТНАЯ СВЯЗЬ ===
  saveFeedback(feedback) {
    this.data.feedback.push({
      ...feedback,
      created_at: Math.floor(Date.now() / 1000)
    });
    this.save();
    return { success: true };
  }

  getFeedbackStats(productId) {
    const productFeedback = this.data.feedback.filter(
      (f) => f.product_id === productId
    );

    const stats = {};
    for (const fb of productFeedback) {
      if (!stats[fb.level]) {
        stats[fb.level] = { ratings: [], count: 0 };
      }
      stats[fb.level].ratings.push(fb.rating);
      stats[fb.level].count++;
    }

    return Object.entries(stats).map(([level, data]) => ({
      level,
      avg_rating: data.ratings.reduce((a, b) => a + b, 0) / data.count,
      count: data.count
    }));
  }

  // === ОТСЛЕЖИВАНИЕ ЦЕН ===
  addPriceRecord(productId, priceEur, priceOriginal) {
    const priceChange = priceOriginal
      ? ((priceEur - priceOriginal) / priceOriginal) * 100
      : 0;

    this.data.price_history.push({
      id: `${productId}_${Date.now()}`,
      product_id: productId,
      price_eur: priceEur,
      price_original: priceOriginal,
      price_change: priceChange,
      checked_at: Math.floor(Date.now() / 1000),
      alert_sent: false
    });

    this.save();
    return { success: true };
  }

  getLatestPrice(productId) {
    const prices = this.data.price_history
      .filter((p) => p.product_id === productId)
      .sort((a, b) => (b.checked_at || 0) - (a.checked_at || 0));
    return prices[0] || null;
  }

  getPriceHistory(productId) {
    return this.data.price_history
      .filter((p) => p.product_id === productId)
      .sort((a, b) => (b.checked_at || 0) - (a.checked_at || 0))
      .slice(0, 30);
  }

  // === ПОДПИСКИ НА ЦЕНЫ ===
  subscribeToPriceAlert(userId, productId, threshold) {
    const existing = this.data.price_subscriptions.find(
      (s) => s.user_id === userId && s.product_id === productId
    );

    if (!existing) {
      this.data.price_subscriptions.push({
        id: `${userId}_${productId}_alert`,
        user_id: userId,
        product_id: productId,
        threshold,
        notified: false,
        created_at: Math.floor(Date.now() / 1000)
      });
      this.save();
    }

    return { success: true };
  }

  unsubscribeFromAlert(userId, productId) {
    const idx = this.data.price_subscriptions.findIndex(
      (s) => s.user_id === userId && s.product_id === productId
    );

    if (idx >= 0) {
      this.data.price_subscriptions.splice(idx, 1);
      this.save();
    }

    return { success: idx >= 0 };
  }

  getActiveSubscriptions(productId) {
    return this.data.price_subscriptions.filter(
      (s) => s.product_id === productId && !s.notified
    );
  }

  markAlertAsSent(subscriptionId) {
    const subscription = this.data.price_subscriptions.find(
      (s) => s.id === subscriptionId
    );
    if (subscription) {
      subscription.notified = true;
      this.save();
    }
    return { success: !!subscription };
  }

  // === АНАЛИТИКА ===
  getTopSearchedCategories(limit = 10) {
    const categories = {};

    for (const search of this.data.searches) {
      if (search.category) {
        categories[search.category] = (categories[search.category] || 0) + 1;
      }
    }

    return Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getAverageRatingByCategory(category) {
    const products = this.data.products.filter((p) => p.category === category);
    const productIds = products.map((p) => p.id);

    const categoryFeedback = this.data.feedback.filter((f) =>
      productIds.includes(f.product_id)
    );

    if (categoryFeedback.length === 0) {
      return null;
    }

    const avgRating =
      categoryFeedback.reduce((sum, f) => sum + f.rating, 0) /
      categoryFeedback.length;

    return {
      avg_rating: avgRating,
      count: categoryFeedback.length
    };
  }

  close() {
    // JSON DB doesn't need explicit closing
  }
}

const db = new OptimarketDB();
await db.initialize();

export default db;
