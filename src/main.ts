import express, { Express, Request, Response, NextFunction, Router } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Routes - Lazy import (bağlantıdan sonra yüklenecek)
// Bu sayede model import'ları mongoose bağlantısından sonra çalışır
let authRoutes: Router;

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 2344;
const API_VERSION = process.env.API_VERSION || 'v1';

// ===========================================
// MIDDLEWARE SETUP
// ===========================================

/**
 * Security headers with Helmet
 * Helmet helps secure Express apps by setting HTTP response headers
 */
app.use(helmet());

/**
 * CORS Configuration
 * Allows cross-origin requests from specified origins
 */
const corsOptions = {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

/**
 * Rate Limiting
 * Prevents brute force attacks and API abuse
 * Default: 100 requests per 15 minutes per IP
 */
// const limiter = rateLimit({
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
//     message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });
// app.use(limiter);

/**
 * Body Parser
 * Parses incoming JSON and URL-encoded payloads
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request Logging Middleware
 * Logs all incoming requests in development
 */
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ===========================================
// MONGODB CONNECTION
// ===========================================

/**
 * Connect to MongoDB
 * Uses Mongoose ODM for database operations
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marin_dev';
        
        await mongoose.connect(mongoUri);
        
        console.log('✅ MongoDB connected successfully');
        console.log(`📦 Database: ${mongoose.connection.name}`);
        
        // MongoDB connection event listeners
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// ===========================================
// ROUTES
// ===========================================

/**
 * Health Check Endpoint
 * Used for monitoring and load balancer health checks
 */
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

/**
 * API Info Endpoint
 */
app.get(`/api/${API_VERSION}`, (req: Request, res: Response) => {
    res.status(200).json({
        name: 'MARIN API',
        version: API_VERSION,
        description: 'Personalized Supplement Recommendation Platform',
        documentation: '/api/v1/docs',
        endpoints: {
            auth: `/api/${API_VERSION}/auth`,
            users: `/api/${API_VERSION}/users`,
            supplements: `/api/${API_VERSION}/supplements`,
            meetings: `/api/${API_VERSION}/meetings`,
            notifications: `/api/${API_VERSION}/notifications`
        }
    });
});

/**
 * Mount API Routes
 * Routes'ları bağlantıdan sonra yükleyeceğiz (lazy import)
 * Bu yüzden routes mount işlemi startServer() içinde yapılıyor
 */

// TODO: Mount other routes when ready (startServer içinde)
// app.use(`/api/${API_VERSION}/users`, userRoutes);
// app.use(`/api/${API_VERSION}/supplements`, supplementRoutes);
// app.use(`/api/${API_VERSION}/user-supplements`, userSupplementRoutes);
// app.use(`/api/${API_VERSION}/meetings`, meetingRoutes);
// app.use(`/api/${API_VERSION}/advisors`, advisorRoutes);
// app.use(`/api/${API_VERSION}/forms`, formRoutes);
// app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
// app.use(`/api/${API_VERSION}/enterprises`, enterpriseRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================
// NOT: 404 Handler routes'lardan SONRA tanımlanmalı
// Bu yüzden startServer() içinde routes mount edildikten sonra tanımlanacak

/**
 * Global Error Handler
 * Catches all errors thrown in the application
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error:', err);
    
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation hatası',
            errors: err.message
        });
    }
    
    // Mongoose duplicate key errors
    if (err.name === 'MongoError' && (err as any).code === 11000) {
        return res.status(409).json({
            status: 'error',
            message: 'Bu kayıt zaten mevcut'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Geçersiz token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token süresi dolmuş'
        });
    }
    
    // Default error
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Internal server error'
    });
});

// ===========================================
// SERVER START
// ===========================================

/**
 * Start the Express server
 * First connects to database, then starts listening
 */
const startServer = async () => {
    try {
        // 1. Önce veritabanına bağlan
        // Bu, model import'larından önce mongoose bağlantısının hazır olmasını sağlar
        await connectDB();
        
        // 2. Veritabanı bağlantısından SONRA routes'ları yükle ve mount et
        // Bu sayede model import'ları mongoose bağlantısı hazır olduğunda çalışır
        authRoutes = (await import('./routes/auth')).default;
        app.use(`/api/${API_VERSION}/auth`, authRoutes);
        
        console.log('✅ Routes mounted successfully');
        
        // 3. 404 Handler'ı routes'lardan SONRA tanımla
        // Bu sayede tanımlı routes'lar önce kontrol edilir
        app.use((req: Request, res: Response) => {
            res.status(404).json({
                status: 'error',
                message: 'Endpoint bulunamadı',
                path: req.path
            });
        });
        
        // 4. Express server'ı başlat
        app.listen(PORT, () => {
            console.log('\n🚀 ========================================');
            console.log(`🚀 MARIN API Server Started`);
            console.log('🚀 ========================================');
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Server running at: http://localhost:${PORT}`);
            console.log(`📚 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log('🚀 ========================================\n');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

/**
 * Handle graceful shutdown
 * Closes database connections and server cleanly
 */
const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
    
    try {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        // Exit process
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
    gracefulShutdown('unhandledRejection');
});

// ===========================================
// START APPLICATION
// ===========================================

startServer();

// Export app for testing
export default app;

