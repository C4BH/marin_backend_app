import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { postUserWeightAndHeight } from '../../../controllers/user/form';
import { WeightAndHeightService } from '../../../services/form';

// Mock dependencies
vi.mock('../../../services/form');

describe('Form Controller', () => {
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

    describe('postUserWeightAndHeight', () => {
        it('should return 200 on successful weight and height update', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                isSuccess: true,
                message: 'Kilo ve boy başarıyla güncellendi'
            };

            vi.mocked(WeightAndHeightService).mockResolvedValue(mockResult as any);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(WeightAndHeightService).toHaveBeenCalledWith('user123', 75.5, 180);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kilo ve boy başarıyla güncellendi'
            });
        });

        it('should return 401 when user is not authenticated', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = undefined;

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
            expect(WeightAndHeightService).not.toHaveBeenCalled();
        });

        it('should return 401 when userId is missing', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = {
                email: 'test@example.com',
                role: 'user'
            } as any;

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Kullanıcı bulunamadı'
            });
        });

        it('should return 400 when service returns failure', async () => {
            mockRequest.body = {
                weight: -10,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const mockResult = {
                isSuccess: false,
                message: 'Geçersiz kilo değeri'
            };

            vi.mocked(WeightAndHeightService).mockResolvedValue(mockResult as any);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Geçersiz kilo değeri'
            });
        });

        it('should log request body and userId', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(WeightAndHeightService).mockResolvedValue({
                isSuccess: true,
                message: 'Success'
            } as any);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(consoleSpy.log).toHaveBeenCalledWith('İstek body:', {
                weight: 75.5,
                height: 180
            });
            expect(consoleSpy.log).toHaveBeenCalledWith('User ID:', 'user123');
            expect(consoleSpy.log).toHaveBeenCalledWith('isSuccess:', true);
        });

        it('should return 500 on internal server error', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const error = new Error('Database connection failed');
            vi.mocked(WeightAndHeightService).mockRejectedValue(error);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Bir hata oluştu',
                error: 'Database connection failed'
            });
            expect(consoleSpy.error).toHaveBeenCalledWith('Bir hata oluştu:', error);
        });

        it('should handle non-Error exceptions', async () => {
            mockRequest.body = {
                weight: 75.5,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(WeightAndHeightService).mockRejectedValue('String error');

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Bir hata oluştu',
                error: 'String error'
            });
        });

        it('should work with integer weight and height values', async () => {
            mockRequest.body = {
                weight: 75,
                height: 180
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(WeightAndHeightService).mockResolvedValue({
                isSuccess: true,
                message: 'Success'
            } as any);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(WeightAndHeightService).toHaveBeenCalledWith('user123', 75, 180);
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should work with decimal weight values', async () => {
            mockRequest.body = {
                weight: 75.75,
                height: 180.5
            };

            mockRequest.user = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            vi.mocked(WeightAndHeightService).mockResolvedValue({
                isSuccess: true,
                message: 'Success'
            } as any);

            await postUserWeightAndHeight(mockRequest as Request, mockResponse as Response);

            expect(WeightAndHeightService).toHaveBeenCalledWith('user123', 75.75, 180.5);
        });
    });
});
