# Technical Architecture

## Technology Stack

### Core Application
- **Runtime**: Node.js 20+ with TypeScript (ES2022, ESNext modules)
- **LLM Provider**: AWS Bedrock (Claude 3.5 Sonnet v2)
- **Observability**: Langfuse v3 (self-hosted) for tracing, prompt management, and metrics
- **Build System**: TypeScript compiler with tsx for development

### Infrastructure & Services
- **Container Orchestration**: Docker Compose (6 services)
- **Databases**: 
  - PostgreSQL 16 (transactional data: users, prompts, API keys)
  - ClickHouse 24.3 (OLAP: traces, observations, scores)
- **Cache & Queue**: Redis 7 (message queue + LRU cache, 256MB)
- **Blob Storage**: MinIO (S3-compatible for event payloads)
- **CI/CD**: GitLab CI/CD with Docker runners

### Testing & Evaluation
- **Evaluation Framework**: Promptfoo (YAML-declarative testing)
- **Load Testing**: k6 with GraphQL endpoint testing
- **Test Data**: Golden dataset (16 curated test cases in 4 categories)
- **Quality Gates**: Automated assertions with g-eval and JavaScript checks

## Architecture Overview

### Request Flow
```
GraphQL Client → VEEDS API → proofreadEntry() → Langfuse (prompt) → AWS Bedrock → Response Processing → Langfuse (tracing)
```

### Data Architecture
- **Single Source of Truth**: `eval/golden_dataset.json` for all test cases
- **Prompt Management**: Langfuse-hosted prompts with version control and fallback to `eval/prompt.txt`
- **Async Processing**: Langfuse uses Redis queue + worker pattern for trace ingestion
- **OLAP Analytics**: ClickHouse for fast dashboard queries on trace data

## Development Environment

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- AWS CLI configured with Bedrock access
- Git

### Setup Commands
```bash
# Environment setup
cp .env.example .env
# Edit .env with AWS credentials and Langfuse keys
./setup.sh  # Generate secrets

# Start infrastructure
docker compose up -d

# Install dependencies
npm install

# Seed Langfuse with prompts
npm run seed

# Run demo
npx tsx src/index.ts
```

### Common Development Commands
```bash
# Development
npm run dev                    # Watch mode
npm run build                  # TypeScript compilation

# Testing & Evaluation
npm run generate               # Generate tests from golden dataset
npm run eval                   # Run Promptfoo evaluation
npm run eval:assert            # CI mode (fail on threshold)
npm run test:load              # k6 load test
npm run test:load:smoke        # Quick smoke test

# Infrastructure
npm run up                     # Start Docker services
npm run down                   # Stop Docker services
npm run logs                   # Follow all logs
npm run health                 # Health check script
```

## Code Standards

### TypeScript Configuration
- **Target**: ES2022 with ESNext modules
- **Module Resolution**: Bundler (for modern Node.js)
- **Strict Mode**: Enabled with all strict checks
- **File Extensions**: Use `.js` imports for ESM compatibility

### Code Organization
- **Modular Architecture**: Separate concerns (client, proofreader, types)
- **Error Handling**: Comprehensive try-catch with structured error responses
- **Retry Logic**: Exponential backoff for Bedrock throttling
- **Async Patterns**: Promise-based with proper cleanup (shutdownAsync)

### Naming Conventions
- **Files**: kebab-case (e.g., `langfuse-client.ts`)
- **Functions**: camelCase with descriptive names
- **Types**: PascalCase interfaces with clear prefixes
- **Constants**: UPPER_SNAKE_CASE for environment variables

## Documentation Structure

