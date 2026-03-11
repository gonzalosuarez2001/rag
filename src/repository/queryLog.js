const prisma = require("../services/db");

async function saveQueryLog({
  sessionId,
  originalPrompt,
  rewrittenQuery,
  expandedQueries,
  intent,
  answer,
  latencyMs,
  retrievedChunks,
}) {
  try {
    await prisma.queryLog.create({
      data: {
        sessionId: sessionId ?? null,
        originalPrompt,
        rewrittenQuery: rewrittenQuery ?? null,
        expandedQueries: expandedQueries ?? [],
        intent,
        answer: answer ?? null,
        latencyMs,
        retrievedChunks: {
          create: retrievedChunks.map((chunk, index) => ({
            file: chunk.payload.file,
            score: chunk.score,
            excerpt: chunk.payload.text,
            rank: index + 1,
          })),
        },
      },
    });
  } catch (error) {
    console.error(
      "Error guardando query log en la base de datos:",
      error.message,
    );
  }
}

module.exports = { saveQueryLog };
