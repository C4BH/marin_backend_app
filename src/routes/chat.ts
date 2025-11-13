/**
 * Chat Routes
 * Chatbot API endpoints
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middlewares/auth';
import { sendMessage, clearConversation, healthCheck } from '../controllers/chat';

const router = Router();

// Rate limiter - User başına 10 mesaj/dakika
const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 10,
    message: {
        success: false,
        error: 'Çok fazla mesaj gönderdiniz. Lütfen bir dakika bekleyin.'
    },
    keyGenerator: (req: any) => {
        // User ID'yi kullan (token'dan gelir)
        return req.user?.userId || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Tüm chat route'ları authentication gerektirir
router.use(verifyToken);

// Chat endpoints
router.post('/message', chatRateLimiter, sendMessage);
router.post('/clear', clearConversation);
router.get('/health', healthCheck);

export default router;

