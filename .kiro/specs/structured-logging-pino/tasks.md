# Implementation Plan: Structured Logging with Pino

## Overview

This implementation plan converts the VEEDS Proofreader from console-based logging to production-ready structured logging using Pino. The approach prioritizes incremental integration, starting with core logging infrastructure, then adding Langfuse correlation, CloudWatch optimization, and finally migrating all existing console calls. Each step builds on the previous to ensure a working system throughout the implementation.

## Tasks

- [x] 1. Set up Pino logging infrastructure and configuration
  - Install Pino dependencies and configure TypeScript types
  - Create logger configuration system with environment variable support
  - Implement base logger singleton with standard log levels
  - Set up development vs production formatting (pretty vs JSON)
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 8.1_

- [x] 2. Implement Langfuse trace correlation
  - [x] 2.1 Create context manager for trace extraction
    - Build context manager to extract trace/span IDs from Langfuse client
    - Implement async context storage for trace correlation
    - Add manual trace context setting methods
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 2.2 Write property test for trace correlation
    - **Property 5: Trace Correlation Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.6**
  
  - [x] 2.3 Implement graceful degradation without trace context
    - Handle missing Langfuse context gracefully
    - Ensure logging works normally when no trace is active
    - Add fallback mechanisms for context extraction failures
    - _Requirements: 2.4, 7.2_
  
  - [x] 2.4 Write property test for context preservation
    - **Property 6: Trace Context Preservation**
    - **Validates: Requirements 2.5**

- [x] 3. Add CloudWatch optimization and performance monitoring
  - [x] 3.1 Implement CloudWatch-compatible log formatting
    - Create JSON formatter with CloudWatch field name compliance
    - Implement object flattening to dot-notation for nested data
    - Add log size limiting to stay under 256KB CloudWatch limit
    - Include @timestamp field in ISO 8601 format
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.2 Write property test for CloudWatch compliance
    - **Property 8: CloudWatch Optimization**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
  
  - [x] 3.3 Implement performance and cost logging
    - Add Bedrock operation logging with duration, tokens, and cost
    - Implement YAML processing performance metrics
    - Add memory and CPU usage monitoring capabilities
    - Create structured performance metrics format
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7_
  
  - [x] 3.4 Write property test for performance metrics
    - **Property 9: Performance Metrics Logging**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6**

- [x] 4. Checkpoint - Ensure core logging infrastructure works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement comprehensive error handling and context
  - [x] 5.1 Create structured error logging with full context
    - Implement error logging with stack traces in structured format
    - Add request context capture (input size, model parameters, user context)
    - Create retry attempt logging with backoff timing details
    - Add correlation ID support for cross-service tracking
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [x] 5.2 Write property test for error context completeness
    - **Property 10: Comprehensive Error Context**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**
  
  - [x] 5.3 Add debugging support for parsing failures
    - Log raw responses when JSON parsing fails
    - Include timing breakdown for timeout scenarios
    - Add environment context (region, version, container ID)
    - _Requirements: 5.4, 5.6, 5.7_

- [x] 6. Enhance development experience
  - [x] 6.1 Implement pretty printing for development
    - Create colorized pretty formatter for development mode
    - Add readable timestamps in local timezone
    - Implement error and warning highlighting
    - Ensure structured data consistency across formats
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 6.2 Write property test for development experience
    - **Property 11: Development Experience Enhancement**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [x] 6.3 Add helper methods and TypeScript integration
    - Create helper methods for common logging patterns
    - Ensure full TypeScript type support and IDE integration
    - Add log level filtering via environment variables
    - _Requirements: 6.4, 6.6, 6.7_

- [x] 7. Create migration utilities and console replacement
  - [x] 7.1 Build console.* replacement methods
    - Implement drop-in replacements for console.log, console.warn, console.error
    - Ensure API compatibility with existing console usage patterns
    - Add backward compatibility support during migration
    - _Requirements: 7.1, 7.5_
  
  - [x] 7.2 Write property test for API compatibility
    - **Property 13: API Compatibility**
    - **Validates: Requirements 7.1**
  
  - [x] 7.3 Create migration utilities for bulk replacement
    - Build automated tools to replace console.* calls with logger calls
    - Ensure integration with existing error handling patterns
    - Verify compatibility with health check and monitoring endpoints
    - _Requirements: 7.4, 7.6, 7.7_
  
  - [x] 7.4 Write property test for integration compatibility
    - **Property 14: Integration Compatibility**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.7**

- [x] 8. Implement advanced configuration and output management
  - [x] 8.1 Add runtime configuration and multiple outputs
    - Implement runtime log level adjustment without restart
    - Support multiple output destinations (stdout, files, streams)
    - Add log rotation and retention policies
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [x] 8.2 Implement sampling and deployment metadata
    - Add sampling support for high-volume debug logs
    - Include deployment metadata (version, commit, environment)
    - Ensure configuration validation with fast failure
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [x] 8.3 Write property test for configuration flexibility
    - **Property 12: Configuration Flexibility**
    - **Validates: Requirements 1.7, 8.1, 8.2, 8.7**

- [x] 9. Migrate existing codebase from console logging
  - [x] 9.1 Replace console calls in proofreader.ts
    - Replace console.warn in retry logic with structured error logging
    - Add performance logging for Bedrock operations
    - Include trace correlation in all log calls
    - _Requirements: 1.3, 4.1, 5.2_
  
  - [x] 9.2 Update Langfuse client integration
    - Ensure logger works with existing Langfuse client without modifications
    - Add logging for Langfuse operations (prompt loading, trace creation)
    - Verify trace correlation works end-to-end
    - _Requirements: 7.2_
  
  - [x] 9.3 Update remaining application files
    - Replace any remaining console.* calls throughout the codebase
    - Add structured logging to health checks and monitoring
    - Ensure all error handling includes proper logging
    - _Requirements: 1.3, 7.7_

- [x] 10. Performance validation and optimization
  - [x] 10.1 Write property test for performance constraints
    - **Property 4: Performance Constraint**
    - **Validates: Requirements 1.6**
  
  - [x] 10.2 Write property test for log format consistency
    - **Property 1: Log Format Consistency**
    - **Validates: Requirements 1.1, 1.2, 6.5**
  
  - [x] 10.3 Write property test for standard field completeness
    - **Property 2: Standard Field Completeness**
    - **Validates: Requirements 1.4, 3.3**

- [x] 11. Final integration and testing
  - [x] 11.1 Integration testing with full stack
    - Test logger with complete Docker Compose infrastructure
    - Verify CloudWatch log ingestion works correctly
    - Test Langfuse correlation in production-like environment
    - _Requirements: 3.6, 3.7_
  
  - [x] 11.2 Write integration tests for end-to-end logging
    - Test complete request flow with structured logging
    - Verify trace correlation across async operations
    - Test error scenarios and recovery patterns
  
  - [x] 11.3 Update documentation and configuration
    - Update README with logging configuration instructions
    - Document environment variables and configuration options
    - Add troubleshooting guide for common logging issues
    - Create CloudWatch Insights query examples

- [x] 12. Final checkpoint - Ensure all tests pass and system is production-ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Migration is done incrementally to maintain system stability
- Performance testing ensures the 5ms per log call requirement is met