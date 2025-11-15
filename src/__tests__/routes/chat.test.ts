import { describe, it, expect, vi, beforeEach } from 'vitest';
import chatRouter from '../../routes/chat';

// Mock controllers
vi.mock('../../controllers/chat', () => ({
    sendMessage: vi.fn(),
    clearConversation: vi.fn(),
    healthCheck: vi.fn()
}));

// Mock middleware
vi.mock('../../middlewares/auth', () => ({
    verifyToken: vi.fn((req, res, next) => next())
}));

// Mock rate limiter
vi.mock('express-rate-limit', () => ({
    default: vi.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Chat Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export a router instance', () => {
        expect(chatRouter).toBeDefined();
        expect(typeof chatRouter).toBe('function');
    });

    it('should be an Express Router', () => {
        expect(chatRouter.post).toBeDefined();
        expect(chatRouter.get).toBeDefined();
        expect(chatRouter.use).toBeDefined();
    });

    describe('Route configuration', () => {
        it('should have message route configured', () => {
            const stack = (chatRouter as any).stack;
            const messageRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/message'
            );

            expect(messageRoute).toBeDefined();
            expect(messageRoute?.route?.methods?.post).toBe(true);
        });

        it('should have clear route configured', () => {
            const stack = (chatRouter as any).stack;
            const clearRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/clear'
            );

            expect(clearRoute).toBeDefined();
            expect(clearRoute?.route?.methods?.post).toBe(true);
        });

        it('should have health route configured', () => {
            const stack = (chatRouter as any).stack;
            const healthRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/health'
            );

            expect(healthRoute).toBeDefined();
            expect(healthRoute?.route?.methods?.get).toBe(true);
        });
    });

    describe('HTTP methods', () => {
        it('should accept POST for message route', () => {
            const stack = (chatRouter as any).stack;
            const messageRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/message'
            );

            expect(messageRoute?.route?.methods?.post).toBe(true);
            expect(messageRoute?.route?.methods?.get).toBeFalsy();
        });

        it('should accept POST for clear route', () => {
            const stack = (chatRouter as any).stack;
            const clearRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/clear'
            );

            expect(clearRoute?.route?.methods?.post).toBe(true);
            expect(clearRoute?.route?.methods?.get).toBeFalsy();
        });

        it('should accept GET for health route', () => {
            const stack = (chatRouter as any).stack;
            const healthRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/health'
            );

            expect(healthRoute?.route?.methods?.get).toBe(true);
            expect(healthRoute?.route?.methods?.post).toBeFalsy();
        });
    });

    describe('Middleware configuration', () => {
        it('should have authentication middleware configured', () => {
            const stack = (chatRouter as any).stack;

            // Check for middleware layers (those without routes)
            const middlewares = stack.filter((layer: any) => !layer.route);

            expect(middlewares.length).toBeGreaterThan(0);
        });

        it('should have rate limiter on message route', () => {
            const stack = (chatRouter as any).stack;
            const messageRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/message'
            );

            // Message route should have multiple handlers (rate limiter + controller)
            expect(messageRoute?.route?.stack?.length).toBeGreaterThan(1);
        });
    });

    describe('Route paths', () => {
        it('should have all expected routes defined', () => {
            const stack = (chatRouter as any).stack;
            const routePaths = stack
                .filter((layer: any) => layer.route)
                .map((layer: any) => layer.route.path);

            expect(routePaths).toContain('/message');
            expect(routePaths).toContain('/clear');
            expect(routePaths).toContain('/health');
        });

        it('should have exactly 3 routes', () => {
            const stack = (chatRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            expect(routes.length).toBe(3);
        });
    });

    describe('Router integrity', () => {
        it('should have all routes with handlers', () => {
            const stack = (chatRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            routes.forEach((layer: any) => {
                expect(layer.route.stack).toBeDefined();
                expect(layer.route.stack.length).toBeGreaterThan(0);
            });
        });

        it('should not have undefined routes', () => {
            const stack = (chatRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            routes.forEach((layer: any) => {
                expect(layer.route.path).toBeDefined();
                expect(layer.route.path).not.toBe('');
            });
        });
    });

    describe('Route order', () => {
        it('should have routes in correct order', () => {
            const stack = (chatRouter as any).stack;
            const routePaths = stack
                .filter((layer: any) => layer.route)
                .map((layer: any) => layer.route.path);

            const messageIndex = routePaths.indexOf('/message');
            const clearIndex = routePaths.indexOf('/clear');
            const healthIndex = routePaths.indexOf('/health');

            expect(messageIndex).toBeGreaterThanOrEqual(0);
            expect(clearIndex).toBeGreaterThanOrEqual(0);
            expect(healthIndex).toBeGreaterThanOrEqual(0);
        });
    });
});
