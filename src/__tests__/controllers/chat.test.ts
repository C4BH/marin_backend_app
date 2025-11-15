import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { sendMessage, clearConversation, healthCheck } from '../../controllers/chat';
import { chatService } from '../../services/chat';
import { logger } from '../../utils/logger';

// Mock dependencies
vi.mock('../../services/chat');
vi.mock('../../utils/logger');

describe('Chat Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));

        mockRequest = {
            body: {},
            user: undefined
        };

        mockResponse = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('sendMessage', () => {
        it('should return 200 with AI response on successful message send', async () => {
            mockRequest.body = {
                message: 'Hello AI!',
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                sessionId: '123e4567-e89b-12d3-a456-426614174000',
                userMessage: 'Hello AI!',
                aiResponse: 'Hello! How can I help you?',
                timestamp: new Date().toISOString()
            };

            vi.mocked(chatService.sendMessage).mockResolvedValue(mockResult);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(chatService.sendMessage).toHaveBeenCalledWith(
                'user123',
                'Hello AI!',
                '123e4567-e89b-12d3-a456-426614174000'
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: mockResult
            });
        });

        it('should create new session when sessionId is not provided', async () => {
            mockRequest.body = {
                message: 'Hello AI!'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                sessionId: 'new-session-id',
                userMessage: 'Hello AI!',
                aiResponse: 'Hello! How can I help you?',
                timestamp: new Date().toISOString()
            };

            vi.mocked(chatService.sendMessage).mockResolvedValue(mockResult);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(chatService.sendMessage).toHaveBeenCalledWith(
                'user123',
                'Hello AI!',
                undefined
            );
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 400 on empty message', async () => {
            mockRequest.body = {
                message: ''
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: expect.stringContaining('Boş mesaj gönderilemez')
            });
            expect(chatService.sendMessage).not.toHaveBeenCalled();
        });

        it('should return 400 on message exceeding 2000 characters', async () => {
            const longMessage = 'a'.repeat(2001);
            mockRequest.body = {
                message: longMessage
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: expect.stringContaining('Maksimum 2000 karakter')
            });
            expect(chatService.sendMessage).not.toHaveBeenCalled();
        });

        it('should return 400 on invalid sessionId format', async () => {
            mockRequest.body = {
                message: 'Hello',
                sessionId: 'invalid-uuid'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: expect.any(String)
            });
            expect(chatService.sendMessage).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.body = {
                message: 'Hello AI!'
            };

            mockRequest.user = undefined;

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Kullanıcı oturum açmamış'
            });
            expect(chatService.sendMessage).not.toHaveBeenCalled();
        });

        it('should return 400 when estimated tokens exceed 1000', async () => {
            // 4001 characters = ~1000 tokens (4 chars per token)
            const longMessage = 'a'.repeat(4001);
            mockRequest.body = {
                message: longMessage
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Mesaj çok uzun. Lütfen mesajınızı kısaltınız.'
            });
        });

        it('should return 503 on quota exceeded error', async () => {
            mockRequest.body = {
                message: 'Hello AI!'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const quotaError = new Error('quota exceeded');
            vi.mocked(chatService.sendMessage).mockRejectedValue(quotaError);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(503);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'quota exceeded'
            });
        });

        it('should return 503 on rate limit error', async () => {
            mockRequest.body = {
                message: 'Hello AI!'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const rateLimitError = new Error('rate_limit exceeded');
            vi.mocked(chatService.sendMessage).mockRejectedValue(rateLimitError);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(503);
        });

        it('should return 500 on other errors', async () => {
            mockRequest.body = {
                message: 'Hello AI!'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const genericError = new Error('Something went wrong');
            vi.mocked(chatService.sendMessage).mockRejectedValue(genericError);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Something went wrong'
            });
        });

        it('should log info on message received', async () => {
            mockRequest.body = {
                message: 'Hello AI!',
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(chatService.sendMessage).mockResolvedValue({} as any);

            await sendMessage(mockRequest as Request, mockResponse as Response);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Chat mesajı kullanıcıdan alındı: user123')
            );
        });
    });

    describe('clearConversation', () => {
        it('should return 200 when conversation is successfully cleared', async () => {
            mockRequest.body = {
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(chatService.clearConversation).mockReturnValue(true);

            await clearConversation(mockRequest as Request, mockResponse as Response);

            expect(chatService.clearConversation).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: 'Konuşma başarıyla temizlendi'
            });
        });

        it('should return 404 when conversation not found', async () => {
            mockRequest.body = {
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(chatService.clearConversation).mockReturnValue(false);

            await clearConversation(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Konuşma oturumu bulunamadı'
            });
        });

        it('should return 400 on invalid sessionId format', async () => {
            mockRequest.body = {
                sessionId: 'invalid-uuid'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            await clearConversation(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Geçersiz session ID formatı'
            });
            expect(chatService.clearConversation).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.body = {
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = undefined;

            await clearConversation(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Kullanıcı oturum açmamış'
            });
        });

        it('should return 500 on internal error', async () => {
            mockRequest.body = {
                sessionId: '123e4567-e89b-12d3-a456-426614174000'
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(chatService.clearConversation).mockImplementation(() => {
                throw new Error('Internal error');
            });

            await clearConversation(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Konuşma temizleme başarısız'
            });
        });
    });

    describe('healthCheck', () => {
        it('should return 200 with health status', async () => {
            vi.mocked(chatService.getActiveSessionCount).mockReturnValue(5);

            await healthCheck(mockRequest as Request, mockResponse as Response);

            expect(chatService.getActiveSessionCount).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: {
                    status: 'healthy',
                    activeSessionCount: 5,
                    timestamp: expect.any(String)
                }
            });
        });

        it('should return valid ISO timestamp', async () => {
            vi.mocked(chatService.getActiveSessionCount).mockReturnValue(0);

            await healthCheck(mockRequest as Request, mockResponse as Response);

            const callArg = jsonMock.mock.calls[0][0];
            const timestamp = callArg.data.timestamp;

            // Validate ISO 8601 format
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it('should return 500 on error', async () => {
            vi.mocked(chatService.getActiveSessionCount).mockImplementation(() => {
                throw new Error('Service unavailable');
            });

            await healthCheck(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Health check failed'
            });
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in chat health check')
            );
        });

        it('should work with zero active sessions', async () => {
            vi.mocked(chatService.getActiveSessionCount).mockReturnValue(0);

            await healthCheck(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: {
                    status: 'healthy',
                    activeSessionCount: 0,
                    timestamp: expect.any(String)
                }
            });
        });
    });
});
