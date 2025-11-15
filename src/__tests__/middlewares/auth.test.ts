import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { verifyToken, resetPasswordLimiter, logResetPasswordAttempt } from '../../middlewares/auth';
import { TokenService } from '../../utils/generate_token';
import { logger } from '../../utils/logger';

// Mock dependencies
vi.mock('../../utils/generate_token');
vi.mock('../../utils/logger');

describe('Auth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup response mocks
        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));

        mockRequest = {
            headers: {},
            cookies: {},
            user: undefined
        };

        mockResponse = {
            status: statusMock,
            json: jsonMock
        };

        mockNext = vi.fn();
    });

    describe('verifyToken', () => {
        it('should verify valid token from Authorization header and call next()', async () => {
            const mockDecoded = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.headers = {
                authorization: 'Bearer valid_token_123'
            };

            vi.mocked(TokenService.verifyAccessToken).mockReturnValue(mockDecoded);

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(TokenService.verifyAccessToken).toHaveBeenCalledWith('valid_token_123');
            expect(mockRequest.user).toEqual(mockDecoded);
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 401 if no token provided', async () => {
            mockRequest.headers = {};

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Yetkisiz erişim. Token gerekli.'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if Authorization header does not start with "Bearer "', async () => {
            mockRequest.headers = {
                authorization: 'InvalidFormat token123'
            };

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Yetkisiz erişim. Token gerekli.'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 with "Token expired" message when token is expired', async () => {
            mockRequest.headers = {
                authorization: 'Bearer expired_token'
            };

            const expiredError = new Error('Token expired');
            expiredError.name = 'TokenExpiredError';

            vi.mocked(TokenService.verifyAccessToken).mockImplementation(() => {
                throw expiredError;
            });

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Token expired'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 with "Invalid token" message when token is invalid', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid_token'
            };

            const jwtError = new Error('Invalid token');
            jwtError.name = 'JsonWebTokenError';

            vi.mocked(TokenService.verifyAccessToken).mockImplementation(() => {
                throw jwtError;
            });

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 with "Unauthorized" for other errors', async () => {
            mockRequest.headers = {
                authorization: 'Bearer some_token'
            };

            const genericError = new Error('Some other error');
            genericError.name = 'SomeOtherError';

            vi.mocked(TokenService.verifyAccessToken).mockImplementation(() => {
                throw genericError;
            });

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should log warning when token is not provided', async () => {
            mockRequest.headers = {};
            mockRequest.user = { userId: 'user123' } as any;

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Authentication failed: Token not provided')
            );
        });

        it('should log debug message on successful authentication', async () => {
            const mockDecoded = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.headers = {
                authorization: 'Bearer valid_token'
            };

            vi.mocked(TokenService.verifyAccessToken).mockReturnValue(mockDecoded);

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Authentication successful for user: user123')
            );
        });

        it('should log error message on authentication failure', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid_token'
            };

            const error = new Error('Invalid signature');
            error.name = 'JsonWebTokenError';

            vi.mocked(TokenService.verifyAccessToken).mockImplementation(() => {
                throw error;
            });

            await verifyToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Authentication error: Invalid signature')
            );
        });
    });

    describe('logResetPasswordAttempt', () => {
        let consoleSpy: any;

        beforeEach(() => {
            consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        });

        it('should log reset password attempt with IP and email', () => {
            mockRequest.ip = '192.168.1.1';
            mockRequest.headers = {
                'x-forwarded-for': '10.0.0.1'
            };
            mockRequest.body = {
                email: 'test@example.com'
            };

            logResetPasswordAttempt(mockRequest as Request, mockResponse as Response, mockNext);

            expect(consoleSpy).toHaveBeenCalledWith('reset password attempt', {
                ip: '192.168.1.1',
                forwarded: '10.0.0.1',
                email: 'test@example.com'
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle missing email in body', () => {
            mockRequest.ip = '192.168.1.1';
            mockRequest.body = {};

            logResetPasswordAttempt(mockRequest as Request, mockResponse as Response, mockNext);

            expect(consoleSpy).toHaveBeenCalledWith('reset password attempt', {
                ip: '192.168.1.1',
                forwarded: undefined,
                email: undefined
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle errors gracefully and still call next', () => {
            mockRequest.ip = '192.168.1.1';
            // Force an error by making body.email throw
            Object.defineProperty(mockRequest, 'body', {
                get() {
                    throw new Error('Test error');
                }
            });

            logResetPasswordAttempt(mockRequest as Request, mockResponse as Response, mockNext);

            expect(consoleSpy).toHaveBeenCalledWith('reset password attempt error', expect.any(Error));
            expect(mockNext).toHaveBeenCalled();
        });

        it('should always call next() even on error', () => {
            mockRequest.ip = undefined;

            logResetPasswordAttempt(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('resetPasswordLimiter', () => {
        it('should be defined as rate limiter', () => {
            expect(resetPasswordLimiter).toBeDefined();
            expect(typeof resetPasswordLimiter).toBe('function');
        });
    });
});
