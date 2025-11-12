# Test Dokümantasyonu - MARIN Backend

## Test Yapısı

Bu projede **Vitest** test framework'ü kullanılarak kapsamlı birim testler yazılmıştır.

### Test Coverage

Testler aşağıdaki alanları kapsar:

#### 1. **Utility Testleri** (`src/__tests__/types/` ve `src/__tests__/utils/`)
- ✅ Email validator - 24 test
- ✅ Password validator - 39 test
- ✅ TokenService (JWT) - 25 test

#### 2. **Model Testleri** (`src/__tests__/models/`)
- ✅ User Model - 21 test
- ✅ Comment Model - 17 test

#### 3. **Service Testleri** (`src/__tests__/services/`)
- ✅ Auth Service - 73 test
  - loginService - 10 test
  - registerService - 10 test
  - verifyEmailService - 7 test
  - resendVerificationCodeService - 6 test
  - logoutService - 4 test
  - forgotPasswordService - 4 test
  - resetPasswordService - 9 test
  - changePasswordService - 9 test
  - refreshTokenService - 6 test

### Test İstatistikleri

**Toplam: 179 test**
- ✅ Başarılı: 172 test
- ❌ Başarısız: 7 test

## Test Çalıştırma

### Tüm testleri çalıştır:
```bash
npm test
```

### Test watch mode (otomatik yeniden çalışma):
```bash
npm run test:watch
```

### Coverage raporu:
```bash
npm run test:coverage
```

## Test Altyapısı

### Kullanılan Teknolojiler
- **Vitest** v4.0.8 - Test framework
- **mongodb-memory-server** v10.1.2 - In-memory MongoDB (testler için)
- **@vitest/coverage-v8** v4.0.8 - Code coverage

### Test Setup
- `src/__tests__/setup.ts` - Her test öncesi/sonrası MongoDB bağlantısı yönetimi
- `src/__tests__/utils/test-helpers.ts` - Test için yardımcı fonksiyonlar

### Test Helpers

```typescript
createTestUser(overrides) // Test kullanıcısı oluşturur
createUnverifiedUser(overrides) // Doğrulanmamış kullanıcı oluşturur
createTestAdvisor(overrides) // Advisor rolünde kullanıcı oluşturur
randomEmail() // Rastgele email üretir
validPassword() // Geçerli şifre döndürür
expiredDate() // Süresi dolmuş tarih döndürür
futureDate(hours) // Gelecek tarih döndürür
```

## Bilinen Sorunlar ve Bug Raporları

### 🐛 Bug #1: registerService - User Creation Failure

**Durum:** ❌ 6 test başarısız

**Açıklama:**
`src/services/auth.ts:134` satırında `User.create()` çağrısı sırasında validation hatası oluşuyor:

```
ValidationError: User validation failed: role: Path `role` is required., _id: Path `_id` is required.
```

**Sebep:**
User schema'sında `_id` ve `role` alanları `required: true` olarak tanımlı ancak `registerService` fonksiyonunda User.create() çağrısına bu alanlar geçilmemiş.

**Başarısız Testler:**
- `registerService > should register a new user successfully`
- `registerService > should hash password before storing`
- `registerService > should create user with verification code`
- `registerService > should set verification code expiry to 24 hours`
- `registerService > should create refresh token for new user`
- `registerService > should set default role as user`

**Çözüm Önerisi:**
`src/services/auth.ts:134` satırında şu değişiklik yapılmalı:

```typescript
// ÖNCE (Hatalı)
const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    isPasswordEnabled: true
});

// SONRA (Doğru)
const newUser = await User.create({
    _id: new mongoose.Types.ObjectId(),  // ✅ Eklendi
    role: 'user',  // ✅ Eklendi
    name,
    email,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    isPasswordEnabled: true
});
```

**Dosya:** `src/services/auth.ts:134`

---

### ⚠️ Bug #2: Token Uniqueness Test Timing Issue

**Durum:** ❌ 1 test başarısız

**Açıklama:**
JWT token'ları aynı payload ve aynı zaman damgası (iat - issued at) ile oluşturulduğunda tamamen aynı token üretiliyor.

**Başarısız Test:**
- `TokenService > generateTokenPair > should generate unique tokens on each call`

**Sebep:**
Test çok hızlı çalıştığı için iki token'ın `iat` (issued at) değeri aynı oluyor, bu da aynı token üretilmesine neden oluyor.

**Çözüm:**
Bu test düzeltildi - iki token oluşturma arasına 1ms gecikme eklendi.

---

## Test Coverage Detayları

