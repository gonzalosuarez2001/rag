const axios = require("axios");

const OLLAMA_URL = process.env.OLLAMA_URL;

async function createEmbedding(text) {
  const url = `${OLLAMA_URL}/api/embeddings`;
  const response = await axios.post(url, {
    model: "nomic-embed-text",
    prompt: text,
  });
  return response.data.embedding;
}

async function chat(messages) {
  const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
    model: "llama3:8b",
    messages,
    stream: false,
  });

  return response.data.message.content;
}

module.exports = { createEmbedding, chat };
