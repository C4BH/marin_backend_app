import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { BecomePremium } from '../../../controllers/user/premium';
import User from '../../../models/user';
import { SubscriptionPlan, SubscriptionStatus } from '../../../models/constants';

// Mock User model
vi.mock('../../../models/user');

describe('Premium Controller', () => {
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

        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('BecomePremium', () => {
        it('should return 200 and upgrade user to premium on success', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                subscription: {
                    plan: SubscriptionPlan.FREE,
                    status: SubscriptionStatus.INACTIVE
                },
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockUser.subscription.plan).toBe(SubscriptionPlan.PERSONAL);
            expect(mockUser.subscription.status).toBe(SubscriptionStatus.ACTIVE);
            expect(mockUser.save).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı premium olarak güncellendi'
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.user = undefined;

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
            expect(User.findById).not.toHaveBeenCalled();
        });

        it('should return 401 when userId is missing', async () => {
            mockRequest.user = {
                email: 'test@example.com',
                role: 'user'
            } as any;

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 404 when user is not found in database', async () => {
            mockRequest.user = {
                userId: 'nonexistent',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(User.findById).mockResolvedValue(null);

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(User.findById).toHaveBeenCalledWith('nonexistent');
            expect(statusMock).toHaveBeenCalledWith(404);
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

            const error = new Error('Database connection failed');
            vi.mocked(User.findById).mockRejectedValue(error);

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Bir hata oluştu'
            });
            expect(consoleSpy).toHaveBeenCalledWith('Bir hata oluştu:', error);
        });

        it('should return 500 when save fails', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockUser = {
                _id: 'user123',
                subscription: {
                    plan: SubscriptionPlan.FREE,
                    status: SubscriptionStatus.INACTIVE
                },
                save: vi.fn().mockRejectedValue(new Error('Save failed'))
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Bir hata oluştu'
            });
        });

        it('should update user who is already premium', async () => {
            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockUser = {
                _id: 'user123',
                subscription: {
                    plan: SubscriptionPlan.PERSONAL,
                    status: SubscriptionStatus.ACTIVE
                },
                save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(User.findById).mockResolvedValue(mockUser as any);

            await BecomePremium(mockRequest as Request, mockResponse as Response);

            expect(mockUser.subscription.plan).toBe(SubscriptionPlan.PERSONAL);
            expect(mockUser.subscription.status).toBe(SubscriptionStatus.ACTIVE);
            expect(mockUser.save).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
        });
    });
});
