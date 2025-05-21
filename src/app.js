// app.js (updated version)
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

// Improved Route Loader
const loadRoute = (routeFilePath, mountPath) => {
  try {
    const route = require(routeFilePath);
    app.use(mountPath, route);
    console.log(`Mounted ${mountPath} -> ${routeFilePath}`);
  } catch (err) {
    console.error(`Route loading failed: ${mountPath}`, err.message);
    console.log('Full error stack:', err.stack);
  }
};

// API Routes
const loadApiRoutes = () => {
  const versionPrefix = API_CONFIG.enableVersioning ? `/${API_CONFIG.currentVersion}` : '';
  const basePath = API_CONFIG.basePath;
  const routesDir = path.join(__dirname, 'api', 'routes', API_CONFIG.currentVersion);

  loadRoute(
    path.join(routesDir, 'loginRoute.js'),
    `${basePath}${versionPrefix}/login`
  );

  loadRoute(
    path.join(routesDir, 'registerRoute.js'),
    `${basePath}${versionPrefix}/register`
  );

  // User Routes
  loadRoute(
    path.join(routesDir, 'userRoutes.js'),
    `${basePath}${versionPrefix}/users`
  );
};

// Debugging middleware
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  next();
});

// Load routes
loadApiRoutes();

// 404 Handler (must come after routes)
app.use((req, res) => {
  console.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    reason: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\nAPI Endpoints:`);
  console.log(`\nServer ready on port ${PORT}`);
});