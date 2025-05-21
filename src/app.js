// app.js (corrected version)
const path = require('path');
const fs = require('fs');

// محاولة تحميل dotenv باستخدام محاولات متعددة لمسارات مختلفة
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
  console.log('Warning: Failed to load .env file from parent directory');
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('Warning: Failed to load .env file from default location');
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// التحقق من وجود express-rate-limit قبل تحميله لتجنب الأخطاء
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  console.log('Warning: express-rate-limit not available, rate limiting will be disabled');
  rateLimit = () => (req, res, next) => next();
}

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

console.log('API Config:', API_CONFIG);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

// Debug Endpoint - إضافة نقطة نهاية للتشخيص
app.get('/debug', (req, res) => {
  try {
    const directories = {
      dirname: __dirname,
      cwd: process.cwd(),
      files_cwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : 'Unable to read CWD',
      files_dirname: fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : 'Unable to read __dirname'
    };
    
    // فحص المسارات المحتملة للتوجيهات
    const possiblePaths = [
      path.resolve(__dirname),
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'api'),
      path.resolve(__dirname, 'src', 'api'),
      path.resolve(__dirname, '..', 'src'),
      path.resolve(__dirname, '..', 'api'),
      path.resolve(process.cwd(), 'src'),
      path.resolve(process.cwd(), 'api')
    ];
    
    const pathContents = {};
    possiblePaths.forEach(p => {
      try {
        pathContents[p] = fs.existsSync(p) ? fs.readdirSync(p) : 'Directory not found';
      } catch (e) {
        pathContents[p] = `Error reading directory: ${e.message}`;
      }
    });
    
    res.json({
      directories,
      pathContents,
      apiConfig: API_CONFIG,
      routes: app._router ? app._router.stack.map(r => r.route && r.route.path).filter(Boolean) : [],
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Health Check
app.get(`${API_CONFIG.basePath}/health`, (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// التحقق من وجود الملف قبل تحميله
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Error checking file: ${filePath}`, err.message);
    return false;
  }
};

// Improved Route Loader with better error handling
const loadRoute = (routeFilePath, mountPath) => {
  try {
    // استخدام path.resolve للحصول على المسار المطلق
    const resolvedPath = path.resolve(routeFilePath);
    console.log(`Attempting to load route from: ${resolvedPath}`);
    
    // التحقق من وجود الملف قبل محاولة تحميله
    if (!fileExists(resolvedPath)) {
      console.error(`File does not exist: ${resolvedPath}`);
      return false;
    }
    
    const route = require(resolvedPath);
    app.use(mountPath, route);
    console.log(`Successfully mounted ${mountPath} -> ${resolvedPath}`);
    return true;
  } catch (err) {
    console.error(`Route loading failed for ${mountPath}:`, err.message);
    console.error('Full error stack:', err.stack);
    return false;
  }
};

// البحث والتحميل من مسارات متعددة محتملة
const loadApiRoutes = () => {
  const versionPrefix = API_CONFIG.enableVersioning ? `/${API_CONFIG.currentVersion}` : '';
  const basePath = API_CONFIG.basePath;
  
  // قائمة بالمسارات المحتملة للتوجيهات بترتيب الأولوية
  const possibleBasePaths = [
    path.resolve(__dirname, 'src', 'api', 'routes', API_CONFIG.currentVersion),
    path.resolve(__dirname, 'api', 'routes', API_CONFIG.currentVersion),
    path.resolve(__dirname, 'routes', API_CONFIG.currentVersion),
    path.resolve(__dirname, '..', 'src', 'api', 'routes', API_CONFIG.currentVersion),
    path.resolve(__dirname, '..', 'api', 'routes', API_CONFIG.currentVersion),
    path.resolve(process.cwd(), 'src', 'api', 'routes', API_CONFIG.currentVersion),
    path.resolve(process.cwd(), 'api', 'routes', API_CONFIG.currentVersion)
  ];
  
  // البحث عن أول مسار صالح يحتوي على الملفات المطلوبة
  let foundBasePath = null;
  
  for (const testPath of possibleBasePaths) {
    console.log(`Checking routes path: ${testPath}`);
    if (fileExists(testPath)) {
      console.log(`Found directory: ${testPath}`);
      
      // التحقق من وجود ملف واحد على الأقل من ملفات التوجيه
      const files = fs.readdirSync(testPath);
      console.log(`Files in directory: ${files.join(', ')}`);
      
      if (files.some(file => file.endsWith('Route.js') || file.endsWith('Routes.js'))) {
        foundBasePath = testPath;
        console.log(`Found valid routes directory: ${foundBasePath}`);
        break;
      }
    }
  }
  
  // إذا لم يتم العثور على أي مسار صالح
  if (!foundBasePath) {
    console.error('ERROR: Could not find valid routes directory!');
    return;
  }
  
  // محاولة تحميل ملفات التوجيه الشائعة
  const routeFiles = {
    login: 'loginRoute.js',
    register: 'registerRoute.js',
    user: 'userRoutes.js'
  };
  
  // هل تم تحميل أي مسار بنجاح؟
  let anyRouteLoaded = false;
  
  // محاولة تحميل الملفات المعروفة
  for (const [key, fileName] of Object.entries(routeFiles)) {
    const filePath = path.join(foundBasePath, fileName);
    const mountPath = `${basePath}${versionPrefix}/${key === 'user' ? 'users' : key}`;
    
    if (loadRoute(filePath, mountPath)) {
      anyRouteLoaded = true;
    }
  }
  
  // محاولة اكتشاف وتحميل أي ملفات مسارات أخرى في المجلد
  try {
    const files = fs.readdirSync(foundBasePath);
    for (const file of files) {
      // تخطي الملفات التي تم تحميلها بالفعل
      if (Object.values(routeFiles).includes(file)) continue;
      
      // تحميل أي ملف آخر ينتهي بـ Route.js أو Routes.js
      if (file.endsWith('Route.js') || file.endsWith('Routes.js')) {
        const baseName = file.replace(/Route[s]?\.js$/, '').toLowerCase();
        const mountPath = `${basePath}${versionPrefix}/${baseName}`;
        
        if (loadRoute(path.join(foundBasePath, file), mountPath)) {
          anyRouteLoaded = true;
        }
      }
    }
  } catch (err) {
    console.error('Error reading directory for additional routes:', err.message);
  }
  
  // إذا لم يتم تحميل أي مسار، إنشاء مسار اختبار
  if (!anyRouteLoaded) {
    console.warn('No routes were loaded! Creating test route...');
    app.get(`${basePath}${versionPrefix}/test`, (req, res) => {
      res.json({ 
        message: 'Test route works, but no API routes were loaded.',
        checkedPaths: possibleBasePaths 
      });
    });
  }
  
  // طباعة المسارات المتاحة
  console.log('\nAvailable routes:');
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
    } else if (r.name === 'router') {
      console.log('Router middleware:', r.regexp);
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
    availableEndpoints: [API_CONFIG.basePath + '/health', '/debug']
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\nServer ready on port ${PORT}`);
  console.log(`Health check endpoint: ${API_CONFIG.basePath}/health`);
  console.log(`Debug endpoint: /debug`);
});
