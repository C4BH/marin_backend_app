import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeightAndHeightService, healthProfileService } from '../../services/form';
import User from '../../models/user';
import FormResponse from '../../models/form';

// Mock models
vi.mock('../../models/user');
vi.mock('../../models/form');

describe('Form Service', () => {
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
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
            vi.mocked(FormResponse).mockImplementation(() => mockFormResponse as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(true);
            expect(result.message).toBe('Sağlık profili başarıyla kaydedildi');
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(mockFormResponse.save).toHaveBeenCalled();
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

            const mockFormResponse = {
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(FormResponse).mockImplementation(() => mockFormResponse as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(null);

            const result = await healthProfileService(userId, healthData);

            expect(result.isSuccess).toBe(false);
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
            vi.mocked(FormResponse).mockImplementation(() => mockFormResponse as any);
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

            const mockFormResponse = {
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(FormResponse).mockImplementation(() => mockFormResponse as any);
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

            let savedFormData: any;
            const mockFormResponse = {
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);
            vi.mocked(FormResponse).mockImplementation((data: any) => {
                savedFormData = data;
                return mockFormResponse as any;
            });
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue({} as any);

            await healthProfileService(userId, healthData);

            expect(savedFormData).toMatchObject({
                userId: userId,
                formData: expect.objectContaining({
                    age: 30,
                    occupation: 'Developer',
                    allergies: ['peanuts', 'shellfish']
                }),
                answeredAt: expect.any(Date)
            });
        });
    });
});
