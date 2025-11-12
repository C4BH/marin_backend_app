import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from '../../services/auth';
import User from '../../models/user';
import bcrypt from 'bcrypt';
import { createTestUser, createUnverifiedUser, randomEmail, validPassword, expiredDate, futureDate } from '../utils/test-helpers';
import { TokenService } from '../../utils/generate_token';

describe('Auth Service', () => {
  describe('loginService', () => {
    it('should login successfully with valid credentials', async () => {
      const email = randomEmail();
      const password = validPassword();
      await createTestUser({ email, password: await bcrypt.hash(password, 10) });

      const result = await authService.loginService(email, password);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Giriş başarılı');
      expect(result.data).toBeDefined();
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe(email);
    });

    it('should fail when email is missing', async () => {
      const result = await authService.loginService('', 'password');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email ve şifre gerekli');
    });

    it('should fail when password is missing', async () => {
      const result = await authService.loginService('test@example.com', '');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email ve şifre gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.loginService('nonexistent@example.com', 'password');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when email is not verified', async () => {
      const email = randomEmail();
      const password = validPassword();
      await createUnverifiedUser({ email, password: await bcrypt.hash(password, 10) });

      const result = await authService.loginService(email, password);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email doğrulanmamış');
    });

    it('should fail when password is incorrect', async () => {
      const email = randomEmail();
      await createTestUser({ email, password: await bcrypt.hash('correct123!', 10) });

      const result = await authService.loginService(email, 'wrong123!');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Şifre yanlış');
    });

    it('should fail when user has no password', async () => {
      const email = randomEmail();
      await createTestUser({ email, password: undefined });

      const result = await authService.loginService(email, 'anypassword');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Bu hesap için şifre tanımlı değil');
    });

    it('should save refresh token to database', async () => {
      const email = randomEmail();
      const password = validPassword();
      await createTestUser({ email, password: await bcrypt.hash(password, 10) });

      const result = await authService.loginService(email, password, 'iPhone');

      const user = await User.findOne({ email });
      expect(user?.refreshTokens).toHaveLength(1);
      expect(user?.refreshTokens[0].device).toBe('iPhone');
      expect(user?.refreshTokens[0].token).toBe(result.data.refreshToken);
    });

    it('should update lastLoginAt timestamp', async () => {
      const email = randomEmail();
      const password = validPassword();
      await createTestUser({ email, password: await bcrypt.hash(password, 10) });

      const beforeLogin = Date.now();
      await authService.loginService(email, password);
      const afterLogin = Date.now();

      const user = await User.findOne({ email });
      expect(user?.lastLoginAt).toBeDefined();
      expect(user?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin);
      expect(user?.lastLoginAt!.getTime()).toBeLessThanOrEqual(afterLogin);
    });

    it('should use default device if not provided', async () => {
      const email = randomEmail();
      const password = validPassword();
      await createTestUser({ email, password: await bcrypt.hash(password, 10) });

      await authService.loginService(email, password);

      const user = await User.findOne({ email });
      expect(user?.refreshTokens[0].device).toBe('unknown');
    });
  });

  describe('registerService', () => {
    it('should register a new user successfully', async () => {
      const email = randomEmail();
      const result = await authService.registerService('John Doe', email, validPassword());

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Kullanıcı başarıyla oluşturuldu');
      expect(result.data).toBeDefined();
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
      expect(result.data.verificationCode).toBeDefined();
      expect(result.data.user.email).toBe(email);
    });

    it('should fail when name is missing', async () => {
      const result = await authService.registerService('', 'test@example.com', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('İsim, email ve şifre gerekli');
    });

    it('should fail when email is missing', async () => {
      const result = await authService.registerService('John', '', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('İsim, email ve şifre gerekli');
    });

    it('should fail when password is missing', async () => {
      const result = await authService.registerService('John', randomEmail(), '');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('İsim, email ve şifre gerekli');
    });

    it('should fail with invalid email format', async () => {
      const result = await authService.registerService('John', 'invalid-email', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz email formatı');
    });

    it('should fail with weak password', async () => {
      const result = await authService.registerService('John', randomEmail(), 'weak');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz şifre formatı');
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should fail when user already exists', async () => {
      const email = randomEmail();
      await createTestUser({ email });

      const result = await authService.registerService('John', email, validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı zaten mevcut');
    });

    it('should hash password before storing', async () => {
      const email = randomEmail();
      const password = validPassword();

      await authService.registerService('John', email, password);

      const user = await User.findOne({ email });
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(password);
      expect(await bcrypt.compare(password, user!.password!)).toBe(true);
    });

    it('should create user with verification code', async () => {
      const email = randomEmail();
      const result = await authService.registerService('John', email, validPassword());

      const user = await User.findOne({ email });
      expect(user?.verificationCode).toBeDefined();
      expect(user?.verificationCodeExpires).toBeDefined();
      expect(user?.isEmailVerified).toBe(false);
      expect(result.data.verificationCode).toBe(user?.verificationCode);
    });

    it('should set verification code expiry to 24 hours', async () => {
      const email = randomEmail();
      await authService.registerService('John', email, validPassword());

      const user = await User.findOne({ email });
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
      const actualExpiry = user!.verificationCodeExpires!.getTime();

      expect(actualExpiry).toBeGreaterThan(Date.now());
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000); // 1 second tolerance
    });

    it('should create refresh token for new user', async () => {
      const email = randomEmail();
      await authService.registerService('John', email, validPassword(), 'Android');

      const user = await User.findOne({ email });
      expect(user?.refreshTokens).toHaveLength(1);
      expect(user?.refreshTokens[0].device).toBe('Android');
    });

    it('should set default role as user', async () => {
      const email = randomEmail();
      await authService.registerService('John', email, validPassword());

      const user = await User.findOne({ email });
      expect(user?.role).toBe('user');
    });
  });

  describe('verifyEmailService', () => {
    it('should verify email successfully with correct code', async () => {
      const email = randomEmail();
      const code = '123456';
      await createUnverifiedUser({
        email,
        verificationCode: code,
        verificationCodeExpires: futureDate(),
      });

      const result = await authService.verifyEmailService(email, code);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Email doğrulandı');

      const user = await User.findOne({ email });
      expect(user?.isEmailVerified).toBe(true);
      expect(user?.verificationCode).toBeUndefined();
      expect(user?.verificationCodeExpires).toBeUndefined();
    });

    it('should fail when email is missing', async () => {
      const result = await authService.verifyEmailService('', '123456');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email ve doğrulama kodu gerekli');
    });

    it('should fail when verification code is missing', async () => {
      const result = await authService.verifyEmailService('test@example.com', '');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email ve doğrulama kodu gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.verifyEmailService('nonexistent@example.com', '123456');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when email already verified', async () => {
      const email = randomEmail();
      await createTestUser({ email, isEmailVerified: true });

      const result = await authService.verifyEmailService(email, '123456');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email zaten doğrulanmış');
    });

    it('should fail when verification code is expired', async () => {
      const email = randomEmail();
      const code = '123456';
      await createUnverifiedUser({
        email,
        verificationCode: code,
        verificationCodeExpires: expiredDate(),
      });

      const result = await authService.verifyEmailService(email, code);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Doğrulama kodu süresi doldu');
    });

    it('should fail when verification code is incorrect', async () => {
      const email = randomEmail();
      await createUnverifiedUser({
        email,
        verificationCode: 'correct123',
        verificationCodeExpires: futureDate(),
      });

      const result = await authService.verifyEmailService(email, 'wrong456');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Doğrulama kodu yanlış');
    });
  });

  describe('resendVerificationCodeService', () => {
    it('should resend verification code successfully', async () => {
      const email = randomEmail();
      await createUnverifiedUser({ email });

      const result = await authService.resendVerificationCodeService(email);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Doğrulama kodu gönderildi');
      expect(result.data.verificationCode).toBeDefined();
    });

    it('should fail when email is missing', async () => {
      const result = await authService.resendVerificationCodeService('');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.resendVerificationCodeService('nonexistent@example.com');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when email already verified', async () => {
      const email = randomEmail();
      await createTestUser({ email, isEmailVerified: true });

      const result = await authService.resendVerificationCodeService(email);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email zaten doğrulanmış');
    });

    it('should generate new verification code', async () => {
      const email = randomEmail();
      const oldCode = 'oldcode123';
      await createUnverifiedUser({ email, verificationCode: oldCode });

      const result = await authService.resendVerificationCodeService(email);

      const user = await User.findOne({ email });
      expect(user?.verificationCode).not.toBe(oldCode);
      expect(user?.verificationCode).toBe(result.data.verificationCode);
    });

    it('should extend verification code expiry', async () => {
      const email = randomEmail();
      await createUnverifiedUser({ email, verificationCodeExpires: expiredDate() });

      await authService.resendVerificationCodeService(email);

      const user = await User.findOne({ email });
      expect(user?.verificationCodeExpires!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('logoutService', () => {
    it('should logout successfully with valid token', async () => {
      const email = randomEmail();
      const user = await createTestUser({ email });
      const refreshToken = 'valid-refresh-token-123';
      user.refreshTokens.push({
        token: refreshToken,
        device: 'iPhone',
        expiresAt: futureDate(30 * 24),
      });
      await user.save();

      const result = await authService.logoutService(refreshToken);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Çıkış başarılı');

      const updatedUser = await User.findOne({ email });
      expect(updatedUser?.refreshTokens).toHaveLength(0);
    });

    it('should fail when refresh token is missing', async () => {
      const result = await authService.logoutService('');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Refresh token gerekli');
    });

    it('should fail when refresh token does not exist', async () => {
      const result = await authService.logoutService('nonexistent-token');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz token');
    });

    it('should only remove specified refresh token', async () => {
      const email = randomEmail();
      const user = await createTestUser({ email });
      const token1 = 'token1';
      const token2 = 'token2';
      user.refreshTokens.push(
        { token: token1, device: 'iPhone', expiresAt: futureDate(30 * 24) },
        { token: token2, device: 'Android', expiresAt: futureDate(30 * 24) }
      );
      await user.save();

      await authService.logoutService(token1);

      const updatedUser = await User.findOne({ email });
      expect(updatedUser?.refreshTokens).toHaveLength(1);
      expect(updatedUser?.refreshTokens[0].token).toBe(token2);
    });
  });

  describe('forgotPasswordService', () => {
    it('should send password reset code successfully', async () => {
      const email = randomEmail();
      await createTestUser({ email });

      const result = await authService.forgotPasswordService(email);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Şifre sıfırlama kodu gönderildi');
      expect(result.data.verificationCode).toBeDefined();

      const user = await User.findOne({ email });
      expect(user?.verificationCode).toBe(result.data.verificationCode);
      expect(user?.verificationCodeExpires).toBeDefined();
    });

    it('should fail when email is missing', async () => {
      const result = await authService.forgotPasswordService('');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.forgotPasswordService('nonexistent@example.com');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when email is not verified', async () => {
      const email = randomEmail();
      await createUnverifiedUser({ email });

      const result = await authService.forgotPasswordService(email);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email doğrulanmamış');
    });
  });

  describe('resetPasswordService', () => {
    it('should reset password successfully with valid code', async () => {
      const email = randomEmail();
      const code = '123456';
      const newPassword = 'NewPass123!';
      await createTestUser({
        email,
        verificationCode: code,
        verificationCodeExpires: futureDate(),
        refreshTokens: [{ token: 'oldtoken', device: 'iPhone', expiresAt: futureDate(30 * 24) }],
      });

      const result = await authService.resetPasswordService(email, code, newPassword);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Şifre başarıyla sıfırlandı');

      const user = await User.findOne({ email });
      expect(await bcrypt.compare(newPassword, user!.password!)).toBe(true);
      expect(user?.verificationCode).toBeUndefined();
      expect(user?.verificationCodeExpires).toBeUndefined();
      expect(user?.refreshTokens).toHaveLength(0); // All tokens cleared for security
    });

    it('should fail when email is missing', async () => {
      const result = await authService.resetPasswordService('', '123456', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, doğrulama kodu ve yeni şifre gerekli');
    });

    it('should fail when verification code is missing', async () => {
      const result = await authService.resetPasswordService('test@example.com', '', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, doğrulama kodu ve yeni şifre gerekli');
    });

    it('should fail when new password is missing', async () => {
      const result = await authService.resetPasswordService('test@example.com', '123456', '');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, doğrulama kodu ve yeni şifre gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.resetPasswordService('nonexistent@example.com', '123456', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when verification code is expired', async () => {
      const email = randomEmail();
      const code = '123456';
      await createTestUser({
        email,
        verificationCode: code,
        verificationCodeExpires: expiredDate(),
      });

      const result = await authService.resetPasswordService(email, code, validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Doğrulama kodu süresi doldu');
    });

    it('should fail when verification code is incorrect', async () => {
      const email = randomEmail();
      await createTestUser({
        email,
        verificationCode: 'correct123',
        verificationCodeExpires: futureDate(),
      });

      const result = await authService.resetPasswordService(email, 'wrong456', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Doğrulama kodu yanlış');
    });

    it('should fail with weak password', async () => {
      const email = randomEmail();
      const code = '123456';
      await createTestUser({
        email,
        verificationCode: code,
        verificationCodeExpires: futureDate(),
      });

      const result = await authService.resetPasswordService(email, code, 'weak');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz şifre formatı');
      expect(result.errors).toBeDefined();
    });

    it('should clear all refresh tokens for security', async () => {
      const email = randomEmail();
      const code = '123456';
      const user = await createTestUser({
        email,
        verificationCode: code,
        verificationCodeExpires: futureDate(),
      });
      user.refreshTokens.push(
        { token: 'token1', device: 'iPhone', expiresAt: futureDate(30 * 24) },
        { token: 'token2', device: 'Android', expiresAt: futureDate(30 * 24) }
      );
      await user.save();

      await authService.resetPasswordService(email, code, validPassword());

      const updatedUser = await User.findOne({ email });
      expect(updatedUser?.refreshTokens).toHaveLength(0);
    });
  });

  describe('changePasswordService', () => {
    it('should change password successfully', async () => {
      const email = randomEmail();
      const oldPassword = validPassword();
      const newPassword = 'NewPass456!';
      await createTestUser({ email, password: await bcrypt.hash(oldPassword, 10) });

      const result = await authService.changePasswordService(email, oldPassword, newPassword);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Şifre başarıyla değiştirildi');

      const user = await User.findOne({ email });
      expect(await bcrypt.compare(newPassword, user!.password!)).toBe(true);
      expect(await bcrypt.compare(oldPassword, user!.password!)).toBe(false);
    });

    it('should fail when email is missing', async () => {
      const result = await authService.changePasswordService('', 'old', 'new');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, eski şifre ve yeni şifre gerekli');
    });

    it('should fail when old password is missing', async () => {
      const result = await authService.changePasswordService('test@example.com', '', 'new');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, eski şifre ve yeni şifre gerekli');
    });

    it('should fail when new password is missing', async () => {
      const result = await authService.changePasswordService('test@example.com', 'old', '');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Email, eski şifre ve yeni şifre gerekli');
    });

    it('should fail when user does not exist', async () => {
      const result = await authService.changePasswordService('nonexistent@example.com', 'old', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Kullanıcı bulunamadı');
    });

    it('should fail when user has no password', async () => {
      const email = randomEmail();
      await createTestUser({ email, password: undefined });

      const result = await authService.changePasswordService(email, 'old', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Bu hesap için şifre tanımlı değil');
    });

    it('should fail when old password is incorrect', async () => {
      const email = randomEmail();
      await createTestUser({ email, password: await bcrypt.hash('correct', 10) });

      const result = await authService.changePasswordService(email, 'wrong', validPassword());

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Eski şifre yanlış');
    });

    it('should fail with weak new password', async () => {
      const email = randomEmail();
      const oldPassword = validPassword();
      await createTestUser({ email, password: await bcrypt.hash(oldPassword, 10) });

      const result = await authService.changePasswordService(email, oldPassword, 'weak');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz şifre formatı');
      expect(result.errors).toBeDefined();
    });

    it('should not clear refresh tokens (unlike reset password)', async () => {
      const email = randomEmail();
      const oldPassword = validPassword();
      const user = await createTestUser({ email, password: await bcrypt.hash(oldPassword, 10) });
      user.refreshTokens.push({ token: 'token1', device: 'iPhone', expiresAt: futureDate(30 * 24) });
      await user.save();

      await authService.changePasswordService(email, oldPassword, 'NewPass456!');

      const updatedUser = await User.findOne({ email });
      expect(updatedUser?.refreshTokens).toHaveLength(1); // Tokens NOT cleared
    });
  });

  describe('refreshTokenService', () => {
    it('should refresh access token successfully', async () => {
      const email = randomEmail();
      const user = await createTestUser({ email });
      const tokens = TokenService.generateTokenPair(user._id.toString(), user.role);
      user.refreshTokens.push({
        token: tokens.refreshToken,
        device: 'iPhone',
        expiresAt: futureDate(30 * 24),
      });
      await user.save();

      const result = await authService.refreshTokenService(tokens.refreshToken);

      expect(result.isSuccess).toBe(true);
      expect(result.message).toBe('Token yenilendi');
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.expiresIn).toBe(3600);
    });

    it('should fail when refresh token is missing', async () => {
      const result = await authService.refreshTokenService('');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Refresh token gerekli');
    });

    it('should fail with invalid token format', async () => {
      const result = await authService.refreshTokenService('invalid-token-format');

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz veya süresi dolmuş token');
    });

    it('should fail when token not in database', async () => {
      const user = await createTestUser();
      const tokens = TokenService.generateTokenPair(user._id.toString(), user.role);
      // Token generated but not saved to database

      const result = await authService.refreshTokenService(tokens.refreshToken);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Geçersiz token');
    });

    it('should fail when token is expired in database', async () => {
      const email = randomEmail();
      const user = await createTestUser({ email });
      const tokens = TokenService.generateTokenPair(user._id.toString(), user.role);
      user.refreshTokens.push({
        token: tokens.refreshToken,
        device: 'iPhone',
        expiresAt: expiredDate(), // Expired
      });
      await user.save();

      const result = await authService.refreshTokenService(tokens.refreshToken);

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Token süresi dolmuş');

      // Should also remove expired token from database
      const updatedUser = await User.findOne({ email });
      expect(updatedUser?.refreshTokens).toHaveLength(0);
    });

    it('should generate new access token with correct payload', async () => {
      const email = randomEmail();
      const user = await createTestUser({ email, role: 'advisor' });
      const tokens = TokenService.generateTokenPair(user._id.toString(), user.role);
      user.refreshTokens.push({
        token: tokens.refreshToken,
        device: 'iPhone',
        expiresAt: futureDate(30 * 24),
      });
      await user.save();

      const result = await authService.refreshTokenService(tokens.refreshToken);

      const decoded = TokenService.verifyAccessToken(result.data.accessToken);
      expect(decoded.userId).toBe(user._id.toString());
      expect(decoded.role).toBe('advisor');
    });
  });
});
