/**
 * Chat Types & Interfaces
 * Chatbot sistemi için TypeScript type definitions
 */

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface ConversationSession {
    sessionId: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: number;
    lastActivityAt: number;
}

export interface SendMessageRequest {
    message: string;
    sessionId?: string;
}

export interface SendMessageResponse {
    success: boolean;
    data?: {
        message: string;
        sessionId: string;
        messageId: string;
    };
    error?: string;
}

export interface ClearConversationRequest {
    sessionId: string;
}

export interface ClearConversationResponse {
    success: boolean;
    message: string;
}

