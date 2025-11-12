# MARIN - Personalized Supplement Recommendation Platform

## GENEL BAKIŞ
Marin, kullanıcılara bilim temelli, kişiselleştirilmiş takviye gıda önerileri sunan bir sağlık teknolojisi platformudur. Platform, bilimsel araştırmalardan ve tıbbi veritabanlarından çekilen verilerle desteklenen öneriler sunar, kullanıcı takibi yapar ve profesyonel danışmanlık hizmeti sağlar.

## TEKNOLOJİ STACK

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Dil**: TypeScript
- **Veritabanı**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (Access + Refresh Token)
- **Cloud Services**: AWS (SES, S3, SNS)
- **Email**: AWS SES (production), Mailtrap (development)
- **Logging**: Winston
- **Validation**: Zod
- **Scheduling**: node-cron

### Mobile
- **Framework**: Flutter
- **State Management**: Riverpod
- **Networking**: Dio + Retrofit
- **Local Storage**: Isar
- **Notifications**: flutter_local_notifications

### External APIs
- **Consensus API**: Bilimsel makale verileri
- **Vademecum API**: İlaç ve takviye gıda veritabanı

## KULLANICI TİPLERİ & ROLLER

### 1. User (Son Kullanıcı)
- Kişisel supplement planı oluşturabilir
- Form doldurarak profil çıkarabilir
- Meeting talep edebilir
- Chatbot ile etkileşime geçebilir
- Takviyeleri değerlendirebilir
- Hatırlatmalar alabilir

### 2. Advisor (Danışman)
- User ile özel role sahip
- Meeting kabul edip yönetebilir
- Kullanıcılara supplement önerebilir
- Meeting notları tutabilir
- Specialization ve sertifika bilgilerine sahip

### 3. Admin (Sistem Yöneticisi)
- Tüm verilere erişim
- Supplement onayı
- Enterprise yönetimi
- Platform moderasyonu

### 4. Enterprise (Kurumsal Müşteri)
- Çoklu kullanıcı yönetimi
- Paket bazlı özellikler (Bronze/Silver/Gold)
- Çalışan sağlığı takibi

## CORE FEATURES (MVP)

### 1. Authentication & Authorization
**Email + Password:**
- Kayıt sırasında email verification
- 6 haneli verification code (AWS SES)
- Kod 15 dakika geçerli

**Refresh Token Sistemi:**
- Access token: 1 saat
- Refresh token: 30 gün
- Multi-device support
- Device tracking (iOS/Android/Web)

**Social Login (Gelecek):**
- Google OAuth
- Apple Sign-In

### 2. Onboarding & Health Profile
**Form Sistemi:**
- Dinamik soru yapısı (FormQuestion model)
- Kategoriler: health, lifestyle, diet, goals, medical_history
- Cevap tipleri: text, multiple_choice, rating, yes_no, number
- Kullanıcı cevapları FormResponse'da saklanır

**Çıkarılan Profil:**
- Yaş, cinsiyet, boy, kilo, BMI
- Sağlık hedefleri (enerji, kas yapımı, bağışıklık)
- Mevcut sağlık durumu
- Alerji ve hassasiyetler
- Diyet tercihleri

### 3. Supplement Recommendation Engine
**Veri Kaynakları:**
- **Vademecum API**: Ürün bilgileri, yan etkiler, etkileşimler
- **Consensus API**: Bilimsel kanıt seviyesi, araştırma sayısı

**Supplement Özellikleri:**
- İsim, marka, form (tablet/kapsül/toz)
- İçerik breakdown (her ingredient için miktar, %DV)
- Kullanım talimatları
- Bilimsel kanıt skoru (Consensus)
- Tıbbi bilgiler (Vademecum)
- Yan etki ve etkileşim uyarıları
- Community rating

**Öneri Mantığı (MVP):**
1. User form cevaplarına göre goals belirlenir
2. Goals ile uyumlu ingredients eşleştirilir
3. Bilimsel kanıt seviyesi yüksek supplements filtrelenir
4. Etkileşim kontrolü yapılır (mevcut supplements ile)
5. Sıralama: Effectiveness + Consensus Score + Rating

### 4. User Supplement Tracking
**UserSupplements (Kullanıcının aktif takviyeleri):**
- Quantity (kaç kutu/şişe)
- Usage schedule (günde 2 kez, sabah açken)
- Start/end date
- Personal notes
- Effectiveness rating (1-10)
- Prescribed by (advisor ise)
- Related meeting

**Hatırlatma Sistemi:**
- Günlük kullanım reminder (local + push notification)
- Bitme uyarısı (2 hafta kala)
- Yenileme önerisi

### 5. Advisor Meeting System
**Meeting Flow:**
1. User meeting request oluşturur
2. Advisor listesinden seçim yapar (specialization bazlı)
3. Müsait slot seçer
4. Advisor onaylar/reddeder
5. Meeting gerçekleşir
6. İki taraf da rating verir
7. Advisor notlar ekler ve yeni supplements önerebilir

**Meeting Özellikleri:**
- Duration (30/60 dakika paket bazlı)
- Status: scheduled, completed, cancelled, no_show
- Discussed supplements tracking
- Recommendations (advisor tarafından)
- Mutual rating system
- Cancellation tracking (kim iptal etti, sebep)

**Meeting Limitleri:**
- Personal plan: Ayda 2 meeting
- Enterprise: Unlimited (şirket içi)
- No-show 3 kez olursa meeting hakkı askıya alınır

### 6. Comment & Rating System
**Polymorphic Comments:**
- Supplement review
- Advisor review
- Meeting feedback

**Rating Aggregation:**
- Supplement average rating güncellenir
- Advisor average rating güncellenir
- Review count tracking

