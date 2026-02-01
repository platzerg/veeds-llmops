// =============================================================================
// Logger - Main export for structured logging with Pino
// =============================================================================

// Re-export everything from the logging module for easy access
export { logger, getLogger, resetLogger, Logger } from './logging/logger.js';
export type { LogContext, BedrockOperation, PerformanceMetrics, Timer } from './logging/logger.js';
export type { LoggerConfig, LogLevel, LogFormat, Environment } from './logging/config.js';
export { loadConfig, validateConfig } from './logging/config.js';
export { getContextManager } from './logging/context-manager.js';

// Default export is the logger instance
export { logger as default } from './logging/logger.js';