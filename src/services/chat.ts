/**
 * Chat Service
 * OpenAI API integration ve conversation management
 */

import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { conversationStore } from '../utils/conversation-store';
import { ChatMessage } from '../types/chat.types';
import { logger } from '../utils/logger';
import User from '../models/user';

export class ChatService {
    private openai: OpenAI;

    /**
     * Form verilerine göre dinamik system prompt oluştur
     */
    private generateSystemPrompt(hasFormData: boolean, formData?: any): string {
        let basePrompt = `Sen Marin adlı bir sağlık asistanısın. Kullanıcılara takviye gıdalar, beslenme, genel sağlık ve wellness konularında yardımcı oluyorsun.

ÖNEMLİ KURALLAR:
- Genel sağlık bilgileri ve öneriler sunabilirsin
- Kesinlikle teşhis koyma, ilaç önerme veya tıbbi tavsiye verme
- ⚠️ KESİNLİKLE TAKVİYE GIDA MARKA ÖNERİSİ YAPMA - Kullanıcıya MARKA ismi önerme
- Kullanıcının ŞU AN KULLANDIĞI takviyeler hakkında bilgi verebilir, yorum yapabilirsin
- Genel takviye türleri hakkında bilgi verebilirsin (Omega 3 nedir, Vitamin D faydaları vb.)
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

YANIT VERME KURALLARI:
- TAKVİYE ÖNERİSİ İSTENDİĞİNDE:
  * "Takviye önerileri için Marin uzman danışmanlarımızla görüşmelisiniz" de
  * Form verilerine dayanarak ASLA spesifik ürün/takviye marka önerme
  * Sadece genel bilgi ver (örn: "Bağışıklık için genelde C vitamini faydalıdır" gibi)
  * MUTLAKA şu uyarıyı ekle: "⚠️ Kişiselleştirilmiş takviye önerileri için Marin uzmanlarıyla görüşmelisiniz."

- KULLANICININ MEVcut TAKVİYELERİ HAKKINDA:
  * Kullanıcının şu an kullandığı takviyeler hakkında bilgi verebilirsin
  * Faydaları, kullanım şekli, dikkat edilmesi gerekenler gibi konularda yorum yapabilirsin
  * "Bu takviyeyi kullanırken şunlara dikkat edin" şeklinde önerilerde bulunabilirsin

- GENEL BİLGİ sorularında (Omega 3 nedir?, Vitamin D'nin faydaları nedir? vb.):
  * Form verilerinden bahsetme, doğrudan bilgiyi ver
  * Uyarı mesajı ekleme, sadece bilgilendirici ol

Unutma: Sen bir bilgi kaynağısın, doktor veya eczacı değilsin.`;

        // Form verileri varsa ekle
        if (hasFormData && formData) {
            basePrompt += '\n\n--- KULLANICI SAĞLIK PROFİLİ ---\n';
            
            if (formData.age) basePrompt += `Yaş: ${formData.age}\n`;
            if (formData.gender) basePrompt += `Cinsiyet: ${formData.gender}\n`;
            if (formData.height) basePrompt += `Boy: ${formData.height} cm\n`;
            if (formData.weight) basePrompt += `Kilo: ${formData.weight} kg\n`;
            if (formData.occupation) basePrompt += `Meslek: ${formData.occupation}\n`;
            
            if (formData.exerciseRegularly !== undefined) {
                basePrompt += `Düzenli Egzersiz: ${formData.exerciseRegularly ? 'Evet' : 'Hayır'}\n`;
            }
            
            if (formData.alcoholSmoking) basePrompt += `Alkol/Sigara: ${formData.alcoholSmoking}\n`;
            
            if (formData.dietTypes && formData.dietTypes.length > 0) {
                basePrompt += `Diyet Türleri: ${formData.dietTypes.join(', ')}\n`;
            }
            
            if (formData.allergies && formData.allergies.length > 0) {
                basePrompt += `Alerjiler: ${formData.allergies.join(', ')}\n`;
            }
            
            if (formData.chronicConditions && formData.chronicConditions.length > 0) {
                basePrompt += `Kronik Hastalıklar: ${formData.chronicConditions.join(', ')}\n`;
            }
            
            if (formData.abnormalBloodTests && formData.abnormalBloodTests.length > 0) {
                basePrompt += `Anormal Kan Testleri: ${formData.abnormalBloodTests.join(', ')}\n`;
            }
            
            if (formData.medications && formData.medications.length > 0) {
                basePrompt += `Kullanılan İlaçlar: ${formData.medications.join(', ')}\n`;
            }
            
            if (formData.supplementGoals && formData.supplementGoals.length > 0) {
                basePrompt += `Takviye Hedefleri: ${formData.supplementGoals.join(', ')}\n`;
            }
            
            if (formData.additionalNotes) {
                basePrompt += `Ek Notlar: ${formData.additionalNotes}\n`;
            }
            
            basePrompt += '--- SAĞLIK PROFİLİ SONU ---\n';
        }

        // NOT: Ürün önerileri AI'ya context olarak VERİLMİYOR
        // Kullanıcı takviye önerisi isterse, uzman danışmanlara yönlendir
        // Sadece mevcut kullandığı takviyeler hakkında yorum yapabilir

        return basePrompt;
    }

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
                // Kullanıcının form verilerini al
                const user = await User.findById(userId).select('formData isFormFilled');
                const hasFormData = user?.isFormFilled && user?.formData;
                const formData = hasFormData ? user.formData : null;

                logger.debug(`Form verileri durumu - userId: ${userId}, hasFormData: ${!!hasFormData}`);

                // NOT: Artık ürün önerileri AI'ya context olarak verilmiyor
                // Sadece form verileri kullanılıyor

                // Dinamik system prompt oluştur
                const systemPromptContent = this.generateSystemPrompt(!!hasFormData, formData);

                const systemMessage: ChatMessage = {
                    role: 'system',
                    content: systemPromptContent,
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

