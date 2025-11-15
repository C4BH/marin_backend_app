# Vademecum API - Mobil Entegrasyon Dökümanı

> **Backend Versiyon:** v1  
> **Son Güncelleme:** 15 Kasım 2024  
> **Durum:** ✅ Production Ready

---

## 📱 Genel Bakış

Marin backend'i, kullanıcıların sağlık profili ve takviye hedeflerine göre **kişiselleştirilmiş takviye gıda önerileri** sunar. Vademecum API entegrasyonu sayesinde gerçek ürün verileri (görsel, fiyat, içerik, kullanım amacı) ile öneriler sunulur.

### Sistem Nasıl Çalışır?

1. **Kullanıcı form doldurur** → `supplementGoals` belirlenir (örn: "enerji", "bağışıklık")
2. **Backend akıllı eşleştirme yapar** → 450+ ürün arasından en uygunları bulur
3. **Skorlanmış öneriler döner** → Her ürün için match skoru (0-100)
4. **Chatbot AI'ya context verilir** → Kullanıcı sohbette akıllı öneriler alır

---

## 🔗 API Endpoints

### Base URL

```
Production: https://api.marin.com/api/v1
Development: http://localhost:2344/api/v1
```

### Authentication

Tüm korumalı endpoint'ler için JWT token gereklidir:

```
Authorization: Bearer <access_token>
```

---

## 📍 Endpoint'ler

### 1. Kişiselleştirilmiş Öneriler

**Kullanıcıya özel takviye gıda önerileri**

```http
GET /supplements/recommendations
```

#### Headers

