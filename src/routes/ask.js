const express = require("express");
const { createEmbedding, chat } = require("../services/ollama");
const { searchPoints, querySparseVector } = require("../services/qdrant");

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt, history = [] } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: 'El campo "prompt" es requerido.' });
  }

  try {
    // 1. Vectorizar el prompt del usuario
    const queryVector = await createEmbedding(`search_query: ${prompt}`);
    const sparseVector = await querySparseVector(prompt);

    // 2. Búsqueda híbrida en Qdrant (densa + sparse SPLADE → fusión RRF)
    const results = await searchPoints(queryVector, sparseVector, 5);

    // 3. Construir contexto con los fragmentos recuperados
    const context = results.points
      .map((r, i) => `[${i + 1}] (${r.payload.file})\n${r.payload.text}`)
      .join("\n\n");

    // 4. Construir array de mensajes: sistema + historial + pregunta actual
    const messages = [
      {
        role: "system",
        content: `Eres un asistente útil. Usa solo el siguiente contexto para responder. Responde directamente, sin decir que estás usando contexto. No empieces la respuesta con frases como "Según el contexto proporcionado" o similares. Si el contexto no contiene suficiente información, indícalo. \n\nCONTEXTO:\n${context}`,
      },
      ...history,
      {
        role: "user",
        content: prompt,
      },
    ];

    // 5. Generar respuesta con llama3 vía /api/chat
    const answer = await chat(messages);

    return res.json({
      answer,
      sources: results.points.map((r) => ({
        file: r.payload.file,
        score: r.score,
        excerpt: r.payload.text,
      })),
    });
  } catch (error) {
    console.error("Error en /ask:", error.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
