import { v4 as uuidv4 } from "uuid";
import productFetcher from "./modules/productFetcher.js";
import db from "./modules/database.js";
import trustScore from "./modules/trustScore.js";

console.log("\n" + "=".repeat(80));
console.log("🧪 OPTIMARKET Integration Test - Full Pipeline");
console.log("=".repeat(80));

// === ТЕСТ 1: Web Scraper & Database ===
async function testWebScraper() {
  console.log("\n\n📦 TEST 1: Web Scraper & Database\n");

  const categories = ["drills", "headphones"];

  for (const category of categories) {
    console.log(`\n[${category.toUpperCase()}]`);

    // Генерируем mock-товары
    const products = await productFetcher.generateMockProducts(category, 15);
    console.log(`  ✅ Generated ${products.length} mock products`);

    // Сохраняем в БД
    const saved = await productFetcher.saveProductsToDB(products, category);
    console.log(`  ✅ Saved ${saved} products to database`);

    // Получаем из БД
    const dbProducts = db.getProductsByCategory(category, 10);
    console.log(`  ✅ Retrieved ${dbProducts.length} products from database`);

    if (dbProducts.length > 0) {
      console.log(`     Sample: ${dbProducts[0].name} - €${dbProducts[0].price_eur}`);
    }
  }
}

// === ТЕСТ 2: Trust Score Algorithm ===
async function testTrustScore() {
  console.log("\n\n🏆 TEST 2: Trust Score Algorithm\n");

  // Создаём mock отзывы
  const mockSnippets = [
    "Bosch GSR 18V-110 is incredibly reliable and durable. Professional quality chuck with excellent precision.",
    "Powerful motor, metal chuck, long-lasting battery. Highly recommended for professionals.",
    "Could be stronger, but overall good quality. Solid construction.",
    "Not noisy, works perfectly. Great value for drilling needs.",
    "Disappointing thermal issues, but strong torque compensation."
  ];

  const product = {
    id: uuidv4(),
    name: "Bosch GSR 18V-110",
    brand: "Bosch",
    price_eur: 249,
    rating: 4.5,
    review_count: 156,
    return_rate_percent: 3
  };

  console.log(`  Product: ${product.name} (${product.brand})`);
  console.log(`  Price: €${product.price_eur}`);
  console.log(`  Rating: ${product.rating}/5 (${product.review_count} reviews)`);

  // Генерируем Trust Report
  const report = trustScore.generateTrustReport(product, mockSnippets, "drills");

  console.log(`\n  📊 TRUST SCORE BREAKDOWN:`);
  console.log(`     Overall Trust Score: ${report.overall_trust_score}/100 🎯`);
  console.log(`     ├─ Signal Quality: ${report.breakdown.signal_quality}%`);
  console.log(`     ├─ Review Volume: ${Math.round(report.breakdown.review_volume)}%`);
  console.log(`     ├─ Rating Score: ${Math.round(report.breakdown.rating * 20)}%`);
  console.log(`     ├─ Brand Reputation: ${(report.breakdown.brand_reputation * 100).toFixed(0)}%`);
  console.log(`     └─ Return Rate Score: ${(report.breakdown.return_rate_score * 100).toFixed(0)}%`);

  console.log(`\n  🔍 SIGNAL ANALYSIS:`);
  console.log(`     Positive Signals: ${report.signals.positive_signals}`);
  console.log(`     Negative Signals: ${report.signals.negative_signals}`);
  console.log(`     Matched Keywords: ${report.signals.matched_keywords.positive.length} positive, ${report.signals.matched_keywords.negative.length} negative`);

  // Сохраняем в БД
  trustScore.saveTrustScoreToDB(report);
  console.log(`\n  ✅ Trust report saved to database`);
}

// === ТЕСТ 3: Ranking Products (E/O/P) ===
async function testProductRanking() {
  console.log("\n\n📈 TEST 3: Product Ranking (E/O/P)\n");

  const category = "drills";
  const products = db.getProductsByCategory(category, 15);

  console.log(`  Ranking ${products.length} products from database...`);

  // Генерируем mock отзывы для каждого товара
  const mockSnippetsLibrary = [
    ["Excellent durability", "Reliable motor", "Professional quality"],
    ["Good value", "Solid construction", "Works well"],
    ["Budget option", "Basic functionality", "Acceptable quality"],
    ["Cheap plastic", "weak torque", "breaks easily"],
    ["Powerful and precise", "durable metal chuck", "professional grade"]
  ];

  const snippetsMap = {};
  for (const product of products) {
    snippetsMap[product.id] = mockSnippetsLibrary[
      Math.floor(Math.random() * mockSnippetsLibrary.length)
    ];
  }

  // Ранжируем
  const ranked = trustScore.rankProducts(products, snippetsMap, category);

  console.log(`\n  🏆 PREMIUM (Best Quality):`);
  ranked.premium.slice(0, 3).forEach((p, idx) => {
    console.log(`     ${idx + 1}. ${p.name} - Trust: ${p.trust_score}/100 - €${p.price_eur}`);
  });

  console.log(`\n  ⭐ OPTIMUM (Best Value):`);
  ranked.optimum.slice(0, 3).forEach((p, idx) => {
    console.log(`     ${idx + 1}. ${p.name} - Trust: ${p.trust_score}/100 - €${p.price_eur}`);
  });

  console.log(`\n  💰 ECONOMY (Budget):`);
  ranked.economy.slice(0, 3).forEach((p, idx) => {
    console.log(`     ${idx + 1}. ${p.name} - Trust: ${p.trust_score}/100 - €${p.price_eur}`);
  });
}

