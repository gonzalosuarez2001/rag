#!/bin/sh
echo "=== Indexando documentos ==="
node src/scripts/indexFiles.js

echo "=== Iniciando API ==="
npm run dev
