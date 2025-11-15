import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { conversationStore } from '../../utils/conversation-store';
import { logger } from '../../utils/logger';
import User from '../../models/user';
import OpenAI from 'openai';

// Set environment variable before any imports
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock dependencies
vi.mock('../../utils/conversation-store');
vi.mock('../../utils/logger');
vi.mock('../../models/user');
vi.mock('openai', () => {
    const mockCreate = vi.fn();
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        }))
    };
});

// Mock chat service to prevent singleton initialization
// We need to mock the entire module but keep ChatService class
vi.mock('../../services/chat', async () => {
    // Import actual to get ChatService class
    const actualModule = await vi.importActual<typeof import('../../services/chat')>('../../services/chat');
    return {
        ...actualModule,
        // Export ChatService class but don't export singleton
        ChatService: actualModule.ChatService,
        // Don't export chatService singleton
        chatService: undefined as any
    };
});

// Import ChatService after mocks are set up
import { ChatService } from '../../services/chat';

describe('ChatService', () => {
    let chatService: ChatService;
    let mockOpenAI: any;
    let originalEnv: string | undefined;

    beforeEach(() => {
        vi.clearAllMocks();

        // Save and set OpenAI API key
        originalEnv = process.env.OPENAI_API_KEY;
        process.env.OPENAI_API_KEY = 'test-api-key';

        // Get mocked OpenAI instance
        mockOpenAI = {
            chat: {
                completions: {
                    create: vi.fn()
                }
            }
        };
        vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);
        
        chatService = new ChatService();
    });

    afterEach(() => {
        if (originalEnv !== undefined) {
            process.env.OPENAI_API_KEY = originalEnv;
        } else {
            delete process.env.OPENAI_API_KEY;
        }
    });

    describe('constructor', () => {
        it('should throw error when OPENAI_API_KEY is not set', () => {
            delete process.env.OPENAI_API_KEY;

            expect(() => new ChatService()).toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should initialize with OpenAI API when key is present', () => {
            process.env.OPENAI_API_KEY = 'test-key';

            const service = new ChatService();

            expect(OpenAI).toHaveBeenCalledWith({
                apiKey: 'test-key'
            });
            expect(logger.info).toHaveBeenCalledWith('ChatService initialized with OpenAI API');
        });
    });

    describe('sendMessage', () => {
        it('should send message and get AI response for new session', async () => {
            const userId = 'user123';
            const message = 'Hello AI!';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            const mockUser = {
                _id: userId,
                isFormFilled: false,
                formData: null
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(User.findById).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser)
            } as any);
            vi.mocked(conversationStore.getMessages).mockReturnValue([
                { role: 'system', content: 'System prompt' },
                { role: 'user', content: message }
            ]);

            mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{
                    message: {
                        content: 'AI response'
                    }
                }]
            });

            const result = await chatService.sendMessage(userId, message);

            expect(result).toHaveProperty('message', 'AI response');
            expect(result).toHaveProperty('sessionId');
            expect(result).toHaveProperty('messageId');
            expect(conversationStore.addMessage).toHaveBeenCalledTimes(3); // system, user, assistant
        });

        it('should use existing sessionId when provided', async () => {
            const userId = 'user123';
            const message = 'Hello!';
            const sessionId = 'existing-session-123';

            const mockSession = {
                sessionId: sessionId,
                userId: userId,
                messages: [
                    { role: 'system', content: 'System prompt' },
                    { role: 'user', content: 'Previous message' },
                    { role: 'assistant', content: 'Previous response' }
                ],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue(mockSession.messages);

            mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{
                    message: {
                        content: 'New AI response'
                    }
                }]
            });

            const result = await chatService.sendMessage(userId, message, sessionId);

            expect(result.sessionId).toBe(sessionId);
            expect(conversationStore.createOrGetSession).toHaveBeenCalledWith(sessionId, userId);
        });

        it('should include form data in system prompt when user has filled form', async () => {
            const userId = 'user123';
            const message = 'What supplements should I take?';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            const mockUser = {
                _id: userId,
                isFormFilled: true,
                formData: {
                    age: 30,
                    gender: 'male',
                    weight: 75,
                    height: 180,
                    exerciseRegularly: true,
                    allergies: ['peanuts']
                }
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(User.findById).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser)
            } as any);
            vi.mocked(conversationStore.getMessages).mockReturnValue([]);

            mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{
                    message: {
                        content: 'Based on your profile...'
                    }
                }]
            });

            await chatService.sendMessage(userId, message);

            // Verify system prompt was added with form data
            expect(conversationStore.addMessage).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    role: 'system',
                    content: expect.stringContaining('Yaş: 30')
                })
            );
        });

        it('should handle OpenAI quota exceeded error', async () => {
            const userId = 'user123';
            const message = 'Hello!';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [{ role: 'system', content: 'System prompt' }],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue([]);

            const quotaError: any = new Error('Quota exceeded');
            quotaError.code = 'insufficient_quota';

            mockOpenAI.chat.completions.create.mockRejectedValue(quotaError);

            await expect(chatService.sendMessage(userId, message))
                .rejects.toThrow('API quota exceeded. Please try again later.');

            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle OpenAI rate limit exceeded error', async () => {
            const userId = 'user123';
            const message = 'Hello!';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [{ role: 'system', content: 'System prompt' }],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue([]);

            const rateLimitError: any = new Error('Rate limit exceeded');
            rateLimitError.code = 'rate_limit_exceeded';

            mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

            await expect(chatService.sendMessage(userId, message))
                .rejects.toThrow('Too many requests. Please wait a moment.');
        });

        it('should handle generic OpenAI errors', async () => {
            const userId = 'user123';
            const message = 'Hello!';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [{ role: 'system', content: 'System prompt' }],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue([]);

            mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Generic error'));

            await expect(chatService.sendMessage(userId, message))
                .rejects.toThrow('Failed to process chat message. Please try again.');
        });

        it('should use default message when OpenAI returns empty response', async () => {
            const userId = 'user123';
            const message = 'Hello!';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [{ role: 'system', content: 'System prompt' }],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue([]);

            mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{
                    message: {
                        content: null
                    }
                }]
            });

            const result = await chatService.sendMessage(userId, message);

            expect(result.message).toBe('Üzgünüm, bir yanıt oluşturamadım.');
        });

        it('should call OpenAI with correct parameters', async () => {
            const userId = 'user123';
            const message = 'Test message';

            const mockSession = {
                sessionId: 'session-123',
                userId: userId,
                messages: [{ role: 'system', content: 'System prompt' }],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            vi.mocked(conversationStore.createOrGetSession).mockReturnValue(mockSession);
            vi.mocked(conversationStore.getMessages).mockReturnValue([
                { role: 'system', content: 'System prompt' },
                { role: 'user', content: message }
            ]);

            mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{
                    message: {
                        content: 'Response'
                    }
                }]
            });

            await chatService.sendMessage(userId, message);

            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
                model: 'gpt-4o-mini',
                messages: expect.any(Array),
                temperature: 0.7,
                max_tokens: 500,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });
        });
    });

    describe('clearConversation', () => {
        it('should clear conversation and return true when session exists', () => {
            const sessionId = 'session-123';

            vi.mocked(conversationStore.clearSession).mockReturnValue(true);

            const result = chatService.clearConversation(sessionId);

            expect(result).toBe(true);
            expect(conversationStore.clearSession).toHaveBeenCalledWith(sessionId);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Conversation cleared for session')
            );
        });

        it('should return false and log warning when session does not exist', () => {
            const sessionId = 'nonexistent-session';

            vi.mocked(conversationStore.clearSession).mockReturnValue(false);

            const result = chatService.clearConversation(sessionId);

            expect(result).toBe(false);
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Attempted to clear non-existent session')
            );
        });
    });

    describe('getActiveSessionCount', () => {
        it('should return active session count from conversation store', () => {
            vi.mocked(conversationStore.getActiveSessionCount).mockReturnValue(5);

            const count = chatService.getActiveSessionCount();

            expect(count).toBe(5);
            expect(conversationStore.getActiveSessionCount).toHaveBeenCalled();
        });

        it('should return 0 when no active sessions', () => {
            vi.mocked(conversationStore.getActiveSessionCount).mockReturnValue(0);

            const count = chatService.getActiveSessionCount();

            expect(count).toBe(0);
        });
    });
});
