const fs = require("fs/promises");
const path = require("path");

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-turbo";
const PRODUCTS_PATH =
  process.env.PRODUCTS_PATH || path.resolve(process.cwd(), "products.json");
const OUTPUT_PATH =
  process.env.OUTPUT_PATH || path.resolve(process.cwd(), "descriptions.json");

const assertEnv = (value, name) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
};

const fetchReviews = async (query) => {
  const response = await fetch("https://api.perplexity.ai/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, num_results: 5 })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results
    .map((result) => result.snippet || result.title || "")
    .filter(Boolean)
    .join("\n");
};

const generateExplanation = async (product, reviews) => {
  const prompt = `Based on these real reviews and tests:\n${reviews}\n\nExplain in 3–4 sentences why "${product.name}" is considered a ${product.tier} product.\nFocus on clarity, reliability, performance, and price-to-quality ratio.\nKeep tone professional, concise, and readable.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI API response missing content.");
  }

  return content.trim();
};

const run = async () => {
  assertEnv(PERPLEXITY_API_KEY, "PERPLEXITY_API_KEY");
  assertEnv(OPENAI_API_KEY, "OPENAI_API_KEY");

  const raw = await fs.readFile(PRODUCTS_PATH, "utf8");
  const products = JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error("products.json must contain an array of products.");
  }

  const descriptions = [];

  for (const product of products) {
    console.log(`🔎 Fetching reviews for ${product.name}...`);
    const reviews = await fetchReviews(product.query);
    console.log(`✅ Fetched reviews for ${product.name}`);

    console.log(`🧠 Generating summary for ${product.name} (${product.tier})...`);
    const description = await generateExplanation(product, reviews);
    console.log(`✅ Generated summary for ${product.name} (${product.tier})`);

    descriptions.push({
      id: product.id,
      tier: product.tier,
      description
    });
  }

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(descriptions, null, 2)}\n`);
  console.log(`💾 Saved ${descriptions.length} descriptions → ${OUTPUT_PATH}`);
};

run().catch((error) => {
  console.error("❌ Generation failed:", error.message);
  process.exitCode = 1;
});
