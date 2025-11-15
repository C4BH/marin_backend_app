import axios, { AxiosInstance } from 'axios';
import {
    VademecumProduct,
    VademecumApiResponse,
    VademecumProductCard,
    VademecumProductCardResponse,
    CachedProductCard,
    CachedProductList,
    ProductMatchResult,
    SyncResult,
    RecommendationResponse
} from '../types/vademecum.types';
import Supplement from '../models/supplements';
import User from '../models/user';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ============================================
// Configuration
// ============================================

const VADEMECUM_API_BASE_URL = process.env.VADEMECUM_API_BASE_URL || 'https://api.vapi.co';
const VADEMECUM_API_KEY = process.env.VADEMECUM_API_KEY || '';
const API_TIMEOUT = 30000; // 30 seconds (increased from 10)
const CACHE_TTL_PRODUCT_CARD = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TTL_PRODUCT_LIST = 6 * 60 * 60 * 1000; // 6 hours
const BATCH_SIZE = 10; // Process 10 products at a time
const BATCH_DELAY = 1000; // 1 second pause between batches

// Sync configuration - retry and rate limiting
const MAX_PAGES_INITIAL = 50; // Fetch first 50 pages (5000 products) initially  
const MIN_PRODUCTS_PER_BRAND = 10; // Minimum products per brand before stopping
const PAGE_RETRY_COUNT = 3; // Retry 3 times on 502 errors
const RETRY_BACKOFF_BASE = 2000; // 2 seconds base delay for retries
const PAGE_REQUEST_DELAY = 1000; // 1 second delay between page requests

// TEMPORARY: Only sync specific brands for testing
const ALLOWED_BRANDS = ['protein ocean', 'velavit', 'solgar'];

// ============================================
// Memory Cache
// ============================================

const productCardCache = new Map<number, CachedProductCard>();
const productListCache: { data: CachedProductList | null } = { data: null };

// ============================================
// API Client
// ============================================