// === ТЕСТ 4: User Searches & Feedback ===
async function testUserTracking() {
  console.log("\n\n👤 TEST 4: User Tracking & Feedback\n");

  const userId = uuidv4();
  const user = {
    id: userId,
    email: "test@optimarket.com",
    telegram_id: 123456789,
    preferences: { categories: ["drills", "headphones"] }
  };

  db.addOrUpdateUser(user);
  console.log(`  ✅ User created: ${user.email}`);

  // Логируем поиск
  const searchId = uuidv4();
  db.logSearch({
    id: searchId,
    user_id: userId,
    query: "best cordless drill",
    category: "drills",
    results_count: 15,
    clicked_product_id: null
  });
  console.log(`  ✅ Search logged: "best cordless drill"`);

  // Получаем рекомендации
  const products = db.getProductsByCategory("drills", 5);
  if (products.length > 0) {
    // Сохраняем отзыв
    const feedbackId = uuidv4();
    db.saveFeedback({
      id: feedbackId,
      search_id: searchId,
      user_id: userId,
      product_id: products[0].id,
      level: "premium",
      rating: 5,
      comment: "Perfect recommendation! Exactly what I needed."
    });
    console.log(`  ✅ Feedback saved: 5/5 rating for "${products[0].name}"`);
  }

  // Получаем историю поиска пользователя
  const history = db.getSearchHistory(userId);
  console.log(`  ✅ Search history: ${history.length} searches`);
}

// === ТЕСТ 5: Price Tracking ===
async function testPriceTracking() {
  console.log("\n\n💰 TEST 5: Price Tracking & Alerts\n");

  const products = db.getProductsByCategory("drills", 5);

  if (products.length > 0) {
    const product = products[0];

    // Добавляем цены в историю
    for (let i = 0; i < 5; i++) {
      const price = product.price_eur + (Math.random() - 0.5) * 30;
      db.addPriceRecord(product.id, price, product.price_eur);
    }

    const history = db.getPriceHistory(product.id);
    console.log(`  ✅ Price history recorded: ${history.length} entries`);

    if (history.length >= 2) {
      console.log(`     Latest: €${history[0].price_eur}`);
      console.log(`     Earliest: €${history[history.length - 1].price_eur}`);
      console.log(`     Change: ${Math.round((history[0].price_change || 0) * 10) / 10}%`);
    }

    // Создаём подписку на alert
    const userId = uuidv4();
    db.subscribeToPriceAlert(userId, product.id, product.price_eur * 0.9);
    console.log(`  ✅ Price alert subscription created (trigger at €${product.price_eur * 0.9})`);

    const subscriptions = db.getActiveSubscriptions(product.id);
    console.log(`  ✅ Active subscriptions: ${subscriptions.length}`);
  }
}

// === АНАЛИТИКА ===
async function testAnalytics() {
  console.log("\n\n📊 TEST 6: Analytics & Reports\n");

  // Топ категории по поискам
  const topCategories = db.getTopSearchedCategories(5);
  console.log(`  Top searched categories:`, topCategories || "No data yet");

  // Рейтинг по категориям
  const drillsRating = db.getAverageRatingByCategory("drills");
  console.log(`  Average rating for drills:`, drillsRating || "No feedback yet");

  // Статистика по товарам
  const allDrills = db.getProductsByCategory("drills", 100);
  console.log(`  Total drills in database: ${allDrills.length}`);

  if (allDrills.length > 0) {
    const avgPrice = (allDrills.reduce((sum, p) => sum + p.price_eur, 0) / allDrills.length).toFixed(2);
    const avgRating = (allDrills.reduce((sum, p) => sum + p.rating, 0) / allDrills.length).toFixed(2);
    console.log(`  Average price: €${avgPrice}`);
    console.log(`  Average rating: ${avgRating}/5`);
  }
}

// === ГЛАВНЫЙ ТЕСТ ===
async function main() {
  try {
    await testWebScraper();
    await testTrustScore();
    await testProductRanking();
    await testUserTracking();
    await testPriceTracking();
    await testAnalytics();

    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("\n📊 Database location: optimarket.db");
    console.log("📚 Check database with: sqlite3 optimarket.db");
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  }
}

main();
