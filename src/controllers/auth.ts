import { Request, Response } from "express";
import {
    loginService,
    registerService,
    verifyEmailService,
    resendVerificationCodeService,
    logoutService,
    forgotPasswordService,
    resetPasswordService,
    changePasswordService,
    refreshTokenService
} from "../services/auth";

/**
 * Login Controller
 * HTTP: POST /auth/login
 * Body: { email, password, device? }
 */
export const login = async (req: Request, res: Response) => {
    const { email, password, device } = req.body;

    try {
        const result = await loginService(email, password, device);

        if (!result.isSuccess) {
            return res.status(401).json({ message: result.message });
        }

        return res.status(200).json({
            message: result.message,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            expiresIn: result.data.expiresIn
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Register Controller
 * HTTP: POST /auth/register
 * Body: { name, email, password, device? }
 */
/**
 * Örnek json body:
 * {
 *  "email": "test@example.com",
 *  "password": "1.Demokrasi"
 * }
 * 
 * 
 * 
 * */
export const register = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const result = await registerService(email, password);

        if (!result.isSuccess) {
            return res.status(400).json({ 
                message: result.message,
                errors: result.errors 
            });
        }

        // Email gönderimi (şimdilik console'da)
        console.log("Verification code:", result.data.verificationCode);
        // await sendVerificationEmail(email, result.data.verificationCode);

        return res.status(201).json({
            message: result.message,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            expiresIn: result.data.expiresIn
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Verify Email Controller
 * HTTP: POST /auth/verify-email
 * Body: { email, verificationCode }
 */
export const verifyEmail = async (req: Request, res: Response) => {
    const { email, verificationCode } = req.body;

    try {
        const result = await verifyEmailService(email, verificationCode);

        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Resend Verification Code Controller
 * HTTP: POST /auth/resend-verification-code
 * Body: { email }
 */
export const resendVerificationCode = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const result = await resendVerificationCodeService(email);

        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }

        // Email gönderimi (şimdilik console'da)
        console.log("Verification code:", result.data.verificationCode);
        // await sendVerificationEmail(email, result.data.verificationCode);

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Logout Controller
 * HTTP: POST /auth/logout
 * Body: { refreshToken }
 */
export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
        const result = await logoutService(refreshToken);

        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Forgot Password Controller
 * HTTP: POST /auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const result = await forgotPasswordService(email);

        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }

        // Email gönderimi (şimdilik console'da)
        console.log("Reset code:", result.data.verificationCode);
        // await sendForgotPasswordEmail(email, result.data.verificationCode);

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Reset Password Controller
 * HTTP: POST /auth/reset-password
 * Body: { email, verificationCode, newPassword }
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { email, verificationCode, newPassword } = req.body;

    try {
        const result = await resetPasswordService(email, verificationCode, newPassword);

        if (!result.isSuccess) {
            return res.status(400).json({ 
                message: result.message,
                errors: result.errors 
            });
        }

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Change Password Controller
 * HTTP: POST /auth/change-password
 * Body: { email, oldPassword, newPassword }
 */
export const changePassword = async (req: Request, res: Response) => {
    const { email, oldPassword, newPassword } = req.body;

    try {
        const result = await changePasswordService(email, oldPassword, newPassword);

        if (!result.isSuccess) {
            return res.status(400).json({ 
                message: result.message,
                errors: result.errors 
            });
        }

        return res.status(200).json({ message: result.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Refresh Token Controller
 * HTTP: POST /auth/refresh-token
 * Body: { refreshToken }
 */
export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
        const result = await refreshTokenService(refreshToken);

        if (!result.isSuccess) {
            return res.status(401).json({ message: result.message });
        }

        return res.status(200).json({
            message: result.message,
            accessToken: result.data.accessToken,
            expiresIn: result.data.expiresIn
        });

    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: "Geçersiz veya süresi dolmuş token" });
    }
}
