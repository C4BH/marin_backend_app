import jwt from "jsonwebtoken";

export interface TokenPayload {
    userId: string;
    role: string;
}
export class TokenService {
    // Access token (1 saat)
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );
    }

    // Refresh token (30 gün)
    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: '30d' }
        );
    }

    // Token çiftini oluştur
    static generateTokenPair(userId: string, role: string) {
        const payload: TokenPayload = { userId, role };
        
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
            expiresIn: 3600 // 1 saat (saniye)
        };
    }

    // Token verify
    static verifyAccessToken(token: string): TokenPayload {
        return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    }

    static verifyRefreshToken(token: string): TokenPayload {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
    }
}