### Architecture Documentation (`docs/`)
- **[GOLDEN-DATASET-ARCHITECTURE.md](../docs/GOLDEN-DATASET-ARCHITECTURE.md)**: Complete architecture documentation of the Golden Dataset integration, including data flow analysis, CI/CD workflows, and practical examples
- **[veeds-llmops-architecture-detail.md](../docs/veeds-llmops-architecture-detail.md)**: Detailed system architecture covering infrastructure, request flows, and improvement suggestions
- **[TEST-DATA-GENERATION.md](../docs/TEST-DATA-GENERATION.md)**: Comprehensive guide for automatic test data generation, including multi-source generation, validation processes, and CI/CD integration
- **[veeds-llmops-architecture-detail.html](../docs/veeds-llmops-architecture-detail.html)**: Visual architecture documentation with interactive diagrams

### Inline Documentation
- **Code Comments**: Explain complex logic and business rules
- **README Sections**: Step-by-step setup and usage guides
- **Script Headers**: Purpose and usage for each automation script

### Generated Documentation
- **Auto-Generated**: Results and reports in `eval/results/`
- **Temporary**: CI artifacts with 30-day retention
- **Structured**: JSON and YAML for machine processing

## Testing Strategy

### Test Categories (Golden Dataset)
- **True Positives (6)**: Invalid entries that must be detected
- **True Negatives (4)**: Valid entries that must pass
- **Edge Cases (3)**: Boundary conditions and ambiguous inputs
- **Adversarial (3)**: Security tests (prompt injection, YAML injection)

### Testing Frameworks
- **Unit Testing**: Built-in assertions via Promptfoo JavaScript checks
- **Integration Testing**: End-to-end via golden dataset evaluation
- **Load Testing**: k6 with GraphQL mutations (20 VUs standard, 200 VUs stress)
- **Regression Testing**: Nightly model comparison (Sonnet vs Haiku)

### Quality Gates
- **CI Pipeline**: Promptfoo evaluation must pass (exit code 0)
- **Performance**: p95 < 3s, error rate < 1%
- **Cost**: < $0.05 per request
- **Accuracy**: > 95% pass rate on golden dataset

## Deployment Process

### CI/CD Pipeline Stages
1. **Quality**: Promptfoo evaluation (blocking on MR)
2. **Performance**: k6 load testing (after quality passes)
3. **Report**: Pipeline summary and artifact collection

### Environment Strategy
- **Development**: Local Docker Compose stack
- **CI**: GitLab runners with ephemeral containers
- **Production**: Inferred from CI/CD configuration (not explicitly defined)

### Deployment Triggers
- **Merge Request**: Quality gate only
- **Main Branch**: Quality + performance testing
- **Nightly**: Full regression + stress testing + model comparison

## Performance Requirements

### Response Time Targets
- **p95 Latency**: < 3 seconds end-to-end
- **p99 Latency**: < 5 seconds
- **Timeout**: 5 seconds maximum per request

### Throughput Targets
- **Standard Load**: 20 concurrent users for 2 minutes
- **Stress Test**: 200 concurrent users for 6 minutes
- **Smoke Test**: 1 user for 10 seconds (CI validation)

### Cost Constraints
- **Per Request**: < $0.05 USD
- **Daily Budget**: Monitored via Langfuse metrics
- **Token Optimization**: 2048 max tokens, temperature 0

## Security Considerations

### Authentication & Authorization
- **AWS Bedrock**: IAM-based access with least privilege
- **Langfuse**: API key authentication with project isolation
- **Environment Variables**: Secrets managed via .env (not committed)

### Input Validation
- **YAML Sanitization**: Structured parsing with error handling
- **Prompt Injection Protection**: Tested via adversarial test cases
- **JSON Schema Validation**: Response structure validation (recommended improvement)

### Data Protection
- **PII Handling**: No personal data in vehicle specifications
- **Audit Trail**: Complete request tracing via Langfuse
- **Retention**: 30-day artifact retention in CI/CD

### Network Security
- **Internal Services**: Docker bridge network (127.0.0.1 binding)
- **External Access**: Only Langfuse web UI on port 3000
- **TLS**: HTTPS for external API calls (Bedrock, Langfuse)