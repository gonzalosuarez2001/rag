const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { parseFile } = require('../services/fileParser');
const { createEmbedding } = require('../services/ollama');
const { ensureCollection, upsertPoints, passageSparseVector } = require('../services/qdrant');

const DOCS_PATH = process.env.DOCS_PATH;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MIN_CHUNK_SIZE = 100;
const SEPARATORS = ['\n\n', '\n', '. ', ' '];

if (!DOCS_PATH) {
  console.error('Error: La variable de entorno DOCS_PATH no está definida.');
  process.exit(1);
}

function applyOverlap(chunks, overlap, separator) {
  if (chunks.length <= 1) return chunks;
  const result = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prev = result[result.length - 1];
    const tail = prev.slice(-overlap);
    result.push(tail + separator + chunks[i]);
  }
  return result;
}

function recursiveSplit(text, separators, size, overlap) {
  if (text.length <= size) return text.length >= MIN_CHUNK_SIZE ? [text] : [];

  const separator = separators.find(s => text.includes(s)) ?? '';
  const parts = separator ? text.split(separator) : [...text];

  const chunks = [];
  let current = '';

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;

    if (candidate.length <= size) {
      current = candidate;
    } else {
      if (current) chunks.push(current.trim());
      if (part.length > size) {
        const subChunks = recursiveSplit(part, separators.slice(1), size, overlap);
        chunks.push(...subChunks);
        current = '';
      } else {
        current = part;
      }
    }
  }

  if (current.trim().length >= MIN_CHUNK_SIZE) chunks.push(current.trim());

  return applyOverlap(chunks, overlap, separator);
}

function splitIntoChunks(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  return recursiveSplit(text.trim(), SEPARATORS, size, overlap);
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

      let sparseVector;

      try {
        sparseVector = await passageSparseVector(chunk);
      } catch (error) {
        console.error(`Error generando sparse vector para chunk ${i}: ${error.message}`);
        continue;
      }

      points.push({
        id: uuidv4(),
        vector: {
          dense: vector,
          sparse: sparseVector,
        },
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
