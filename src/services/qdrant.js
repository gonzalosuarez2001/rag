const axios = require('axios');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = 'docs';

async function ensureCollection() {
  try {
    await axios.get(`${QDRANT_URL}/collections/${COLLECTION}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
      console.log(`Colección "${COLLECTION}" creada.`);
    } else {
      throw error;
    }
  }
}

async function upsertPoints(points) {
  await axios.put(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    points,
  });
}

async function searchPoints(vector, limit = 5, scoreThreshold = 0.3) {
  const response = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
    {
      vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    }
  );

  return response.data.result;
}

module.exports = { ensureCollection, upsertPoints, searchPoints };
