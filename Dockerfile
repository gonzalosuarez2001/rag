FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["sh", "entrypoint.sh"]
