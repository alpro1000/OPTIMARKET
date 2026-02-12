// Analytics Module - Price analysis, trends, statistics
// Location: modules/analytics.js

import db from "./database.js";

class AnalyticsEngine {
  /**
   * Get price statistics for a category
   */
  getPriceStats(category) {
    const products = db.getProductsByCategory(category, 1000);

    if (products.length === 0) {
      return {
        category,
        total_products: 0,
        error: "No products found"
      };
    }

    // Extract prices
    const prices = products
      .map((p) => {
        // Handle both RUB and EUR currencies
        if (p.currency === "EUR") {
          return p.price * 100; // Convert EUR to RUB (approx)
        }
        return p.price;
      })
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return { category, total_products: products.length, error: "No valid prices" };
    }

    // Calculate stats
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const min = prices[0];
    const max = prices[prices.length - 1];
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];

    // Calculate standard deviation
    const variance = prices.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Price distribution (create bins)
    const binCount = 10;
    const binSize = (max - min) / binCount;
    const distribution = Array(binCount).fill(0);

    prices.forEach((price) => {
      const binIndex = Math.floor((price - min) / binSize);
      if (binIndex < binCount) {
        distribution[binIndex]++;
      }
    });

    // Rating stats
    const ratings = products
      .map((p) => p.rating)
      .filter((r) => r > 0)
      .sort((a, b) => b - a);

    return {
      category,
      total_products: products.length,
      price_stats: {
        currency: "RUB",
        count: prices.length,
        average: Math.round(avg),
        median: Math.round(median),
        min: Math.round(min),
        max: Math.round(max),
        q1: Math.round(q1),
        q3: Math.round(q3),
        std_dev: Math.round(stdDev),
        range: Math.round(max - min)
      },
      price_distribution: distribution,
      rating_stats: {
        average: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
        median: ratings[Math.floor(ratings.length / 2)],
        min: Math.min(...ratings),
        max: Math.max(...ratings)
      }
    };
  }

  /**
   * Get top products by rating
   */
  getTopByRating(category, limit = 5) {
    const products = db.getProductsByCategory(category, 1000);

    return products
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map((p) => ({
        name: p.name,
        price: p.price,
        rating: p.rating,
        reviews: p.review_count,
        source: p.source
      }));
  }

  /**
   * Get value curve data (price vs rating)
   */
  getValueCurve(category) {
    const products = db.getProductsByCategory(category, 1000);

    // Create scatter plot data
    const data = products
      .filter((p) => p.price > 0 && p.rating > 0)
      .map((p) => ({
        price: p.price,
        rating: p.rating,
        name: p.name,
        id: p.id
      }))
      .sort((a, b) => a.price - b.price);

    // Find inflection point (diminishing returns)
    let maxValueScore = 0;
    let inflectionPoint = null;

    data.forEach((point) => {
      const valueScore = point.rating / Math.max(1, point.price / 1000);
      if (valueScore > maxValueScore) {
        maxValueScore = valueScore;
        inflectionPoint = point;
      }
    });

    // Categorize by value
    const sweet_spot = data.filter(
      (p) => Math.abs(p.rating - 4) < 0.5 && p.price < 10000
    );
    const premium = data.filter(
      (p) => p.rating >= 4.5 && p.price > 10000
    );
    const budget = data.filter((p) => p.price < 2000);

    return {
      category,
      total_points: data.length,
      chart_data: data,
      inflection_point: inflectionPoint,
      sweet_spot_count: sweet_spot.length,
      sweet_spot_avg_price: sweet_spot.length
        ? Math.round(
            sweet_spot.reduce((s, p) => s + p.price, 0) / sweet_spot.length
          )
        : 0,
      premium_count: premium.length,
      budget_count: budget.length
    };
  }

  /**
   * Get all analytics for dashboard
   */
  getDashboard() {
    const categories = ["drills", "headphones", "laptops", "phones"];

    const dashboard = {
      generated_at: new Date().toISOString(),
      categories: {}
    };

    categories.forEach((cat) => {
      dashboard.categories[cat] = {
        stats: this.getPriceStats(cat),
        top_rated: this.getTopByRating(cat, 3),
        value_curve: this.getValueCurve(cat)
      };
    });

    // Calculate global metrics
    const totalProducts = categories.reduce(
      (sum, cat) => sum + (dashboard.categories[cat].stats.total_products || 0),
      0
    );

    const avgPrice = Math.round(
      categories.reduce((sum, cat) => {
        const stats = dashboard.categories[cat].stats;
        return sum + (stats.price_stats?.average || 0);
      }, 0) / categories.length
    );

    dashboard.summary = {
      total_products: totalProducts,
      total_categories: categories.length,
      average_price_rub: avgPrice,
      data_sources: ["ozon.ru", "mock"]
    };

    return dashboard;
  }

  /**
   * Get trending categories
   */
  getTrends() {
    const categories = ["drills", "headphones", "laptops", "phones"];
    const trends = {};

    categories.forEach((cat) => {
      const stats = this.getPriceStats(cat);
      trends[cat] = {
        product_count: stats.total_products,
        avg_price: stats.price_stats?.average || 0,
        avg_rating: stats.rating_stats?.average || 0,
        price_range: {
          min: stats.price_stats?.min || 0,
          max: stats.price_stats?.max || 0
        }
      };
    });

    return trends;
  }
}

// Export singleton
export default new AnalyticsEngine();
