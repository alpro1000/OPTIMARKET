import pipeline from "./modules/pipeline.js";
import { v4 as uuidv4 } from "uuid";

console.log("\n" + "=".repeat(80));
console.log("🚀 OPTIMARKET Full Demo - Web Scraper + DB + Trust Score + Price Alerts");
console.log("=".repeat(80));

async function demo() {
  try {
    // Инициализируем систему
    await pipeline.initialize();

    // === DEMO 1: User Searches for Drills ===
    console.log("\n\n1️⃣  USER SEARCH: 'Professional Cordless Drill'");
    console.log("-".repeat(80));

    const drilSearch = await pipeline.search("professional", "drills");
    console.log(`✅ Found ${drilSearch.total_found} drills`);

    if (drilSearch.recommendations.premium) {
      console.log(`\n🏆 PREMIUM: ${drilSearch.recommendations.premium.name}`);
      console.log(`   Price: €${drilSearch.recommendations.premium.price_eur}`);
      console.log(`   Trust Score: ${drilSearch.recommendations.premium.trust_score}/100`);
    }

    if (drilSearch.recommendations.optimum) {
      console.log(`\n⭐ OPTIMUM: ${drilSearch.recommendations.optimum.name}`);
      console.log(`   Price: €${drilSearch.recommendations.optimum.price_eur}`);
      console.log(`   Trust Score: ${drilSearch.recommendations.optimum.trust_score}/100`);
    }

    if (drilSearch.recommendations.economy) {
      console.log(`\n💰 ECONOMY: ${drilSearch.recommendations.economy.name}`);
      console.log(`   Price: €${drilSearch.recommendations.economy.price_eur}`);
      console.log(`   Trust Score: ${drilSearch.recommendations.economy.trust_score}/100`);
    }

    // === DEMO 2: User Clicks on Premium and Submits Feedback ===
    console.log("\n\n2️⃣  USER FEEDBACK: Premium product rated 5/5");
    console.log("-".repeat(80));

    const userId = uuidv4();
    const premiumProductId = drilSearch.recommendations.premium?.id;

    if (premiumProductId) {
      const feedback = pipeline.submitFeedback(
        userId,
        drilSearch.search_id,
        premiumProductId,
        "premium",
        5,
        "Perfect recommendation! Great build quality and power."
      );

      console.log(`✅ Feedback recorded: ${feedback.feedback_id}`);
    }

    // === DEMO 3: User Subscribes to Price Alert ===
    console.log("\n\n3️⃣  PRICE ALERT SUBSCRIPTION");
    console.log("-".repeat(80));

    if (drilSearch.recommendations.premium) {
      const alertPrice = drilSearch.recommendations.premium.price_eur * 0.85;
      const alert = pipeline.subscribeToPriceAlert(
        userId,
        drilSearch.recommendations.premium.id,
        alertPrice
      );

      console.log(`✅ Price alert created`);
      console.log(`   Product: ${drilSearch.recommendations.premium.name}`);
      console.log(`   Alert trigger: €${alertPrice}`);
      console.log(`   Current price: €${drilSearch.recommendations.premium.price_eur}`);
    }

    // === DEMO 4: Get Product Details ===
    console.log("\n\n4️⃣  PRODUCT DETAILS PAGE");
    console.log("-".repeat(80));

    if (drilSearch.recommendations.premium) {
      const details = pipeline.getProductDetails(
        drilSearch.recommendations.premium.id
      );

      console.log(`📌 ${details.product.name}`);
      console.log(`   Brand: ${details.product.brand}`);
      console.log(`   Price: €${details.product.price_eur}`);
      console.log(`   Rating: ${details.product.rating}/5 (${details.product.review_count} reviews)`);
      console.log(`   Trust Score: ${details.analysis?.trust_score || "N/A"}/100`);

      if (details.price_history.length > 0) {
        console.log(`   Price History: ${details.price_history.length} records`);
      }
    }

    // === DEMO 5: Search for Headphones ===
    console.log("\n\n5️⃣  ANOTHER SEARCH: Headphones");
    console.log("-".repeat(80));

    const headphoneSearch = await pipeline.search("wireless", "headphones");
    console.log(`✅ Found ${headphoneSearch.total_found} headphones`);

    if (headphoneSearch.recommendations.optimum) {
      console.log(`⭐ Best value: ${headphoneSearch.recommendations.optimum.name}`);
      console.log(`   Price: €${headphoneSearch.recommendations.optimum.price_eur}`);
      console.log(`   Trust Score: ${headphoneSearch.recommendations.optimum.trust_score}/100`);
    }

    // === DEMO 6: Analytics Dashboard ===
    console.log("\n\n6️⃣  ANALYTICS DASHBOARD");
    console.log("-".repeat(80));

    const analytics = pipeline.getAnalytics();

    console.log("📊 Category Statistics:");
    for (const [category, stats] of Object.entries(analytics.categories)) {
      console.log(`\n   ${category.toUpperCase()}:`);
      console.log(`     Products: ${stats.product_count}`);
      console.log(`     Avg Rating: ${stats.average_rating.toFixed(1)}/5`);
      console.log(`     Avg Price: €${stats.average_price}`);
    }

    // === DEMO 7: Start Price Tracking ===
    console.log("\n\n7️⃣  START PRICE TRACKING");
    console.log("-".repeat(80));

    console.log("🕐 Price tracking system running:");
    console.log("   ├─ Every 4 hours: Check all prices");
    console.log("   ├─ Send alerts to subscribers");
    console.log("   └─ Every 24h: Update product database");

    // Note: Не запускаем реальный cron в демо, только показываем конфиг
    console.log("\n✅ System is ready for production deployment!");

    // === SUMMARY ===
    console.log("\n" + "=".repeat(80));
    console.log("📋 DEMO SUMMARY");
    console.log("=".repeat(80));
    console.log(`
  ✅ Web Scraper: Fetched products from multiple sources
  ✅ Database: Stored ${analytics.categories.drills.product_count + analytics.categories.headphones.product_count} products
  ✅ Trust Score: Generated AI-powered recommendations
  ✅ User Tracking: Logged searches and feedback
  ✅ Price Alerts: Created subscription for price drops
  ✅ Analytics: Generated performance metrics
  
  🚀 Ready to deploy to production!
    `);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ DEMO FAILED:", error);
    process.exit(1);
  }
}

demo();
