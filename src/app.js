const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const baseRoutesPath = path.resolve(process.cwd(), 'src', 'api', 'routes');
const envPath = path.join(baseRoutesPath, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded .env from: ${envPath}`);
} else {
  console.warn(`⚠️ .env not found at: ${envPath}`);
  dotenv.config(); // fallback
}
// Express و الإضافات
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  console.warn('Rate limiting disabled');
  rateLimit = () => (req, res, next) => next();
}

const app = express();
const PORT = process.env.PORT || 3000;

console.log('__dirname:', __dirname);
console.log('CWD:', process.cwd());

// إعدادات الـ API
const API_CONFIG = {
  basePath: process.env.API_BASE_PATH || '/api',
  enableVersioning: process.env.ENABLE_VERSIONING === 'true',
  currentVersion: process.env.API_CURRENT_VERSION || '' // تم إزالة v1
};

console.log('API Config:', API_CONFIG);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

// نقطة فحص
app.get('/debug', (req, res) => {
  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    env: process.env,
    apiConfig: API_CONFIG,
    routes: app._router.stack
      .map(r => (r.route ? r.route.path : null))
      .filter(Boolean),
  });
});

// Health Check
app.get(`${API_CONFIG.basePath}/health`, (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// تحميل التوجيهات
const loadRoutes = () => {
  const baseRoutesPath = path.resolve(__dirname, 'src', 'api', 'routes');
  if (!fs.existsSync(baseRoutesPath)) {
    console.error(`❌ Routes directory not found: ${baseRoutesPath}`);
    return;
  }

  const files = fs.readdirSync(baseRoutesPath);
  const routeFiles = files.filter(file =>
    file.endsWith('Route.js') || file.endsWith('Routes.js')
  );

  if (routeFiles.length === 0) {
    console.warn(`⚠️ No route files found in ${baseRoutesPath}`);
    return;
  }

  routeFiles.forEach(file => {
    const fullPath = path.join(baseRoutesPath, file);
    const route = require(fullPath);

    const routeName = file
      .replace(/Route[s]?\.js$/, '')
      .toLowerCase()
      .trim();

    const routePath = `${API_CONFIG.basePath}/${routeName || 'default'}`;
    app.use(routePath, route);

    console.log(`✅ Loaded route: ${file} -> ${routePath}`);
  });
};

loadRoutes();

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    reason: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Base API path: ${API_CONFIG.basePath}`);
});
