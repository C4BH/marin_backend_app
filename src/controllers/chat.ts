/**
 * Chat Controller
 * Chat API endpoints için request/response handling
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat';
import { logger } from '../utils/logger';

// Request validation schemas
const sendMessageSchema = z.object({
    message: z.string()
        .min(1, 'Boş mesaj gönderilemez')
        .max(2000, 'Maksimum 2000 karakter gönderilebilir'),
    sessionId: z.string().uuid().optional()
});

const clearConversationSchema = z.object({
    sessionId: z.string().uuid('Geçersiz session ID formatı')
});

/**
 * POST /api/v1/chat/message
 * Kullanıcı mesajı gönder ve AI yanıtı al
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validation
        const validationResult = sendMessageSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: validationResult.error.message || 'Geçersiz istek verisi'
            });
            return;
        }

        const { message, sessionId } = validationResult.data;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Kullanıcı oturum açmamış'
            });
            return;
        }

        // Message length check (token estimation)
        const estimatedTokens = Math.ceil(message.length / 4);
        if (estimatedTokens > 1000) {
            res.status(400).json({
                success: false,
                error: 'Mesaj çok uzun. Lütfen mesajınızı kısaltınız.'
            });
            return;
        }

        logger.info(`Chat mesajı kullanıcıdan alındı: ${userId}, sessionId: ${sessionId || 'yeni'}`);

        // Process message
        const result = await chatService.sendMessage(userId, message, sessionId);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        logger.error(`sendMessage controller hatası: ${error.message}`, { error });

        // User-friendly error messages
        const errorMessage = error.message || 'Beklenmeyen bir hata oluştu';
        const statusCode = error.message.includes('quota') || error.message.includes('rate_limit') ? 503 : 500;

        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * POST /api/v1/chat/clear
 * Conversation history'yi temizle
 */
export const clearConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validation
        const validationResult = clearConversationSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Geçersiz session ID formatı'
            });
            return;
        }

        const { sessionId } = validationResult.data;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Kullanıcı oturum açmamış'
            });
            return;
        }

        logger.info(`Konuşma temizleme isteği kullanıcıdan alındı: ${userId}, sessionId: ${sessionId}`);

        // Clear conversation
        const cleared = chatService.clearConversation(sessionId);

        if (cleared) {
            res.status(200).json({
                success: true,
                message: 'Konuşma başarıyla temizlendi'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Konuşma oturumu bulunamadı'
            });
        }

    } catch (error: any) {
        logger.error(`clearConversation controller hatası: ${error.message}`, { error });

        res.status(500).json({
            success: false,
            error: 'Konuşma temizleme başarısız'
        });
    }
};

/**
 * GET /api/v1/chat/health
 * Chat service health check (internal/monitoring)
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
        const activeSessionCount = chatService.getActiveSessionCount();

        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                activeSessionCount,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        logger.error(`Error in chat health check: ${error.message}`);

        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
};

