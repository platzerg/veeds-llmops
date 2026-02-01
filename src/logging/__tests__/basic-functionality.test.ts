// =============================================================================
// Basic Functionality Tests - Structured Logging with Pino
// =============================================================================
import { jest } from '@jest/globals';
import { Logger, getLogger, resetLogger } from '../logger.js';

// Mock Langfuse to avoid dynamic import issues
jest.mock('../../langfuse-client.js', () => ({
  getLangfuse: jest.fn(() => ({
    // Mock Langfuse instance
  }))
}));

describe('Basic Logger Functionality', () => {
  beforeEach(() => {
    resetLogger();
  });

  afterEach(() => {
    resetLogger();
  });

  test('Logger can be instantiated', () => {
    const logger = new Logger({ format: 'json', level: 'info' });
    expect(logger).toBeDefined();
  });

  test('Singleton logger works', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });

  test('Logger has all required methods', () => {
    const logger = getLogger();
    expect(typeof logger.trace).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });

  test('Logger has performance methods', () => {
    const logger = getLogger();
    expect(typeof logger.time).toBe('function');
    expect(typeof logger.timeEnd).toBe('function');
    expect(typeof logger.logBedrock).toBe('function');
    expect(typeof logger.logPerformance).toBe('function');
  });

  test('Logger has context methods', () => {
    const logger = getLogger();
    expect(typeof logger.child).toBe('function');
    expect(typeof logger.withTrace).toBe('function');
    expect(typeof logger.withLangfuseTrace).toBe('function');
    expect(typeof logger.withLangfuseSpan).toBe('function');
  });

  test('Timer functionality works', () => {
    const logger = getLogger();
    const timer = logger.time('test-operation');
    expect(timer).toBeDefined();
    expect(timer.label).toBe('test-operation');
    expect(typeof timer.startTime).toBe('number');
  });

  test('Error logging with Error objects', () => {
    const logger = new Logger({ format: 'json', level: 'trace' });
    
    // Mock the Pino logger to capture calls
    const mockLog = jest.fn();
    (logger as any).pinoLogger = { error: mockLog };

    const error = new Error('Test error');
    error.name = 'TestError';
    
    logger.error(error);

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Test error',
        error: expect.objectContaining({
          name: 'TestError',
          message: 'Test error',
          stack: expect.any(String),
        }),
      }),
      'Test error'
    );
  });

  test('Bedrock operation logging', () => {
    const logger = new Logger({ 
      format: 'json', 
      level: 'trace',
      enablePerformanceLogging: true
    });
    
    // Mock the Pino logger to capture calls
    const mockLog = jest.fn();
    (logger as any).pinoLogger = { info: mockLog };

    logger.logBedrock({
      model: 'claude-3-5-sonnet',
      operation: 'invoke',
      duration: 1500,
      tokenUsage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      cost: 0.025,
    });

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: expect.stringContaining('Bedrock'),
        operation: 'bedrock',
        component: 'bedrock-client',
        duration: 1500,
        model: 'claude-3-5-sonnet',
        tokenUsage: expect.objectContaining({
          inputTokens: 100,
          outputTokens: 50,
        }),
        cost: 0.025,
      }),
      expect.any(String)
    );
  });

  test('Context methods return logger instance', () => {
    const logger = getLogger();
    
    const childLogger = logger.child({ operation: 'test' });
    expect(childLogger).toBeInstanceOf(Logger);
    
    const traceLogger = logger.withTrace('trace-123', 'span-456');
    expect(traceLogger).toBe(logger); // Should return same instance
  });

  test('Configuration validation', () => {
    expect(() => {
      new Logger({ 
        format: 'json', 
        level: 'invalid' as any 
      });
    }).toThrow();
  });
});