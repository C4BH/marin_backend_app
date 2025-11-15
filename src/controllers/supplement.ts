import { Request, Response } from 'express';
import { getRecommendedProducts, syncProductsToDatabase } from '../services/vademecum';
import Supplement from '../models/supplements';
import { logger } from '../utils/logger';

/**
 * Get personalized supplement recommendations for the authenticated user
 * GET /api/supplements/recommendations
 */
export const getRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({
                isSuccess: false,
                message: 'Kimlik doğrulama gerekli'
            });
        }

        logger.info(`Getting recommendations for user: ${userId}`);

        const recommendations = await getRecommendedProducts(userId.toString());

        return res.status(200).json({
            isSuccess: true,
            message: 'Öneriler başarıyla getirildi',
            data: recommendations
        });
    } catch (error: any) {
        logger.error('Error in getRecommendations:', error.message);
        
        if (error.message === 'User not found') {
            return res.status(404).json({
                isSuccess: false,
                message: 'Kullanıcı bulunamadı'
            });
        }
        
        if (error.message === 'User has not filled the health profile form') {
            return res.status(400).json({
                isSuccess: false,
                message: 'Öneri alabilmek için önce sağlık profili formunu doldurmalısınız'
            });
        }

        return res.status(500).json({
            isSuccess: false,
            message: 'Öneriler getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

/**
 * Get all active supplements with pagination
 * GET /api/supplements?page=1&limit=20&search=vitamin
 */
export const getAllSupplements = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string || '';

        const skip = (page - 1) * limit;

        // Build query
        const query: any = { isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { 'medicalInfo.description': { $regex: search, $options: 'i' } }
            ];
        }

        // Get supplements with pagination
        const [supplements, total] = await Promise.all([
            Supplement.find(query)
                .select('name brand imageUrl price currency manufacturer category form rating reviewCount')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Supplement.countDocuments(query)
        ]);

        logger.info(`Retrieved ${supplements.length} supplements (page ${page})`);

        return res.status(200).json({
            isSuccess: true,
            message: 'Takviye gıdalar başarıyla getirildi',
            data: {
                supplements,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + supplements.length < total
                }
            }
        });
    } catch (error: any) {
        logger.error('Error in getAllSupplements:', error.message);
        return res.status(500).json({
            isSuccess: false,
            message: 'Takviye gıdalar getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

/**
 * Get single supplement by ID
 * GET /api/supplements/:id
 */
export const getSupplementById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const supplement = await Supplement.findById(id).lean();

        if (!supplement) {
            return res.status(404).json({
                isSuccess: false,
                message: 'Takviye gıda bulunamadı'
            });
        }

        logger.info(`Retrieved supplement: ${supplement.name}`);

        return res.status(200).json({
            isSuccess: true,
            message: 'Takviye gıda başarıyla getirildi',
            data: supplement
        });
    } catch (error: any) {
        logger.error('Error in getSupplementById:', error.message);
        return res.status(500).json({
            isSuccess: false,
            message: 'Takviye gıda getirilirken bir hata oluştu',
            error: error.message
        });
    }
};

/**
 * Manually trigger sync from Vademecum API
 * POST /api/supplements/sync
 * Admin only
 */
export const syncSupplements = async (req: Request, res: Response) => {
    try {
        // TEMPORARY: Admin check disabled for testing
        // const userRole = req.user?.role;
        // if (userRole !== 'admin') {
        //     return res.status(403).json({
        //         isSuccess: false,
        //         message: 'Bu işlem için admin yetkisi gerekli'
        //     });
        // }

        logger.info('Manual sync triggered (testing mode)');

        // Start sync (this can take a while)
        const result = await syncProductsToDatabase();

        if (result.success) {
            return res.status(200).json({
                isSuccess: true,
                message: result.message,
                data: {
                    stats: result.stats,
                    brandCounts: result.brandCounts,
                    errors: result.errors
                }
            });
        } else {
            return res.status(500).json({
                isSuccess: false,
                message: result.message,
                data: {
                    stats: result.stats,
                    brandCounts: result.brandCounts,
                    errors: result.errors
                }
            });
        }
    } catch (error: any) {
        logger.error('Error in syncSupplements:', error.message);
        return res.status(500).json({
            isSuccess: false,
            message: 'Senkronizasyon sırasında bir hata oluştu',
            error: error.message
        });
    }
};

