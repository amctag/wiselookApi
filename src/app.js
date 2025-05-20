// app.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Config
const API_CONFIG = {
  basePath: process.env.API_BASE_PATH || '/api',
  currentVersion: process.env.API_CURRENT_VERSION || 'v1',
  enableVersioning: process.env.ENABLE_VERSIONING === 'true'
};

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

// Health Check
app.get(`${API_CONFIG.basePath}/health`, (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
const loadRoute = (routeFilePath, mountPath) => {
  try {
    const route = require(routeFilePath);
    app.use(mountPath, route);
    console.log(`Loaded route: ${mountPath}`);
  } catch (err) {
    console.error(`Failed to load route at ${mountPath}:`, err.message);
  }
};


// API Routes
const loadApiRoutes = () => {
  const versionPrefix = API_CONFIG.enableVersioning ? `/${API_CONFIG.currentVersion}` : '';
  const basePath = API_CONFIG.basePath;

  // Mount userRoutes at /api/v1/users
  loadRoute(
    path.join(__dirname, `./api/routes/${API_CONFIG.currentVersion}/userRoutes`),
    `${basePath}${versionPrefix}/users`
  );

  // Mount authRoutes at /api/v1
  loadRoute(
    path.join(__dirname, `./api/routes/${API_CONFIG.currentVersion}/authRoutes`),
    `${basePath}${versionPrefix}`
  );
};


// Function load API Routes
loadApiRoutes();

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}${API_CONFIG.basePath}`);
  console.log(`Version: ${API_CONFIG.currentVersion}`);
  console.log(`Versioning ${API_CONFIG.enableVersioning ? 'enabled' : 'disabled'}`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit();
});