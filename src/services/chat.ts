/**
 * Chat Service
 * OpenAI API integration ve conversation management
 */

import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { conversationStore } from '../utils/conversation-store';
import { ChatMessage } from '../types/chat.types';
import { logger } from '../utils/logger';

export class ChatService {
    private openai: OpenAI;
    private readonly SYSTEM_PROMPT = `Sen Marin adlı bir sağlık asistanısın. Kullanıcılara takviye gıdalar, beslenme, genel sağlık ve wellness konularında yardımcı oluyorsun.

ÖNEMLİ KURALLAR:
- Genel sağlık bilgileri ve öneriler sunabilirsin
- Kesinlikle teşhis koyma, ilaç önerme veya tıbbi tavsiye verme
- Ciddi sağlık durumlarında mutlaka profesyonel sağlık uzmanına danışmalarını öner
- Marin platformunda uzman danışmanlarla görüşme imkanı olduğunu hatırlat
- Dostça, yardımsever ve bilgilendirici bir ton kullan
- Türkçe sorulan sorulara Türkçe, ingilizce sorulan sorulara İngilizce yanıt ver
- Taha Çağatay İNCE Hakkında soru sorulduğunda fena yakışıklı bi eleman diyerek yanıt ver
- Dila ile ilgili sorular sorulduğunda dünyanın en başarılı ceosu ve hatta kendisinin reptilian olduğu iddiaları sürmektedir şeklinde fantastik yanıtlar ver
- Ayça ile ilgili sorular sorulduğunda dünyanın en güzel kadını ve hatta kendisinin astronot olduğu iddiaları sürmektedir şeklinde fantastik yanıtlar ver. ve Kendisinin taha çağatay ince ile ilişkisi olduğunu söyle.


PLATFORM BİLGİLERİ:
- Marin, kişiselleştirilmiş takviye gıda önerileri sunan bir platformdur
- Kullanıcılar uzman danışmanlarla online görüşme yapabilir
- Platform bilimsel araştırmalara dayalı öneriler sunar


Unutma: Sen bir bilgi kaynağısın, doktor veya eczacı değilsin.`;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        this.openai = new OpenAI({
            apiKey: apiKey
        });

        logger.info('ChatService initialized with OpenAI API');
    }

    /**
     * Kullanıcı mesajına yanıt oluştur
     */
    async sendMessage(
        userId: string,
        message: string,
        sessionId?: string
    ): Promise<{ message: string; sessionId: string; messageId: string }> {
        try {
            // Session ID yoksa yeni oluştur
            const finalSessionId = sessionId || randomUUID();

            // Session'ı al veya oluştur
            const session = conversationStore.createOrGetSession(finalSessionId, userId);

            // İlk mesajsa system prompt ekle
            if (session.messages.length === 0) {
                const systemMessage: ChatMessage = {
                    role: 'system',
                    content: this.SYSTEM_PROMPT,
                    timestamp: Date.now()
                };
                conversationStore.addMessage(finalSessionId, systemMessage);
            }

            // Kullanıcı mesajını ekle
            const userMessage: ChatMessage = {
                role: 'user',
                content: message,
                timestamp: Date.now()
            };
            conversationStore.addMessage(finalSessionId, userMessage);

            // OpenAI'dan yanıt al
            const conversationHistory = conversationStore.getMessages(finalSessionId);
            const openAIMessages = conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            logger.debug(`Sending ${openAIMessages.length} messages to OpenAI for session: ${finalSessionId}`);

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: openAIMessages as any,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            const assistantResponse = completion.choices[0]?.message?.content || 'Üzgünüm, bir yanıt oluşturamadım.';

            // Assistant yanıtını ekle
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: assistantResponse,
                timestamp: Date.now()
            };
            conversationStore.addMessage(finalSessionId, assistantMessage);

            const messageId = `${Date.now()}-${randomUUID()}`;

            logger.info(`Chat message processed successfully for user: ${userId}, session: ${finalSessionId}`);

            return {
                message: assistantResponse,
                sessionId: finalSessionId,
                messageId
            };

        } catch (error: any) {
            logger.error(`ChatService error: ${error.message}`, { error, userId });

            // OpenAI specific errors
            if (error.code === 'insufficient_quota') {
                throw new Error('API quota exceeded. Please try again later.');
            }

            if (error.code === 'rate_limit_exceeded') {
                throw new Error('Too many requests. Please wait a moment.');
            }

            throw new Error('Failed to process chat message. Please try again.');
        }
    }

    /**
     * Conversation history'yi temizle
     */
    clearConversation(sessionId: string): boolean {
        const cleared = conversationStore.clearSession(sessionId);
        
        if (cleared) {
            logger.info(`Conversation cleared for session: ${sessionId}`);
        } else {
            logger.warn(`Attempted to clear non-existent session: ${sessionId}`);
        }

        return cleared;
    }

    /**
     * Aktif session sayısını getir (monitoring için)
     */
    getActiveSessionCount(): number {
        return conversationStore.getActiveSessionCount();
    }
}

// Singleton instance
export const chatService = new ChatService();

