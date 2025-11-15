# Chat Form Entegrasyonu - Test Senaryoları

## Genel Bakış

Chatbot artık kullanıcının sağlık profili form verilerine erişerek kişiselleştirilmiş yanıtlar verebiliyor.

## Yapılan Değişiklikler

### 1. `src/services/chat.ts`

- User modeli import edildi
- `generateSystemPrompt()` metodu eklendi (form verilerine göre dinamik system prompt oluşturur)
- `sendMessage()` metodunda kullanıcının form verileri alınıp system prompt'a ekleniyor
- Form verileri sadece konuşma başlangıcında bir kez ekleniyor

### 2. Chatbot Davranış Kuralları

Chatbot artık şu kurallara göre çalışıyor:

**Özel Tavsiye Gerektiren Sorular:**

- Beslenme önerileri
- Takviye önerileri
- Diyet planı
- Egzersiz programı

Bu tür sorularda:

- Form doldurulmuşsa: "Form verilerinizi inceledim ve şu kanaatlere vardım..." şeklinde başlar
- Form doldurulmamışsa: "Form verilerinizi inceleyemedim (henüz doldurmadınız). Genel öneriler sunabilirim..." şeklinde başlar
- **MUTLAKA mesaj sonuna güvenlik uyarısı ekler:** "⚠️ Bu algoritma senin için Marin uzmanları tarafından oluşturulmuştur ve güvenliğin için son aşamada onlar tarafından kontrol edilmelidir. Bir Marin sağlık profesyoneli ile görüşmelisin."
- **KESİNLİKLE marka ismi önermez** - Sadece genel takviye türlerinden (Omega 3, Vitamin D, Magnezyum vb.) bahseder

**Genel Bilgi Soruları:**

- Omega 3 nedir?
- Vitamin D'nin faydaları nedir?
- Protein nedir?

Bu tür sorularda:

- Form verilerinden bahsetmez, doğrudan bilgi verir
- Güvenlik uyarısı EKLEMEZ (genel bilgi olduğu için)

## Manuel Test Senaryoları

### Test 1: Form Doldurmuş Kullanıcı + Özel Tavsiye Sorusu

**Ön Koşul:**

- Kullanıcının `isFormFilled: true` olması
- Kullanıcının `formData` alanının dolu olması

**Test Adımları:**

1. Kullanıcı ile giriş yap
2. Yeni bir chat session başlat (sessionId olmadan)
3. Özel tavsiye isteyen bir soru sor:
   - Örnek: "Sabahları kahvaltıda neler yiyebilirim, bütçe dostu olursa sevinirim"
   - Örnek: "Hangi takviyeleri kullanmalıyım?"
   - Örnek: "Kilom için nasıl bir diyet önerirsin?"

**Beklenen Sonuç:**

- Chatbot "Form verilerinizi inceledim ve şu kanaatlere vardım..." ile başlamalı
- Kullanıcının yaş, boy, kilo, alerjiler, kronik hastalıklar vb. bilgilerini dikkate almalı
- Kişiselleştirilmiş öneriler sunmalı
- **KESİNLİKLE marka ismi önermemeli** (örn. "X markası Omega 3" değil, sadece "Omega 3")
- **Mesaj sonunda mutlaka şu uyarı olmalı:** "⚠️ Bu algoritma senin için Marin uzmanları tarafından oluşturulmuştur ve güvenliğin için son aşamada onlar tarafından kontrol edilmelidir. Bir Marin sağlık profesyoneli ile görüşmelisin."

**Test Örneği (cURL):**

```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "Sabahları kahvaltıda neler yiyebilirim, bütçe dostu olursa sevinirim"
  }'
```

### Test 2: Form Doldurmuş Kullanıcı + Genel Bilgi Sorusu

**Ön Koşul:**

- Kullanıcının `isFormFilled: true` olması

**Test Adımları:**

1. Kullanıcı ile giriş yap
2. Yeni bir chat session başlat
3. Genel bilgi sorusu sor:
   - Örnek: "Omega 3 nedir?"
   - Örnek: "Vitamin D'nin faydaları nelerdir?"
   - Örnek: "Protein ne işe yarar?"

**Beklenen Sonuç:**

- Chatbot form verilerinden bahsetmemeli
- Doğrudan bilgi vermeli
- Genel, öğretici bir yanıt vermeli
- **Güvenlik uyarısı OLMAMALI** (genel bilgi sorusu olduğu için)

### Test 3: Form Doldurmamış Kullanıcı + Özel Tavsiye Sorusu

**Ön Koşul:**

- Kullanıcının `isFormFilled: false` olması VEYA `formData` boş olması

**Test Adımları:**

1. Kullanıcı ile giriş yap
2. Yeni bir chat session başlat
3. Özel tavsiye isteyen bir soru sor:
   - Örnek: "Hangi takviyeleri kullanmalıyım?"

**Beklenen Sonuç:**

- Chatbot "Form verilerinizi inceleyemedim (henüz doldurmadınız). Genel öneriler sunabilirim..." ile başlamalı
- Genel öneriler sunmalı
- Formu doldurmasını nazikçe önerebilir
- **Marka ismi önermemeli**
- **Mesaj sonunda mutlaka güvenlik uyarısı olmalı** (özel tavsiye sorusu olduğu için)

### Test 4: Form Doldurmamış Kullanıcı + Genel Bilgi Sorusu

**Ön Koşul:**

- Kullanıcının `isFormFilled: false` olması

