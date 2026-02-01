// =============================================================================
// Property Test: Trace Correlation Completeness
// Feature: structured-logging-pino, Property 5: Trace Correlation Completeness
// Validates: Requirements 2.1, 2.2, 2.6
// =============================================================================
import * as fc from 'fast-check';
import { getContextManager } from '../context-manager.js';

/**
 * Property 5: Trace Correlation Completeness
 * For any active Langfuse trace context, log entries should automatically include 
 * the trace ID, and when spans are active, both trace ID and span ID should be included
 */

describe('Property Test: Trace Correlation Completeness', () => {
  beforeEach(() => {
    getContextManager().clearContext();
  });

  test('Property 5: Context manager preserves trace ID', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        (traceId) => {
          // Setup: Set trace context
          const contextManager = getContextManager();
          contextManager.setTraceContext(traceId);

          // Action: Get current context
          const context = contextManager.getCurrentContext();

          // Verification: Context should include trace ID
          expect(context.traceId).toBe(traceId);
          expect(context.spanId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Context manager preserves trace ID and span ID', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.string({ minLength: 1, maxLength: 50 }), // spanId
        (traceId, spanId) => {
          // Setup: Set trace and span context
          const contextManager = getContextManager();
          contextManager.setTraceContext(traceId, spanId);

          // Action: Get current context
          const context = contextManager.getCurrentContext();

          // Verification: Context should include both trace ID and span ID
          expect(context.traceId).toBe(traceId);
          expect(context.spanId).toBe(spanId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Langfuse trace object context extraction', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        (traceId, userId) => {
          // Setup: Mock Langfuse trace object
          const mockTrace = {
            id: traceId,
            userId: userId,
          };

          const contextManager = getContextManager();
          contextManager.setLangfuseTrace(mockTrace, userId);

          // Action: Get current context
          const context = contextManager.getCurrentContext();

          // Verification: Context should include trace ID and user ID
          expect(context.traceId).toBe(traceId);
          expect(context.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Langfuse span object context extraction', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.string({ minLength: 1, maxLength: 50 }), // spanId
        (traceId, spanId) => {
          // Setup: Mock Langfuse span object
          const mockSpan = {
            id: spanId,
          };

          const contextManager = getContextManager();
          contextManager.setLangfuseSpan(mockSpan, traceId);

          // Action: Get current context
          const context = contextManager.getCurrentContext();

          // Verification: Context should include both trace ID and span ID
          expect(context.traceId).toBe(traceId);
          expect(context.spanId).toBe(spanId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Context merging preserves all fields', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.string({ minLength: 1, maxLength: 50 }), // operation
        fc.string({ minLength: 1, maxLength: 50 }), // requestId
        (traceId, operation, requestId) => {
          // Setup: Set trace context
          const contextManager = getContextManager();
          contextManager.setTraceContext(traceId);

          // Action: Run with additional context
          const result = contextManager.withContext(
            { operation, requestId },
            () => contextManager.getCurrentContext()
          );

          // Verification: Context should include all fields
          expect(result.traceId).toBe(traceId);
          expect(result.operation).toBe(operation);
          expect(result.requestId).toBe(requestId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Context survives async operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // traceId
        fc.integer({ min: 1, max: 100 }), // delay
        async (traceId, delay) => {
          // Setup: Set trace context
          const contextManager = getContextManager();
          contextManager.setTraceContext(traceId);

          // Action: Async operation
          await new Promise(resolve => setTimeout(resolve, delay));
          const context = contextManager.getCurrentContext();

          // Verification: Context should survive async operation
          expect(context.traceId).toBe(traceId);
        }
      ),
      { numRuns: 50 } // Reduced for async tests
    );
  });
});