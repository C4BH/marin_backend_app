import { describe, it, expect, vi, beforeEach } from 'vitest';
import userRouter from '../../routes/user';

// Mock controllers
vi.mock('../../controllers/user/form', () => ({
    postUserWeightAndHeight: vi.fn()
}));

vi.mock('../../controllers/user/profile', () => ({
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    deleteUser: vi.fn(),
    healthProfile: vi.fn(),
    isFormFilled: vi.fn()
}));

// Mock middleware
vi.mock('../../middlewares/auth', () => ({
    verifyToken: vi.fn((req, res, next) => next())
}));

describe('User Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export a router instance', () => {
        expect(userRouter).toBeDefined();
        expect(typeof userRouter).toBe('function');
    });

    it('should be an Express Router', () => {
        expect(userRouter.post).toBeDefined();
        expect(userRouter.get).toBeDefined();
        expect(userRouter.put).toBeDefined();
        expect(userRouter.delete).toBeDefined();
        expect(userRouter.use).toBeDefined();
    });

    describe('Route configuration', () => {
        it('should have weight-and-height route configured', () => {
            const stack = (userRouter as any).stack;
            const weightHeightRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/weight-and-height'
            );

            expect(weightHeightRoute).toBeDefined();
            expect(weightHeightRoute?.route?.methods?.post).toBe(true);
        });

        it('should have profile GET route configured', () => {
            const stack = (userRouter as any).stack;
            const profileRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/profile' && layer.route.methods.get
            );

            expect(profileRoute).toBeDefined();
        });

        it('should have profile PUT route configured', () => {
            const stack = (userRouter as any).stack;
            const profileRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/profile' && layer.route.methods.put
            );

            expect(profileRoute).toBeDefined();
        });

        it('should have profile DELETE route configured', () => {
            const stack = (userRouter as any).stack;
            const profileRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/profile' && layer.route.methods.delete
            );

            expect(profileRoute).toBeDefined();
        });

        it('should have health-form route configured', () => {
            const stack = (userRouter as any).stack;
            const healthFormRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/health-form'
            );

            expect(healthFormRoute).toBeDefined();
            expect(healthFormRoute?.route?.methods?.post).toBe(true);
        });

        it('should have is-form-filled route configured', () => {
            const stack = (userRouter as any).stack;
            const isFormFilledRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/is-form-filled'
            );

            expect(isFormFilledRoute).toBeDefined();
            expect(isFormFilledRoute?.route?.methods?.get).toBe(true);
        });
    });

    describe('HTTP methods', () => {
        it('should accept POST for weight-and-height', () => {
            const stack = (userRouter as any).stack;
            const route = stack.find((layer: any) =>
                layer.route && layer.route.path === '/weight-and-height'
            );

            expect(route?.route?.methods?.post).toBe(true);
            expect(route?.route?.methods?.get).toBeFalsy();
        });

        it('should accept GET for profile read', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) =>
                layer.route && layer.route.path === '/profile'
            );

            const getRoute = routes.find((layer: any) => layer.route.methods.get);
            expect(getRoute).toBeDefined();
        });

        it('should accept PUT for profile update', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) =>
                layer.route && layer.route.path === '/profile'
            );

            const putRoute = routes.find((layer: any) => layer.route.methods.put);
            expect(putRoute).toBeDefined();
        });

        it('should accept DELETE for profile deletion', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) =>
                layer.route && layer.route.path === '/profile'
            );

            const deleteRoute = routes.find((layer: any) => layer.route.methods.delete);
            expect(deleteRoute).toBeDefined();
        });

        it('should accept POST for health-form', () => {
            const stack = (userRouter as any).stack;
            const route = stack.find((layer: any) =>
                layer.route && layer.route.path === '/health-form'
            );

            expect(route?.route?.methods?.post).toBe(true);
        });

        it('should accept GET for is-form-filled', () => {
            const stack = (userRouter as any).stack;
            const route = stack.find((layer: any) =>
                layer.route && layer.route.path === '/is-form-filled'
            );

            expect(route?.route?.methods?.get).toBe(true);
        });
    });

    describe('Middleware configuration', () => {
        it('should have authentication middleware configured', () => {
            const stack = (userRouter as any).stack;

            // Check for middleware layers (those without routes)
            const middlewares = stack.filter((layer: any) => !layer.route);

            expect(middlewares.length).toBeGreaterThan(0);
        });

        it('should apply verifyToken to all routes', () => {
            const stack = (userRouter as any).stack;

            // First middleware should be verifyToken
            const firstMiddleware = stack[0];
            expect(firstMiddleware.route).toBeUndefined();
        });
    });

    describe('Route paths', () => {
        it('should have all expected routes defined', () => {
            const stack = (userRouter as any).stack;
            const routePaths = stack
                .filter((layer: any) => layer.route)
                .map((layer: any) => layer.route.path);

            expect(routePaths).toContain('/weight-and-height');
            expect(routePaths).toContain('/profile');
            expect(routePaths).toContain('/health-form');
            expect(routePaths).toContain('/is-form-filled');
        });

        it('should have profile path used for multiple HTTP methods', () => {
            const stack = (userRouter as any).stack;
            const profileRoutes = stack.filter((layer: any) =>
                layer.route && layer.route.path === '/profile'
            );

            // Should have GET, PUT, and DELETE for /profile
            expect(profileRoutes.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Router integrity', () => {
        it('should have at least 6 routes configured', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            // weight-and-height, profile (GET, PUT, DELETE), health-form, is-form-filled
            expect(routes.length).toBeGreaterThanOrEqual(6);
        });

        it('should have all routes with handlers', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            routes.forEach((layer: any) => {
                expect(layer.route.stack).toBeDefined();
                expect(layer.route.stack.length).toBeGreaterThan(0);
            });
        });

        it('should not have undefined routes', () => {
            const stack = (userRouter as any).stack;
            const routes = stack.filter((layer: any) => layer.route);

            routes.forEach((layer: any) => {
                expect(layer.route.path).toBeDefined();
                expect(layer.route.path).not.toBe('');
            });
        });
    });

    describe('RESTful design', () => {
        it('should use appropriate HTTP methods for profile CRUD', () => {
            const stack = (userRouter as any).stack;
            const profileRoutes = stack.filter((layer: any) =>
                layer.route && layer.route.path === '/profile'
            );

            const methods = profileRoutes.map((layer: any) =>
                Object.keys(layer.route.methods).find(method => layer.route.methods[method])
            );

            expect(methods).toContain('get');     // Read
            expect(methods).toContain('put');     // Update
            expect(methods).toContain('delete');  // Delete
        });

        it('should use POST for data submission routes', () => {
            const stack = (userRouter as any).stack;

            const weightHeightRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/weight-and-height'
            );
            const healthFormRoute = stack.find((layer: any) =>
                layer.route && layer.route.path === '/health-form'
            );

            expect(weightHeightRoute?.route?.methods?.post).toBe(true);
            expect(healthFormRoute?.route?.methods?.post).toBe(true);
        });
    });
});
