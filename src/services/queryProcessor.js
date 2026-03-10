const { chat } = require("./ollama");

async function rewriteQuery(prompt, history = []) {
  const historyText =
    history.length > 0
      ? history
          .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
          .join("\n")
      : null;

  const userContent = historyText
    ? `Historial de conversación:\n${historyText}\n\nPregunta actual: ${prompt}`
    : prompt;

  const messages = [
    {
      role: "system",
      content: `Eres un asistente que reformula preguntas para mejorar tanto la búsqueda en documentos universitarios
      como la obtención de información del alumno en una base de datos institucional.
        Dado el historial de conversación (si existe) y la pregunta actual, reformula la pregunta para que sea:
        - Auto-contenida: no dependa del contexto previo de la conversación.
        - Específica y clara para búsqueda en reglamentos o información universitaria y en bases de datos institucionales.
        - En español.

        Devuelve ÚNICAMENTE la pregunta reformulada, sin explicaciones ni texto adicional.`,
    },
    {
      role: "user",
      content: userContent,
    },
  ];

  const rewritten = await chat(messages);
  console.log("Query Reformulada:", rewritten);
  return rewritten.trim();
}

async function expandQuery(query) {
  const messages = [
    {
      role: "system",
      content: `Eres un asistente que genera variaciones de preguntas para mejorar la recuperación de documentos universitarios.
        Dado una pregunta, genera exactamente 3 reformulaciones alternativas que mantengan la misma intención pero usen diferentes palabras, estructuras o enfoques.
        Devuelve ÚNICAMENTE las 3 variaciones en idioma español, una por línea, sin numeración, viñetas ni explicaciones.`,
    },
    {
      role: "user",
      content: query,
    },
  ];

  const raw = await chat(messages);

  const expansions = raw
    .split("\n")
    .map((line) => line.replace(/^[\d\.\-\*\)]+\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);

  console.log("Query Expandida:", expansions);


  return expansions;
}

function mergeResults(allResults, limit = 5) {
  const pointsMap = new Map();

  for (const result of allResults) {
    for (const point of result.points ?? []) {
      const existing = pointsMap.get(point.id);
      if (!existing || point.score > existing.score) {
        pointsMap.set(point.id, point);
      }
    }
  }

  return [...pointsMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { rewriteQuery, expandQuery, mergeResults };
