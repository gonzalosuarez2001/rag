async function rerankDocuments(query, results, topK = 5) {
  if (!results || results.length === 0) return [];

  const texts = results.map((r) => r.payload.text);

  const response = await fetch(`${process.env.RERANKER_URL}/rerank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, texts, truncate: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reranker error ${response.status}: ${error}`);
  }

  const ranked = await response.json();

  return ranked.slice(0, topK).map(({ index, score }) => ({
    ...results[index],
    rerankScore: score,
  }));
}

module.exports = { rerankDocuments };
