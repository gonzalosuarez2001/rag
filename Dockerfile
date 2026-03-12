FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm install
RUN npx prisma generate

COPY src/ ./src/

COPY entrypoint.sh ./

RUN node src/scripts/download-splade-model.js

RUN chmod +x entrypoint.sh

EXPOSE 3000


