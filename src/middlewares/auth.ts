import { NextFunction, Request, Response } from "express";
import { TokenService } from "../utils/generate_token";
import { logger } from "../utils/logger.ts";
import rateLimit from "express-rate-limit";

/**
 * Verify Token Middleware
 * JWT access token'ı doğrular ve req.user'a ekler
 * 
 * Token kaynakları (öncelik sırasına göre):
 * 1. Authorization header: "Bearer <token>"
 * 2. Cookie: req.cookies.token (cookie-parser gerekli)
 * 
 * TokenService kullanarak projedeki diğer token işlemleriyle tutarlılık sağlar.
 * TokenService.verifyAccessToken() metodu, token'ı doğrular ve TokenPayload döner.
 * Eğer token geçersiz veya süresi dolmuşsa, jwt.verify() otomatik olarak hata fırlatır.
 */
export const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Token'ı Authorization header'dan al (öncelikli)
        let token: string | undefined;
        
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 3. Token yoksa hata dön
        if (!token) {
            logger.warn(`Authentication failed: Token not provided for user: ${req.user?.userId}`);
            res.status(401).json({ 
                success: false,
                message: "Yetkisiz erişim. Token gerekli." 
            });
            return;
        }

        // 4. TokenService ile token'ı doğrula
        // TokenService.verifyAccessToken() zaten hata fırlatır, try-catch ile yakalıyoruz
        const decoded = TokenService.verifyAccessToken(token);
        
        // 5. Decoded token'ı req.user'a ekle (sonraki middleware'lerde kullanılacak)
        req.user = decoded;
        
        logger.debug(`Authentication successful for user: ${decoded.userId}`);
        next();
        
    } catch (error: any) {
        // JWT hataları: JsonWebTokenError, TokenExpiredError, vb.
        logger.error(`Authentication error: ${error.message || error}`);
        
        // Hata tipine göre mesaj belirle
        let message = "Unauthorized";
        if (error.name === "TokenExpiredError") {
            message = "Token expired";
        } else if (error.name === "JsonWebTokenError") {
            message = "Invalid token";
        }
        
        res.status(401).json({ 
            success: false,
            message 
        });
        return;
    }
};

export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Çok sık şifre sıfırlama talebi. Lütfen 15 dakika sonra tekrar deneyin.",
    },
    keyGenerator: (req: any) => `${req.ip}:${req.body?.email ?? ""}`,
});

export const logResetPasswordAttempt = (req: any, _res: any, next: any) => {
    try {
        const ip = req.ip;
        const forwarded = req.headers["x-forwarded-for"];
        const email = req.body?.email;
        console.log("reset password attempt", { ip, forwarded, email });
    } catch (error) {
        console.log("reset password attempt error", error);
    }
    next();
};