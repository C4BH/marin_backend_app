import cron from 'node-cron';
import { syncProductsToDatabase } from '../services/vademecum';
import { logger } from '../utils/logger';

/**
 * Vademecum Product Sync Job
 * Runs daily at 03:00 AM to sync products from Vademecum API
 */

let isRunning = false;

export const startVademecumSyncJob = () => {
    // Schedule: Every day at 03:00 AM
    // Cron expression: "0 3 * * *"
    // - 0: minute 0
    // - 3: hour 3 (3 AM)
    // - *: every day of month
    // - *: every month
    // - *: every day of week
    
    const cronSchedule = process.env.VADEMECUM_SYNC_CRON || '0 3 * * *';
    
    const job = cron.schedule(cronSchedule, async () => {
        // Prevent overlapping runs
        if (isRunning) {
            logger.warn('Vademecum sync job is already running, skipping this execution');
            return;
        }

        isRunning = true;
        logger.info('🔄 Starting scheduled Vademecum product sync...');
        
        const startTime = Date.now();

        try {
            const result = await syncProductsToDatabase();
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (result.success) {
                logger.info(`✅ Vademecum sync completed successfully in ${duration}s`, {
                    stats: result.stats,
                    timestamp: new Date().toISOString()
                });
            } else {
                logger.error(`❌ Vademecum sync failed in ${duration}s`, {
                    message: result.message,
                    stats: result.stats,
                    errors: result.errors,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            logger.error(`❌ Vademecum sync job error in ${duration}s:`, {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        } finally {
            isRunning = false;
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'Europe/Istanbul'
    });

    logger.info(`📅 Vademecum sync job scheduled: ${cronSchedule} (${process.env.TZ || 'Europe/Istanbul'})`);
    
    return job;
};

/**
 * Stop the sync job (for graceful shutdown)
 */
export const stopVademecumSyncJob = (job: cron.ScheduledTask) => {
    if (job) {
        job.stop();
        logger.info('Vademecum sync job stopped');
    }
};

