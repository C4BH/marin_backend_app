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
        .min(1, 'Message cannot be empty')
        .max(2000, 'Message too long (max 2000 characters)'),
    sessionId: z.string().uuid().optional()
});

const clearConversationSchema = z.object({
    sessionId: z.string().uuid('Invalid session ID format')
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
                error: validationResult.error.errors[0]?.message || 'Invalid request data'
            });
            return;
        }

        const { message, sessionId } = validationResult.data;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        // Message length check (token estimation)
        const estimatedTokens = Math.ceil(message.length / 4);
        if (estimatedTokens > 1000) {
            res.status(400).json({
                success: false,
                error: 'Message too long. Please shorten your message.'
            });
            return;
        }

        logger.info(`Chat message received from user: ${userId}, sessionId: ${sessionId || 'new'}`);

        // Process message
        const result = await chatService.sendMessage(userId, message, sessionId);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        logger.error(`Error in sendMessage controller: ${error.message}`, { error });

        // User-friendly error messages
        const errorMessage = error.message || 'An unexpected error occurred';
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
                error: 'Invalid session ID format'
            });
            return;
        }

        const { sessionId } = validationResult.data;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        logger.info(`Clear conversation request from user: ${userId}, sessionId: ${sessionId}`);

        // Clear conversation
        const cleared = chatService.clearConversation(sessionId);

        if (cleared) {
            res.status(200).json({
                success: true,
                message: 'Conversation cleared successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Conversation session not found'
            });
        }

    } catch (error: any) {
        logger.error(`Error in clearConversation controller: ${error.message}`, { error });

        res.status(500).json({
            success: false,
            error: 'Failed to clear conversation'
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