**Test Adımları:**

1. Kullanıcı ile giriş yap
2. Genel bilgi sorusu sor:
   - Örnek: "Omega 3 nedir?"

**Beklenen Sonuç:**

- Chatbot normal şekilde bilgi vermeli
- Form durumundan bahsetmemeli
- **Güvenlik uyarısı OLMAMALI** (genel bilgi sorusu olduğu için)

### Test 5: Conversation Devam Eden Session

**Test Adımları:**

1. Yeni bir session başlat
2. İlk mesajı gönder (system prompt bu noktada eklenir)
3. Aynı sessionId ile ikinci mesajı gönder
4. Log kayıtlarını kontrol et

**Beklenen Sonuç:**

- İlk mesajda form verileri alınmalı ve system prompt oluşturulmalı
- İkinci mesajda form verileri tekrar alınmamalı (session.messages.length > 0 olduğu için)
- Loglarda "Form verileri durumu" sadece ilk mesajda görülmeli

## Debug İpuçları

### Log Kontrolleri

```bash
# Form verileri durumunu görmek için
tail -f logs/combined.log | grep "Form verileri durumu"

# Chat işlemlerini görmek için
tail -f logs/combined.log | grep "Chat message"
```

### MongoDB Kontrolü

```javascript
// Kullanıcının form verileri var mı kontrol et
db.users.findOne(
  { _id: ObjectId("USER_ID") },
  { formData: 1, isFormFilled: 1 }
);

// Form dolu bir kullanıcı bulma
db.users.findOne({ isFormFilled: true }, { formData: 1, email: 1 });
```

## Başarı Kriterleri

✅ Form doldurmuş kullanıcılar için özel tavsiyelerde "Form verilerinizi inceledim..." ifadesi kullanılıyor
✅ Form doldurmamış kullanıcılar için özel tavsiyelerde "Form verilerinizi inceleyemedim..." ifadesi kullanılıyor
✅ **Özel tavsiye gerektiren sorularda mesaj sonunda güvenlik uyarısı ekleniyor**
✅ **Genel bilgi sorularında güvenlik uyarısı eklenmiyor**
✅ Genel bilgi sorularında form durumundan bahsedilmiyor
✅ **Chatbot KESİNLİKLE marka ismi önermiyor** (sadece genel takviye türleri)
✅ Form verileri (yaş, boy, kilo, alerjiler vb.) chatbot yanıtlarına yansıyor
✅ Conversation devam ederken form verileri tekrar alınmıyor (performans)
✅ Linter hataları yok
✅ Mevcut chat fonksiyonları çalışmaya devam ediyor

## Olası Sorunlar ve Çözümler

### Sorun: Chatbot form verilerini dikkate almıyor

**Çözüm:**

- Kullanıcının `isFormFilled` alanını kontrol edin
- MongoDB'de `formData` alanının dolu olduğunu doğrulayın
- Loglarda "hasFormData: true" görünüyor mu kontrol edin

### Sorun: Her mesajda form verileri tekrar alınıyor

**Çözüm:**

- Form verileri sadece `session.messages.length === 0` olduğunda alınmalı
- Loglarda kaç kere "Form verileri durumu" logunu görüyorsunuz?

### Sorun: OpenAI token limiti aşılıyor

**Çözüm:**

- Form verileri system prompt'a eklendiğinde token sayısı artıyor
- Gerekirse `max_tokens` değerini ayarlayın (şu an 500)
- Veya form verilerini daha kısa formatta yazın

### Sorun: Chatbot marka ismi öneriyor

**Çözüm:**

- System prompt'ta "KESİNLİKLE MARKA İSMİ ÖNERME" kuralı var
- OpenAI bazen yine de marka önerebilir, bu durumda:
  - Temperature değerini düşürün (şu an 0.7)
  - System prompt'ta kuralı daha net belirtin
  - Post-processing ile marka isimlerini filtreleyin

### Sorun: Güvenlik uyarısı her mesajda çıkıyor (genel bilgi sorularında da)

**Çözüm:**

- System prompt'ta "Bu tür sorularda uyarı mesajı EKLEME" talimatı var
- OpenAI bazen tüm mesajlara ekleyebilir
- Temperature değerini düşürün veya system prompt'u daha net yapın

### Sorun: Güvenlik uyarısı özel tavsiye sorularında çıkmıyor

**Çözüm:**

- System prompt'ta "MUTLAKA mesajın sonuna şu uyarıyı ekle" yazıyor
- OpenAI bazen atlayabilir
- Model'i gpt-4 gibi daha güçlü bir modele yükseltin (şu an gpt-4o-mini)

## Notlar

- Form verileri sadece konuşma başlangıcında bir kez eklenir (performans optimizasyonu)
- Kullanıcı formu güncelledikten sonra yeni bir session başlatmalı
- System prompt'ta form verileri Türkçe olarak eklenir
- Boş alanlar system prompt'a eklenmez
- **Chatbot marka ismi önermez, sadece genel takviye türlerinden bahseder**
- **Özel tavsiye sorularında mesaj sonuna güvenlik uyarısı eklenir**
- **Genel bilgi sorularında güvenlik uyarısı eklenmez**
- Güvenlik uyarısı metni: "⚠️ Bu algoritma senin için Marin uzmanları tarafından oluşturulmuştur ve güvenliğin için son aşamada onlar tarafından kontrol edilmelidir. Bir Marin sağlık profesyoneli ile görüşmelisin."
