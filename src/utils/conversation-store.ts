/**
 * In-Memory Conversation Store
 * Session-based conversation history yönetimi
 * TTL: 30 dakika
 * Max messages per conversation: 20
 */

import { ConversationSession, ChatMessage } from '../types/chat.types';
import { logger } from './logger';

class ConversationStore {
    private store: Map<string, ConversationSession>;
    private readonly TTL = 30 * 60 * 1000; // 30 dakika
    private readonly MAX_MESSAGES = 20;
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        this.store = new Map();
        // Her 5 dakikada bir expired session'ları temizle
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Yeni conversation session oluştur veya mevcut olanı getir
     */
    createOrGetSession(sessionId: string, userId: string): ConversationSession {
        const existing = this.store.get(sessionId);
        
        if (existing) {
            // Session'ı güncelle
            existing.lastActivityAt = Date.now();
            return existing;
        }

        // Yeni session oluştur
        const newSession: ConversationSession = {
            sessionId,
            userId,
            messages: [],
            createdAt: Date.now(),
            lastActivityAt: Date.now()
        };

        this.store.set(sessionId, newSession);
        logger.info(`New conversation session created: ${sessionId} for user: ${userId}`);
        return newSession;
    }

    /**
     * Session'a mesaj ekle
     */
    addMessage(sessionId: string, message: ChatMessage): void {
        const session = this.store.get(sessionId);
        if (!session) {
            logger.warn(`Session not found: ${sessionId}`);
            return;
        }

        session.messages.push(message);
        session.lastActivityAt = Date.now();

        // Max mesaj limitini aş, en eski user-assistant çiftini sil (system prompt hariç)
        if (session.messages.length > this.MAX_MESSAGES) {
            // System mesajları koru, sadece user/assistant mesajları sil
            const systemMessages = session.messages.filter(m => m.role === 'system');
            const otherMessages = session.messages.filter(m => m.role !== 'system');
            
            // En eski 2 mesajı sil (1 user + 1 assistant)
            otherMessages.splice(0, 2);
            
            session.messages = [...systemMessages, ...otherMessages];
            logger.debug(`Trimmed conversation history for session: ${sessionId}`);
        }
    }

    /**
     * Session'ın tüm mesajlarını getir
     */
    getMessages(sessionId: string): ChatMessage[] {
        const session = this.store.get(sessionId);
        return session ? session.messages : [];
    }

    /**
     * Session'ı temizle
     */
    clearSession(sessionId: string): boolean {
        const deleted = this.store.delete(sessionId);
        if (deleted) {
            logger.info(`Conversation session cleared: ${sessionId}`);
        }
        return deleted;
    }

    /**
     * Expired session'ları temizle
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.store.entries()) {
            if (now - session.lastActivityAt > this.TTL) {
                this.store.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} expired conversation sessions`);
        }
    }

    /**
     * Store'u tamamen temizle (test amaçlı)
     */
    clearAll(): void {
        this.store.clear();
        logger.info('All conversation sessions cleared');
    }

    /**
     * Aktif session sayısı
     */
    getActiveSessionCount(): number {
        return this.store.size;
    }

    /**
     * Cleanup interval'i durdur (graceful shutdown için)
     */
    shutdown(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
        logger.info('Conversation store shut down');
    }
}

// Singleton instance
export const conversationStore = new ConversationStore();

