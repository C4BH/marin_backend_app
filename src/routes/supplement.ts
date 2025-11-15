import express from 'express';
import {
    getRecommendations,
    getAllSupplements,
    getSupplementById,
    syncSupplements
} from '../controllers/supplement';
import { verifyToken } from '../middlewares/auth';

const router = express.Router();

/**
 * GET /api/supplements/recommendations
 * Get personalized supplement recommendations
 * Requires authentication
 */
router.get('/recommendations', verifyToken, getRecommendations);

/**
 * GET /api/supplements
 * Get all active supplements with pagination
 * Public endpoint
 */
router.get('/', getAllSupplements);

/**
 * GET /api/supplements/:id
 * Get single supplement by ID
 * Public endpoint
 */
router.get('/:id', getSupplementById);

/**
 * POST /api/supplements/sync
 * Manually trigger sync from Vademecum API
 * TEMPORARY: Authentication disabled for testing
 */
router.post('/sync', syncSupplements); // TODO: Re-enable verifyToken in production

export default router;

