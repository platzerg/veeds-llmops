// =============================================================================
// Logger Configuration - Environment-driven with sensible defaults
// =============================================================================

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogFormat = 'pretty' | 'json';
export type Environment = 'development' | 'production' | 'test';

export interface LoggerConfig {
  level: LogLevel;
  environment: Environment;
  format: LogFormat;
  serviceName: string;
  version: string;
  
  // Correlation settings
  enableLangfuseCorrelation: boolean;
  enableRequestCorrelation: boolean;
  traceHeaderName: string;
  
  // Performance settings
  enablePerformanceLogging: boolean;
  logMemoryUsage: boolean;
  logCpuUsage: boolean;
  
  // CloudWatch settings
  cloudWatchLogGroup: string;
  cloudWatchLogStream: string;
  maxLogSize: number;
}

/**
 * Load configuration from environment variables with sensible defaults
 */
export function loadConfig(): LoggerConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const environment = ['development', 'production', 'test'].includes(nodeEnv) 
    ? nodeEnv as Environment 
    : 'development';

  return {
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    environment,
    format: (process.env.LOG_FORMAT as LogFormat) || (environment === 'development' ? 'pretty' : 'json'),
    serviceName: process.env.LOG_SERVICE_NAME || 'veeds-proofreader',
    version: process.env.npm_package_version || '1.0.0',
    
    // Correlation
    enableLangfuseCorrelation: process.env.ENABLE_LANGFUSE_CORRELATION !== 'false',
    enableRequestCorrelation: process.env.ENABLE_REQUEST_CORRELATION !== 'false',
    traceHeaderName: process.env.TRACE_HEADER_NAME || 'x-trace-id',
    
    // Performance
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
    logMemoryUsage: process.env.LOG_MEMORY_USAGE === 'true',
    logCpuUsage: process.env.LOG_CPU_USAGE === 'true',
    
    // CloudWatch
    cloudWatchLogGroup: process.env.CLOUDWATCH_LOG_GROUP || '/veeds/proofreader',
    cloudWatchLogStream: process.env.CLOUDWATCH_LOG_STREAM || process.env.HOSTNAME || 'local',
    maxLogSize: parseInt(process.env.MAX_LOG_SIZE || '256000', 10), // 256KB
  };
}

/**
 * Validate configuration and throw descriptive errors for invalid values
 */
export function validateConfig(config: LoggerConfig): void {
  const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (!validLevels.includes(config.level)) {
    throw new Error(`Invalid LOG_LEVEL: ${config.level}. Must be one of: ${validLevels.join(', ')}`);
  }

  const validFormats: LogFormat[] = ['pretty', 'json'];
  if (!validFormats.includes(config.format)) {
    throw new Error(`Invalid LOG_FORMAT: ${config.format}. Must be one of: ${validFormats.join(', ')}`);
  }

  if (config.maxLogSize <= 0 || config.maxLogSize > 1024 * 1024) {
    throw new Error(`Invalid MAX_LOG_SIZE: ${config.maxLogSize}. Must be between 1 and 1048576 bytes`);
  }

  if (!config.serviceName.trim()) {
    throw new Error('LOG_SERVICE_NAME cannot be empty');
  }
}