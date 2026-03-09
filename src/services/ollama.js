const { Ollama } = require("ollama");

const ollama = new Ollama({ host: process.env.OLLAMA_URL });

async function createEmbedding(text) {
  const response = await ollama.embeddings({
    model: "nomic-embed-text",
    prompt: text,
  });
  return response.embedding;
}

async function chat(messages) {
  const response = await ollama.chat({
    model: "llama3:8b",
    messages,
    stream: false,
  });
  return response.message.content;
}

module.exports = { createEmbedding, chat };
