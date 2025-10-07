import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import connectDB from "./config/db.js";
import router from "./routes/index.js";
import errorHandler, { notFoundHandler } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { cookieMiddleware, cookieConsentMiddleware } from "./middleware/cookieMiddleware.js";
import { auditCRUD } from "./middleware/auditMiddleware.js";
import { getCacheStats } from "./middleware/cacheMiddleware.js";

// Import swagger with error handling
let specs, swaggerUi, swaggerUiOptions;
try {
  const swaggerModule = await import("./docs/swagger.js");
  specs = swaggerModule.specs;
  swaggerUi = swaggerModule.swaggerUi;
  swaggerUiOptions = swaggerModule.swaggerUiOptions;
} catch (error) {
  console.warn('Swagger documentation not available:', error.message);
  specs = null;
  swaggerUi = null;
  swaggerUiOptions = null;
}
import logger from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Cookie middleware
app.use(cookieMiddleware);
app.use(cookieConsentMiddleware);

// CORS middleware
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:3000",
  "http://localhost:3000",  // Next.js default
  "http://localhost:5173", // Vite default
  "http://localhost:3001", // Alternative port
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3001"
];

console.log('🔧 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);
console.log('   CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

logger.info('Server middleware configured', {
  corsOrigin: process.env.CLIENT_ORIGIN,
  environment: process.env.NODE_ENV || 'development'
});

// Database Connection
connectDB();

// Health check endpoint
app.get("/api/health", (req, res) => {
  logger.debug('Health check endpoint accessed');
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation (only if swagger dependencies are available)
if (swaggerUi && specs) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  logger.info('Swagger documentation available at /api/docs');
} else {
  app.get("/api/docs", (req, res) => {
    res.json({
      success: false,
      message: "API documentation not available. Please install swagger dependencies."
    });
  });
}

// Cache statistics endpoint (Admin only)
app.get("/api/cache/stats", (req, res) => {
  res.json({
    success: true,
    data: getCacheStats()
  });
});

logger.info('Setting up API routes');
app.use("/api", router);

// rate limiters
app.use("/api", apiLimiter);

// Serve uploaded files (identification documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
logger.info('Static file serving enabled for /uploads directory');

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Frontend static files (for production)
app.use(express.static(path.join(__dirname, "../.next/static")));
app.use(express.static(path.join(__dirname, "../public")));

// Serve Next.js app for non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }
  
  // For now, just return a simple HTML page
  // In production, you would integrate with Next.js server
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Amethyst Inn System</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <h1>Amethyst Inn System</h1>
        <p>Backend is running. Frontend should be served separately during development.</p>
        <p>API is available at <a href="/api/health">/api/health</a></p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  logger.success(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Server will shutdown', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise', reason, { promise });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - Shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - Shutting down gracefully');
  process.exit(0);
});  
