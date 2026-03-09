require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const askRouter = require('./routes/ask');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'Ok' }));
app.use('/ask', askRouter);

app.listen(PORT, () => {
  console.log(`RAG API corriendo en el puerto ${PORT}`);
});
