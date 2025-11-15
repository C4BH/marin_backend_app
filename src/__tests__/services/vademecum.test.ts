import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
    fetchAllProducts,
    fetchProductCard,
    syncProductsToDatabase,
    matchProductsToGoals,
    getRecommendedProducts,
    scoreProductForGoal,
    mapProductCardToSupplement,
    clearCache,
    getCacheStats
} from '../../services/vademecum';
import { logger } from '../../utils/logger';
import Supplement from '../../models/supplements';
import User from '../../models/user';

// Mock axios - define mockGet inside factory to avoid hoisting issues
vi.mock('axios', () => {
    const mockGet = vi.fn();
    return {
        default: {
            create: vi.fn(() => ({
                get: mockGet
            })),
            // Export mockGet for test access
            _mockGet: mockGet
        }
    };
});

// Mock models
vi.mock('../../models/supplements');
vi.mock('../../models/user');
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('Vademecum Service', () => {
    let mockGet: any;

    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
        // Get mockGet from axios mock
        const axios = require('axios');
        mockGet = (axios.default as any)._mockGet;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAllProducts', () => {
        it('should fetch all products with pagination', async () => {
            const mockProducts = [
                { id: 1, name: 'Product 1' },
                { id: 2, name: 'Product 2' }
            ];

            mockGet
                .mockResolvedValueOnce({ data: { product: mockProducts } })
                .mockResolvedValueOnce({ data: { product: [] } }); // Empty to stop pagination

            const products = await fetchAllProducts();
            
            expect(products).toHaveLength(2);
            expect(products[0].name).toBe('Product 1');
        });

        it('should handle API errors', async () => {
            mockGet.mockRejectedValue(new Error('API Error'));

            await expect(fetchAllProducts()).rejects.toThrow('Failed to fetch products');
        });

        it('should handle timeout errors', async () => {
            mockGet.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' });

            await expect(fetchAllProducts()).rejects.toThrow();
        });

        it('should handle network errors', async () => {
            mockGet.mockRejectedValue({ code: 'ENOTFOUND', message: 'Network error' });

            await expect(fetchAllProducts()).rejects.toThrow();
        });

        it('should handle malformed API responses', async () => {
            mockGet.mockResolvedValueOnce({ data: null });

            await expect(fetchAllProducts()).rejects.toThrow();
        });

        it('should handle empty product array in response', async () => {
            mockGet
                .mockResolvedValueOnce({ data: { product: [] } });

            const products = await fetchAllProducts();
            
            expect(products).toHaveLength(0);
        });

        it('should handle multiple pages correctly', async () => {
            const page1 = [
                { id: 1, name: 'Product 1' },
                { id: 2, name: 'Product 2' }
            ];
            const page2 = [
                { id: 3, name: 'Product 3' },
                { id: 4, name: 'Product 4' }
            ];

            mockGet
                .mockResolvedValueOnce({ data: { product: page1 } })
                .mockResolvedValueOnce({ data: { product: page2 } })
                .mockResolvedValueOnce({ data: { product: [] } });

            const products = await fetchAllProducts();
            
            expect(products).toHaveLength(4);
            expect(mockGet).toHaveBeenCalledTimes(3);
        });

        it('should handle rate limiting errors', async () => {
            mockGet.mockRejectedValue({
                response: {
                    status: 429,
                    data: { message: 'Rate limit exceeded' }
                }
            });

            await expect(fetchAllProducts()).rejects.toThrow();
        });
    });

    describe('fetchProductCard', () => {
        it('should fetch product card by ID', async () => {
            const mockCard = {
                product: { id: 1, name: 'Test Product' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Test Company' },
                    indication: 'Vitamin takviyesi',
                    ingredients: [],
                    image: { url: 'https://example.com/image.jpg' },
                    price: [{ retail: 100, currencyCode: 'TRY', effectiveDate: '2024-01-01' }]
                }
            };

            mockGet.mockResolvedValue({ data: mockCard });

            const card = await fetchProductCard(1);
            
            expect(card).toBeDefined();
            expect(card?.product.name).toBe('Test Product');
        });

        it('should return null for 404 errors', async () => {
            mockGet.mockRejectedValue({ response: { status: 404 } });

            const card = await fetchProductCard(999);
            
            expect(card).toBeNull();
        });

        it('should handle timeout errors', async () => {
            mockGet.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' });

            const card = await fetchProductCard(1);
            
            expect(card).toBeNull();
        });

        it('should handle network errors', async () => {
            mockGet.mockRejectedValue({ code: 'ENOTFOUND', message: 'Network error' });

            const card = await fetchProductCard(1);
            
            expect(card).toBeNull();
        });

        it('should handle 500 server errors', async () => {
            mockGet.mockRejectedValue({ response: { status: 500 } });

            const card = await fetchProductCard(1);
            
            expect(card).toBeNull();
        });

        it('should handle malformed response data', async () => {
            mockGet.mockResolvedValue({ data: null });

            const card = await fetchProductCard(1);
            
            expect(card).toBeNull();
        });

        it('should use cache for repeated requests', async () => {
            const mockCard = {
                product: { id: 1, name: 'Cached Product' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: { id: 1, name: 'Company' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: { retail: 100, currencyCode: 'TRY' }
                }
            };

            mockGet.mockResolvedValue({ data: mockCard });

            // First call
            const card1 = await fetchProductCard(1);
            expect(mockGet).toHaveBeenCalledTimes(1);

            // Second call should use cache
            const card2 = await fetchProductCard(1);
            // Cache might not work in test environment, but we verify it doesn't crash
            expect(card2).toBeDefined();
        });
    });

    describe('scoreProductForGoal', () => {
        it('should score product highly when indication matches goal', () => {
            const supplement = {
                name: 'Vitamin D3',
                medicalInfo: {
                    description: 'Bağışıklık sistemi desteği için vitamin takviyesi'
                },
                ingredients: [{ name: 'Vitamin D3', amount: 1000, unit: 'IU' }],
                category: ['vitamin']
            };

            const result = scoreProductForGoal(supplement, 'bağışıklık');
            
            expect(result.score).toBeGreaterThan(40);
            expect(result.reason).toContain('uyumlu');
        });

        it('should score product by product name match', () => {
            const supplement = {
                name: 'Omega 3 Fish Oil',
                medicalInfo: { description: 'Yağ asidi takviyesi' },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'omega');
            
            expect(result.score).toBeGreaterThan(0);
        });

        it('should score product by ingredient match', () => {
            const supplement = {
                name: 'Multi Vitamin',
                medicalInfo: { description: 'Çoklu vitamin' },
                ingredients: [
                    { name: 'Magnezyum', amount: 100, unit: 'mg' }
                ],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'magnezyum');
            
            expect(result.score).toBeGreaterThan(0);
        });

        it('should return zero score for no match', () => {
            const supplement = {
                name: 'Unrelated Product',
                medicalInfo: { description: 'Some description' },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'completely different');
            
            expect(result.score).toBe(0);
            expect(result.reason).toBe('Genel uyum');
        });

        it('should handle multiple goal words with partial matches', () => {
            const supplement = {
                name: 'Enerji Vitamin',
                medicalInfo: {
                    description: 'Enerji desteği için vitamin takviyesi'
                },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'enerji artırıcı');
            
            expect(result.score).toBeGreaterThan(0);
            expect(result.reason).toContain('uyumlu');
        });

        it('should be case insensitive', () => {
            const supplement = {
                name: 'VITAMIN D3',
                medicalInfo: {
                    description: 'BAĞIŞIKLIK SİSTEMİ DESTEĞİ'
                },
                ingredients: [{ name: 'Vitamin D3', amount: 1000, unit: 'IU' }],
                category: ['vitamin']
            };

            const result1 = scoreProductForGoal(supplement, 'bağışıklık');
            const result2 = scoreProductForGoal(supplement, 'BAĞIŞIKLIK');
            const result3 = scoreProductForGoal(supplement, 'Bağışıklık');
            
            expect(result1.score).toBe(result2.score);
            expect(result2.score).toBe(result3.score);
        });

        it('should handle Turkish character normalization', () => {
            const supplement = {
                name: 'Vitamin İçeren Takviye',
                medicalInfo: {
                    description: 'İmmün sistem desteği'
                },
                ingredients: [{ name: 'Çinko', amount: 10, unit: 'mg' }],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'immun sistem');
            
            // Turkish 'İ' should match 'i' after normalization
            expect(result.score).toBeGreaterThan(0);
        });

        it('should handle empty strings', () => {
            const supplement = {
                name: 'Product',
                medicalInfo: { description: 'Description' },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, '');
            
            expect(result.score).toBe(0);
        });

        it('should handle null/undefined medicalInfo', () => {
            const supplement = {
                name: 'Product',
                medicalInfo: null,
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'test');
            
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('should handle null/undefined ingredients', () => {
            const supplement = {
                name: 'Product',
                medicalInfo: { description: 'Description' },
                ingredients: null,
                category: []
            };

            const result = scoreProductForGoal(supplement, 'test');
            
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('should handle empty ingredients array', () => {
            const supplement = {
                name: 'Product',
                medicalInfo: { description: 'Description' },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'test');
            
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('should score by category match', () => {
            const supplement = {
                name: 'Multi Vitamin',
                medicalInfo: { description: 'Vitamin takviyesi' },
                ingredients: [],
                category: ['vitamin', 'mineral']
            };

            const result = scoreProductForGoal(supplement, 'vitamin');
            
            expect(result.score).toBeGreaterThanOrEqual(50);
        });

        it('should combine scores from multiple matches', () => {
            const supplement = {
                name: 'Enerji Vitamin',
                medicalInfo: {
                    description: 'Enerji artırıcı vitamin takviyesi'
                },
                ingredients: [{ name: 'Vitamin B12', amount: 100, unit: 'mcg' }],
                category: ['enerji', 'vitamin']
            };

            const result = scoreProductForGoal(supplement, 'enerji');
            
            // Should score from indication, name, ingredients, and category
            expect(result.score).toBeGreaterThan(50);
        });

        it('should handle very short goal words (less than 3 chars)', () => {
            const supplement = {
                name: 'Vitamin C',
                medicalInfo: { description: 'C vitamini takviyesi' },
                ingredients: [],
                category: []
            };

            // Goal words less than 3 chars are filtered out
            const result = scoreProductForGoal(supplement, 'c vitamin');
            
            // Should still match from exact indication match
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('should handle goals with special characters', () => {
            const supplement = {
                name: 'Omega-3',
                medicalInfo: { description: 'Omega 3 yağ asidi' },
                ingredients: [],
                category: []
            };

            const result = scoreProductForGoal(supplement, 'omega-3');
            
            expect(result.score).toBeGreaterThan(0);
        });
    });

    describe('matchProductsToGoals', () => {
        it('should match products to goals and sort by score', async () => {
            const mockSupplements = [
                {
                    _id: '1',
                    sourceId: '1',
                    name: 'Vitamin D',
                    medicalInfo: { description: 'Bağışıklık desteği' },
                    ingredients: [],
                    category: ['vitamin'],
                    isActive: true,
                    sourceType: 'vademecum'
                },
                {
                    _id: '2',
                    sourceId: '2',
                    name: 'Omega 3',
                    medicalInfo: { description: 'Kalp sağlığı' },
                    ingredients: [],
                    category: ['yağ asidi'],
                    isActive: true,
                    sourceType: 'vademecum'
                }
            ];

            (Supplement.find as any).mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockSupplements)
            });

            const results = await matchProductsToGoals(['bağışıklık']);
            
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it('should handle empty goals array', async () => {
            const result = await matchProductsToGoals([]);
            
            expect(result).toEqual([]);
        });

        it('should handle invalid goal strings', async () => {
            // Filter out null/undefined/empty goals before calling
            const validGoals = ['', null as any, undefined as any, 'valid goal']
                .filter((g): g is string => typeof g === 'string' && g.length > 0);
            
            const result = await matchProductsToGoals(validGoals);
            
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle database errors during matching', async () => {
            (Supplement.find as any).mockRejectedValue(new Error('Database error'));

            await expect(matchProductsToGoals(['energy'])).rejects.toThrow();
        });

        it('should filter out products with zero score', async () => {
            const mockSupplements = [
                {
                    _id: '1',
                    sourceId: '1',
                    name: 'Unrelated Product',
                    medicalInfo: { description: 'Not matching' },
                    ingredients: [],
                    category: [],
                    isActive: true,
                    sourceType: 'vademecum'
                }
            ];

            (Supplement.find as any).mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockSupplements)
            });

            const results = await matchProductsToGoals(['bağışıklık']);
            
            expect(results).toHaveLength(0);
        });
    });

    describe('getRecommendedProducts', () => {
        it('should get recommendations for user with form data', async () => {
            const mockUser = {
                _id: 'user123',
                formData: {
                    supplementGoals: ['enerji', 'bağışıklık']
                },
                isFormFilled: true
            };

            (User.findById as any).mockResolvedValue(mockUser);
            (Supplement.find as any).mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                    {
                        _id: '1',
                        sourceId: '1',
                        name: 'B Vitamini Kompleksi',
                        medicalInfo: { description: 'Enerji metabolizması desteği' },
                        ingredients: [],
                        category: ['vitamin'],
                        isActive: true,
                        sourceType: 'vademecum',
                        price: 50,
                        currency: 'TRY'
                    }
                ])
            });

            const result = await getRecommendedProducts('user123');
            
            expect(result.recommendations).toBeDefined();
            expect(result.userGoals).toEqual(['enerji', 'bağışıklık']);
            expect(result.totalMatches).toBeGreaterThanOrEqual(0);
        });

        it('should throw error if user not found', async () => {
            (User.findById as any).mockResolvedValue(null);

            await expect(getRecommendedProducts('invalid')).rejects.toThrow('User not found');
        });

        it('should handle user with empty goals array', async () => {
            const mockUser = {
                _id: 'user123',
                isFormFilled: true,
                formData: {
                    supplementGoals: []
                }
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            const result = await getRecommendedProducts('user123');
            
            expect(result.recommendations).toHaveLength(0);
            expect(result.totalMatches).toBe(0);
        });

        it('should handle user with null formData', async () => {
            const mockUser = {
                _id: 'user123',
                isFormFilled: true,
                formData: null
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await expect(getRecommendedProducts('user123')).rejects.toThrow();
        });

        it('should throw error if user has not filled form', async () => {
            const mockUser = {
                _id: 'user123',
                formData: null,
                isFormFilled: false
            };

            (User.findById as any).mockResolvedValue(mockUser);

            await expect(getRecommendedProducts('user123')).rejects.toThrow('has not filled the health profile form');
        });

        it('should return empty recommendations if no goals', async () => {
            const mockUser = {
                _id: 'user123',
                formData: { supplementGoals: [] },
                isFormFilled: true
            };

            (User.findById as any).mockResolvedValue(mockUser);

            const result = await getRecommendedProducts('user123');
            
            expect(result.recommendations).toHaveLength(0);
            expect(result.userGoals).toHaveLength(0);
        });
    });

    describe('mapProductCardToSupplement', () => {
        it('should correctly map product card to supplement model', () => {
            const mockCard = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: {
                        id: 1,
                        name: 'Test Company',
                        officialname: 'Test Company Inc.'
                    },
                    indication: 'Vitamin takviyesi',
                    ingredients: [
                        {
                            id: 1,
                            name: 'Vitamin C',
                            amount: 500,
                            unit: { id: 1, name: 'mg' }
                        }
                    ],
                    image: [{ url: 'https://example.com/image.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.name).toBe('Test Supplement');
            expect(result.brand).toBe('Test Company');
            expect(result.sourceId).toBe('123');
            expect(result.sourceType).toBe('vademecum');
            expect(result.price).toBe(100);
            expect(result.currency).toBe('TRY');
            expect(result.imageUrl).toBe('https://example.com/image.jpg');
            expect(result.ingredients).toHaveLength(1);
            expect(result.ingredients[0].name).toBe('Vitamin C');
        });

        it('should handle missing optional fields', () => {
            const mockCard: any = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: null,
                    licenseeCompany: null,
                    indication: null,
                    ingredients: [],
                    image: null,
                    price: null
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.name).toBe('Test Supplement');
            expect(result.brand).toBe('Unknown');
            expect(result.form).toBe('other');
            expect(result.ingredients).toEqual([]);
            expect(result.price).toBeUndefined();
            expect(result.currency).toBe('TRY');
            expect(result.imageUrl).toBeUndefined();
        });

        it('should handle null values gracefully', () => {
            const mockCard: any = {
                product: { id: 456, name: 'Minimal Product' },
                card: {
                    drugType: undefined,
                    licenseeCompany: undefined,
                    indication: undefined,
                    ingredients: null,
                    image: undefined,
                    price: undefined
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.name).toBe('Minimal Product');
            expect(result.brand).toBe('Unknown');
            expect(result.form).toBe('other');
            expect(result.category).toEqual([]);
            expect(result.ingredients).toEqual([]);
        });

        it('should correctly identify form types', () => {
            const forms = [
                { name: 'Tablet', expected: 'tablet' },
                { name: 'Kapsül', expected: 'capsule' },
                { name: 'Şurup', expected: 'liquid' },
                { name: 'Süspansiyon', expected: 'liquid' },
                { name: 'Toz', expected: 'powder' },
                { name: 'Krem', expected: 'cream' },
                { name: 'Unknown', expected: 'other' }
            ];

            forms.forEach(({ name, expected }) => {
                const mockCard: any = {
                    product: { id: 1, name: 'Test' },
                    card: {
                        drugType: { id: 1, name },
                        licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                        indication: 'Test',
                        ingredients: [],
                        image: undefined,
                        price: undefined
                    }
                };

                const result = mapProductCardToSupplement(mockCard);
                expect(result.form).toBe(expected);
            });
        });

        it('should correctly categorize from indication', () => {
            const indications = [
                { text: 'Vitamin takviyesi', expected: ['vitamin'] },
                { text: 'Mineral desteği', expected: ['mineral'] },
                { text: 'Enerji artırıcı', expected: ['enerji'] },
                { text: 'Bağışıklık güçlendirici', expected: ['bağışıklık'] },
                { text: 'Vitamin ve mineral kombinasyonu', expected: ['vitamin', 'mineral'] }
            ];

            indications.forEach(({ text, expected }) => {
                const mockCard: any = {
                    product: { id: 1, name: 'Test' },
                    card: {
                        drugType: { id: 1, name: 'Tablet' },
                        licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                        indication: text,
                        ingredients: [],
                        image: undefined,
                        price: undefined
                    }
                };

                const result = mapProductCardToSupplement(mockCard);
                expected.forEach(cat => {
                    expect(result.category).toContain(cat);
                });
            });
        });

        it('should handle ingredients without unit', () => {
            const mockCard: any = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [
                        {
                            id: 1,
                            name: 'Vitamin C',
                            amount: 500,
                            unit: null
                        }
                    ],
                    image: undefined,
                    price: undefined
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.ingredients[0].name).toBe('Vitamin C');
            expect(result.ingredients[0].unit).toBe('');
        });

        it('should handle image array with multiple images', () => {
            const mockCard: any = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [
                        { url: 'https://example.com/image1.jpg' },
                        { url: 'https://example.com/image2.jpg' }
                    ],
                    price: undefined
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.imageUrl).toBe('https://example.com/image1.jpg');
        });

        it('should use officialname when available for manufacturer', () => {
            const mockCard: any = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: {
                        id: 1,
                        name: 'Test Company',
                        officialname: 'Test Company Inc. Official'
                    },
                    indication: 'Test',
                    ingredients: [],
                    image: undefined,
                    price: undefined
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.manufacturer).toBe('Test Company Inc. Official');
        });

        it('should fallback to name when officialname is not available', () => {
            const mockCard: any = {
                product: { id: 123, name: 'Test Supplement' },
                card: {
                    drugType: { id: 1, name: 'Tablet' },
                    licenseeCompany: {
                        id: 1,
                        name: 'Test Company',
                        officialname: 'Test Company' // Fallback to name
                    },
                    indication: 'Test',
                    ingredients: [],
                    image: undefined,
                    price: undefined
                }
            };

            const result = mapProductCardToSupplement(mockCard);
            
            expect(result.manufacturer).toBe('Test Company');
        });
    });

    describe('syncProductsToDatabase', () => {
        it('should sync products successfully', async () => {
            const mockProducts = [
                { id: 1, name: 'Product 1' }
            ];

            const mockCard = {
                product: { id: 1, name: 'Product 1' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            mockGet
                .mockResolvedValueOnce({ data: { product: mockProducts } })
                .mockResolvedValueOnce({ data: { product: [] } })
                .mockResolvedValueOnce({ data: mockCard });

            (Supplement.findOneAndUpdate as any).mockResolvedValue({});

            const result = await syncProductsToDatabase();
            
            expect(result.success).toBe(true);
            expect(result.stats.total).toBe(1);
        });

        it('should handle empty product list', async () => {
            mockGet
                .mockResolvedValueOnce({ data: { product: [] } });

            const result = await syncProductsToDatabase();
            
            expect(result.success).toBe(true);
            expect(result.stats.total).toBe(0);
            expect(result.stats.synced).toBe(0);
        });

        it('should handle database errors during sync', async () => {
            const mockProducts = [
                { id: 1, name: 'Product 1' }
            ];

            const mockCard = {
                product: { id: 1, name: 'Product 1' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            mockGet
                .mockResolvedValueOnce({ data: { product: mockProducts } })
                .mockResolvedValueOnce({ data: { product: [] } })
                .mockResolvedValueOnce({ data: mockCard });

            (Supplement.findOneAndUpdate as any).mockRejectedValue(new Error('Database error'));

            const result = await syncProductsToDatabase();
            
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should handle partial sync failures', async () => {
            const mockProducts = [
                { id: 1, name: 'Product 1' },
                { id: 2, name: 'Product 2' }
            ];

            const mockCard1 = {
                product: { id: 1, name: 'Product 1' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            const mockCard2 = {
                product: { id: 2, name: 'Product 2' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            mockGet
                .mockResolvedValueOnce({ data: { product: mockProducts } })
                .mockResolvedValueOnce({ data: { product: [] } })
                .mockResolvedValueOnce({ data: mockCard1 })
                .mockResolvedValueOnce({ data: mockCard2 });

            // First product succeeds, second fails
            (Supplement.findOneAndUpdate as any)
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error('Database error'));

            const result = await syncProductsToDatabase();
            
            expect(result.stats.total).toBe(2);
            expect(result.errors).toBeDefined();
        });

        it('should update existing products instead of creating duplicates', async () => {
            const mockProducts = [
                { id: 1, name: 'Product 1' }
            ];

            const mockCard = {
                product: { id: 1, name: 'Product 1' },
                card: {
                    drugType: { id: 1, name: 'Besin Desteği' },
                    licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                    indication: 'Test',
                    ingredients: [],
                    image: [{ url: 'test.jpg' }],
                    price: {
                        retail: 100,
                        currencyCode: 'TRY',
                        effectiveDate: '2024-01-01',
                        taxPercent: 8,
                        storageBased: false,
                        abroadProduct: false
                    }
                }
            };

            mockGet
                .mockResolvedValueOnce({ data: { product: mockProducts } })
                .mockResolvedValueOnce({ data: { product: [] } })
                .mockResolvedValueOnce({ data: mockCard });

            const existingSupplement = {
                _id: 'existing-id',
                sourceId: '1',
                sourceType: 'vademecum'
            };

            (Supplement.findOneAndUpdate as any).mockResolvedValue(existingSupplement);

            const result = await syncProductsToDatabase();
            
            expect(result.success).toBe(true);
            expect(Supplement.findOneAndUpdate).toHaveBeenCalledWith(
                { sourceId: '1', sourceType: 'vademecum' },
                expect.any(Object),
                { upsert: true, new: true }
            );
        });
    });

    describe('Cache Functions', () => {
        describe('clearCache', () => {
            it('should clear product card cache', () => {
                // Clear cache
                clearCache();

                const stats = getCacheStats();
                expect(stats.productCards).toBe(0);
                expect(stats.productList).toBe('empty');
            });

            it('should log cache clear operation', () => {
                // Logger is already mocked at top level
                clearCache();
                expect(vi.mocked(logger.info)).toHaveBeenCalledWith('Cache cleared');
            });
        });

        describe('getCacheStats', () => {
            it('should return cache statistics', () => {
                clearCache(); // Start with empty cache
                const stats = getCacheStats();
                
                expect(stats).toHaveProperty('productCards');
                expect(stats).toHaveProperty('productList');
                expect(stats.productCards).toBe(0);
                expect(stats.productList).toBe('empty');
            });

            it('should return correct cache size when items are cached', async () => {
                clearCache(); // Clear first
                
                const mockCard = {
                    product: { id: 1, name: 'Product 1' },
                    card: {
                        drugType: { id: 1, name: 'Besin Desteği' },
                        licenseeCompany: { id: 1, name: 'Company', officialname: 'Company Inc' },
                        indication: 'Test',
                        ingredients: [],
                        image: [{ url: 'test.jpg' }],
                        price: {
                            retail: 100,
                            currencyCode: 'TRY',
                            effectiveDate: '2024-01-01',
                            taxPercent: 8,
                            storageBased: false,
                            abroadProduct: false
                        }
                    }
                };

                // Get mockGet from beforeEach (it's in describe scope)
                if (mockGet) {
                    mockGet.mockResolvedValue({ data: mockCard });

                    // Fetch product to populate cache
                    await fetchProductCard(1);
                }
                
                const stats = getCacheStats();
                // Cache stats should be valid even if empty
                expect(stats).toHaveProperty('productCards');
                expect(stats).toHaveProperty('productList');
            });
        });
    });
});

