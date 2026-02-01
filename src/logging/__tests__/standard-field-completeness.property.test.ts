// =============================================================================
// Property Test: Standard Field Completeness
// Feature: structured-logging-pino, Property 2: Standard Field Completeness
// Validates: Requirements 1.4, 3.3
// =============================================================================
import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { Logger, getLogger, resetLogger } from '../logger.js';
import { LoggerConfig } from '../config.js';

/**
 * Property 2: Standard Field Completeness
 * Every log entry must include all required standard fields (@timestamp, level, 
 * message, service, version, environment) and should include trace correlation 
 * fields when available.
 */

describe('Property Test: Standard Field Completeness', () => {
  beforeEach(() => {
    resetLogger();
  });

  afterEach(() => {
    resetLogger();
  });

  test('Property 2: All log entries contain required standard fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          environment: fc.constantFrom('development', 'production', 'test'),
        }),
        (level, message, config) => {
          // Setup: Create logger with specific config
          const logger = new Logger({ 
            format: 'json', 
            level: 'trace',
            ...config
          });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { [level]: mockLog };

          // Action: Log at the specified level
          (logger as any)[level](message);

          // Verification: Check that log was called with all required fields
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level,
              message,
              service: config.serviceName,
              version: config.version,
              environment: config.environment,
            }),
            message
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Trace correlation fields included when context available', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // spanId
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // userId
        fc.string({ minLength: 1, maxLength: 100 }), // message
        (traceId, spanId, userId, message) => {
          // Setup: Logger with trace context
          const logger = new Logger({ format: 'json', level: 'trace' });
          logger.withTrace(traceId, spanId);
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { info: mockLog };

          // Action: Log with context
          logger.info(message, userId ? { userId } : undefined);

          // Verification: Check that log was called with trace fields
          const expectedCall = expect.objectContaining({
            '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            level: 'info',
            message,
            traceId,
          });

          if (spanId) {
            expectedCall.spanId = spanId;
          }
          if (userId) {
            expectedCall.userId = userId;
          }

          expect(mockLog).toHaveBeenCalledWith(expectedCall, message);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Error fields included for error log entries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // error name
        fc.string({ minLength: 1, maxLength: 200 }), // error message
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // error code
        (errorName, errorMessage, errorCode) => {
          // Setup: Create error object
          const error = new Error(errorMessage);
          error.name = errorName;
          if (errorCode) {
            (error as any).code = errorCode;
          }
          
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { error: mockLog };

          // Action: Log error
          logger.error(error);

          // Verification: Check that log was called with error fields
          const expectedErrorFields: any = {
            name: errorName,
            message: errorMessage,
            stack: expect.any(String),
          };

          if (errorCode) {
            expectedErrorFields.code = errorCode;
          }

          const expectedCall = expect.objectContaining({
            '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            level: 'error',
            message: errorMessage,
            error: expect.objectContaining(expectedErrorFields),
          });

          expect(mockLog).toHaveBeenCalledWith(expectedCall, errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Performance fields included for performance logging', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // operation
        fc.integer({ min: 1, max: 10000 }), // duration
        fc.record({
          inputTokens: fc.integer({ min: 1, max: 10000 }),
          outputTokens: fc.integer({ min: 1, max: 5000 }),
        }),
        fc.float({ min: Math.fround(0.001), max: Math.fround(1.0) }), // cost
        (operation, duration, tokenUsage, cost) => {
          // Setup: Logger with performance logging enabled
          const logger = new Logger({ 
            format: 'json', 
            level: 'trace',
            enablePerformanceLogging: true
          });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { info: mockLog };

          // Action: Log Bedrock operation
          logger.logBedrock({
            model: 'claude-3-5-sonnet',
            operation: 'invoke',
            duration,
            tokenUsage,
            cost,
          });

          // Verification: Check that log was called with performance fields
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level: 'info',
              message: expect.any(String),
              operation: 'bedrock',
              component: 'bedrock-client',
              duration,
              model: 'claude-3-5-sonnet',
              tokenUsage: expect.objectContaining({
                inputTokens: tokenUsage.inputTokens,
                outputTokens: tokenUsage.outputTokens,
              }),
              cost,
            }),
            expect.any(String)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: CloudWatch-specific fields included in production format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.record({
          operation: fc.string({ minLength: 1, maxLength: 50 }),
          component: fc.string({ minLength: 1, maxLength: 50 }),
          requestId: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (message, context) => {
          // Setup: Logger in production mode
          const logger = new Logger({ 
            format: 'json', 
            level: 'info',
            environment: 'production'
          });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { info: mockLog };

          // Action: Log with context
          logger.info(message, context);

          // Verification: Check that log was called with CloudWatch-compatible fields
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level: 'info',
              message,
              service: expect.any(String),
              version: expect.any(String),
              environment: 'production',
              operation: context.operation,
              component: context.component,
              requestId: context.requestId,
            }),
            message
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Field types are consistent and valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          duration: fc.integer({ min: 1, max: 10000 }),
          cost: fc.float({ min: Math.fround(0.001), max: Math.fround(1.0) }),
          retryCount: fc.integer({ min: 0, max: 5 }),
        }),
        (level, message, numericContext) => {
          // Setup: Logger
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { [level]: mockLog };

          // Action: Log with numeric context
          (logger as any)[level](message, numericContext);

          // Verification: Check that field types are preserved
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.any(String),
              level,
              message,
              service: expect.any(String),
              version: expect.any(String),
              environment: expect.any(String),
              duration: numericContext.duration,
              cost: numericContext.cost,
              retryCount: numericContext.retryCount,
            }),
            message
          );

          // Verify the actual call to check types
          const actualCall = mockLog.mock.calls[0][0] as any;
          expect(typeof actualCall.duration).toBe('number');
          expect(typeof actualCall.cost).toBe('number');
          expect(typeof actualCall.retryCount).toBe('number');
          expect(actualCall.duration).toBe(numericContext.duration);
          expect(actualCall.cost).toBe(numericContext.cost);
          expect(actualCall.retryCount).toBe(numericContext.retryCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});