### 7. Notification System
**Notification Tipleri:**
- supplement_reminder: Günlük kullanım hatırlatması
- meeting_reminder: 24 saat ve 1 saat öncesi
- form_due: Aylık takip formu
- meeting_request: Yeni meeting talebi (advisor için)

**Delivery Channels:**
- Push notification (SNS)
- Email (SES)
- In-app notification

**Scheduling:**
- node-cron ile günlük check
- Scheduled notifications için queue sistem

### 8. Enterprise Features (MVP)
**Plan Tipleri:**
- Bronze: 50 kullanıcı, temel özellikler
- Silver: 200 kullanıcı, priority support
- Gold: Unlimited, custom branding, analytics

**Enterprise Dashboard:**
- Çalışan listesi ve durumları
- Supplement kullanım istatistikleri
- Meeting istatistikleri
- Genel sağlık trendleri

## DATABASE SCHEMA

### Core Collections:
1. **users**: Tüm kullanıcılar (user, advisor, admin)
2. **supplements**: Global supplement kataloğu
3. **userSupplements**: User-supplement ilişkisi
4. **meetings**: Danışmanlık görüşmeleri
5. **comments**: Polymorphic yorum sistemi
6. **formQuestions**: Dinamik form soruları
7. **formResponses**: Kullanıcı form cevapları
8. **enterprises**: Kurumsal hesaplar
9. **notifications**: Bildirim sistemi

### İlişkiler:
- User → UserSupplements → Supplement
- User (advisor) → Meetings ← User (client)
- User → Comments → (Supplement/Advisor/Meeting)
- User → FormResponses → FormQuestion
- Enterprise → Users

## API ENDPOINTS (MVP)

### Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh-token
- POST /api/v1/auth/logout

### User Profile
- GET /api/v1/users/me
- PUT /api/v1/users/me
- GET /api/v1/users/:id (advisor profile için)

### Forms
- GET /api/v1/forms/onboarding
- POST /api/v1/forms/responses
- GET /api/v1/forms/my-responses

### Supplements
- GET /api/v1/supplements (search, filter)
- GET /api/v1/supplements/:id
- GET /api/v1/supplements/recommendations (personalized)
- POST /api/v1/supplements/:id/comments

### User Supplements
- GET /api/v1/user-supplements
- POST /api/v1/user-supplements
- PUT /api/v1/user-supplements/:id
- DELETE /api/v1/user-supplements/:id

### Meetings
- GET /api/v1/meetings (user's meetings)
- POST /api/v1/meetings (request meeting)
- PUT /api/v1/meetings/:id (update, cancel)
- POST /api/v1/meetings/:id/complete (advisor)
- GET /api/v1/advisors (list available advisors)
- GET /api/v1/advisors/:id/availability

### Notifications
- GET /api/v1/notifications
- PUT /api/v1/notifications/:id/read
- PUT /api/v1/notifications/mark-all-read

### Enterprise (Admin only)
- POST /api/v1/enterprises
- GET /api/v1/enterprises/:id
- GET /api/v1/enterprises/:id/users
- GET /api/v1/enterprises/:id/analytics

## SECURITY & COMPLIANCE

### Data Protection
- Password hashing: bcrypt (10 rounds)
- JWT secret rotation capability
- Refresh token encryption
- PII data minimal tutulması

### API Security
- Helmet.js (security headers)
- Rate limiting: 100 req/15min per IP
- CORS whitelist
- Input validation (Zod)
- SQL/NoSQL injection prevention

### KVKK/GDPR Compliance
- Explicit consent for data collection
- Right to data export
- Right to data deletion
- Data retention policy (2 yıl)
- Audit logging

## EXTERNAL API INTEGRATION

### Consensus API
**Kullanım:**
- Supplement'e ait bilimsel araştırmaları çeker
- Consensus score hesaplar
- Study count ve summary sağlar

**Rate Limit:** 1000 request/month (MVP)

**Data Sync:**
- Haftalık scheduled job
- Cache TTL: 7 gün

### Vademecum API
**Kullanım:**
- Supplement detay bilgileri
- Yan etki ve etkileşim uyarıları
- Approved uses

**Rate Limit:** 5000 request/month (MVP)

**Data Sync:**
- Aylık scheduled job
- Cache TTL: 30 gün

## DEPLOYMENT & INFRASTRUCTURE (MVP)

### Backend
- Platform: AWS EC2 / DigitalOcean Droplet
- Environment: Production, Staging
- Process Manager: PM2
- Reverse Proxy: Nginx

### Database
- MongoDB Atlas (M10 cluster)
- Backup: Daily automated
- Replication: 3-node replica set

### File Storage
- AWS S3 (user uploads, reports)
- CloudFront CDN (static assets)

### Email & Notifications
- AWS SES (transactional emails)
- AWS SNS (push notifications)
- Mailtrap (development testing)

### Monitoring
- Sentry (error tracking)
- CloudWatch (logs, metrics)
- Winston (application logging)

## SUCCESS METRICS (MVP)

### User Engagement
- Daily Active Users (DAU)
- Form completion rate
- Supplement addition rate
- Rating/comment contribution

### Advisor Performance
- Meeting completion rate
- Average rating
- Response time
- User satisfaction score

### Platform Health
- API response time (<200ms p95)
- Error rate (<1%)
- Email delivery rate (>98%)
- Notification delivery rate (>95%)

### Business Metrics
- User retention (30-day)
- Enterprise conversion rate
- Meeting utilization rate
- Supplement catalog growth

## MVP SCOPE EXCLUSIONS (Phase 2)

- E-commerce / Supplement satın alma
- Advanced AI/ML recommendation engine
- Video meeting integration
- Comprehensive analytics dashboard
- Multi-language support
- White-label solution
- Insurance integration
- Healthcare provider network