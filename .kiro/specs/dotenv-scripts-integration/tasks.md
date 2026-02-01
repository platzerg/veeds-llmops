# Implementation Plan: dotenv-scripts-integration

## Overview

This implementation plan converts the dotenv scripts integration design into discrete coding tasks. The approach focuses on implementing both direct import and CLI wrapper methods, ensuring backward compatibility, and providing comprehensive testing coverage. Each task builds incrementally to deliver a robust environment variable loading solution.

## Tasks

- [ ] 1. Set up environment loading infrastructure
  - Update package.json dependencies to ensure dotenv and dotenv-cli are available
  - Create environment loading utility functions for validation and logging
  - Set up TypeScript configuration for proper module resolution
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 2. Implement direct import method for existing scripts
  - [ ] 2.1 Add dotenv import to seed-langfuse.ts
    - Add `import "dotenv/config"` as first line in scripts/seed-langfuse.ts
    - Verify environment variables load before existing validation logic
    - _Requirements: 1.1, 3.1, 3.3_
  
  - [ ] 2.2 Write property test for automatic environment loading
    - **Property 1: Automatic Environment Loading**
    - **Validates: Requirements 1.1, 1.3, 5.1, 5.2**
  
  - [ ] 2.3 Add dotenv import to push-scores-to-langfuse.ts
    - Add `import "dotenv/config"` as first line in scripts/push-scores-to-langfuse.ts
    - Ensure environment variables are available before Langfuse client initialization
    - _Requirements: 1.1, 3.1, 3.3_
  
  - [ ] 2.4 Add dotenv import to remaining scripts
    - Add `import "dotenv/config"` to setup-prompts-simple.ts, generate-test-data.ts, validate-test-data.ts, ci-test-pipeline.ts
    - Verify each script can access environment variables without manual sourcing
    - _Requirements: 1.1, 3.1, 3.3_

- [ ] 3. Implement CLI wrapper method for npm scripts
  - [ ] 3.1 Update package.json scripts with dotenv-cli wrapper
    - Modify npm scripts to use `dotenv -e .env -e .env.local --` prefix
    - Update seed, eval:push, dataset:upload, and other environment-dependent scripts
    - _Requirements: 3.2, 3.4_
  
  - [ ] 3.2 Write property test for integration method consistency
    - **Property 4: Integration Method Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [ ] 3.3 Implement environment file precedence handling
    - Configure dotenv-cli to load multiple environment files in correct precedence order
    - Ensure system environment variables take highest precedence
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Checkpoint - Ensure basic integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement environment precedence and validation
  - [ ] 5.1 Create environment precedence validation utility
    - Write TypeScript utility to validate environment variable precedence
    - Support .env, .env.local, .env.development file hierarchy
    - _Requirements: 1.2, 2.1, 2.2, 2.3_
  
  - [ ] 5.2 Write property test for environment precedence resolution
    - **Property 2: Environment Precedence Resolution**
    - **Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.5**
  
  - [ ] 5.3 Implement required variable validation
    - Add validation logic to check for required environment variables in each script
    - Provide clear error messages when required variables are missing
    - _Requirements: 4.3, 6.3_
  
  - [ ] 5.4 Write property test for required variable validation
    - **Property 7: Required Variable Validation**
    - **Validates: Requirements 4.3, 6.3**

- [ ] 6. Implement error handling and fallback mechanisms
  - [ ] 6.1 Add graceful degradation for missing environment files
    - Implement fallback to system environment variables when .env files don't exist
    - Ensure scripts continue execution without errors
    - _Requirements: 1.4, 4.1, 4.4_
  
  - [ ] 6.2 Write property test for graceful degradation
    - **Property 3: Graceful Degradation**
    - **Validates: Requirements 1.4, 4.1, 4.2, 4.4**
  
  - [ ] 6.3 Implement malformed file handling
    - Add error handling for malformed .env files with syntax errors
    - Log warnings and continue with valid entries
    - _Requirements: 4.2_
  
  - [ ] 6.4 Add comprehensive logging for debugging
    - Implement detailed logging for environment loading operations
    - Ensure sensitive values are never logged
    - _Requirements: 1.5, 4.5, 6.1, 6.4_
  
  - [ ] 6.5 Write property test for secure sensitive data handling
    - **Property 8: Secure Sensitive Data Handling**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

- [ ] 7. Ensure backward compatibility and security
  - [ ] 7.1 Validate backward compatibility with existing scripts
    - Test that existing scripts continue to work without modification
    - Ensure manual environment variable handling is not disrupted
    - _Requirements: 3.5_
  
  - [ ] 7.2 Implement .env.example exclusion
    - Ensure .env.example files are never loaded as configuration
    - Verify template files don't affect runtime environment
    - _Requirements: 2.4_
  
  - [ ] 7.3 Write property test for environment file exclusion
    - **Property 5: Environment File Exclusion**
    - **Validates: Requirements 2.4**
  
  - [ ] 7.4 Validate security practices compatibility
    - Test compatibility with AWS credentials and API key handling
    - Ensure existing security practices are maintained
    - _Requirements: 6.5_

- [ ] 8. Implement cross-environment consistency
  - [ ] 8.1 Add CI/CD pipeline compatibility
    - Ensure environment loading works in GitLab CI/CD contexts
    - Test with both file-based and system environment variables
    - _Requirements: 5.3, 5.4_
  
  - [ ] 8.2 Implement environment preservation logic
    - Ensure existing process.env values are preserved unless explicitly overridden
    - Maintain compatibility with system-provided environment variables
    - _Requirements: 2.5_
  
  - [ ] 8.3 Write property test for cross-environment compatibility
    - **Property 6: Cross-Environment Compatibility**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 9. Integration testing and validation
  - [ ] 9.1 Create comprehensive integration tests
    - Test end-to-end script execution with both integration methods
    - Validate npm run commands work with dotenv-cli wrapper
    - _Requirements: 5.1, 5.2_
  
  - [ ] 9.2 Write property test for comprehensive secure logging
    - **Property 9: Comprehensive Secure Logging**
    - **Validates: Requirements 1.5, 4.5, 5.5**
  
  - [ ] 9.3 Validate CI/CD pipeline integration
    - Test that existing GitLab CI/CD configurations continue to work
    - Ensure environment loading works in containerized environments
    - _Requirements: 5.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Integration tests validate end-to-end functionality
- The implementation maintains backward compatibility with existing scripts
- Security considerations are integrated throughout the implementation process