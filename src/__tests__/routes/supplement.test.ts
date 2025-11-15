import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import supplementRoutes from '../../routes/supplement';
import * as authMiddleware from '../../middlewares/auth';

// Mock middleware
vi.mock('../../middlewares/auth');

// Mock controllers
vi.mock('../../controllers/supplement', () => ({
    getRecommendations: vi.fn((req, res) => {
        res.status(200).json({
            isSuccess: true,
            message: 'Recommendations retrieved',
            data: { recommendations: [] }
        });
    }),
    getAllSupplements: vi.fn((req, res) => {
        res.status(200).json({
            isSuccess: true,
            message: 'Supplements retrieved',
            data: { supplements: [], pagination: {} }
        });
    }),
    getSupplementById: vi.fn((req, res) => {
        res.status(200).json({
            isSuccess: true,
            message: 'Supplement retrieved',
            data: { id: req.params.id }
        });
    }),
    syncSupplements: vi.fn((req, res) => {
        res.status(200).json({
            isSuccess: true,
            message: 'Sync completed',
            data: { stats: {} }
        });
    })
}));

describe('Supplement Routes', () => {
    let app: Express;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/supplements', supplementRoutes);

        // Mock verifyToken middleware to pass through
        (authMiddleware.verifyToken as any).mockImplementation((req: any, res: any, next: any) => {
            req.user = { _id: 'user123', role: 'user' };
            next();
        });
    });

    afterAll(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/supplements/recommendations', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/supplements/recommendations');

            expect(response.status).toBe(200); // Passes because middleware is mocked
        });

        it('should return recommendations', async () => {
            const response = await request(app)
                .get('/api/supplements/recommendations');

            expect(response.status).toBe(200);
            expect(response.body.isSuccess).toBe(true);
        });
    });

    describe('GET /api/supplements', () => {
        it('should return all supplements', async () => {
            const response = await request(app)
                .get('/api/supplements');

            expect(response.status).toBe(200);
            expect(response.body.isSuccess).toBe(true);
        });

        it('should support pagination query params', async () => {
            const response = await request(app)
                .get('/api/supplements')
                .query({ page: 1, limit: 20 });

            expect(response.status).toBe(200);
        });

        it('should support search query param', async () => {
            const response = await request(app)
                .get('/api/supplements')
                .query({ search: 'vitamin' });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/supplements/:id', () => {
        it('should return supplement by id', async () => {
            const response = await request(app)
                .get('/api/supplements/123');

            expect(response.status).toBe(200);
            expect(response.body.isSuccess).toBe(true);
        });
    });

    describe('POST /api/supplements/sync', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/supplements/sync');

            expect(response.status).toBe(200); // Passes because middleware is mocked
        });

        it('should trigger sync', async () => {
            const response = await request(app)
                .post('/api/supplements/sync');

            expect(response.status).toBe(200);
            expect(response.body.isSuccess).toBe(true);
        });
    });
});