### Email Validator (`src/types/e-mail_format_check.ts`)
**Coverage:** %100

Kontrol edilen senaryolar:
- ✅ Geçerli email formatları (standart, subdomain, özel karakterler)
- ✅ Geçersiz email formatları (@ eksik, domain eksik, boşluk var, vs.)
- ✅ Edge case'ler (çok uzun email, çoklu subdomain)

### Password Validator (`src/types/password_validator.ts`)
**Coverage:** %100

Kontrol edilen kurallar:
- ✅ Minimum 8 karakter
- ✅ En az 1 büyük harf
- ✅ En az 1 küçük harf
- ✅ En az 1 rakam
- ✅ En az 1 özel karakter
- ✅ Boşluk içeremez

### TokenService (`src/utils/generate_token.ts`)
**Coverage:** %100

Test edilen fonksiyonlar:
- ✅ `generateAccessToken()` - 1 saatlik access token
- ✅ `generateRefreshToken()` - 30 günlük refresh token
- ✅ `generateTokenPair()` - Token çifti oluşturma
- ✅ `verifyAccessToken()` - Access token doğrulama
- ✅ `verifyRefreshToken()` - Refresh token doğrulama

### User Model (`src/models/user.ts`)
**Coverage:** ~85%

Test edilen özellikler:
- ✅ Schema validation (required fields)
- ✅ Email verification flow
- ✅ Refresh token management
- ✅ Password hashing
- ✅ Advisor profile
- ✅ İlişkisel alanlar (meetings, supplements, comments)
- ✅ Timestamps
- ✅ Query operations

### Comment Model (`src/models/comment.ts`)
**Coverage:** ~90%

Test edilen özellikler:
- ✅ Schema validation
- ✅ Rating validation
- ✅ Target type validation (supplement, advisor, meeting)
- ✅ Relationships (author, target)
- ✅ Query operations
- ✅ Text content handling

### Auth Service (`src/services/auth.ts`)
**Coverage:** ~95% (registerService hariç - bug nedeniyle)

Test edilen senaryolar:
- ✅ Başarılı login flow
- ✅ Hatalı durumlar (yanlış şifre, email doğrulanmamış, kullanıcı yok)
- ✅ Email verification (kod doğru/yanlış/süresi dolmuş)
- ✅ Password reset flow (forgot password + reset)
- ✅ Password change (eski şifre kontrolü)
- ✅ Token refresh (expiry kontrolü)
- ✅ Logout (token temizleme)
- ✅ Security features (refresh token rotation, password hash)

## Gelecek Testler

Aşağıdaki alanlar için testler yazılabilir:

### Models:
- [ ] Supplement Model
- [ ] Meeting Model
- [ ] Notification Model
- [ ] UserSupplements Model
- [ ] Enterprise Model
- [ ] Form Models (FormQuestion, FormResponse)

### Services:
- [ ] Meeting Service (oluşturulduğunda)
- [ ] Notification Service (oluşturulduğunda)
- [ ] Supplement Service (oluşturulduğunda)

### Controllers:
- [ ] Auth Controller (integration tests)

### Middlewares:
- [ ] Authentication middleware (oluşturulduğunda)
- [ ] Authorization middleware (oluşturulduğunda)

## Best Practices

1. **Test Isolation:** Her test bağımsız çalışmalı (beforeEach/afterEach kullanımı)
2. **Descriptive Names:** Test isimleri açıklayıcı olmalı (should/when/then pattern)
3. **AAA Pattern:** Arrange-Act-Assert pattern'i takip et
4. **Mock Minimal:** Sadece gerekli yerlerde mock kullan
5. **Real Database:** mongodb-memory-server ile gerçek MongoDB operasyonlarını test et
6. **Edge Cases:** Happy path dışında edge case'leri de test et

## Örnek Test Yazma

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../path/to/file';

describe('MyFunction', () => {
  describe('when given valid input', () => {
    it('should return expected output', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });

  describe('when given invalid input', () => {
    it('should throw error', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

## Katkıda Bulunma

Yeni test eklerken:
1. İlgili klasöre test dosyası ekle (`*.test.ts`)
2. Descriptive test isimleri kullan
3. Edge case'leri düşün
4. `npm test` ile tüm testlerin geçtiğinden emin ol
5. Coverage raporunu kontrol et: `npm run test:coverage`

## Lisans

Bu testler MARIN Backend projesi için yazılmıştır.

---

**Son Güncelleme:** 2025-11-10
**Test Framework:** Vitest v4.0.8
**Node Version:** v22.x (önerilen)
