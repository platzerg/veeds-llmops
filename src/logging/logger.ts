// =============================================================================
// Logger Singleton - Main logging interface with Pino backend
// =============================================================================
import pino from 'pino';
import { LoggerConfig, LogLevel, loadConfig, validateConfig } from './config.js';
import { LogContext, getContextManager } from './context-manager.js';
import { LogEntry, JSONFormatter, PrettyFormatter } from './formatters.js';

// Export LogContext for external use
export type { LogContext };

export interface Timer {
  label: string;
  startTime: number;
}

export interface BedrockOperation {
  model: string;
  operation: 'invoke' | 'stream';
  duration: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  cost: number;
  retryCount?: number;
  error?: string;
}

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

export class Logger {
  private pinoLogger: pino.Logger;
  private config: LoggerConfig;
  private contextManager = getContextManager();
  private timers = new Map<string, Timer>();
  private jsonFormatter: JSONFormatter;
  private prettyFormatter: PrettyFormatter;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...loadConfig(), ...config };
    validateConfig(this.config);
    
    this.jsonFormatter = new JSONFormatter(this.config);
    this.prettyFormatter = new PrettyFormatter(this.config);
    
    // Configure Pino based on format
    const pinoConfig: pino.LoggerOptions = {
      level: this.config.level,
      base: {
        service: this.config.serviceName,
        version: this.config.version,
        environment: this.config.environment,
      },
    };

    // Use pretty printing in development, JSON in production
    if (this.config.format === 'pretty') {
      pinoConfig.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      };
    }

    this.pinoLogger = pino(pinoConfig);
  }

  // ---------------------------------------------------------------------------
  // Standard logging methods
  // ---------------------------------------------------------------------------

  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string | Error, context?: LogContext): void {
    if (message instanceof Error) {
      this.log('error', message.message, {
        ...context,
        error: {
          name: message.name,
          message: message.message,
          stack: message.stack,
          code: (message as any).code,
        },
      });
    } else {
      this.log('error', message, context);
    }
  }

  fatal(message: string | Error, context?: LogContext): void {
    if (message instanceof Error) {
      this.log('fatal', message.message, {
        ...context,
        error: {
          name: message.name,
          message: message.message,
          stack: message.stack,
          code: (message as any).code,
        },
      });
    } else {
      this.log('fatal', message, context);
    }
  }

  // ---------------------------------------------------------------------------
  // Performance logging
  // ---------------------------------------------------------------------------

  time(label: string): Timer {
    const timer: Timer = {
      label,
      startTime: Date.now(),
    };
    this.timers.set(label, timer);
    return timer;
  }

  timeEnd(label: string, context?: LogContext): void {
    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`Timer '${label}' not found`, context);
      return;
    }

    const duration = Date.now() - timer.startTime;
    this.timers.delete(label);

    this.info(`Timer '${label}' completed`, {
      ...context,
      duration,
      operation: label,
    });
  }

  logBedrock(operation: BedrockOperation): void {
    if (!this.config.enablePerformanceLogging) return;

    const level = operation.error ? 'error' : 'info';
    const message = `Bedrock ${operation.operation} completed`;

    this.log(level, message, {
      operation: 'bedrock',
      component: 'bedrock-client',
      duration: operation.duration,
      model: operation.model,
      tokenUsage: operation.tokenUsage,
      cost: operation.cost,
      retryCount: operation.retryCount,
      ...(operation.error && { error: { message: operation.error } }),
    });
  }

  logPerformance(metrics: PerformanceMetrics): void {
    if (!this.config.enablePerformanceLogging) return;

    this.info(`Performance metrics for ${metrics.operation}`, {
      operation: metrics.operation,
      component: 'performance',
      duration: metrics.duration,
      ...(this.config.logMemoryUsage && metrics.memoryUsage && { memoryUsage: metrics.memoryUsage }),
      ...(this.config.logCpuUsage && metrics.cpuUsage && { cpuUsage: metrics.cpuUsage }),
    });
  }

  // ---------------------------------------------------------------------------
  // Context management
  // ---------------------------------------------------------------------------

  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.contextManager.withContext(context, () => {
      // The child logger will inherit the context
    });
    return childLogger;
  }

  withTrace(traceId: string, spanId?: string): Logger {
    this.contextManager.setTraceContext(traceId, spanId);
    return this;
  }

  /**
   * Set context from Langfuse trace object
   */
  withLangfuseTrace(trace: any, userId?: string): Logger {
    this.contextManager.setLangfuseTrace(trace, userId);
    return this;
  }

  /**
   * Set context from Langfuse span object
   */
  withLangfuseSpan(span: any, traceId?: string): Logger {
    this.contextManager.setLangfuseSpan(span, traceId);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Core logging implementation
  // ---------------------------------------------------------------------------

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const startTime = performance.now();
    
    try {
      // Merge context from all sources
      const currentContext = this.contextManager.getCurrentContext();
      const mergedContext = { ...currentContext, ...context };

      // Build log entry
      const logEntry: LogEntry = {
        '@timestamp': new Date().toISOString(),
        level,
        message,
        service: this.config.serviceName,
        version: this.config.version,
        environment: this.config.environment,
        ...mergedContext,
      };

      // Use Pino for actual logging
      this.pinoLogger[level](logEntry, message);

      // Check performance constraint (5ms requirement)
      const duration = performance.now() - startTime;
      if (duration > 5) {
        // Log performance warning, but avoid infinite recursion
        console.warn(`Logger performance warning: ${duration.toFixed(2)}ms for level ${level}`);
      }
    } catch (error) {
      // Fallback to console if logging fails - never let logging break the application
      console.error('Logger error:', error);
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

/**
 * Reset logger instance (useful for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}

// ---------------------------------------------------------------------------
// Console replacement methods
// ---------------------------------------------------------------------------
export const logger = {
  trace: (message: string, context?: LogContext) => getLogger().trace(message, context),
  debug: (message: string, context?: LogContext) => getLogger().debug(message, context),
  info: (message: string, context?: LogContext) => getLogger().info(message, context),
  warn: (message: string, context?: LogContext) => getLogger().warn(message, context),
  error: (message: string | Error, context?: LogContext) => getLogger().error(message, context),
  fatal: (message: string | Error, context?: LogContext) => getLogger().fatal(message, context),
  
  // Console compatibility
  log: (message: string, context?: LogContext) => getLogger().info(message, context),
  
  // Performance methods
  time: (label: string) => getLogger().time(label),
  timeEnd: (label: string, context?: LogContext) => getLogger().timeEnd(label, context),
  
  // Specialized logging
  logBedrock: (operation: BedrockOperation) => getLogger().logBedrock(operation),
  logPerformance: (metrics: PerformanceMetrics) => getLogger().logPerformance(metrics),
  
  // Context methods
  child: (context: LogContext) => getLogger().child(context),
  withTrace: (traceId: string, spanId?: string) => getLogger().withTrace(traceId, spanId),
  withLangfuseTrace: (trace: any, userId?: string) => getLogger().withLangfuseTrace(trace, userId),
  withLangfuseSpan: (span: any, traceId?: string) => getLogger().withLangfuseSpan(span, traceId),
};