import fs from "fs";
import { fetchReviews } from "./modules/perplexity.js";
import { generateExplanation } from "./modules/gemini.js";

const products = JSON.parse(fs.readFileSync("./products.json", "utf8"));
const results = [];

async function main() {
  console.log("🚀 Starting AI Hybrid Analysis (Perplexity + Gemini)...");

  for (const product of products) {
    console.log(`\n🔍 Fetching reviews for: ${product.name}`);
    const reviews = await fetchReviews(product.query);
    console.log(`   ✅ Got ${(reviews || "").length} chars of review data`);

    const description = await generateExplanation(product, reviews);
    console.log(`   ✍️  ${product.tier}: ${description}`);

    results.push({
      id: product.id,
      name: product.name,
      tier: product.tier,
      description
    });
  }

  fs.writeFileSync("./descriptions.json", JSON.stringify(results, null, 2));
  console.log("\n💾 Saved → descriptions.json");
}

main().catch((error) => {
  console.error("❌ Generation failed:", error);
  process.exitCode = 1;
});
