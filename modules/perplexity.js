import fetch from "node-fetch";

/**
 * Fetches real review snippets and expert tests from the web
 * using Perplexity API (required component).
 */
export async function fetchReviews(query) {
  console.log(`📡 Perplexity API: searching for "${query}"`);

  const res = await fetch("https://api.perplexity.ai/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      num_results: 5,
      focus: "reviews"
    })
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Perplexity API error (${res.status}): ${message}`);
  }

  const data = await res.json();
  const snippets = data.results?.map((result) => result.snippet).join("\n");

  console.log("✅ Perplexity API: received response");
  return snippets || "No reviews found.";
}
