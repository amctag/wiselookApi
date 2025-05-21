const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');


// تحميل .env تلقائياً لو موجود
const envPath = path.join(process.cwd(), 'src', 'api', 'routes', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded .env from ${envPath}`);
} else {
  dotenv.config();
  console.log('⚠️ .env not found in /src/api/routes, loaded default env');
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعدادات API من env أو ثابتة
const API_BASE_PATH = process.env.API_BASE_PATH || '/api';
const ENABLE_VERSIONING = process.env.ENABLE_VERSIONING === 'true';
const API_VERSION = process.env.API_CURRENT_VERSION || '';

const apiPrefix = ENABLE_VERSIONING && API_VERSION
  ? `${API_BASE_PATH}/${API_VERSION}`
  : API_BASE_PATH;

// دالة لتحميل كل ملفات Route تلقائياً من مجلد routes
const routesDir = path.join(process.cwd(), 'src', 'api', 'routes');

if (!fs.existsSync(routesDir)) {
  console.error(`❌ Directory not found: ${routesDir}`);
  process.exit(1);
}

const routeFiles = fs.readdirSync(routesDir).filter(f =>
  f.endsWith('Route.js') || f.endsWith('Routes.js')
);

if (routeFiles.length === 0) {
  console.warn(`⚠️ No route files found in ${routesDir}`);
}

routeFiles.forEach(file => {
  const routePath = path.join(routesDir, file);
  const routeModule = require(routePath);
  
  // اسم الراوت بناءً على اسم الملف
  let routeName = file.replace(/Route(s)?\.js$/, '').toLowerCase();
  if (!routeName) routeName = 'default';
  const fullRoutePath = `${apiPrefix}/${routeName}`;
  
  // التحقق من نوع القيمة المصدرة
  if (typeof routeModule === 'function') {
    // إذا كان دالة (middleware أو router)
    app.use(fullRoutePath, routeModule);
    console.log(`✅ Route loaded: ${file} -> ${fullRoutePath}`);
  } else if (routeModule && typeof routeModule.router === 'function') {
    // إذا كان كائن يحتوي على router
    app.use(fullRoutePath, routeModule.router);
    console.log(`✅ Route loaded: ${file} -> ${fullRoutePath}`);
  } else {
    console.error(`❌ Invalid route format in file: ${file}. Expected a router function.`);
  }
});

// مسار صحة الخادم
app.get(`${API_BASE_PATH}/health`, (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
