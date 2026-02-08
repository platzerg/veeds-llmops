// =============================================================================
// Log Formatters - Pretty printing for development, JSON for production
// =============================================================================
import type { LoggerConfig } from './config.ts';

export interface LogEntry {
  '@timestamp': string;
  level: string;
  message: string;
  service: string;
  version: string;
  environment: string;

  // Correlation fields
  traceId?: string;
  spanId?: string;
  requestId?: string;
  userId?: string;

  // Context fields
  operation?: string;
  component?: string;

  // Performance fields
  duration?: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  cost?: number;

  // Error fields
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };

  // Additional context
  [key: string]: any;
}

export interface LogFormatter {
  format(logEntry: LogEntry): string;
}

/**
 * JSON formatter for production - CloudWatch optimized
 */
export class JSONFormatter implements LogFormatter {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  format(logEntry: LogEntry): string {
    // Flatten nested objects to dot notation for CloudWatch compatibility
    const flattened = this.flattenObject(logEntry);

    // Ensure CloudWatch field name compatibility
    const cloudWatchCompatible = this.makeCloudWatchCompatible(flattened);

    // Limit size to CloudWatch maximum
    const limited = this.limitSize(cloudWatchCompatible);

    return JSON.stringify(limited);
  }

  /**
   * Flatten nested objects to dot notation (max 2 levels for CloudWatch)
   */
  private flattenObject(obj: any, prefix = '', maxDepth = 2, currentDepth = 0): any {
    if (currentDepth >= maxDepth) {
      return obj;
    }

    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value) && currentDepth < maxDepth - 1) {
        Object.assign(flattened, this.flattenObject(value, newKey, maxDepth, currentDepth + 1));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Ensure field names are compatible with CloudWatch Insights
   */
  private makeCloudWatchCompatible(obj: any): any {
    const compatible: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // CloudWatch reserved fields should start with @
      let compatibleKey = key;
      if (key === 'timestamp') {
        compatibleKey = '@timestamp';
      }

      // Replace problematic characters in field names
      compatibleKey = compatibleKey.replace(/[^a-zA-Z0-9@._-]/g, '_');

      compatible[compatibleKey] = value;
    }

    return compatible;
  }

  /**
   * Limit log entry size to CloudWatch maximum (256KB)
   */
  private limitSize(obj: any): any {
    const jsonString = JSON.stringify(obj);

    if (jsonString.length <= this.config.maxLogSize) {
      return obj;
    }

    // If too large, truncate message and add truncation notice
    const truncated = { ...obj };
    const overhead = JSON.stringify({ ...truncated, message: '', truncated: true }).length;
    const maxMessageLength = this.config.maxLogSize - overhead - 100; // Safety margin

    if (truncated.message && typeof truncated.message === 'string') {
      truncated.message = truncated.message.substring(0, maxMessageLength) + '...';
    }

    truncated.truncated = true;
    truncated.originalSize = jsonString.length;

    return truncated;
  }
}

/**
 * Pretty formatter for development - human readable with colors
 */
export class PrettyFormatter implements LogFormatter {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  format(logEntry: LogEntry): string {
    const timestamp = new Date(logEntry['@timestamp']).toLocaleString();
    const level = this.colorizeLevel(logEntry.level);
    const message = logEntry.message;

    // Build context string
    const contextParts: string[] = [];

    if (logEntry.traceId) {
      contextParts.push(`trace=${logEntry.traceId.substring(0, 8)}`);
    }

    if (logEntry.operation) {
      contextParts.push(`op=${logEntry.operation}`);
    }

    if (logEntry.duration) {
      contextParts.push(`${logEntry.duration}ms`);
    }

    const context = contextParts.length > 0 ? ` [${contextParts.join(' ')}]` : '';

    let formatted = `${timestamp} ${level} ${message}${context}`;

    // Add error details if present
    if (logEntry.error) {
      formatted += `\n  Error: ${logEntry.error.name}: ${logEntry.error.message}`;
      if (logEntry.error.stack && this.config.environment === 'development') {
        formatted += `\n  Stack: ${logEntry.error.stack}`;
      }
    }

    // Add additional context in development
    if (this.config.environment === 'development') {
      const additionalContext = this.getAdditionalContext(logEntry);
      if (additionalContext) {
        formatted += `\n  Context: ${additionalContext}`;
      }
    }

    return formatted;
  }

  /**
   * Colorize log level for better visibility
   */
  private colorizeLevel(level: string): string {
    const colors = {
      trace: '\x1b[90m', // gray
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    };

    const reset = '\x1b[0m';
    const color = colors[level as keyof typeof colors] || '';

    return `${color}${level.toUpperCase().padEnd(5)}${reset}`;
  }

  /**
   * Extract additional context for development display
   */
  private getAdditionalContext(logEntry: LogEntry): string {
    const context: string[] = [];

    // Skip standard fields
    const skipFields = new Set([
      '@timestamp', 'level', 'message', 'service', 'version', 'environment',
      'traceId', 'spanId', 'operation', 'duration', 'error'
    ]);

    for (const [key, value] of Object.entries(logEntry)) {
      if (!skipFields.has(key) && value !== undefined && value !== null) {
        if (typeof value === 'object') {
          context.push(`${key}=${JSON.stringify(value)}`);
        } else {
          context.push(`${key}=${value}`);
        }
      }
    }

    return context.join(', ');
  }
}