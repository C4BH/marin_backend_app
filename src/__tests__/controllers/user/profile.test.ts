import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
    getUserProfile,
    updateUserProfile,
    deleteUser,
    healthProfile,
    isFormFilled
} from '../../../controllers/user/profile';
import * as userService from '../../../services/user';
import * as formService from '../../../services/form';
import User from '../../../models/user';

// Mock dependencies
vi.mock('../../../services/user');
vi.mock('../../../services/form');
vi.mock('../../../models/user');

describe('Profile Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));

        mockRequest = {
            body: {},
            user: undefined
        };

        mockResponse = {
            status: statusMock,
            json: jsonMock
        };

        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        };
    });

    describe('getUserProfile', () => {
        it('should return 200 with user profile on success', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Profile retrieved successfully',
                data: {
                    name: 'John Doe',
                    email: 'test@example.com',
                    age: 30
                }
            };

            vi.mocked(userService.getUserProfile).mockResolvedValue(mockResult as any);

            await getUserProfile(mockRequest as Request, mockResponse as Response);

            expect(userService.getUserProfile).toHaveBeenCalledWith('user123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Profile retrieved successfully',
                data: {
                    name: 'John Doe',
                    email: 'test@example.com',
                    age: 30
                }
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await getUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
            expect(userService.getUserProfile).not.toHaveBeenCalled();
        });

        it('should return 400 when service returns failure', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                isSuccess: false,
                message: 'User not found'
            };

            vi.mocked(userService.getUserProfile).mockResolvedValue(mockResult as any);

            await getUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });

        it('should return 500 on internal server error', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const error = new Error('Database error');
            vi.mocked(userService.getUserProfile).mockRejectedValue(error);

            await getUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'getUserProfile hatası',
                error: 'Database error'
            });
        });
    });

    describe('updateUserProfile', () => {
        it('should return 200 with updated profile on success', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = {
                name: 'Jane Doe',
                age: 25
            };

            const mockResult = {
                isSuccess: true,
                message: 'Profile updated successfully',
                data: {
                    name: 'Jane Doe',
                    age: 25
                }
            };

            vi.mocked(userService.updateUserProfile).mockResolvedValue(mockResult as any);

            await updateUserProfile(mockRequest as Request, mockResponse as Response);

            expect(userService.updateUserProfile).toHaveBeenCalledWith('user123', {
                name: 'Jane Doe',
                age: 25
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Profile updated successfully',
                data: {
                    name: 'Jane Doe',
                    age: 25
                }
            });
        });

        it('should log userId and data', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = {
                name: 'Test User'
            };

            vi.mocked(userService.updateUserProfile).mockResolvedValue({
                isSuccess: true,
                message: 'Success',
                data: {}
            } as any);

            await updateUserProfile(mockRequest as Request, mockResponse as Response);

            expect(consoleSpy.log).toHaveBeenCalledWith('userId:', 'user123');
            expect(consoleSpy.log).toHaveBeenCalledWith('data:', { name: 'Test User' });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;
            mockRequest.body = { name: 'Test' };

            await updateUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 400 on service failure', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = { name: '' };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid data'
            };

            vi.mocked(userService.updateUserProfile).mockResolvedValue(mockResult as any);

            await updateUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid data'
            });
        });

        it('should return 500 on internal error', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = { name: 'Test' };

            const error = new Error('Update failed');
            vi.mocked(userService.updateUserProfile).mockRejectedValue(error);

            await updateUserProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'updateUserProfile hatası',
                error: 'Update failed'
            });
        });
    });

    describe('deleteUser', () => {
        it('should return 200 on successful user deletion', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockDeletedUser = {
                _id: 'user123',
                email: 'test@example.com'
            };

            vi.mocked(User.findByIdAndDelete).mockResolvedValue(mockDeletedUser as any);

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı başarıyla silindi'
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
            expect(User.findByIdAndDelete).not.toHaveBeenCalled();
        });

        it('should return 400 when user not found in database', async () => {
            mockRequest.user = {
                userId: 'nonexistent',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(User.findByIdAndDelete).mockResolvedValue(null);

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 500 on database error', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const error = new Error('Delete failed');
            vi.mocked(User.findByIdAndDelete).mockRejectedValue(error);

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'deleteUser hatası',
                error: 'Delete failed'
            });
        });
    });

    describe('healthProfile', () => {
        it('should return 200 on successful health profile update', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = {
                bloodType: 'A+',
                allergies: ['peanuts'],
                medications: ['aspirin']
            };

            const mockResult = {
                isSuccess: true,
                message: 'Health profile updated'
            };

            vi.mocked(formService.healthProfileService).mockResolvedValue(mockResult as any);

            await healthProfile(mockRequest as Request, mockResponse as Response);

            expect(formService.healthProfileService).toHaveBeenCalledWith('user123', {
                bloodType: 'A+',
                allergies: ['peanuts'],
                medications: ['aspirin']
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Health profile updated'
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;
            mockRequest.body = { bloodType: 'A+' };

            await healthProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 400 on service failure', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = { bloodType: 'Invalid' };

            const mockResult = {
                isSuccess: false,
                message: 'Invalid blood type'
            };

            vi.mocked(formService.healthProfileService).mockResolvedValue(mockResult as any);

            await healthProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid blood type'
            });
        });

        it('should return 500 on internal error', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            mockRequest.body = { bloodType: 'A+' };

            const error = new Error('Service error');
            vi.mocked(formService.healthProfileService).mockRejectedValue(error);

            await healthProfile(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'healthProfile hatası',
                error: 'Service error'
            });
        });
    });

    describe('isFormFilled', () => {
        it('should return 200 when user form is filled', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockUser = {
                _id: 'user123',
                isFormFilled: true
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await isFormFilled(mockRequest as Request, mockResponse as Response);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı formunu daha önce doldurdu'
            });
        });

        it('should return 400 when user form is not filled', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockUser = {
                _id: 'user123',
                isFormFilled: false
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await isFormFilled(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı formunu daha önce doldurmadı'
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await isFormFilled(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
            expect(User.findById).not.toHaveBeenCalled();
        });

        it('should return 400 when user not found in database', async () => {
            mockRequest.user = {
                userId: 'nonexistent',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(User.findById).mockResolvedValue(null);

            await isFormFilled(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 500 on database error', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const error = new Error('Database error');
            vi.mocked(User.findById).mockRejectedValue(error);

            await isFormFilled(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'isFormFilled hatası',
                error: 'Database error'
            });
        });
    });
});
