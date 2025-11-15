import { describe, it, expect } from 'vitest';
import type {
    ChatMessage,
    ConversationSession,
    SendMessageRequest,
    SendMessageResponse,
    ClearConversationRequest,
    ClearConversationResponse
} from '../../types/chat.types';

describe('Chat Types', () => {
    describe('ChatMessage', () => {
        it('should accept valid user message', () => {
            const message: ChatMessage = {
                role: 'user',
                content: 'Hello!',
                timestamp: Date.now()
            };

            expect(message.role).toBe('user');
            expect(message.content).toBe('Hello!');
            expect(message.timestamp).toBeGreaterThan(0);
        });

        it('should accept valid assistant message', () => {
            const message: ChatMessage = {
                role: 'assistant',
                content: 'Hi! How can I help?',
                timestamp: Date.now()
            };

            expect(message.role).toBe('assistant');
            expect(message.content).toBe('Hi! How can I help?');
        });

        it('should accept valid system message', () => {
            const message: ChatMessage = {
                role: 'system',
                content: 'System prompt here',
                timestamp: Date.now()
            };

            expect(message.role).toBe('system');
            expect(message.content).toBe('System prompt here');
        });

        it('should have all required fields', () => {
            const message: ChatMessage = {
                role: 'user',
                content: 'Test',
                timestamp: 12345
            };

            expect(message).toHaveProperty('role');
            expect(message).toHaveProperty('content');
            expect(message).toHaveProperty('timestamp');
        });
    });

    describe('ConversationSession', () => {
        it('should create valid conversation session', () => {
            const session: ConversationSession = {
                sessionId: 'session-123',
                userId: 'user-456',
                messages: [],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            expect(session.sessionId).toBe('session-123');
            expect(session.userId).toBe('user-456');
            expect(session.messages).toEqual([]);
            expect(session.createdAt).toBeGreaterThan(0);
            expect(session.lastActivityAt).toBeGreaterThan(0);
        });

        it('should accept session with messages', () => {
            const messages: ChatMessage[] = [
                { role: 'user', content: 'Hello', timestamp: 1000 },
                { role: 'assistant', content: 'Hi!', timestamp: 2000 }
            ];

            const session: ConversationSession = {
                sessionId: 'session-123',
                userId: 'user-456',
                messages: messages,
                createdAt: 1000,
                lastActivityAt: 2000
            };

            expect(session.messages).toHaveLength(2);
            expect(session.messages[0].role).toBe('user');
            expect(session.messages[1].role).toBe('assistant');
        });

        it('should have all required fields', () => {
            const session: ConversationSession = {
                sessionId: 'id',
                userId: 'uid',
                messages: [],
                createdAt: 0,
                lastActivityAt: 0
            };

            expect(session).toHaveProperty('sessionId');
            expect(session).toHaveProperty('userId');
            expect(session).toHaveProperty('messages');
            expect(session).toHaveProperty('createdAt');
            expect(session).toHaveProperty('lastActivityAt');
        });
    });

    describe('SendMessageRequest', () => {
        it('should accept request with message only', () => {
            const request: SendMessageRequest = {
                message: 'Hello AI!'
            };

            expect(request.message).toBe('Hello AI!');
            expect(request.sessionId).toBeUndefined();
        });

        it('should accept request with message and sessionId', () => {
            const request: SendMessageRequest = {
                message: 'Hello AI!',
                sessionId: 'session-123'
            };

            expect(request.message).toBe('Hello AI!');
            expect(request.sessionId).toBe('session-123');
        });

        it('should require message field', () => {
            const request: SendMessageRequest = {
                message: 'Required message'
            };

            expect(request.message).toBeDefined();
        });
    });

    describe('SendMessageResponse', () => {
        it('should accept successful response', () => {
            const response: SendMessageResponse = {
                success: true,
                data: {
                    message: 'AI response',
                    sessionId: 'session-123',
                    messageId: 'msg-456'
                }
            };

            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
            expect(response.data?.message).toBe('AI response');
            expect(response.data?.sessionId).toBe('session-123');
            expect(response.data?.messageId).toBe('msg-456');
            expect(response.error).toBeUndefined();
        });

        it('should accept error response', () => {
            const response: SendMessageResponse = {
                success: false,
                error: 'Failed to process message'
            };

            expect(response.success).toBe(false);
            expect(response.error).toBe('Failed to process message');
            expect(response.data).toBeUndefined();
        });

        it('should have success field', () => {
            const successResponse: SendMessageResponse = {
                success: true
            };

            const errorResponse: SendMessageResponse = {
                success: false
            };

            expect(successResponse).toHaveProperty('success');
            expect(errorResponse).toHaveProperty('success');
        });
    });

    describe('ClearConversationRequest', () => {
        it('should accept valid sessionId', () => {
            const request: ClearConversationRequest = {
                sessionId: 'session-123'
            };

            expect(request.sessionId).toBe('session-123');
        });

        it('should require sessionId field', () => {
            const request: ClearConversationRequest = {
                sessionId: 'required-session-id'
            };

            expect(request.sessionId).toBeDefined();
        });
    });

    describe('ClearConversationResponse', () => {
        it('should accept successful response', () => {
            const response: ClearConversationResponse = {
                success: true,
                message: 'Conversation cleared successfully'
            };

            expect(response.success).toBe(true);
            expect(response.message).toBe('Conversation cleared successfully');
        });

        it('should accept error response', () => {
            const response: ClearConversationResponse = {
                success: false,
                message: 'Session not found'
            };

            expect(response.success).toBe(false);
            expect(response.message).toBe('Session not found');
        });

        it('should have required fields', () => {
            const response: ClearConversationResponse = {
                success: true,
                message: 'Test message'
            };

            expect(response).toHaveProperty('success');
            expect(response).toHaveProperty('message');
        });
    });

    describe('Type compatibility', () => {
        it('should allow messages array in conversation session', () => {
            const messages: ChatMessage[] = [
                { role: 'user', content: 'Msg 1', timestamp: 1 },
                { role: 'system', content: 'Msg 2', timestamp: 2 },
                { role: 'assistant', content: 'Msg 3', timestamp: 3 }
            ];

            const session: ConversationSession = {
                sessionId: 'test',
                userId: 'user',
                messages: messages,
                createdAt: 0,
                lastActivityAt: 3
            };

            expect(session.messages).toEqual(messages);
        });

        it('should allow optional data in SendMessageResponse', () => {
            const response1: SendMessageResponse = {
                success: true,
                data: {
                    message: 'Response',
                    sessionId: 'id',
                    messageId: 'mid'
                }
            };

            const response2: SendMessageResponse = {
                success: false
            };

            expect(response1.data).toBeDefined();
            expect(response2.data).toBeUndefined();
        });
    });

    describe('Edge cases', () => {
        it('should accept empty string message', () => {
            const message: ChatMessage = {
                role: 'user',
                content: '',
                timestamp: Date.now()
            };

            expect(message.content).toBe('');
        });

        it('should accept very long message', () => {
            const longContent = 'a'.repeat(10000);
            const message: ChatMessage = {
                role: 'user',
                content: longContent,
                timestamp: Date.now()
            };

            expect(message.content.length).toBe(10000);
        });

        it('should accept timestamp of 0', () => {
            const message: ChatMessage = {
                role: 'user',
                content: 'Test',
                timestamp: 0
            };

            expect(message.timestamp).toBe(0);
        });

        it('should accept empty messages array in session', () => {
            const session: ConversationSession = {
                sessionId: 'test',
                userId: 'user',
                messages: [],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            expect(session.messages).toEqual([]);
        });
    });
});
