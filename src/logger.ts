// =============================================================================
// Logger - Main export for structured logging with Pino
// =============================================================================

// Re-export everything from the logging module for easy access
export { logger, getLogger, resetLogger, Logger } from './logging/logger.ts';
export type { LogContext, BedrockOperation, PerformanceMetrics, Timer } from './logging/logger.ts';
export type { LoggerConfig, LogLevel, LogFormat, Environment } from './logging/config.ts';
export { loadConfig, validateConfig } from './logging/config.ts';
export { getContextManager } from './logging/context-manager.ts';

// Default export is the logger instance
export { logger as default } from './logging/logger.ts';