import fetch from "node-fetch";

/**
 * Fetch real review & test snippets from the web.
 * This is the ONLY allowed source of factual information.
 */
export async function fetchReviewSnippets(query) {
  console.log(`📡 Perplexity API: searching for "${query}"`);

  const res = await fetch("https://api.perplexity.ai/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      num_results: 8,
      focus: "reviews"
    })
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Perplexity API error (${res.status}): ${message}`);
  }

  const data = await res.json();
  const snippets = (data.results || []).map((result) => ({
    title: result.title,
    snippet: result.snippet,
    source: result.url
  }));

  console.log(`✅ Perplexity API: received ${snippets.length} snippets`);
  return snippets;
}
