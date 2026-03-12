const { QdrantClient } = require("@qdrant/js-client-rest");
const { SparseTextEmbedding, SparseEmbeddingModel } = require("fastembed");

const client = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});
const COLLECTION = "docs";

const sparseModelPromise = SparseTextEmbedding.init({
  model: SparseEmbeddingModel.SpladePPEnV1,
});

async function ensureCollection() {
  try {
    await client.getCollection(COLLECTION);
  } catch (error) {
    if (error.status === 404) {
      await client.createCollection(COLLECTION, {
        vectors: {
          dense: { size: 768, distance: "Cosine" },
        },
        sparse_vectors: {
          sparse: { modifier: "idf" },
        },
      });
      console.log(`Colección "${COLLECTION}" creada con vectores híbridos.`);
    } else {
      throw error;
    }
  }
}

async function passageSparseVector(text) {
  const model = await sparseModelPromise;
  for await (const batch of model.passageEmbed([text])) {
    return {
      indices: Array.from(batch[0].indices),
      values: Array.from(batch[0].values),
    };
  }
}

async function querySparseVector(text) {
  const model = await sparseModelPromise;
  const result = await model.queryEmbed(text);
  return {
    indices: Array.from(result.indices),
    values: Array.from(result.values),
  };
}

async function upsertPoints(points) {
  await client.upsert(COLLECTION, { points });
}

async function searchPoints(
  denseVector,
  sparseVector,
  limit = 5,
  scoreThreshold = 0.3,
) {
  const results = await client.query(COLLECTION, {
    prefetch: [
      { query: denseVector, using: "dense", limit: limit * 3 },
      { query: sparseVector, using: "sparse", limit: limit * 3 },
    ],
    query: { fusion: "rrf" },
    limit,
    score_threshold: scoreThreshold,
    with_payload: true,
  });

  return results.points ?? [];
}

module.exports = {
  ensureCollection,
  upsertPoints,
  searchPoints,
  passageSparseVector,
  querySparseVector,
};