```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

#### Response (200 OK)

```json
{
  "isSuccess": true,
  "message": "Öneriler başarıyla getirildi",
  "data": {
    "recommendations": [
      {
        "id": "6733e5f2a8b9c1d2e3f4g5h6",
        "vademecumId": 3195,
        "name": "Vitamin D3 1000 IU Kapsül",
        "imageUrl": "https://cdn.vademecum.com/products/vitamin-d3.jpg",
        "price": 89.9,
        "currency": "TRY",
        "manufacturer": "Abdi İbrahim İlaç San. ve Tic. A.Ş.",
        "matchScore": 85,
        "matchReason": "Kullanım amacı hedefle uyumlu, İçerik hedefle uyumlu",
        "category": ["vitamin", "bağışıklık"],
        "form": "kapsül",
        "ingredients": [
          {
            "name": "Kolekalsiferol (Vitamin D3)",
            "amount": 1000,
            "unit": "IU"
          }
        ],
        "indication": "Bağışıklık sistemi desteği ve kemik sağlığı için vitamin D takviyesi"
      },
      {
        "id": "6733e5f2a8b9c1d2e3f4g5h7",
        "vademecumId": 4521,
        "name": "Omega 3 Fish Oil 1200mg",
        "imageUrl": "https://cdn.vademecum.com/products/omega3.jpg",
        "price": 125.5,
        "currency": "TRY",
        "manufacturer": "Eczacıbaşı İlaç San. ve Tic. A.Ş.",
        "matchScore": 75,
        "matchReason": "Kullanım amacı kısmen uyumlu",
        "category": ["omega 3", "kalp sağlığı"],
        "form": "yumuşak kapsül",
        "ingredients": [
          {
            "name": "Omega-3 Yağ Asitleri",
            "amount": 1200,
            "unit": "mg"
          }
        ],
        "indication": "Kardiyovasküler sağlık ve beyin fonksiyonları desteği"
      }
    ],
    "totalMatches": 12,
    "userGoals": ["enerji artışı", "bağışıklık desteği", "genel sağlık"]
  }
}
```

#### Response Alanları

| Alan           | Tip      | Açıklama                                    |
| -------------- | -------- | ------------------------------------------- |
| `id`           | string   | MongoDB ObjectId (ürün detayı için kullan)  |
| `vademecumId`  | number   | Vademecum API'deki ürün ID'si               |
| `name`         | string   | Ürün adı (tam commercial name)              |
| `imageUrl`     | string?  | Ürün görseli URL (null olabilir)            |
| `price`        | number?  | Perakende satış fiyatı                      |
| `currency`     | string?  | Para birimi (TRY, USD, EUR)                 |
| `manufacturer` | string?  | Üretici firma adı                           |
| `matchScore`   | number   | Eşleşme skoru (0-100, yüksek = daha uygun)  |
| `matchReason`  | string   | Neden önerildiğinin açıklaması              |
| `category`     | string[] | Kategoriler (vitamin, mineral, protein vb.) |
| `form`         | string?  | Ürün formu (kapsül, tablet, toz, sıvı vb.)  |
| `ingredients`  | array    | İçindeki aktif maddeler                     |
| `indication`   | string?  | Kullanım amacı / endikasyon                 |

#### Hata Durumları

**401 Unauthorized**

```json
{
  "isSuccess": false,
  "message": "Kimlik doğrulama gerekli"
}
```

**400 Bad Request**

```json
{
  "isSuccess": false,
  "message": "Öneri alabilmek için önce sağlık profili formunu doldurmalısınız"
}
```

**404 Not Found**

```json
{
  "isSuccess": false,
  "message": "Kullanıcı bulunamadı"
}
```

**500 Internal Server Error**

```json
{
  "isSuccess": false,
  "message": "Öneriler getirilirken bir hata oluştu",
  "error": "Database connection failed"
}
```

---

### 2. Tüm Ürünleri Listele

**Public endpoint - Tüm aktif takviye gıdaları listeler**

```http
GET /supplements?page=1&limit=20&search=vitamin
```

#### Query Parameters

| Parametre | Tip    | Zorunlu | Default | Açıklama                              |
| --------- | ------ | ------- | ------- | ------------------------------------- |
| `page`    | number | Hayır   | 1       | Sayfa numarası                        |
| `limit`   | number | Hayır   | 20      | Sayfa başına ürün sayısı (max: 100)   |
| `search`  | string | Hayır   | -       | Ürün adı, marka veya açıklama araması |

#### Örnek İstek

```http
GET /supplements?page=2&limit=10&search=omega
```

#### Response (200 OK)

```json
{
  "isSuccess": true,
  "message": "Takviye gıdalar başarıyla getirildi",
  "data": {
    "supplements": [
      {
        "_id": "6733e5f2a8b9c1d2e3f4g5h6",
        "name": "Omega 3 Fish Oil 1200mg",
        "brand": "Eczacıbaşı",
        "imageUrl": "https://cdn.vademecum.com/products/omega3.jpg",
        "price": 125.5,
        "currency": "TRY",
        "manufacturer": "Eczacıbaşı İlaç San. ve Tic. A.Ş.",
        "category": ["omega 3", "kalp sağlığı"],
        "form": "yumuşak kapsül",
        "rating": 4.5,
        "reviewCount": 128
      }
    ],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 450,
      "totalPages": 45,
      "hasMore": true
    }
  }
}
```

---

### 3. Tek Ürün Detayı

**Belirli bir ürünün detaylı bilgileri**

```http
GET /supplements/:id
```

#### Path Parameters

| Parametre | Tip    | Açıklama                                          |
| --------- | ------ | ------------------------------------------------- |
| `id`      | string | MongoDB ObjectId (recommendations'dan gelen `id`) |

#### Örnek İstek

```http
GET /supplements/6733e5f2a8b9c1d2e3f4g5h6
```

#### Response (200 OK)

```json
{
  "isSuccess": true,
  "message": "Takviye gıda başarıyla getirildi",
  "data": {
    "_id": "6733e5f2a8b9c1d2e3f4g5h6",
    "name": "Vitamin D3 1000 IU Kapsül",
    "brand": "Abdi İbrahim",
    "form": "kapsül",
    "ingredients": [
      {
        "name": "Kolekalsiferol (Vitamin D3)",
        "amount": 1000,
        "unit": "IU",
        "dailyValue": 250
      }
    ],
    "usage": {
      "recommendedDosage": "Günde 1 kapsül",
      "frequency": "Günlük",
      "timing": "Yemeklerle birlikte"
    },
    "medicalInfo": {
      "description": "Bağışıklık sistemi desteği ve kemik sağlığı için vitamin D takviyesi",
      "approvedUses": [
        "Bağışıklık desteği",
        "Kemik sağlığı",
        "D vitamini eksikliği"
      ],
      "sideEffects": ["Nadiren bulantı", "Baş ağrısı"],
      "interactions": ["Kalsiyum takviyesi ile birlikte alınabilir"],
      "warnings": ["Gebelikte hekim kontrolü önerilir"]
    },
    "rating": 4.7,
    "reviewCount": 234,
    "category": ["vitamin", "bağışıklık"],
    "price": 89.9,
    "currency": "TRY",
    "imageUrl": "https://cdn.vademecum.com/products/vitamin-d3.jpg",
    "manufacturer": "Abdi İbrahim İlaç San. ve Tic. A.Ş.",
    "availability": true,
    "isActive": true,
    "createdAt": "2024-11-10T12:34:56.789Z",
    "updatedAt": "2024-11-15T08:20:15.123Z"
  }
}
```

#### Hata Durumları

**404 Not Found**

```json
{
  "isSuccess": false,
  "message": "Takviye gıda bulunamadı"
}
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Kullanıcı Form Doldurdu, Öneriler Göster

