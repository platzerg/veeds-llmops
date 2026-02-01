# Requirements Document

## Introduction

The VEEDS LLMOps system currently uses fragile regex-based JSON extraction from LLM responses without validating the extracted JSON structure. This creates reliability issues where LLM hallucinations or malformed responses can cause runtime errors or incorrect behavior. The Output Schema Validation feature will implement robust JSON schema validation using the ajv library to ensure all LLM responses conform to the expected ProofreadResult structure before being processed or returned to clients.

## Glossary

- **ProofreadResult**: The structured response object containing `isValid` boolean and `errors` array returned by the proofreader
- **Schema_Validator**: The ajv-based JSON schema validation component
- **LLM_Response**: Raw text response from AWS Bedrock Claude model
- **JSON_Extraction**: Process of extracting JSON from LLM response using regex
- **Schema_Violation**: When extracted JSON does not conform to the expected schema
- **Validation_Error**: Detailed error information when schema validation fails
- **Fallback_Response**: Default error response returned when validation fails

## Requirements

### Requirement 1: JSON Schema Definition

**User Story:** As a system architect, I want a comprehensive JSON schema for ProofreadResult, so that all LLM responses are validated against a consistent structure.

#### Acceptance Criteria

1. THE Schema_Validator SHALL define a JSON schema with required fields `isValid` and `errors`
2. WHEN the schema is defined, THE Schema_Validator SHALL specify `isValid` as boolean type
3. WHEN the schema is defined, THE Schema_Validator SHALL specify `errors` as array type with item schema
4. WHEN error items are defined, THE Schema_Validator SHALL require `field`, `message`, and `severity` properties
5. WHEN severity is validated, THE Schema_Validator SHALL accept only "error", "warning", or "info" values
6. THE Schema_Validator SHALL reject additional properties not defined in the schema

### Requirement 2: Response Validation Integration

**User Story:** As a developer, I want automatic validation of extracted JSON responses, so that invalid LLM outputs are caught before processing.

#### Acceptance Criteria

1. WHEN JSON is extracted from LLM response, THE Schema_Validator SHALL validate it against the ProofreadResult schema
2. WHEN validation succeeds, THE System SHALL continue with normal processing
3. WHEN validation fails, THE System SHALL generate detailed validation error messages
4. WHEN validation fails, THE System SHALL log the schema violation with full context
5. THE Schema_Validator SHALL be integrated after JSON extraction but before response processing

### Requirement 3: Error Handling and Fallback

**User Story:** As a system operator, I want graceful handling of schema validation failures, so that the system remains stable when LLM responses are malformed.

#### Acceptance Criteria

1. WHEN schema validation fails, THE System SHALL return a structured fallback response
2. WHEN returning fallback response, THE System SHALL include validation error details in logs
3. WHEN validation fails, THE System SHALL preserve the original LLM response for debugging
4. THE Fallback_Response SHALL conform to the same ProofreadResult schema
5. WHEN validation fails, THE System SHALL increment error metrics for monitoring

### Requirement 4: Performance Optimization

**User Story:** As a performance engineer, I want efficient schema validation, so that response times remain within acceptable limits.

#### Acceptance Criteria

1. THE Schema_Validator SHALL compile the JSON schema once during application startup
2. WHEN validating responses, THE Schema_Validator SHALL reuse the compiled schema
3. WHEN validation is performed, THE System SHALL complete validation within 10ms for typical responses
4. THE Schema_Validator SHALL not significantly impact memory usage during validation
5. WHEN validation errors occur, THE System SHALL provide fast error reporting without detailed traversal

### Requirement 5: Comprehensive Error Reporting

**User Story:** As a developer, I want detailed validation error information, so that I can debug and fix schema violations effectively.

#### Acceptance Criteria

1. WHEN validation fails, THE Schema_Validator SHALL provide field-level error details
2. WHEN reporting errors, THE Schema_Validator SHALL include the JSON path of invalid fields
3. WHEN validation fails, THE System SHALL log both the invalid JSON and expected schema
4. THE Validation_Error SHALL include human-readable error descriptions
5. WHEN multiple validation errors exist, THE Schema_Validator SHALL report all errors, not just the first

### Requirement 6: Langfuse Integration

**User Story:** As a system operator, I want schema validation events tracked in Langfuse, so that I can monitor validation failures and LLM response quality.

#### Acceptance Criteria

1. WHEN validation succeeds, THE System SHALL add a validation success score to the Langfuse trace
2. WHEN validation fails, THE System SHALL create a Langfuse span with validation error details
3. WHEN logging to Langfuse, THE System SHALL include schema violation metadata
4. THE System SHALL track validation failure rates as Langfuse scores
5. WHEN validation fails, THE Langfuse_Trace SHALL be marked with ERROR level

### Requirement 7: Configuration and Extensibility

**User Story:** As a system architect, I want configurable schema validation, so that the schema can be updated without code changes.

#### Acceptance Criteria

1. THE Schema_Validator SHALL load schema definitions from configuration files
2. WHEN schema configuration changes, THE System SHALL support hot-reloading of schemas
3. THE Schema_Validator SHALL support multiple schema versions for backward compatibility
4. WHEN extending schemas, THE System SHALL maintain backward compatibility with existing responses
5. THE Schema_Validator SHALL validate its own configuration schema on startup