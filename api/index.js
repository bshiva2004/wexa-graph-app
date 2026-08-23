const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('../backend/routes/api');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Mount API routes under /api
app.use('/api', apiRoutes);

// Fallback health check
app.get('/', (req, res) => {
  res.json({ status: 'API is running on Vercel Serverless' });
});

module.exports = app;