const apiClient: AxiosInstance = axios.create({
    baseURL: VADEMECUM_API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Authorization': `Bearer ${VADEMECUM_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// ============================================
// 1. API Communication Functions
// ============================================

/**
 * Fetch all products from Vademecum API with pagination
 */
export const fetchAllProducts = async (): Promise<VademecumProduct[]> => {
    try {
        // TEMPORARY: Cache disabled for testing - always fetch fresh
        // if (productListCache.data && productListCache.data.expiresAt > Date.now()) {
        //     logger.info('Returning cached product list');
        //     return productListCache.data.data;
        // }

        logger.info(`Fetching product list from Vademecum API (max ${MAX_PAGES_INITIAL} pages, cache bypassed)`);
        const allProducts: VademecumProduct[] = [];
        let page = 1;
        const perPage = 100;
        let hasMore = true;

        while (hasMore && page <= MAX_PAGES_INITIAL) {
            let retries = PAGE_RETRY_COUNT;
            let success = false;
            
            while (retries > 0 && !success) {
                try {
                    logger.debug(`Requesting page ${page}/${MAX_PAGES_INITIAL} (attempt ${PAGE_RETRY_COUNT - retries + 1}/${PAGE_RETRY_COUNT})`);
                    const response = await apiClient.get<VademecumApiResponse>('/products', {
                        params: { page, 'per-page': perPage }
                    });

                    logger.debug(`API Response status: ${response.status}, data keys: ${Object.keys(response.data || {}).join(', ')}`);
                    
                    // Extract products from response
                    let products: VademecumProduct[] = [];
                    if (Array.isArray(response.data.data as any)) {
                        // Each item in data array has a "product" field
                        products = response.data.data.map((item: any) => ({
                            id: item.product?.id,
                            name: item.product?.name
                        })).filter((p: any) => p.id && p.name);
                    } else if (Array.isArray(response.data.product)) {
                        products = response.data.product;
                    }
                    
                    allProducts.push(...products);
                    success = true;

                    logger.info(`✓ Page ${page}/${MAX_PAGES_INITIAL}: ${products.length} products (total: ${allProducts.length})`);

                    // If we got fewer products than requested, we've reached the end
                    if (products.length < perPage) {
                        hasMore = false;
                        logger.info('Reached last page (fewer products than requested)');
                    }
                    
                } catch (error: any) {
                    if (error.response?.status === 404 || error.response?.status === 400) {
                        // No more pages
                        hasMore = false;
                        success = true;
                        logger.info('Reached last page (404/400 response)');
                    } else if (error.response?.status === 502 && retries > 1) {
                        // 502 Bad Gateway - retry with exponential backoff
                        const backoffMs = RETRY_BACKOFF_BASE * (PAGE_RETRY_COUNT - retries + 1);
                        logger.warn(`⚠️ 502 error on page ${page}, retrying in ${backoffMs}ms... (${retries-1} retries left)`);
                        await sleep(backoffMs);
                        retries--;
                    } else {
                        // Other error or out of retries
                        logger.error(`❌ Failed to fetch page ${page} after ${PAGE_RETRY_COUNT - retries + 1} attempts`);
                        throw error;
                    }
                }
            }
            
            if (!success) {
                logger.error(`Stopping sync at page ${page} due to repeated failures`);
                break;
            }
            
            // Move to next page
            page++;
            
            // Add delay between pages to avoid rate limiting
            if (page <= MAX_PAGES_INITIAL && hasMore) {
                await sleep(PAGE_REQUEST_DELAY);
            }
        }
        
        if (page > MAX_PAGES_INITIAL) {
            logger.info(`Stopped at page limit (${MAX_PAGES_INITIAL}). Total products: ${allProducts.length}`);
        }

        logger.info(`Total products fetched: ${allProducts.length}`);

        // Cache the result
        productListCache.data = {
            data: allProducts,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_TTL_PRODUCT_LIST
        };

        return allProducts;
    } catch (error: any) {
        const errorDetails = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        };
        logger.error('Error fetching products from Vademecum:', JSON.stringify(errorDetails));
        throw new Error(`Failed to fetch products: ${error.message} (Status: ${error.response?.status || 'N/A'})`);
    }
};

/**
 * Fetch product card details for a specific product
 */
export const fetchProductCard = async (productId: number): Promise<VademecumProductCard | null> => {
    try {
        // Check cache first
        const cached = productCardCache.get(productId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        logger.info(`Fetching product card for ID: ${productId}`);
        const response = await apiClient.get<VademecumProductCardResponse>(`/custom-product-card/${productId}`);
        
        // Check if data is empty array (product not found or no data)
        if (!response.data.success || Array.isArray(response.data.data) || !response.data.data) {
            logger.warn(`Product card not found or empty for ID: ${productId}`);
            return null;
        }
        
        const cardData = response.data.data;

        // Cache the result
        productCardCache.set(productId, {
            data: cardData,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_TTL_PRODUCT_CARD
        });

        return cardData;
    } catch (error: any) {
        if (error.response?.status === 404) {
            logger.warn(`Product card not found for ID: ${productId}`);
            return null;
        }
        logger.error(`Error fetching product card ${productId}:`, error.message);
        return null; // Don't throw, just return null to continue processing
    }
};

/**
 * Sleep utility for batch processing
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sync all products to database
 */
export const syncProductsToDatabase = async (): Promise<SyncResult> => {
    const stats = {
        total: 0,
        synced: 0,
        failed: 0,
        skipped: 0
    };
    const errors: string[] = [];
    const brandCounts = new Map<string, number>();

    try {
        logger.info('Starting Vademecum product sync...');

        // Fetch all products
        const products = await fetchAllProducts();
        stats.total = products.length;

        // Process in batches
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const batch = products.slice(i, i + BATCH_SIZE);
            logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)}`);

            // Process each product in the batch
            const batchPromises = batch.map(async (product) => {
                try {
                    // Fetch detailed card
                    const cardData = await fetchProductCard(product.id);
                    if (!cardData) {
                        stats.skipped++;
                        return;
                    }

                    // TEMPORARY: Filter by brand (only Protein Ocean, Velavit, Solgar)
                    if (cardData.card.licenseeCompany?.name) {
                        const brandName = cardData.card.licenseeCompany.name.toLowerCase();
                        const isAllowedBrand = ALLOWED_BRANDS.some(brand => 
                            brandName.includes(brand)
                        );
                        
                        if (!isAllowedBrand) {
                            logger.debug(`Skipping product ${product.id} - Brand not in allowed list: ${cardData.card.licenseeCompany.name}`);
                            stats.skipped++;
                            return;
                        }
                        
                        // Track which allowed brand this belongs to
                        ALLOWED_BRANDS.forEach(brand => {
                            if (brandName.includes(brand)) {
                                brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
                            }
                        });
                    } else {
                        // No brand info, skip
                        logger.debug(`Skipping product ${product.id} - No brand information`);
                        stats.skipped++;
                        return;
                    }

                    // Filter: Only sync supplements/nutrition products, skip prescription drugs
                    const drugTypeName = cardData.card.drugType?.name?.toLowerCase() || '';
                    const prescriptionType = cardData.card.prescriptionType?.name?.toLowerCase() || '';
                    
                    // Skip if it's a prescription drug
                    if (prescriptionType && prescriptionType !== 'beyaz reçete' && prescriptionType !== 'reçetesiz') {
                        logger.debug(`Skipping prescription drug: ${product.name}`);
                        stats.skipped++;
                        return;
                    }

                    // Only include supplements and nutritional products
                    const isSupplementCategory = 
                        drugTypeName.includes('besin') || 
                        drugTypeName.includes('takviye') ||
                        drugTypeName.includes('vitamin') ||
                        drugTypeName.includes('mineral') ||
                        drugTypeName === 'gbtü' || // Geleneksel Bitkisel Tıbbi Ürün
                        drugTypeName === 'otc';

                    if (!isSupplementCategory) {
                        logger.debug(`Skipping non-supplement: ${product.name} (type: ${drugTypeName})`);
                        stats.skipped++;
                        return;
                    }

                    // Map to Supplement model
                    const supplementData = mapProductCardToSupplement(cardData);

                    // Upsert (update if exists, insert if not)
                    await Supplement.findOneAndUpdate(
                        { sourceId: String(product.id), sourceType: 'vademecum' },
                        supplementData,
                        { upsert: true, new: true }
                    );

                    stats.synced++;
                    logger.debug(`Synced: ${product.name}`);
                } catch (error: any) {
                    stats.failed++;
                    const errorMsg = `Failed to sync ${product.name}: ${error.message}`;
                    errors.push(errorMsg);
                    logger.error(errorMsg);
                }
            });

            await Promise.all(batchPromises);

            // Pause between batches to avoid rate limiting
            if (i + BATCH_SIZE < products.length) {
                await sleep(BATCH_DELAY);
            }
        }

        // Log brand statistics
        const brandStats = {
            'protein ocean': brandCounts.get('protein ocean') || 0,
            'velavit': brandCounts.get('velavit') || 0,
            'solgar': brandCounts.get('solgar') || 0
        };
        
        logger.info('Sync completed', { stats, brandStats });

        return {
            success: true,
            message: `Sync completed. ${stats.synced}/${stats.total} products synced.`,
            stats,
            brandCounts: brandStats,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error: any) {
        logger.error('Sync failed:', error.message);
        return {
            success: false,
            message: `Sync failed: ${error.message}`,
            stats,
            errors: [error.message]
        };
    }
};

// ============================================
// 2. Data Transformation
// ============================================

/**
 * Map Vademecum product card to Supplement model
 */
export const mapProductCardToSupplement = (cardData: VademecumProductCard): any => {
    const { product, card } = cardData;

    // Extract ingredients
    const ingredients = (card.ingredients || []).map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit?.name || '',
        dailyValue: undefined,
        source: undefined
    }));

    // Get price (now a single object, not array)
    const priceData = card.price;

    // Extract form from drug type
    const drugTypeName = card.drugType?.name?.toLowerCase() || '';
    let form = 'other';
    if (drugTypeName.includes('tablet')) form = 'tablet';
    else if (drugTypeName.includes('kapsül')) form = 'capsule';
    else if (drugTypeName.includes('şurup') || drugTypeName.includes('süspansiyon')) form = 'liquid';
    else if (drugTypeName.includes('toz')) form = 'powder';
    else if (drugTypeName.includes('krem')) form = 'cream';

    // Extract category from indication
    const category: string[] = [];
    const indication = card.indication?.toLowerCase() || '';
    if (indication.includes('vitamin')) category.push('vitamin');
    if (indication.includes('mineral')) category.push('mineral');
    if (indication.includes('protein')) category.push('protein');
    if (indication.includes('enerji')) category.push('enerji');
    if (indication.includes('bağışıklık')) category.push('bağışıklık');
    if (indication.includes('ağrı')) category.push('ağrı kesici');
    if (indication.includes('ateş')) category.push('ateş düşürücü');

    return {
        _id: new mongoose.Types.ObjectId(),
        name: product.name,
        brand: card.licenseeCompany?.name || 'Unknown',
        form: form,
        ingredients: ingredients,
        usage: {
            recommendedDosage: undefined,
            frequency: undefined,
            timing: undefined,
            duration: undefined
        },
        scientificData: undefined,
        medicalInfo: {
            description: card.indication || '',
            approvedUses: card.indication ? [card.indication] : [],
            sideEffects: [],
            interactions: [],
            contraindications: [],
            warnings: []
        },
        rating: 0,
        reviewCount: 0,
        category: category,
        sourceType: 'vademecum',
        sourceId: String(product.id),
        lastSynced: new Date(),
        price: priceData?.retail,
        currency: priceData?.currencyCode || 'TRY',
        imageUrl: card.image && card.image.length > 0 ? card.image[0].url : undefined,
        manufacturer: card.licenseeCompany?.officialname || card.licenseeCompany?.name,
        availability: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
};

// ============================================
// 3. Matching & Filtering
// ============================================

/**
 * Normalize Turkish characters for better matching
 */
const normalizeTurkish = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'c')
        .trim();
};

/**
 * Score a product against a specific goal
 */
export const scoreProductForGoal = (supplement: any, goal: string): { score: number; reason: string } => {
    const normalizedGoal = normalizeTurkish(goal);
    let score = 0;
    const reasons: string[] = [];

    // Check indication (most important - 50 points)
    const indication = normalizeTurkish(supplement.medicalInfo?.description || '');
    if (indication.includes(normalizedGoal)) {
        score += 50;
        reasons.push('Kullanım amacı hedefle uyumlu');
    } else {
        // Check for partial matches
        const goalWords = normalizedGoal.split(' ').filter(w => w.length > 3);
        const matchingWords = goalWords.filter(word => indication.includes(word));
        if (matchingWords.length > 0) {
            score += 25;
            reasons.push('Kullanım amacı kısmen uyumlu');
        }
    }

    // Check product name (30 points)
    const productName = normalizeTurkish(supplement.name);
    if (productName.includes(normalizedGoal)) {
        score += 30;
        reasons.push('Ürün adı hedefle eşleşiyor');
    } else {
        const goalWords = normalizedGoal.split(' ').filter(w => w.length > 3);
        const matchingWords = goalWords.filter(word => productName.includes(word));
        if (matchingWords.length > 0) {
            score += 15;
            reasons.push('Ürün adı kısmen eşleşiyor');
        }
    }

    // Check ingredients (20 points)
    if (supplement.ingredients && supplement.ingredients.length > 0) {
        const ingredientMatches = supplement.ingredients.filter((ing: any) => {
            const ingName = normalizeTurkish(ing.name);
            return ingName.includes(normalizedGoal) || normalizedGoal.includes(ingName);
        });
        
        if (ingredientMatches.length > 0) {
            score += 20;
            reasons.push(`İçerik hedefle uyumlu (${ingredientMatches[0].name})`);
        }
    }

    // Check category (10 points bonus)
    if (supplement.category && supplement.category.length > 0) {
        const categoryMatch = supplement.category.some((cat: string) => 
            normalizeTurkish(cat).includes(normalizedGoal) || normalizedGoal.includes(normalizeTurkish(cat))
        );
        if (categoryMatch) {
            score += 10;
        }
    }

    return {
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : 'Genel uyum'
    };
};

/**
 * Match products to user goals
 */
export const matchProductsToGoals = async (goals: string[]): Promise<ProductMatchResult[]> => {
    try {
        // Get all active supplements from database
        const supplements = await Supplement.find({ 
            isActive: true,
            sourceType: 'vademecum'
        }).lean();

        logger.info(`Matching ${supplements.length} products against ${goals.length} goals`);

        // Score each product against all goals
        const scoredProducts = supplements.map(supplement => {
            let maxScore = 0;
            let maxReason = '';

            // Calculate score for each goal and keep the highest
            goals.forEach(goal => {
                const { score, reason } = scoreProductForGoal(supplement, goal);
                if (score > maxScore) {
                    maxScore = score;
                    maxReason = reason;
                }
            });

            return {
                supplement,
                score: maxScore,
                reason: maxReason
            };
        });

        // Filter products with score > 0 and sort by score
        const matchedProducts = scoredProducts
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Top 20 matches

        // Map to result format
        const results: ProductMatchResult[] = matchedProducts.map(p => ({
            id: p.supplement._id.toString(),
            vademecumId: parseInt(p.supplement.sourceId || '0'),
            name: p.supplement.name,
            imageUrl: p.supplement.imageUrl,
            price: p.supplement.price,
            currency: p.supplement.currency,
            manufacturer: p.supplement.manufacturer,
            matchScore: p.score,
            matchReason: p.reason,
            category: p.supplement.category || [],
            form: p.supplement.form,
            ingredients: p.supplement.ingredients?.map((ing: any) => ({
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit
            })),
            indication: p.supplement.medicalInfo?.description
        }));

        logger.info(`Found ${results.length} matching products`);
        return results;
    } catch (error: any) {
        logger.error('Error matching products:', error.message);
        throw new Error(`Failed to match products: ${error.message}`);
    }
};

/**
 * Get recommended products for a specific user
 */
export const getRecommendedProducts = async (userId: string): Promise<RecommendationResponse> => {
    try {
        // Get user's form data
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.formData || !user.isFormFilled) {
            throw new Error('User has not filled the health profile form');
        }

        // Extract supplement goals
        const goals = (user.formData as any).supplementGoals || [];
        if (goals.length === 0) {
            logger.warn(`User ${userId} has no supplement goals`);
            return {
                recommendations: [],
                totalMatches: 0,
                userGoals: []
            };
        }

        logger.info(`Getting recommendations for user ${userId} with goals:`, goals);

        // Match products to goals
        const matches = await matchProductsToGoals(goals);

        return {
            recommendations: matches.slice(0, 10), // Top 10 for user
            totalMatches: matches.length,
            userGoals: goals
        };
    } catch (error: any) {
        logger.error('Error getting recommendations:', error.message);
        throw error;
    }
};

// ============================================
// 4. Cache Management
// ============================================

export const clearCache = () => {
    productCardCache.clear();
    productListCache.data = null;
    logger.info('Cache cleared');
};

export const getCacheStats = () => {
    return {
        productCards: productCardCache.size,
        productList: productListCache.data ? 'cached' : 'empty'
    };
};

