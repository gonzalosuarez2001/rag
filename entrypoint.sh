#!/bin/sh
echo "=== Sincronizando schema con la base de datos ==="
npx prisma db push

echo "=== Indexando documentos ==="
node src/scripts/indexFiles.js

echo "=== Iniciando API ==="
npm run dev
