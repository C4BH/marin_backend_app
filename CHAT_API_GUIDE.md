# Marin Chatbot API Kullanım Kılavuzu

## Genel Bakış

Marin chatbot API'si, kullanıcılara sağlık ve takviye gıdalar konusunda genel bilgi veren bir AI asistanı sunar. OpenAI GPT-4o-mini modelini kullanır.

## Özellikler

- ✅ Session-based conversation (30 dakika TTL)
- ✅ JWT authentication
- ✅ Rate limiting (10 mesaj/dakika)
- ✅ In-memory conversation storage
- ✅ Otomatik conversation cleanup
- ✅ Maksimum 20 mesaj history per session

## Endpoints

### 1. Mesaj Gönder

**Endpoint:** `POST /api/v1/chat/message`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "message": "Omega-3 takviyesi hakkında bilgi verir misin?",
  "sessionId": "optional-uuid-v4" // İlk mesajda göndermezseniz otomatik oluşturulur
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "message": "Omega-3 yağ asitleri...",
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "messageId": "1699876543210-uuid"
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "Message cannot be empty"
}
```

**Response (Rate Limit - 429):**

```json
{
  "success": false,
  "error": "Çok fazla mesaj gönderdiniz. Lütfen bir dakika bekleyin."
}
```

### 2. Conversation Temizle

**Endpoint:** `POST /api/v1/chat/clear`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Conversation cleared successfully"
}
```

**Response (Not Found - 404):**

```json
{
  "success": false,
  "error": "Conversation session not found"
}
```

### 3. Health Check

**Endpoint:** `GET /api/v1/chat/health`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "activeSessionCount": 5,
    "timestamp": "2024-11-13T10:30:00.000Z"
  }
}
```

## Flutter Integration Örneği

### 1. API Service (Dio)

```dart
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

class ChatService {
  final Dio _dio;
  final String _baseUrl = 'http://localhost:2344/api/v1/chat';
  String? _sessionId;

  ChatService(this._dio);

  Future<ChatResponse> sendMessage(String message) async {
    try {
      // İlk mesajsa session ID oluştur
      _sessionId ??= const Uuid().v4();

      final response = await _dio.post(
        '$_baseUrl/message',
        data: {
          'message': message,
          'sessionId': _sessionId,
        },
      );

      return ChatResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 429) {
        throw 'Çok fazla mesaj gönderdiniz. Lütfen bekleyin.';
      }
      throw 'Mesaj gönderilemedi: ${e.message}';
    }
  }

  Future<void> clearConversation() async {
    if (_sessionId == null) return;

    try {
      await _dio.post(
        '$_baseUrl/clear',
        data: {'sessionId': _sessionId},
      );
      _sessionId = null;
    } catch (e) {
      print('Conversation temizlenemedi: $e');
    }
  }
}

class ChatResponse {
  final String message;
  final String sessionId;
  final String messageId;

  ChatResponse({
    required this.message,
    required this.sessionId,
    required this.messageId,
  });

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      message: json['message'],
      sessionId: json['sessionId'],
      messageId: json['messageId'],
    );
  }
}
```

### 2. Chat Controller (Riverpod)

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

final chatProvider = StateNotifierProvider<ChatController, ChatState>((ref) {
  final chatService = ref.watch(chatServiceProvider);
  return ChatController(chatService);
});

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ChatMessage {
  final String content;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.content,
    required this.isUser,
    required this.timestamp,
  });
}

class ChatController extends StateNotifier<ChatState> {
  final ChatService _chatService;

  ChatController(this._chatService) : super(ChatState());

  Future<void> sendMessage(String message) async {
    if (message.trim().isEmpty) return;

    // Kullanıcı mesajını ekle
    final userMessage = ChatMessage(
      content: message,
      isUser: true,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    );

    try {
      // AI yanıtı al
      final response = await _chatService.sendMessage(message);

      final aiMessage = ChatMessage(
        content: response.message,
        isUser: false,
        timestamp: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, aiMessage],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> clearConversation() async {
    await _chatService.clearConversation();
    state = ChatState(); // Reset
  }
}
```

### 3. UI Widget

```dart
class ChatScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatState = ref.watch(chatProvider);
    final chatController = ref.read(chatProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text('Marin'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => chatController.clearConversation(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: chatState.messages.length,
              itemBuilder: (context, index) {
                final message = chatState.messages[index];
                return ChatBubble(message: message);
              },
            ),
          ),
          if (chatState.isLoading)
            LinearProgressIndicator(),
          if (chatState.error != null)
            ErrorBanner(error: chatState.error!),
          ChatInput(
            onSend: (text) => chatController.sendMessage(text),
            enabled: !chatState.isLoading,
          ),
        ],
      ),
    );
  }
}
```

## Test Etmek İçin

### 1. .env dosyasına ekleyin:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Server'ı başlatın:

```bash
npm run dev
```

### 3. Postman/Insomnia ile test edin:

**Örnek Request:**

```bash
curl -X POST http://localhost:2344/api/v1/chat/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Merhaba, D vitamini eksikliği belirtileri nelerdir?"
  }'
```

## Rate Limiting

- **User başına:** 10 mesaj / dakika
- **Response:** 429 Too Many Requests

Limit aşıldığında 1 dakika beklemelisiniz.

## Güvenlik Notları

1. ✅ Tüm endpoint'ler JWT authentication gerektirir
2. ✅ Input validation (max 2000 karakter)
3. ✅ Rate limiting aktif
4. ✅ System prompt ile AI sınırlandırılmış (tıbbi tavsiye vermez)
5. ✅ Session TTL: 30 dakika (otomatik cleanup)

## Sınırlamalar

- Conversation history maksimum 20 mesaj
- Session expire: 30 dakika
- Mesaj uzunluğu: Max 2000 karakter
- OpenAI token limit check: ~1000 token
- Şu an kişisel sağlık verilerine erişim YOK (Phase 2)

## İlerideki Geliştirmeler (Phase 2)

- [ ] Kullanıcı health profile entegrasyonu
- [ ] Supplement veritabanından öneriler
- [ ] Conversation history DB'ye kayıt
- [ ] WebSocket support (real-time)
- [ ] Voice input/output
- [ ] Multi-language support
