import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from 'express';
import authRouter from '../../routes/auth';

// Mock controllers
vi.mock('../../controllers/auth', () => ({
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    refreshToken: vi.fn()
}));

// Mock middlewares
vi.mock('../../middlewares/auth', () => ({
    logResetPasswordAttempt: vi.fn(),
    resetPasswordLimiter: vi.fn()
}));

describe('Auth Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export a router instance', () => {
        expect(authRouter).toBeDefined();
        expect(typeof authRouter).toBe('function');
    });

    it('should be an Express Router', () => {
        // Router has specific methods
        expect(authRouter.post).toBeDefined();
        expect(authRouter.get).toBeDefined();
        expect(authRouter.put).toBeDefined();
        expect(authRouter.delete).toBeDefined();
        expect(authRouter.use).toBeDefined();
    });

    describe('Route configuration', () => {
        it('should have login route configured', () => {
            const stack = (authRouter as any).stack;
            const loginRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/login'
            );

            expect(loginRoute).toBeDefined();
            expect(loginRoute?.route?.methods?.post).toBe(true);
        });

        it('should have register route configured', () => {
            const stack = (authRouter as any).stack;
            const registerRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/register'
            );

            expect(registerRoute).toBeDefined();
            expect(registerRoute?.route?.methods?.post).toBe(true);
        });

        it('should have logout route configured', () => {
            const stack = (authRouter as any).stack;
            const logoutRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/logout'
            );

            expect(logoutRoute).toBeDefined();
            expect(logoutRoute?.route?.methods?.post).toBe(true);
        });

        it('should have refresh-token route configured', () => {
            const stack = (authRouter as any).stack;
            const refreshRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/refresh-token'
            );

            expect(refreshRoute).toBeDefined();
            expect(refreshRoute?.route?.methods?.post).toBe(true);
        });

        it('should have verify-email route configured', () => {
            const stack = (authRouter as any).stack;
            const verifyRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/verify-email'
            );

            expect(verifyRoute).toBeDefined();
            expect(verifyRoute?.route?.methods?.post).toBe(true);
        });

        it('should have resend-verification-code route configured', () => {
            const stack = (authRouter as any).stack;
            const resendRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/resend-verification-code'
            );

            expect(resendRoute).toBeDefined();
            expect(resendRoute?.route?.methods?.post).toBe(true);
        });

        it('should have forgot-password route configured', () => {
            const stack = (authRouter as any).stack;
            const forgotRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/forgot-password'
            );

            expect(forgotRoute).toBeDefined();
            expect(forgotRoute?.route?.methods?.post).toBe(true);
        });

        it('should have reset-password route configured', () => {
            const stack = (authRouter as any).stack;
            const resetRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/reset-password'
            );

            expect(resetRoute).toBeDefined();
            expect(resetRoute?.route?.methods?.post).toBe(true);
        });
    });

    describe('HTTP methods', () => {
        it('should only accept POST for login', () => {
            const stack = (authRouter as any).stack;
            const loginRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/login'
            );

            expect(loginRoute?.route?.methods?.post).toBe(true);
            expect(loginRoute?.route?.methods?.get).toBeFalsy();
            expect(loginRoute?.route?.methods?.put).toBeFalsy();
            expect(loginRoute?.route?.methods?.delete).toBeFalsy();
        });

        it('should only accept POST for all auth routes', () => {
            const stack = (authRouter as any).stack;
            const routes = [
                '/login',
                '/register',
                '/logout',
                '/refresh-token',
                '/verify-email',
                '/resend-verification-code',
                '/forgot-password',
                '/reset-password'
            ];

            routes.forEach(path => {
                const route = stack.find((layer: any) =>
                    layer.route && layer.route.path === path
                );

                expect(route?.route?.methods?.post).toBe(true);
                expect(route?.route?.methods?.get).toBeFalsy();
            });
        });
    });

    describe('Middleware configuration', () => {
        it('should have rate limiter and log middleware configured', () => {
            const stack = (authRouter as any).stack;

            // Check for middleware layers (those without routes)
            const middlewares = stack.filter((layer: any) => !layer.route);

            expect(middlewares.length).toBeGreaterThan(0);
        });
    });

    describe('Route paths', () => {
        it('should have all expected routes defined', () => {
            const stack = (authRouter as any).stack;
            const routePaths = stack
                .filter((layer: any) => layer.route)
                .map((layer: any) => layer.route.path);

            expect(routePaths).toContain('/login');
            expect(routePaths).toContain('/register');
            expect(routePaths).toContain('/logout');
            expect(routePaths).toContain('/refresh-token');
            expect(routePaths).toContain('/verify-email');
            expect(routePaths).toContain('/resend-verification-code');
            expect(routePaths).toContain('/forgot-password');
            expect(routePaths).toContain('/reset-password');
        });

        it('should not have change-password route (commented out)', () => {
            const stack = (authRouter as any).stack;
            const changePasswordRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/change-password'
            );

            expect(changePasswordRoute).toBeUndefined();
        });
    });

    describe('Router integrity', () => {
        it('should have at least 8 routes configured', () => {
            const stack = (authRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            expect(routes.length).toBeGreaterThanOrEqual(8);
        });

        it('should have all routes with handlers', () => {
            const stack = (authRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            routes.forEach((layer: any) => {
                expect(layer.route.stack).toBeDefined();
                expect(layer.route.stack.length).toBeGreaterThan(0);
            });
        });
    });
});
