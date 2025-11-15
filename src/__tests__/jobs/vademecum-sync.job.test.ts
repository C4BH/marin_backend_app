import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startVademecumSyncJob, stopVademecumSyncJob } from '../../jobs/vademecum-sync.job';
import * as vademecumService from '../../services/vademecum';
import { logger } from '../../utils/logger';

// Mock dependencies
vi.mock('../../services/vademecum');
vi.mock('../../utils/logger');

// Create mock schedule function outside to avoid hoisting issues
const mockScheduleFn = vi.fn((cronExpression, callback, options) => {
  return {
    stop: vi.fn(),
    start: vi.fn(),
    callback,
    cronExpression,
    options,
  };
});

vi.mock('node-cron', () => ({
  default: {
    schedule: mockScheduleFn
  },
}));

describe('Vademecum Sync Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startVademecumSyncJob', () => {
    it('should schedule a cron job with default schedule', () => {
      const job = startVademecumSyncJob();

      expect(mockScheduleFn).toHaveBeenCalled();
      expect(job).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Vademecum sync job scheduled')
      );
    });

    it('should use custom cron schedule from environment', () => {
      const originalEnv = process.env.VADEMECUM_SYNC_CRON;
      process.env.VADEMECUM_SYNC_CRON = '0 2 * * *';

      startVademecumSyncJob();

      expect(mockScheduleFn).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        expect.any(Object)
      );

      // Restore
      if (originalEnv) {
        process.env.VADEMECUM_SYNC_CRON = originalEnv;
      } else {
        delete process.env.VADEMECUM_SYNC_CRON;
      }
    });

    it('should use correct timezone from environment', () => {
      const originalTZ = process.env.TZ;
      process.env.TZ = 'America/New_York';

      startVademecumSyncJob();

      expect(mockScheduleFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          timezone: 'America/New_York',
        })
      );

      // Restore
      if (originalTZ) {
        process.env.TZ = originalTZ;
      } else {
        delete process.env.TZ;
      }
    });

    it('should use default timezone when not specified', () => {
      const originalTZ = process.env.TZ;
      delete process.env.TZ;

      startVademecumSyncJob();

      expect(mockScheduleFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          timezone: 'Europe/Istanbul',
        })
      );

      // Restore
      if (originalTZ) {
        process.env.TZ = originalTZ;
      }
    });
  });

  describe('stopVademecumSyncJob', () => {
    it('should stop the cron job', () => {
      const mockJob = {
        stop: vi.fn(),
      };

      stopVademecumSyncJob(mockJob as any);

      expect(mockJob.stop).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Vademecum sync job stopped');
    });

    it('should handle null job gracefully', () => {
      expect(() => stopVademecumSyncJob(null as any)).not.toThrow();
    });

    it('should handle undefined job gracefully', () => {
      expect(() => stopVademecumSyncJob(undefined as any)).not.toThrow();
    });
  });

  describe('Sync job execution', () => {
    it('should call syncProductsToDatabase when job runs', async () => {
      const mockSyncResult = {
        success: true,
        stats: {
          total: 100,
          created: 10,
          updated: 20,
          unchanged: 70,
        },
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      expect(vademecumService.syncProductsToDatabase).toHaveBeenCalled();
    });

    it('should log success when sync completes successfully', async () => {
      const mockSyncResult = {
        success: true,
        stats: {
          total: 100,
          created: 10,
          updated: 20,
          unchanged: 70,
        },
        message: 'Sync completed',
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting scheduled Vademecum product sync')
      );
      // Skip first info log (scheduling message)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Vademecum sync completed successfully'),
        expect.objectContaining({
          stats: mockSyncResult.stats,
        })
      );
    });

    it('should log error when sync fails', async () => {
      const mockSyncResult = {
        success: false,
        stats: {
          total: 100,
          created: 5,
          updated: 0,
          unchanged: 0,
        },
        message: 'API rate limit exceeded',
        errors: ['Too many requests'],
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Vademecum sync failed'),
        expect.objectContaining({
          message: 'API rate limit exceeded',
          errors: ['Too many requests'],
        })
      );
    });

    it('should handle exceptions during sync', async () => {
      const error = new Error('Database connection failed');

      vi.mocked(vademecumService.syncProductsToDatabase).mockRejectedValue(error);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Vademecum sync job error'),
        expect.objectContaining({
          error: 'Database connection failed',
          stack: expect.any(String),
        })
      );
    });

    it('should prevent overlapping job executions', async () => {
      // Mock a long-running sync
      vi.mocked(vademecumService.syncProductsToDatabase).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          stats: { total: 0, created: 0, updated: 0, unchanged: 0 },
        } as any), 5000))
      );

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];

      // Start first execution
      const firstExecution = scheduledCallback();

      // Try to start second execution while first is running
      await scheduledCallback();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already running')
      );

      // Wait for first execution to complete
      await firstExecution;
    });

    it('should track execution duration', async () => {
      const mockSyncResult = {
        success: true,
        stats: {
          total: 50,
          created: 5,
          updated: 10,
          unchanged: 35,
        },
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      const infoCalls = (logger.info as any).mock.calls;
      const successCall = infoCalls.find((call: any[]) => 
        call[0] && typeof call[0] === 'string' && call[0].includes('completed successfully')
      );
      expect(successCall).toBeDefined();
    });

    it('should include timestamp in logs', async () => {
      const mockSyncResult = {
        success: true,
        stats: {
          total: 25,
          created: 2,
          updated: 3,
          unchanged: 20,
        },
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];
      await scheduledCallback();

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Job state management', () => {
    it('should reset running flag after successful execution', async () => {
      const mockSyncResult = {
        success: true,
        stats: { total: 10, created: 1, updated: 2, unchanged: 7 },
      };

      vi.mocked(vademecumService.syncProductsToDatabase).mockResolvedValue(mockSyncResult as any);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];

      // First execution
      await scheduledCallback();

      // Second execution should work (not blocked)
      vi.clearAllMocks();
      await scheduledCallback();

      expect(vademecumService.syncProductsToDatabase).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should reset running flag after failed execution', async () => {
      const error = new Error('Sync failed');

      vi.mocked(vademecumService.syncProductsToDatabase).mockRejectedValue(error);

      startVademecumSyncJob();

      const scheduledCallback = mockScheduleFn.mock.calls[0][1];

      // First execution (fails)
      await scheduledCallback();

      // Second execution should work (not blocked)
      vi.clearAllMocks();
      await scheduledCallback();

      expect(vademecumService.syncProductsToDatabase).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
