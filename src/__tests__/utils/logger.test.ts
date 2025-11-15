import { describe, it, expect, vi, beforeEach } from 'vitest';
import winston from 'winston';

// Mock winston before importing logger
vi.mock('winston', () => {
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        add: vi.fn()
    };

    return {
        default: {
            createLogger: vi.fn(() => mockLogger),
            format: {
                combine: vi.fn((...args) => args),
                timestamp: vi.fn(),
                json: vi.fn(),
                prettyPrint: vi.fn(),
                colorize: vi.fn(),
                simple: vi.fn()
            },
            transports: {
                File: vi.fn(),
                Console: vi.fn()
            }
        }
    };
});

describe('Logger', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
        vi.clearAllMocks();
        originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        if (originalEnv !== undefined) {
            process.env.NODE_ENV = originalEnv;
        }
    });

    it('should create logger with correct configuration', async () => {
        // Re-import logger to test configuration
        await vi.resetModules();
        const { logger } = await import('../../utils/logger');

        expect(winston.createLogger).toHaveBeenCalled();
        expect(logger).toBeDefined();
    });

    it('should create logger with info level in production', async () => {
        process.env.NODE_ENV = 'production';
        await vi.resetModules();

        const { logger } = await import('../../utils/logger');

        expect(winston.createLogger).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'info'
            })
        );
    });

    it('should create logger with debug level in development', async () => {
        process.env.NODE_ENV = 'development';
        await vi.resetModules();

        const { logger } = await import('../../utils/logger');

        expect(winston.createLogger).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'debug'
            })
        );
    });

    it('should configure File transports for error and combined logs', async () => {
        await vi.resetModules();
        await import('../../utils/logger');

        expect(winston.transports.File).toHaveBeenCalledWith(
            expect.objectContaining({
                filename: 'logs/error.log',
                level: 'error'
            })
        );

        expect(winston.transports.File).toHaveBeenCalledWith(
            expect.objectContaining({
                filename: 'logs/combined.log'
            })
        );
    });

    it('should add Console transport in non-production environment', async () => {
        process.env.NODE_ENV = 'development';
        await vi.resetModules();

        const { logger } = await import('../../utils/logger');

        expect(logger.add).toHaveBeenCalled();
        expect(winston.transports.Console).toHaveBeenCalled();
    });

    it('should not add Console transport in production', async () => {
        process.env.NODE_ENV = 'production';
        await vi.resetModules();

        const { logger } = await import('../../utils/logger');

        // In production, add should not be called
        expect(logger.add).not.toHaveBeenCalled();
    });

    it('should use combined format with timestamp, json, and prettyPrint', async () => {
        await vi.resetModules();
        await import('../../utils/logger');

        expect(winston.format.combine).toHaveBeenCalled();
        expect(winston.format.timestamp).toHaveBeenCalled();
        expect(winston.format.json).toHaveBeenCalled();
        expect(winston.format.prettyPrint).toHaveBeenCalled();
    });

    it('should export logger instance', async () => {
        await vi.resetModules();
        const { logger } = await import('../../utils/logger');

        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.debug).toBe('function');
    });

    describe('Logger methods', () => {
        it('should call logger.info', async () => {
            await vi.resetModules();
            const { logger } = await import('../../utils/logger');

            logger.info('Test info message');
            expect(logger.info).toHaveBeenCalledWith('Test info message');
        });

        it('should call logger.error', async () => {
            await vi.resetModules();
            const { logger } = await import('../../utils/logger');

            logger.error('Test error message');
            expect(logger.error).toHaveBeenCalledWith('Test error message');
        });

        it('should call logger.warn', async () => {
            await vi.resetModules();
            const { logger } = await import('../../utils/logger');

            logger.warn('Test warning message');
            expect(logger.warn).toHaveBeenCalledWith('Test warning message');
        });

        it('should call logger.debug', async () => {
            await vi.resetModules();
            const { logger } = await import('../../utils/logger');

            logger.debug('Test debug message');
            expect(logger.debug).toHaveBeenCalledWith('Test debug message');
        });
    });

    describe('Console transport format', () => {
        it('should use colorize and simple format for console in development', async () => {
            process.env.NODE_ENV = 'development';
            await vi.resetModules();

            await import('../../utils/logger');

            expect(winston.format.colorize).toHaveBeenCalled();
            expect(winston.format.simple).toHaveBeenCalled();
        });
    });
});
