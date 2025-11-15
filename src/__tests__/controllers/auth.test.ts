import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
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
} from '../../controllers/auth';
import * as authService from '../../services/auth';

// Mock auth services
vi.mock('../../services/auth');

describe('Auth Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));

        mockRequest = {
            body: {}
        };

        mockResponse = {
            status: statusMock,
            json: jsonMock
        };

        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('login', () => {
        it('should return 200 with tokens on successful login', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123!',
                device: 'mobile'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Login successful',
                data: {
                    accessToken: 'access_token_123',
                    refreshToken: 'refresh_token_123',
                    expiresIn: 3600
                }
            };

            vi.mocked(authService.loginService).mockResolvedValue(mockResult as any);

            await login(mockRequest as Request, mockResponse as Response);

            expect(authService.loginService).toHaveBeenCalledWith('test@example.com', 'Password123!', 'mobile');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Login successful',
                accessToken: 'access_token_123',
                refreshToken: 'refresh_token_123',
                expiresIn: 3600
            });
        });

        it('should return 401 on failed login', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'wrong_password'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid credentials'
            };

            vi.mocked(authService.loginService).mockResolvedValue(mockResult as any);

            await login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return 500 on internal server error', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            vi.mocked(authService.loginService).mockRejectedValue(new Error('Database error'));

            await login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('register', () => {
        it('should return 201 with tokens on successful registration', async () => {
            mockRequest.body = {
                email: 'newuser@example.com',
                password: 'Password123!'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Registration successful',
                data: {
                    accessToken: 'access_token_123',
                    refreshToken: 'refresh_token_123',
                    expiresIn: 3600,
                    verificationCode: '123456'
                }
            };

            vi.mocked(authService.registerService).mockResolvedValue(mockResult as any);

            await register(mockRequest as Request, mockResponse as Response);

            expect(authService.registerService).toHaveBeenCalledWith('newuser@example.com', 'Password123!');
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Registration successful',
                accessToken: 'access_token_123',
                refreshToken: 'refresh_token_123',
                expiresIn: 3600
            });
            expect(consoleSpy).toHaveBeenCalledWith('Verification code:', '123456');
        });

        it('should return 400 with errors on validation failure', async () => {
            mockRequest.body = {
                email: 'invalid-email',
                password: 'weak'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Validation failed',
                errors: ['Invalid email format', 'Password too weak']
            };

            vi.mocked(authService.registerService).mockResolvedValue(mockResult as any);

            await register(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation failed',
                errors: ['Invalid email format', 'Password too weak']
            });
        });

        it('should return 500 on internal server error', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            vi.mocked(authService.registerService).mockRejectedValue(new Error('Database error'));

            await register(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('verifyEmail', () => {
        it('should return 200 on successful email verification', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                verificationCode: '123456'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Email verified successfully'
            };

            vi.mocked(authService.verifyEmailService).mockResolvedValue(mockResult as any);

            await verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(authService.verifyEmailService).toHaveBeenCalledWith('test@example.com', '123456');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Email verified successfully' });
        });

        it('should return 400 on invalid verification code', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                verificationCode: 'wrong_code'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid verification code'
            };

            vi.mocked(authService.verifyEmailService).mockResolvedValue(mockResult as any);

            await verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid verification code' });
        });

        it('should return 500 on internal server error', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                verificationCode: '123456'
            };

            vi.mocked(authService.verifyEmailService).mockRejectedValue(new Error('Database error'));

            await verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('resendVerificationCode', () => {
        it('should return 200 and log verification code on success', async () => {
            mockRequest.body = {
                email: 'test@example.com'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Verification code sent',
                data: {
                    verificationCode: '654321'
                }
            };

            vi.mocked(authService.resendVerificationCodeService).mockResolvedValue(mockResult as any);

            await resendVerificationCode(mockRequest as Request, mockResponse as Response);

            expect(authService.resendVerificationCodeService).toHaveBeenCalledWith('test@example.com');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Verification code sent' });
            expect(consoleSpy).toHaveBeenCalledWith('Verification code:', '654321');
        });

        it('should return 400 on failure', async () => {
            mockRequest.body = {
                email: 'test@example.com'
            };

            const mockResult = {
                isSuccess: false,
                message: 'User not found'
            };

            vi.mocked(authService.resendVerificationCodeService).mockResolvedValue(mockResult as any);

            await resendVerificationCode(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('logout', () => {
        it('should return 200 on successful logout', async () => {
            mockRequest.body = {
                refreshToken: 'refresh_token_123'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Logged out successfully'
            };

            vi.mocked(authService.logoutService).mockResolvedValue(mockResult as any);

            await logout(mockRequest as Request, mockResponse as Response);

            expect(authService.logoutService).toHaveBeenCalledWith('refresh_token_123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Logged out successfully' });
        });

        it('should return 400 on logout failure', async () => {
            mockRequest.body = {
                refreshToken: 'invalid_token'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid token'
            };

            vi.mocked(authService.logoutService).mockResolvedValue(mockResult as any);

            await logout(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
        });
    });

    describe('forgotPassword', () => {
        it('should return 200 and log reset code on success', async () => {
            mockRequest.body = {
                email: 'test@example.com'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Reset code sent',
                data: {
                    verificationCode: '789012'
                }
            };

            vi.mocked(authService.forgotPasswordService).mockResolvedValue(mockResult as any);

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(authService.forgotPasswordService).toHaveBeenCalledWith('test@example.com');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Reset code sent' });
            expect(consoleSpy).toHaveBeenCalledWith('Reset code:', '789012');
        });

        it('should return 400 when user not found', async () => {
            mockRequest.body = {
                email: 'nonexistent@example.com'
            };

            const mockResult = {
                isSuccess: false,
                message: 'User not found'
            };

            vi.mocked(authService.forgotPasswordService).mockResolvedValue(mockResult as any);

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('resetPassword', () => {
        it('should return 200 on successful password reset', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                verificationCode: '123456',
                newPassword: 'NewPassword123!'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Password reset successfully'
            };

            vi.mocked(authService.resetPasswordService).mockResolvedValue(mockResult as any);

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(authService.resetPasswordService).toHaveBeenCalledWith('test@example.com', '123456', 'NewPassword123!');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Password reset successfully' });
        });

        it('should return 400 with errors on validation failure', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                verificationCode: 'wrong',
                newPassword: 'weak'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Validation failed',
                errors: ['Password too weak']
            };

            vi.mocked(authService.resetPasswordService).mockResolvedValue(mockResult as any);

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Validation failed',
                errors: ['Password too weak']
            });
        });
    });

    describe('changePassword', () => {
        it('should return 200 on successful password change', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                oldPassword: 'OldPassword123!',
                newPassword: 'NewPassword123!'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Password changed successfully'
            };

            vi.mocked(authService.changePasswordService).mockResolvedValue(mockResult as any);

            await changePassword(mockRequest as Request, mockResponse as Response);

            expect(authService.changePasswordService).toHaveBeenCalledWith('test@example.com', 'OldPassword123!', 'NewPassword123!');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Password changed successfully' });
        });

        it('should return 400 when old password is incorrect', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                oldPassword: 'WrongPassword',
                newPassword: 'NewPassword123!'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Incorrect old password',
                errors: []
            };

            vi.mocked(authService.changePasswordService).mockResolvedValue(mockResult as any);

            await changePassword(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Incorrect old password',
                errors: []
            });
        });
    });

    describe('refreshToken', () => {
        it('should return 200 with new access token on successful refresh', async () => {
            mockRequest.body = {
                refreshToken: 'valid_refresh_token'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Token refreshed',
                data: {
                    accessToken: 'new_access_token',
                    expiresIn: 3600
                }
            };

            vi.mocked(authService.refreshTokenService).mockResolvedValue(mockResult as any);

            await refreshToken(mockRequest as Request, mockResponse as Response);

            expect(authService.refreshTokenService).toHaveBeenCalledWith('valid_refresh_token');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Token refreshed',
                accessToken: 'new_access_token',
                expiresIn: 3600
            });
        });

        it('should return 401 on invalid refresh token', async () => {
            mockRequest.body = {
                refreshToken: 'invalid_refresh_token'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid refresh token'
            };

            vi.mocked(authService.refreshTokenService).mockResolvedValue(mockResult as any);

            await refreshToken(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
        });

        it('should return 401 on exception', async () => {
            mockRequest.body = {
                refreshToken: 'some_token'
            };

            vi.mocked(authService.refreshTokenService).mockRejectedValue(new Error('Token error'));

            await refreshToken(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Geçersiz veya süresi dolmuş token' });
        });
    });
});
