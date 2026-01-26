import fs from "fs";
import path from "path";
import { fetchReviewSnippets } from "./modules/perplexity.js";
import { extractSignals } from "./modules/reviewSignals.js";

const INPUT_PATH = "./products.json";
const OUTPUT_PATH = "./reports/mvp-output.json";
const ECONOMY_MIN_THRESHOLD = 0.45;
const PREMIUM_PRICE_RATIO = 0.75;

const products = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

const ensureOutputDir = () => {
  const outputDir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
};

const computeValueScore = (signals, price, stats) => {
  const sentiment =
    (signals.positive_mentions + 1) / (signals.negative_mentions + 1);

  return (
    0.4 * (sentiment / stats.maxSentiment) +
    0.3 * (signals.trust_score / stats.maxTrust) +
    0.3 * (1 - price / stats.maxPrice)
  );
};

const formatReason = (product, reason) => ({
  id: product.id,
  reason
});

async function main() {
  console.log("🚀 OptiMarket MVP pipeline started (Perplexity required).");
  ensureOutputDir();

  const enriched = [];

  for (const product of products) {
    console.log(`\n🔍 Fetching reviews for: ${product.name}`);
    const snippets = await fetchReviewSnippets(product.query);

    if (!snippets.length) {
      console.log("⚠️  No snippets returned. Product excluded from scoring.");
      continue;
    }

    const signals = extractSignals(snippets);
    console.log(
      `✅ Signals: +${signals.positive_mentions} / -${signals.negative_mentions} | trust=${signals.trust_score.toFixed(
        2
      )}`
    );

    enriched.push({
      ...product,
      price: product.price || 150,
      snippets,
      signals
    });
  }

  if (enriched.length < 3) {
    throw new Error(
      "Not enough products with review data to select Economy/Optimum/Premium."
    );
  }

  const stats = {
    maxSentiment: Math.max(
      ...enriched.map(
        (item) =>
          (item.signals.positive_mentions + 1) /
          (item.signals.negative_mentions + 1)
      )
    ),
    maxTrust: Math.max(...enriched.map((item) => item.signals.trust_score)),
    maxPrice: Math.max(...enriched.map((item) => item.price))
  };

  const scored = enriched.map((item) => ({
    ...item,
    value_score: Number(
      computeValueScore(item.signals, item.price, stats).toFixed(4)
    )
  }));

  const economyCandidates = scored.filter(
    (item) => item.value_score >= ECONOMY_MIN_THRESHOLD
  );
  const economy = economyCandidates.sort((a, b) => a.price - b.price)[0];

  const optimum = scored.reduce((best, current) => {
    const currentRatio = current.value_score / current.price;
    if (!best) return current;
    return currentRatio > best.value_score / best.price ? current : best;
  }, null);

  const premiumThreshold = stats.maxPrice * PREMIUM_PRICE_RATIO;
  const premiumCandidates = scored.filter(
    (item) => item.price >= premiumThreshold
  );
  const premium = premiumCandidates.sort(
    (a, b) => b.value_score - a.value_score
  )[0];

  if (!economy || !optimum || !premium) {
    throw new Error("Failed to resolve Economy/Optimum/Premium selections.");
  }

  const selection = {
    economy: formatReason(
      economy,
      "Lowest price with acceptable real-user feedback."
    ),
    optimum: formatReason(
      optimum,
      "Best balance of positive review signals versus price."
    ),
    premium: formatReason(
      premium,
      "Highest trust and durability mentions across reviews and tests."
    )
  };

  const output = {
    generated_at: new Date().toISOString(),
    stats,
    selection,
    products: scored
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved MVP output → ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("❌ MVP pipeline failed:", error);
  process.exitCode = 1;
});
