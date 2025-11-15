import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile, updateUserProfile } from '../../services/user';
import User from '../../models/user';

// Mock User model
vi.mock('../../models/user');

describe('User Service', () => {
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('getUserProfile', () => {
        it('should return user profile successfully', async () => {
            const userId = 'user123';
            const mockUser = {
                _id: userId,
                name: 'John',
                surname: 'Doe',
                email: 'john@example.com',
                phone: '+905551234567',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male'
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            const result = await getUserProfile(userId);

            expect(result.isSuccess).toBe(true);
            expect(result.message).toBe('Kullanıcı profili başarıyla alındı');
            expect(result.data).toEqual({
                name: 'John',
                surname: 'Doe',
                email: 'john@example.com',
                phone: '+905551234567',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male'
            });
            expect(User.findById).toHaveBeenCalledWith(userId);
        });

        it('should return error when user not found', async () => {
            const userId = 'nonexistent';

            vi.mocked(User.findById).mockResolvedValue(null);

            const result = await getUserProfile(userId);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
            expect(result.data).toBeUndefined();
        });

        it('should handle database errors', async () => {
            const userId = 'user123';
            const error = new Error('Database connection failed');

            vi.mocked(User.findById).mockRejectedValue(error);

            const result = await getUserProfile(userId);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('getUserProfile hatası');
            expect(result.error).toBe('Database connection failed');
            expect(consoleSpy).toHaveBeenCalledWith('getUserProfile hatası:', error);
        });

        it('should handle non-Error exceptions', async () => {
            const userId = 'user123';

            vi.mocked(User.findById).mockRejectedValue('String error');

            const result = await getUserProfile(userId);

            expect(result.isSuccess).toBe(false);
            expect(result.error).toBe('String error');
        });

        it('should return only specified fields from user', async () => {
            const userId = 'user123';
            const mockUser = {
                _id: userId,
                name: 'John',
                surname: 'Doe',
                email: 'john@example.com',
                phone: '+905551234567',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male',
                password: 'secret_password',  // Should not be included
                verificationCode: '123456'     // Should not be included
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            const result = await getUserProfile(userId);

            expect(result.data).not.toHaveProperty('password');
            expect(result.data).not.toHaveProperty('verificationCode');
            expect(result.data).toHaveProperty('name');
            expect(result.data).toHaveProperty('email');
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const userId = 'user123';
            const updateData = {
                name: 'Jane',
                surname: 'Smith',
                phone: '+905559876543'
            };

            const existingUser = {
                _id: userId,
                name: 'John',
                surname: 'Doe',
                email: 'john@example.com'
            };

            const updatedUser = {
                _id: userId,
                name: 'Jane',
                surname: 'Smith',
                email: 'john@example.com',
                phone: '+905559876543'
            };

            vi.mocked(User.findById).mockResolvedValue(existingUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await updateUserProfile(userId, updateData);

            expect(result.isSuccess).toBe(true);
            expect(result.message).toBe('Kullanıcı profili başarıyla güncellendi');
            expect(result.data).toEqual(updatedUser);
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true });
        });

        it('should return error when user not found in findById', async () => {
            const userId = 'nonexistent';
            const updateData = {
                name: 'Jane'
            };

            vi.mocked(User.findById).mockResolvedValue(null);

            const result = await updateUserProfile(userId, updateData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
            expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should return error when user not found in findByIdAndUpdate', async () => {
            const userId = 'user123';
            const updateData = {
                name: 'Jane'
            };

            const existingUser = {
                _id: userId,
                name: 'John'
            };

            vi.mocked(User.findById).mockResolvedValue(existingUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(null);

            const result = await updateUserProfile(userId, updateData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('Kullanıcı bulunamadı');
        });

        it('should handle database errors', async () => {
            const userId = 'user123';
            const updateData = {
                name: 'Jane'
            };

            const error = new Error('Database error');
            vi.mocked(User.findById).mockRejectedValue(error);

            const result = await updateUserProfile(userId, updateData);

            expect(result.isSuccess).toBe(false);
            expect(result.message).toBe('updateUserProfile hatası');
            expect(result.error).toBe('Database error');
            expect(consoleSpy).toHaveBeenCalledWith('updateUserProfile hatası:', error);
        });

        it('should handle partial data updates', async () => {
            const userId = 'user123';
            const partialUpdate = {
                name: 'NewName'
            };

            const existingUser = {
                _id: userId,
                name: 'OldName',
                email: 'test@example.com'
            };

            const updatedUser = {
                _id: userId,
                name: 'NewName',
                email: 'test@example.com'
            };

            vi.mocked(User.findById).mockResolvedValue(existingUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await updateUserProfile(userId, partialUpdate);

            expect(result.isSuccess).toBe(true);
            expect(result.data.name).toBe('NewName');
            expect(result.data.email).toBe('test@example.com');
        });

        it('should handle empty update data', async () => {
            const userId = 'user123';
            const emptyUpdate = {};

            const existingUser = {
                _id: userId,
                name: 'John'
            };

            const updatedUser = {
                _id: userId,
                name: 'John'
            };

            vi.mocked(User.findById).mockResolvedValue(existingUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await updateUserProfile(userId, emptyUpdate);

            expect(result.isSuccess).toBe(true);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {}, { new: true });
        });

        it('should update multiple fields at once', async () => {
            const userId = 'user123';
            const multipleUpdates = {
                name: 'Jane',
                surname: 'Smith',
                phone: '+905551234567',
                dateOfBirth: new Date('1995-05-15')
            };

            const existingUser = {
                _id: userId,
                name: 'John',
                surname: 'Doe'
            };

            const updatedUser = {
                _id: userId,
                ...multipleUpdates
            };

            vi.mocked(User.findById).mockResolvedValue(existingUser as any);
            vi.mocked(User.findByIdAndUpdate).mockResolvedValue(updatedUser as any);

            const result = await updateUserProfile(userId, multipleUpdates);

            expect(result.isSuccess).toBe(true);
            expect(result.data).toMatchObject(multipleUpdates);
        });

        it('should handle non-Error exceptions', async () => {
            const userId = 'user123';
            const updateData = { name: 'Jane' };

            vi.mocked(User.findById).mockRejectedValue('String error');

            const result = await updateUserProfile(userId, updateData);

            expect(result.isSuccess).toBe(false);
            expect(result.error).toBe('String error');
        });
    });
});
