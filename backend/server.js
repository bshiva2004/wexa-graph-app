const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { verifyConnectivity, closeDriver, getConnectionStatus } = require('./config/db');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for assessment review / local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend Static Assets if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving production frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA fallback to index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // API Welcome & Health Route when frontend is not pre-built in current directory
  app.get('/', (req, res) => {
    const status = getConnectionStatus();
    res.json({
      message: '🚀 Wexa Graph Recommendation Network API is Running',
      version: '1.0.0',
      endpoints: [
        'GET /api/health',
        'GET /api/dashboard',
        'GET /api/users',
        'GET /api/recommendations/:userId',
        'GET /api/synergy/:userId',
        'GET /api/graph',
        'GET /api/stats',
        'POST /api/playground',
      ],
      cognoDB: status,
    });
  });
}

// Global 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server & Check CognoDB Connectivity
if (require.main === module) {
  const server = app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📡 Checking CognoDB Cloud Connectivity...`);
    console.log(`======================================================`);

    const status = await verifyConnectivity();
    if (status.connected) {
      console.log(`🎉 Ready to serve graph recommendation queries!\n`);
    } else {
      console.warn(`\n⚠️  Database is offline or not yet configured in backend/.env`);
      console.warn(`   Configure COGNODB_URI and COGNODB_PASSWORD, then run:`);
      console.warn(`   npm run seed\n`);
    }
  });

  // Graceful Shutdown Handler
  const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await closeDriver();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
