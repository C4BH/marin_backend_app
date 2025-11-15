import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeightAndHeightService, healthProfileService } from '../../services/form';
import User from '../../models/user';
import FormResponse from '../../models/form';

// Mock models
vi.mock('../../models/user');
vi.mock('../../services/vademecum', () => ({
    getRecommendedProducts: vi.fn().mockResolvedValue({ totalMatches: 0 })
}));
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Use a global object to capture savedFormData (works with hoisting)
// Create object in a way that avoids TDZ issues
const mockState: { savedFormData: any; mockInstance: any } = {} as any;
mockState.savedFormData = undefined;
mockState.mockInstance = undefined;

vi.mock('../../models/form', () => {
    // Use closure to access mockState
    return {
        default: vi.fn().mockImplementation((data: any) => {
            // Capture data using module-scoped object
            // Access mockState through closure
            (globalThis as any).__formMockState = (globalThis as any).__formMockState || { savedFormData: undefined, mockInstance: undefined };
            (globalThis as any).__formMockState.savedFormData = data;
            (globalThis as any).__formMockState.mockInstance = {
                ...data,
                save: vi.fn().mockResolvedValue(true)
            };
            return (globalThis as any).__formMockState.mockInstance;
        })
    };
});

// Expose for tests - access through globalThis
const savedFormData = () => (globalThis as any).__formMockState?.savedFormData;
const mockFormResponseInstance = () => (globalThis as any).__formMockState?.mockInstance;

