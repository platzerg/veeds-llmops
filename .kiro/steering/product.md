# Product Overview

## Product Purpose
VEEDS Proofreader is an LLM-powered quality assurance system for YAML vehicle data validation. It uses Claude 3.5 Sonnet via AWS Bedrock to automatically detect errors in vehicle component specifications, ensuring data quality before ingestion into the VEEDS system.

## Target Users
- **Vehicle Data Engineers**: Primary users who need to validate YAML entries for vehicle components
- **Quality Assurance Teams**: Teams responsible for ensuring data integrity in automotive databases
- **DevOps Engineers**: Teams managing the LLMOps pipeline and evaluation infrastructure

## Key Features
- **Intelligent YAML Validation**: Detects format errors, missing fields, invalid units, and logical inconsistencies
- **Multi-language Support**: Handles both German and English error messages and field names
- **Comprehensive Observability**: Full request tracing via Langfuse with cost, latency, and quality metrics
- **Automated Testing Pipeline**: Golden dataset-driven evaluation with Promptfoo and k6 load testing
- **Prompt Management**: Centralized prompt versioning and A/B testing through Langfuse
- **Production-Ready**: Retry logic, fallback mechanisms, and performance monitoring

## Business Objectives
- **Data Quality**: Ensure 99%+ accuracy in vehicle data validation before database ingestion
- **Cost Efficiency**: Optimize LLM usage costs while maintaining quality standards
- **Operational Excellence**: Maintain <3s p95 response times with comprehensive monitoring
- **Continuous Improvement**: Enable rapid prompt iteration and model comparison

## User Journey
1. **Data Submission**: Vehicle data engineers submit YAML entries for validation
2. **LLM Processing**: System processes entries through Claude 3.5 Sonnet with structured prompts
3. **Error Detection**: System identifies field-level errors with severity classification
4. **Result Delivery**: Users receive structured validation results with actionable error messages
5. **Quality Monitoring**: All interactions are traced and monitored for continuous improvement

## Success Criteria
- **Accuracy**: >95% precision and recall on golden dataset test cases
- **Performance**: <3s p95 response time for validation requests
- **Reliability**: >99.9% uptime with graceful degradation
- **Cost Control**: <$0.05 per validation request
- **Quality Gates**: All CI/CD evaluations must pass before deployment