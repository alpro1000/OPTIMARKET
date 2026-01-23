import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generates a short factual explanation using Gemini.
 * Uses Perplexity's snippets as input context.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateExplanation(product, reviews) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are an AI expert analyzing real product reviews.

Product: ${product.name}
Category: ${product.tier}

Real user and expert reviews:
${reviews}

Explain in 3 concise sentences why this product fits its category (${product.tier}).
Focus on build quality, performance, reliability, and price-to-value ratio.
Be factual, concise, and trustworthy.
`;

  console.log(`🧠 Gemini API: generating summary for ${product.name}`);
  const result = await model.generateContent(prompt);

  return result.response.text().trim();
}