**Flow:**

1. Kullanıcı health profile formunu doldurur
2. Form backend'e POST edilir → `supplementGoals` kaydedilir
3. Backend otomatik olarak önerileri hesaplar (form service'de)
4. Mobil app **kullanıcı istediğinde** recommendations endpoint'ini çağırır
5. Öneriler "Öneriler" ekranında gösterilir

> **NOT:** Chatbot artık ürün önerisi yapmıyor. Öneriler sadece dedicated "Öneriler" ekranında gösterilmeli.

### Senaryo 2: Chatbot Entegrasyonu

**Chatbot Davranışı:**

Chatbot artık **spesifik ürün önerisi yapmıyor**. Bunun yerine:

1. ✅ Genel takviye bilgileri verebilir (Omega 3 nedir, C vitamini faydaları vb.)
2. ✅ Kullanıcının **mevcut kullandığı** takviyeler hakkında yorum yapabilir
3. ❌ Yeni ürün/takviye önerisi YAPAMAZ
4. ⚠️ Takviye önerisi için kullanıcıyı uzman danışmanlara yönlendirir

**Örnek Chat Akışları:**

**Senaryo A - Takviye Önerisi İsteme:**

```
User: "Bağışıklığım zayıf, hangi takviye önerirsin?"

AI: "Genel olarak bağışıklık sistemi için C vitamini,
D vitamini ve Çinko faydalı olabilir. Ancak
kişiselleştirilmiş takviye önerileri için Marin
uzman danışmanlarımızla görüşmenizi öneririm.

⚠️ Kişiselleştirilmiş takviye önerileri için
Marin uzmanlarıyla görüşmelisiniz."
```

**Senaryo B - Genel Bilgi:**

```
User: "Omega 3'ün faydaları nedir?"

AI: "Omega 3 yağ asitleri kalp sağlığı, beyin
fonksiyonları ve enflamasyonun azaltılması için
önemlidir. EPA ve DHA içeren balık yağı türevleri
en yaygın kullanılan formlardır..."
```

**Senaryo C - Mevcut Takviye Hakkında Yorum:**

```
User: "Vitamin D3 kullanıyorum, nasıl almalıyım?"

AI: "Vitamin D3'ü yağlı yemeklerle birlikte almanız
emilimini artırır. Günde 1 doz, sabah kahvaltıda
almak ideal olabilir. Güneş ışığı alımınızı da
artırmaya çalışın..."
```

**Mobil tarafta ekstra bir şey yapmanıza gerek yok!** Backend chatbot'u otomatik olarak bu kurallara göre çalıştırıyor.

---

## 📊 Matching Algoritması (Bilgi Amaçlı)

Backend'de ürünler şu şekilde skorlanıyor:

### Skorlama Kriterleri

| Kriter                 | Puan | Açıklama                                                 |
| ---------------------- | ---- | -------------------------------------------------------- |
| **Indication Match**   | 50   | Ürünün kullanım amacı kullanıcının hedefiyle eşleşiyorsa |
| **Product Name Match** | 30   | Ürün adı kullanıcının hedefiyle eşleşiyorsa              |
| **Ingredient Match**   | 20   | İçindeki aktif maddeler hedefle uyumluysa                |
| **Category Bonus**     | +10  | Kategori eşleşmesi varsa bonus                           |

### Örnek Hesaplama

```
Kullanıcı Goal: "bağışıklık desteği"

Ürün: Vitamin D3 1000 IU
- Indication: "Bağışıklık sistemi desteği..." → +50
- Product Name: "Vitamin D3" → +30
- Ingredients: "Vitamin D3" → +20
- Category: ["vitamin", "bağışıklık"] → +10

Toplam Score: 110 → Normalize → 100 (Max)
```

### Turkish Character Normalization

Backend Türkçe karakterleri normalize ediyor:

- ı → i
- ş → s
- ğ → g
- ü → u
- ö → o
- ç → c

Bu sayede kullanıcı "bagisiklik" yazsa bile "bağışıklık" ile eşleşiyor.

---

## 🔄 Veri Güncelliği

### Otomatik Senkronizasyon

Backend her gün **03:00'da** otomatik olarak Vademecum API'den yeni ürünleri çeker ve mevcut ürünleri günceller.

### Cache Stratejisi

- **Product List Cache:** 6 saat
- **Product Card Cache:** 24 saat
- **Recommendations:** Her istekte yeniden hesaplanır (ürünler cache'den)

**Mobil tarafta yapmanız gerekenler:**

1. Recommendations'ı her seferinde API'den çekin (user-specific)
2. Ürün listesini cache'leyebilirsiniz (6 saat fresh)
3. Tek ürün detayını cache'leyebilirsiniz (24 saat)

---

### Ürün Detay Sayfası

**Şunları Gösterin:**

- ✅ Ürün görseli (büyük)
- ✅ Ürün adı ve üretici
- ✅ Fiyat ve para birimi
- ✅ İçindeki aktif maddeler (ingredients)
- ✅ Kullanım amacı (indication)
- ✅ Kullanım talimatı (usage)
- ✅ Uyarılar ve yan etkiler (warnings, side effects)
- ✅ Rating ve review count

### API Test Endpoints (Development)

```bash
# Health check
curl http://localhost:2344/health

# Get recommendations (with auth)
curl -H "Authorization: Bearer <token>" \
     http://localhost:2344/api/v1/supplements/recommendations

# Get all supplements (public)
curl http://localhost:2344/api/v1/supplements?page=1&limit=10
```

---

## 📱 Riverpod State Management Örneği

```dart
// Provider tanımları
final supplementRepositoryProvider = Provider<SupplementRepository>((ref) {
  return SupplementRepositoryImpl(dio: ref.read(dioProvider));
});

final recommendationsProvider = FutureProvider<RecommendationsResponse>((ref) {
  final repository = ref.read(supplementRepositoryProvider);
  return repository.getRecommendations();
});

final supplementsListProvider = StateNotifierProvider<SupplementsNotifier, SupplementsState>((ref) {
  return SupplementsNotifier(ref.read(supplementRepositoryProvider));
});

// UI'da kullanım
class RecommendationsScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendationsAsync = ref.watch(recommendationsProvider);

    return recommendationsAsync.when(
      loading: () => CircularProgressIndicator(),
      error: (error, stack) {
        if (error is FormNotFilledException) {
          return FormNotFilledWidget();
        }
        return ErrorWidget(error.toString());
      },
      data: (response) {
        return ListView.builder(
          itemCount: response.recommendations.length,
          itemBuilder: (context, index) {
            final supplement = response.recommendations[index];
            return SupplementCard(supplement: supplement);
          },
        );
      },
    );
  }
}
```

---

## 🔐 Güvenlik Notları

1. **API Key'leri Saklamayın:** Tüm authentication backend üzerinden
2. **Token Refresh:** Access token expire olduğunda refresh token kullanın
3. **HTTPS Kullanın:** Production'da sadece HTTPS
4. **Sensitive Data:** Sağlık bilgileri hassas, dikkatli handle edin

---

## 📞 Destek ve Sorular

### Backend Geliştirici İletişim

- **Soru ve Sorunlar:** Backend ekibiyle Slack üzerinden iletişime geçin
- **API Değişiklikleri:** Versiyon değişikliklerinde bildirim alacaksınız
- **Rate Limiting:** Henüz yok ama ekleneceğinde bildirim yapılacak

### Yararlı Kaynaklar

- Backend Repo: `marin-backend`
- API Postman Collection: `/docs/postman/`
- Logger Çıktıları: Backend ekibinden isteyin

---

## 📈 Gelecek Güncellemeler (Roadmap)

### Yakında Gelecek Özellikler

- [ ] **Ürün Favorileme** - Kullanıcı ürünleri favorilerine ekleyebilecek
- [ ] **Review & Rating** - Kullanıcılar ürünleri değerlendirebilecek
- [ ] **Compare Products** - İki ürünü karşılaştırma
- [ ] **Price Tracking** - Fiyat değişikliği bildirimleri
- [ ] **Similar Products** - "Buna benzer ürünler"
- [ ] **AI-Powered Search** - Doğal dil araması
- [ ] **Notification** - Yeni öneriler için bildirim

### Breaking Changes (Yapılması Planlanan)

Şu an planlanmış breaking change yok. Tüm değişiklikler backward-compatible olacak.

---

## 📋 Checklist: Mobil Entegrasyon

Entegrasyonu tamamlamak için:

- [ ] Dio/HTTP client setup (base URL, interceptors)
- [ ] JWT token management (storage, refresh)
- [ ] Supplement data models oluştur
- [ ] Repository pattern implement et
- [ ] State management setup (Riverpod/Bloc)
- [ ] Recommendations screen UI
- [ ] Supplements list screen UI (pagination)
- [ ] Supplement detail screen UI
- [ ] Error handling (FormNotFilled, Unauthorized, etc.)
- [ ] Loading states
- [ ] Empty states ("Henüz öneri yok")
- [ ] Image caching (CachedNetworkImage)
- [ ] Pull-to-refresh
- [ ] Unit tests (repository, models)
- [ ] Integration tests (API calls)

---

## 🎉 Özet

Vademecum API entegrasyonu ile:

✅ Kullanıcılara **kişiselleştirilmiş** takviye önerileri sunabilirsiniz  
✅ 450+ gerçek ürün verisi (görsel, fiyat, içerik)  
✅ Akıllı **match scoring** algoritması  
✅ Chatbot genel bilgiler verir ve uzman danışmanlara yönlendirir
✅ Ürün önerileri dedicated "Öneriler" ekranında gösterilir  
✅ **Production-ready** ve test edilmiş sistem

**İyi kodlamalar! 🚀**

---

**Döküman Versiyonu:** 1.0  
**Son Güncelleme:** 15 Kasım 2024  
**Hazırlayan:** Marin Backend Team
