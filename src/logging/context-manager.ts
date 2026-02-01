// =============================================================================
// Context Manager - Langfuse trace correlation and async context storage
// =============================================================================
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: any;
}

// Async local storage for maintaining context across async operations
const asyncStorage = new AsyncLocalStorage<LogContext>();

export class ContextManager {
  /**
   * Get current log context from all available sources
   */
  getCurrentContext(): LogContext {
    const context: LogContext = {};
    
    // 1. Get context from async local storage
    const asyncContext = asyncStorage.getStore();
    if (asyncContext) {
      Object.assign(context, asyncContext);
    }
    
    // 2. Try to extract from Langfuse (if enabled and available)
    try {
      const langfuseContext = this.extractFromLangfuse();
      if (langfuseContext) {
        Object.assign(context, langfuseContext);
      }
    } catch (error) {
      // Silently ignore Langfuse extraction errors - logging should not fail
      // because of trace correlation issues
    }
    
    return context;
  }

  /**
   * Manually set trace context (useful for manual correlation)
   */
  setTraceContext(traceId: string, spanId?: string): void {
    const currentContext = asyncStorage.getStore() || {};
    const newContext = {
      ...currentContext,
      traceId,
      ...(spanId && { spanId })
    };
    
    asyncStorage.enterWith(newContext);
  }

  /**
   * Clear all context
   */
  clearContext(): void {
    asyncStorage.enterWith({});
  }

  /**
   * Run a function with specific context
   */
  withContext<T>(context: LogContext, fn: () => T): T {
    const currentContext = asyncStorage.getStore() || {};
    const mergedContext = { ...currentContext, ...context };
    
    return asyncStorage.run(mergedContext, fn);
  }

  /**
   * Extract trace context from Langfuse client
   * Returns null if no active trace or if extraction fails
   */
  private extractFromLangfuse(): LogContext | null {
    try {
      // Only try to import Langfuse if we're not in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      
      // Dynamic import to avoid circular dependencies and test issues
      // Note: Langfuse SDK doesn't expose current trace/span context directly
      // We'll need to rely on manual context setting when traces are created
      // This method is here for future enhancement when/if Langfuse adds
      // context extraction capabilities
      
      // For now, check if we have any stored context from manual setting
      const currentContext = asyncStorage.getStore();
      if (currentContext?.traceId) {
        return {
          traceId: currentContext.traceId,
          spanId: currentContext.spanId,
          userId: currentContext.userId,
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set context from Langfuse trace object
   * This should be called when creating traces in the application
   */
  setLangfuseTrace(trace: any, userId?: string): void {
    if (!trace) return;
    
    const context: LogContext = {
      traceId: trace.id || trace.traceId,
      userId: userId || trace.userId,
    };
    
    const currentContext = asyncStorage.getStore() || {};
    const newContext = { ...currentContext, ...context };
    
    asyncStorage.enterWith(newContext);
  }

  /**
   * Set context from Langfuse span object
   */
  setLangfuseSpan(span: any, traceId?: string): void {
    if (!span) return;
    
    const context: LogContext = {
      spanId: span.id || span.spanId,
      ...(traceId && { traceId }),
    };
    
    const currentContext = asyncStorage.getStore() || {};
    const newContext = { ...currentContext, ...context };
    
    asyncStorage.enterWith(newContext);
  }
}

// Singleton instance
let contextManager: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManager) {
    contextManager = new ContextManager();
  }
  return contextManager;
}