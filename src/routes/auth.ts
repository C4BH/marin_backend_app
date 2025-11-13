import { Router } from "express";
import { 
    login, 
    register, 
    verifyEmail, 
    resendVerificationCode, 
    logout, 
    forgotPassword, 
    resetPassword, 
    changePassword,
    refreshToken 
} from "../controllers/auth";
import { logResetPasswordAttempt, resetPasswordLimiter } from "../middlewares/auth";

const router = Router();

// Middleware



// Auth
router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", resendVerificationCode);

// Password management
router.use(resetPasswordLimiter as any);
router.use(logResetPasswordAttempt as any);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
// router.post("/change-password", changePassword);

export default router;