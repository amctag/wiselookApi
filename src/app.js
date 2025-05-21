// app.js (corrected version)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Debugging info at startup
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

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

// Improved Route Loader with better error handling
const loadRoute = (routeFilePath, mountPath) => {
  try {
    // استخدام path.resolve للحصول على المسار المطلق
    const resolvedPath = path.resolve(routeFilePath);
    console.log(`Attempting to load route from: ${resolvedPath}`);
    
    const route = require(resolvedPath);
    app.use(mountPath, route);
    console.log(`Successfully mounted ${mountPath} -> ${resolvedPath}`);
  } catch (err) {
    console.error(`Route loading failed for ${mountPath}:`, err.message);
    console.error('Full error stack:', err.stack);
  }
};

// API Routes with consistent path handling
const loadApiRoutes = () => {
  const versionPrefix = API_CONFIG.enableVersioning ? `/${API_CONFIG.currentVersion}` : '';
  const basePath = API_CONFIG.basePath;
  
  // تحديد المسار الأساسي للملفات على حسب هيكل المشروع
  // هنا نفترض أن المسارات موجودة في ./src/api/routes/v1
  const apiBasePath = path.resolve(__dirname, 'src', 'api', 'routes', API_CONFIG.currentVersion);
  console.log(`Routes directory: ${apiBasePath}`);
  
  // تحميل مسار تسجيل الدخول
  loadRoute(
    path.join(apiBasePath, 'loginRoute.js'),
    `${basePath}${versionPrefix}/login`
  );
  
  // تحميل مسار التسجيل
  loadRoute(
    path.join(apiBasePath, 'registerRoute.js'),
    `${basePath}${versionPrefix}/register`
  );
  
  // تحميل مسارات المستخدم
  loadRoute(
    path.join(apiBasePath, 'userRoutes.js'),
    `${basePath}${versionPrefix}/users`
  );
  
  // طباعة المسارات المتاحة بعد التحميل
  console.log('\nAvailable routes:');
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
    }
  });
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
    reason: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: API_CONFIG.basePath + '/health' // توفير معلومات إضافية
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
  console.log(`\nServer ready on port ${PORT}`);
  console.log(`Health check endpoint: ${API_CONFIG.basePath}/health`);
});
