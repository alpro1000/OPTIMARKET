const POSITIVE = ["durable", "reliable", "solid", "powerful", "long-lasting"];
const NEGATIVE = ["noisy", "overheats", "breaks", "cheap plastic", "fails"];

export function extractSignals(snippets) {
  let positive = 0;
  let negative = 0;

  for (const snippet of snippets) {
    const text = snippet.snippet.toLowerCase();
    POSITIVE.forEach((word) => {
      if (text.includes(word)) positive += 1;
    });
    NEGATIVE.forEach((word) => {
      if (text.includes(word)) negative += 1;
    });
  }

  return {
    positive_mentions: positive,
    negative_mentions: negative,
    trust_score: Math.log(snippets.length + 1)
  };
}
