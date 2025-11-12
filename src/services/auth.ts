import User from "../models/user";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { validateEmail } from "../types/e-mail_format_check";
import { validateStrongPassword } from "../types/password_validator";
import { TokenService } from "../utils/generate_token";
import { nanoid } from "nanoid";

// Service response type'ı
interface ServiceResponse {
    isSuccess: boolean;
    message: string;
    data?: any;
    errors?: string[];
}

/**
 * Login Service - Tüm login business logic'ini içerir
 * @param email - Kullanıcı email
 * @param password - Kullanıcı şifresi
 * @param device - Cihaz bilgisi (opsiyonel)
 * @returns ServiceResponse - Başarı/hata durumu ve token bilgileri
 */
export const loginService = async (
    email: string, 
    password: string, 
    device?: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email || !password) {
        return { isSuccess: false, message: "Email ve şifre gerekli" };
    }
    
    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }
    
    // 3. Email verification kontrolü
    if (user.isEmailVerified === false) {
        return { isSuccess: false, message: "Email doğrulanmamış" };
    }
    
    // 4. Password var mı kontrolü
    if (!user.password) {
        return { isSuccess: false, message: "Bu hesap için şifre tanımlı değil" };
    }
    
    // 5. Password doğrulama
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { isSuccess: false, message: "Şifre yanlış" };
    }
    
    // 6. Token oluştur
    const tokens = TokenService.generateTokenPair(user._id.toString(), user.role);
    
    // 7. RefreshToken'ı veritabanına kaydet
    user.refreshTokens.push({
        token: tokens.refreshToken,
        device: device || "unknown",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
    });
    
    // 8. lastLoginAt güncelle
    user.lastLoginAt = new Date();
    await user.save();
    
    // 9. Başarılı sonuç dön
    return {
        isSuccess: true,
        message: "Giriş başarılı",
        data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        }
    };
}

/**
 * Register Service - Yeni kullanıcı kaydı
 * @param email - Kullanıcı email
 * @param password - Kullanıcı şifresi
 * @param device - Cihaz bilgisi (opsiyonel)
 * @returns ServiceResponse - Başarı/hata durumu ve token bilgileri
 */
export const registerService = async (    
    email: string,
    password: string,
    device?: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email || !password) {
        return { isSuccess: false, message: "İsim, email ve şifre gerekli" };
    }

    // 2. Email format kontrolü
    if (!validateEmail(email)) {
        return { isSuccess: false, message: "Geçersiz email formatı" };
    }

    // 3. Password strength kontrolü
    const passwordErrors = validateStrongPassword(password);
    if (passwordErrors.length > 0) {
        return { 
            isSuccess: false, 
            message: "Geçersiz şifre formatı", 
            errors: passwordErrors 
        };
    }

    // 4. Kullanıcı zaten var mı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return { isSuccess: false, message: "Kullanıcı zaten mevcut" };
    }

    // 5. Verification code oluştur
    const verificationCode = nanoid(6);

    // 6. Password hash'le
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Yeni kullanıcı oluştur
    const newUser = await User.create({
        _id: new mongoose.Types.ObjectId(), // ✅ _id'yi manuel oluştur
        email,
        password: hashedPassword,
        role: 'user', // ✅ Default role ekle
        verificationCode,
        verificationCodeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 saat
        isPasswordEnabled: true
    });

    // 8. Token oluştur
    const tokens = TokenService.generateTokenPair(newUser._id.toString(), newUser.role);

    // 9. RefreshToken'ı kaydet
    newUser.refreshTokens.push({
        token: tokens.refreshToken,
        device: device || "unknown",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
    });

    await newUser.save();

    // 10. Başarılı sonuç dön
    return {
        isSuccess: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            verificationCode, // Email gönderimi için
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        }
    };
}

