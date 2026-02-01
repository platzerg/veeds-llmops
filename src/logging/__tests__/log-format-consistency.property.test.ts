// =============================================================================
// Property Test: Log Format Consistency
// Feature: structured-logging-pino, Property 1: Log Format Consistency
// Validates: Requirements 1.1, 1.2, 6.5
// =============================================================================
import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { Logger, getLogger, resetLogger } from '../logger.js';
import { LoggerConfig } from '../config.js';

/**
 * Property 1: Log Format Consistency
 * All log entries should have consistent structure regardless of log level,
 * message content, or context data. The format should remain stable across
 * different environments (development vs production).
 */

describe('Property Test: Log Format Consistency', () => {
  beforeEach(() => {
    resetLogger();
  });

  afterEach(() => {
    resetLogger();
  });

  test('Property 1: All log levels produce consistent structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          operation: fc.string({ minLength: 1, maxLength: 50 }),
          component: fc.string({ minLength: 1, maxLength: 50 }),
          requestId: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (level, message, context) => {
          // Setup: Create logger with JSON format for consistent testing
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { [level]: mockLog };

          // Action: Log at the specified level
          (logger as any)[level](message, context);

          // Verification: Check that log was called with proper structure
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level,
              message,
              service: expect.any(String),
              version: expect.any(String),
              environment: expect.any(String),
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

  test('Property 1: Format consistency across environments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('development', 'production', 'test'),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.record({
          traceId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (environment, message, context) => {
          // Setup: Create loggers for different environments
          const devLogger = new Logger({ 
            environment, 
            format: 'json', 
            level: 'debug' 
          });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (devLogger as any).pinoLogger = { info: mockLog };

          // Action: Log same message in both environments
          devLogger.info(message, context);

          // Verification: Check that log was called with proper structure
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level: 'info',
              message,
              environment,
              traceId: context.traceId,
              userId: context.userId,
            }),
            message
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Error objects maintain consistent structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorName, errorMessage, stackTrace) => {
          // Setup: Create error object
          const error = new Error(errorMessage);
          error.name = errorName;
          error.stack = stackTrace;
          
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { error: mockLog };

          // Action: Log error
          logger.error(error);

          // Verification: Check that log was called with proper structure
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              level: 'error',
              message: errorMessage,
              error: expect.objectContaining({
                name: errorName,
                message: errorMessage,
                stack: stackTrace,
              }),
            }),
            errorMessage
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Context merging preserves structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 1, maxLength: 50 }),
          component: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        fc.record({
          requestId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (baseContext, additionalContext, message) => {
          // Setup: Logger with base context
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { info: mockLog };

          // Action: Log with merged context
          logger.info(message, { ...baseContext, ...additionalContext });

          // Verification: Check that log was called with all context fields
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
              level: 'info',
              message,
              operation: baseContext.operation,
              component: baseContext.component,
              requestId: additionalContext.requestId,
              userId: additionalContext.userId,
            }),
            message
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Special characters in messages maintain structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => 
          // Include various special characters that might break JSON
          s.includes('"') || s.includes('\n') || s.includes('\t') || 
          s.includes('\\') || s.includes('\r') || /[^\x20-\x7E]/.test(s)
        ),
        (message) => {
          // Setup: Logger
          const logger = new Logger({ format: 'json', level: 'trace' });
          
          // Mock Pino logger to capture output
          const mockLog = jest.fn();
          (logger as any).pinoLogger = { info: mockLog };

          // Action: Log message with special characters
          logger.info(message);

          // Verification: Should still produce valid structure
          expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
              level: 'info',
              message,
              '@timestamp': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            }),
            message
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});