describe('Form Service', () => {
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset savedFormData for each test
        (globalThis as any).__formMockState = { savedFormData: undefined, mockInstance: undefined };
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        };
    });

    describe('WeightAndHeightService', () => {
        it('should update weight and height successfully', async () => {
            const userId = 'user123';
            const weight = 75.5;
            const height = 180;

            const mockUser = {
                _id: userId,
                weight: 70,
                height: 175
            };

            const updatedMockUser = {
                _id: userId,
                weight: weight,
                height: height
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedMockUser as any);

            const result = await WeightAndHeightService(userId, weight, height);

            expect(result.isSuccess).toBe(true);
            expect(result.message).toBe('Ağırlık ve boy değerleri başarıyla güncellendi');
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                { $set: { weight: 75.5, height: 180 } },
                { new: true, runValidators: true }
            );
        });

        it('should update only weight when height is undefined', async () => {
            const userId = 'user123';
            const weight = 75.5;

            const mockUser = {
                _id: userId,
                weight: 70,
                height: 175
            };

            const updatedMockUser = {
                _id: userId,
                weight: weight,
                height: 175
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedMockUser as any);

            const result = await WeightAndHeightService(userId, weight, undefined as any);

            expect(result.isSuccess).toBe(true);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                { $set: { weight: 75.5 } },
                { new: true, runValidators: true }
            );
        });

        it('should update only height when weight is undefined', async () => {
            const userId = 'user123';
            const height = 180;

            const mockUser = {
                _id: userId,
                weight: 70,
                height: 175
            };

            const updatedMockUser = {
                _id: userId,
                weight: 70,
                height: height
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedMockUser as any);

            const result = await WeightAndHeightService(userId, undefined as any, height);

            expect(result.isSuccess).toBe(true);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                { $set: { height: 180 } },
                { new: true, runValidators: true }
            );
        });

        it('should return error when both weight and height are undefined', async () => {
            const userId = 'user123';

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            const result = await WeightAndHeightService(userId, undefined as any, undefined as any);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Ağırlık veya boy değeri sağlanmalıdır');
            expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should return error when user not found in findById', async () => {
            const userId = 'nonexistent';
            const weight = 75;
            const height = 180;

            vi.mocked(User.findById).mockResolvedValue(null);

            const result = await WeightAndHeightService(userId, weight, height);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
        });

        it('should return error when user not found in findByIdAndUpdate', async () => {
            const userId = 'user123';
            const weight = 75;
            const height = 180;

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(null);

            const result = await WeightAndHeightService(userId, weight, height);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
        });

        it('should convert weight and height to numbers', async () => {
            const userId = 'user123';
            const weight = '75.5' as any;
            const height = '180' as any;

            const mockUser = {
                _id: userId
            };

            const updatedMockUser = {
                _id: userId,
                weight: 75.5,
                height: 180
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedMockUser as any);

            await WeightAndHeightService(userId, weight, height);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                { $set: { weight: 75.5, height: 180 } },
                { new: true, runValidators: true }
            );
        });

        it('should handle database errors', async () => {
            const userId = 'user123';
            const weight = 75;
            const height = 180;

            const error = new Error('Database error');
            vi.mocked(User.findById).mockRejectedValue(error);

            const result = await WeightAndHeightService(userId, weight, height);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Bir hata oluştu');
            expect(result.error).toBe('Database error');
            expect(consoleSpy.error).toHaveBeenCalledWith('Bir hata oluştu:', error);
        });

        it('should log updated user on success', async () => {
            const userId = 'user123';
            const weight = 75;
            const height = 180;

            const mockUser = {
                _id: userId
            };

            const updatedMockUser = {
                _id: userId,
                weight: weight,
                height: height
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedMockUser as any);

            await WeightAndHeightService(userId, weight, height);

            expect(consoleSpy.log).toHaveBeenCalledWith('updatedUser:', updatedMockUser);
        });
    });

    describe('healthProfileService', () => {
        it('should save health profile successfully', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                occupation: 'Engineer',
                height: 180,
                weight: 75,
                gender: 'male',
                exerciseRegularly: true,
                alcoholSmoking: 'never',
                dietTypes: ['vegetarian'],
                allergies: ['peanuts'],
                abnormalBloodTests: [],
                chronicConditions: [],
                medications: [],
                supplementGoals: ['energy', 'immunity'],
                additionalNotes: 'No additional notes'
            };

            const mockUser = {
                _id: userId,
                email: 'test@example.com'
            };

            const mockFormResponse = {
                userId: userId,
                formData: healthData,
                answeredAt: expect.any(Date),
                save: vi.fn().mockResolvedValue(true)
            };

            const updatedUser = {
                _id: userId,
                formData: healthData,
                isFormFilled: true
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(result.message).toBe('Sağlık profili başarıyla kaydedildi');
            expect(User.findById).toHaveBeenCalledWith(userId);
            // FormResponse save is called, check that it was called
            expect(savedFormData()).toMatchObject({
                userId: userId,
                formData: expect.objectContaining({
                    age: 30,
                    occupation: 'Engineer'
                })
            });
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                {
                    $set: {
                        formData: expect.objectContaining({
                            age: 30,
                            occupation: 'Engineer',
                            gender: 'male'
                        }),
                        isFormFilled: true
                    }
                },
                { new: true }
            );
        });

        it('should return error when user not found', async () => {
            const userId = 'nonexistent';
            const healthData = {
                age: 30,
                gender: 'male'
            };

            vi.mocked(User.findById).mockResolvedValue(null);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
        });

        it('should return error when user update fails', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(null);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(false);
            // Service returns "Kullanıcı bulunamadı" when updatedUser is null
            expect(result.message).toBe('Kullanıcı bulunamadı');
        });

        it('should handle database errors', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30
            };

            const error = new Error('Database error');
            vi.mocked(User.findById).mockRejectedValue(error);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('healthProfileService hatası');
            expect(result.error).toBe('Database error');
            expect(consoleSpy.error).toHaveBeenCalledWith('healthProfileService hatası:', error);
        });

        it('should log incoming data', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                gender: 'male'
            };

            const mockUser = {
                _id: userId
            };

            const mockFormResponse = {
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            await healthProfileService(userId, healthData);

            expect(consoleSpy.log).toHaveBeenCalledWith('gelen data:', healthData);
        });

        it('should handle partial health data', async () => {
            const userId = 'user123';
            const partialData = {
                age: 30,
                gender: 'female'
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, partialData);

            expect(result.isSuccess).toBe(true);
        });

        it('should create form response with correct structure', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                occupation: 'Developer',
                allergies: ['peanuts', 'shellfish']
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            await healthProfileService(userId, healthData);

            expect(savedFormData()).toMatchObject({
                userId: userId,
                formData: expect.objectContaining({
                    age: 30,
                    occupation: 'Developer',
                    allergies: ['peanuts', 'shellfish']
                }),
                answeredAt: expect.any(Date)
            });
        });

        it('should handle very long text inputs', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                additionalNotes: 'A'.repeat(10000) // Very long notes
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(savedFormData()?.formData.additionalNotes).toBe('A'.repeat(10000));
        });

        it('should handle array fields with many items', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                allergies: Array(100).fill('allergy').map((a, i) => `${a}-${i}`),
                medications: Array(50).fill('medication').map((m, i) => `${m}-${i}`)
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(savedFormData()?.formData.allergies).toHaveLength(100);
            expect(savedFormData()?.formData.medications).toHaveLength(50);
        });

        it('should handle empty arrays', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                allergies: [],
                medications: [],
                chronicConditions: []
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(savedFormData()?.formData.allergies).toEqual([]);
        });

        it('should handle null values in optional fields', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                occupation: null,
                height: null,
                weight: null
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
        });

        it('should handle special characters in text fields', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30,
                occupation: "O'Brien & Müller",
                additionalNotes: 'Special chars: @#$%^&*()'
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(savedFormData()?.formData.occupation).toBe("O'Brien & Müller");
        });

        it('should handle getRecommendedProducts error gracefully', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);
            
            // Mock getRecommendedProducts to throw error
            const vademecumService = require('../../services/vademecum');
            vi.spyOn(vademecumService, 'getRecommendedProducts').mockRejectedValue(new Error('Recommendation error'));

            const result = await healthProfileService(userId, healthData);

            // Should still succeed even if recommendations fail
            expect(result.isSuccess).toBe(true);
        });

        it('should handle FormResponse save errors', async () => {
            const userId = 'user123';
            const healthData = {
                age: 30
            };

            const mockUser = {
                _id: userId
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            
            // Mock FormResponse to throw error on save
            const FormResponse = require('../../models/form').default;
            const mockInstance = {
                save: vi.fn().mockRejectedValue(new Error('Save error'))
            };
            vi.mocked(FormResponse).mockImplementation(() => mockInstance);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toContain('hatası');
        });
    });
});