/**
 * Verify Email Service - Email doğrulama
 * @param email - Kullanıcı email
 * @param verificationCode - Doğrulama kodu
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const verifyEmailService = async (
    email: string,
    verificationCode: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email || !verificationCode) {
        return { isSuccess: false, message: "Email ve doğrulama kodu gerekli" };
    }

    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }

    // 3. Email zaten doğrulanmış mı?
    if (user.isEmailVerified) {
        return { isSuccess: false, message: "Email zaten doğrulanmış" };
    }

    // 4. Kod süresi dolmuş mu?
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        return { isSuccess: false, message: "Doğrulama kodu süresi doldu" };
    }

    // 5. Kod doğru mu?
    if (user.verificationCode !== verificationCode) {
        return { isSuccess: false, message: "Doğrulama kodu yanlış" };
    }

    // 6. Email'i doğrula
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return {
        isSuccess: true,
        message: "Email doğrulandı"
    };
}

/**
 * Resend Verification Code Service - Doğrulama kodunu yeniden gönder
 * @param email - Kullanıcı email
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const resendVerificationCodeService = async (
    email: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email) {
        return { isSuccess: false, message: "Email gerekli" };
    }

    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }

    // 3. Email zaten doğrulanmış mı?
    if (user.isEmailVerified) {
        return { isSuccess: false, message: "Email zaten doğrulanmış" };
    }

    // 4. Yeni kod oluştur (süresi dolmuş olsa bile yenisini gönder)
    const verificationCode = nanoid(6);
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 saat
    await user.save();

    return {
        isSuccess: true,
        message: "Doğrulama kodu gönderildi",
        data: { verificationCode } // Email gönderimi için
    };
}

/**
 * Logout Service - Kullanıcı çıkışı
 * @param refreshToken - Refresh token
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const logoutService = async (
    refreshToken: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!refreshToken) {
        return { isSuccess: false, message: "Refresh token gerekli" };
    }

    // 2. Token'a sahip user'ı bul
    const user = await User.findOne({ "refreshTokens.token": refreshToken });
    if (!user) {
        return { isSuccess: false, message: "Geçersiz token" };
    }

    // 3. Token'ı diziden sil
    user.refreshTokens = user.refreshTokens.filter((token: any) => token.token !== refreshToken);
    await user.save();

    return {
        isSuccess: true,
        message: "Çıkış başarılı"
    };
}

/**
 * Forgot Password Service - Şifre sıfırlama kodu gönder
 * @param email - Kullanıcı email
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const forgotPasswordService = async (
    email: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email) {
        return { isSuccess: false, message: "Email gerekli" };
    }

    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }

    // 3. Email doğrulanmış mı?
    if (user.isEmailVerified === false) {
        return { isSuccess: false, message: "Email doğrulanmamış" };
    }

    // 4. Verification code oluştur
    const verificationCode = nanoid(6);
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 saat
    await user.save();

    return {
        isSuccess: true,
        message: "Şifre sıfırlama kodu gönderildi",
        data: { verificationCode } // Email gönderimi için
    };
}

/**
 * Reset Password Service - Şifre sıfırlama (verification code ile)
 * @param email - Kullanıcı email
 * @param verificationCode - Doğrulama kodu
 * @param newPassword - Yeni şifre
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const resetPasswordService = async (
    email: string,
    verificationCode: string,
    newPassword: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email || !verificationCode || !newPassword) {
        return { isSuccess: false, message: "Email, doğrulama kodu ve yeni şifre gerekli" };
    }

    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }

    // 3. Kod süresi dolmuş mu?
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        return { isSuccess: false, message: "Doğrulama kodu süresi doldu" };
    }

    // 4. Kod doğru mu?
    if (user.verificationCode !== verificationCode) {
        return { isSuccess: false, message: "Doğrulama kodu yanlış" };
    }

    // 5. Yeni şifre güvenli mi?
    const passwordErrors = validateStrongPassword(newPassword);
    if (passwordErrors.length > 0) {
        return { 
            isSuccess: false, 
            message: "Geçersiz şifre formatı", 
            errors: passwordErrors 
        };
    }

    // 6. Şifreyi güncelle
    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.isPasswordEnabled = true;

    // 7. GÜVENLİK: Tüm refresh token'ları temizle (şifre değişti, herkesi çıkış yaptır)
    user.refreshTokens = [];

    await user.save();

    return {
        isSuccess: true,
        message: "Şifre başarıyla sıfırlandı"
    };
}

/**
 * Change Password Service - Şifre değiştirme (eski şifre ile)
 * @param email - Kullanıcı email
 * @param oldPassword - Eski şifre
 * @param newPassword - Yeni şifre
 * @returns ServiceResponse - Başarı/hata durumu
 */
export const changePasswordService = async (
    email: string,
    oldPassword: string,
    newPassword: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!email || !oldPassword || !newPassword) {
        return { isSuccess: false, message: "Email, eski şifre ve yeni şifre gerekli" };
    }

    // 2. User'ı bul
    const user = await User.findOne({ email });
    if (!user) {
        return { isSuccess: false, message: "Kullanıcı bulunamadı" };
    }

    // 3. Password var mı?
    if (!user.password) {
        return { isSuccess: false, message: "Bu hesap için şifre tanımlı değil" };
    }

    // 4. Eski şifre doğru mu?
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        return { isSuccess: false, message: "Eski şifre yanlış" };
    }

    // 5. Yeni şifre güvenli mi?
    const passwordErrors = validateStrongPassword(newPassword);
    if (passwordErrors.length > 0) {
        return { 
            isSuccess: false, 
            message: "Geçersiz şifre formatı", 
            errors: passwordErrors 
        };
    }

    // 6. Şifreyi güncelle
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
        isSuccess: true,
        message: "Şifre başarıyla değiştirildi"
    };
}

/**
 * Refresh Token Service - Access token yenileme
 * @param refreshToken - Refresh token
 * @returns ServiceResponse - Başarı/hata durumu ve yeni access token
 */
export const refreshTokenService = async (
    refreshToken: string
): Promise<ServiceResponse> => {
    // 1. Input validation
    if (!refreshToken) {
        return { isSuccess: false, message: "Refresh token gerekli" };
    }

    try {
        // 2. Token'ı verify et
        const decoded = TokenService.verifyRefreshToken(refreshToken);

        // 3. User'ı bul ve token'ın veritabanında olduğunu kontrol et
        const user = await User.findOne({
            _id: decoded.userId,
            "refreshTokens.token": refreshToken
        });

        if (!user) {
            return { isSuccess: false, message: "Geçersiz token" };
        }

        // 4. Token'ın süresini kontrol et
        const tokenData = user.refreshTokens.find((t: any) => t.token === refreshToken);
        if (!tokenData || tokenData.expiresAt < new Date()) {
            // Süresi dolmuş token'ı sil
            user.refreshTokens = user.refreshTokens.filter((t: any) => t.token !== refreshToken);
            await user.save();
            return { isSuccess: false, message: "Token süresi dolmuş" };
        }

        // 5. Yeni access token oluştur
        const newAccessToken = TokenService.generateAccessToken({
            userId: user._id.toString(),
            role: user.role
        });

        return {
            isSuccess: true,
            message: "Token yenilendi",
            data: {
                accessToken: newAccessToken,
                expiresIn: 3600 // 1 saat
            }
        };
    } catch (error) {
        return { isSuccess: false, message: "Geçersiz veya süresi dolmuş token" };
    }
}
