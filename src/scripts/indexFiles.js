const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { parseFile } = require('../services/fileParser');
const { createEmbedding } = require('../services/ollama');
const { ensureCollection, upsertPoints } = require('../services/qdrant');

const DOCS_PATH = process.env.DOCS_PATH;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

if (!DOCS_PATH) {
  console.error('Error: La variable de entorno DOCS_PATH no está definida.');
  process.exit(1);
}

function splitIntoChunks(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + size;
    // Extend to the next word boundary to avoid cutting mid-word
    if (end < text.length) {
      const nextSpace = text.indexOf(' ', end);
      end = nextSpace !== -1 ? nextSpace : text.length;
    }
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    // Step back by overlap, aligned to a word boundary
    const stepEnd = end - overlap;
    const prevSpace = text.lastIndexOf(' ', stepEnd);
    start = prevSpace > start ? prevSpace + 1 : stepEnd;
  }
  return chunks.filter(c => c.length > 0);
}

function getAllFiles(dirPath, fileList = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function indexFiles() {
  console.log(`Indexando archivos en: ${DOCS_PATH}`);

  console.log(`Asegurando que exista colección en Qdrant`);
  await ensureCollection();

  const files = getAllFiles(DOCS_PATH);
  console.log(`Archivos encontrados: ${files.length}`);

  for (const filePath of files) {
    const fileName = path.relative(DOCS_PATH, filePath);
    console.log(`\nProcesando: ${fileName}`);

    let text;
    try {
      text = await parseFile(filePath);
    } catch (error) {
      console.warn(`⚠ Skipping (${error.message})`);
      continue;
    }

    if (!text || !text.trim()) {
      console.warn('⚠ Archivo vacío o sin texto, se omite.');
      continue;
    }

    const chunks = splitIntoChunks(text.trim());
    console.log(`Chunks: ${chunks.length}`);

    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let vector;
      try {
        vector = await createEmbedding(`search_document: ${chunk}`);
      } catch (error) {
        console.error(`Error generando embedding para chunk ${i}: ${error.message}`);
        continue;
      }
      points.push({
        id: uuidv4(),
        vector,
        payload: {
          text: chunk,
          file: fileName,
          chunk_index: i,
        },
      });
    }

    if (points.length > 0) {
      await upsertPoints(points);
      console.log(`${points.length} vectores guardados.`);
    }
  }

  console.log('\n✅ Indexación completada.');
}

indexFiles().catch((error) => {
  console.error('Error durante la indexación de archivos:', error);
  process.exit(1);
});
