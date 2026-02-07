# LLM Toolkit - Codebase Prime Report

**Generated:** 2026-02-07  
**Location:** `c:\Dev\ai\projects\llmqu\llm-toolkit`

---

## Project Overview

### Purpose and Type
This is a **multi-module LLM evaluation and observability toolkit** designed for enterprise-grade LLM testing, evaluation, and monitoring. The workspace contains 4 distinct submodules focused on:

1. **Golden Dataset Generation** for GraphQL query testing
2. **LLM-based YAML Proofreading** with full observability
3. **Comprehensive LLM Evaluation Framework** with tracing
4. **Remote Agentic Coding Platform** (in planning/documentation phase)

### Primary Technologies
- **Runtime:** Node.js 18+ with TypeScript (ES2022, ESNext modules)
- **LLM Providers:** AWS Bedrock (Claude 3.5 Sonnet, Claude Opus 4.5), OpenAI, Anthropic
- **Observability:** Langfuse v3, OpenTelemetry, Jaeger, Grafana Tempo
- **Testing:** Promptfoo, k6, Vitest, Gatling
- **Infrastructure:** Docker Compose, PostgreSQL, ClickHouse, Redis, MinIO

### Current State
- **Not a Git Repository** - This workspace is not initialized as a git repository
- **Multi-Module Structure** - Contains 3 active TypeScript projects + documentation
- **Production-Ready** - Includes full CI/CD pipelines and observability stack

---

## Architecture

### Overall Structure
```
llm-toolkit/
├── .agents/                    # Agent configuration and PRD
├── .claude/                    # Claude-specific commands
├── docs/                       # Architecture documentation
├── golden-retriever/           # Golden dataset generator
├── llm-eval-observability-toolkit/  # Evaluation framework
└── veeds-llmops/              # YAML proofreader with LLMOps
```

### Key Architectural Patterns

#### 1. **Modular Submodule Architecture**
Each submodule is self-contained with its own:
- `package.json` and dependencies
- TypeScript configuration
- Docker Compose setup
- Evaluation configs

#### 2. **Unified Observability**
All modules integrate with:
- **Langfuse v3** for LLM-specific tracing
- **OpenTelemetry** for distributed tracing
- **Dual-export** capability (Jaeger local + AWS X-Ray cloud)

#### 3. **Golden Dataset Pattern**
```
Generate → Validate → Verify → Test → Evaluate
```

#### 4. **LLMOps Stack**
```
Application → Bedrock → Langfuse → Promptfoo → k6
     ↓           ↓          ↓          ↓        ↓
  Runtime    LLM API   Tracing   Evaluation  Load Test
```

### Important Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `.agents/` | Agent configuration, PRD, reference docs | `PRD.md`, `archon-rules.md` |
| `.claude/commands/` | Claude command system | `prime.md`, `execute.md`, `plan-feature.md` |
| `docs/` | Architecture documentation | `Technical-Architecture-All-Submodules.md` |
| `golden-retriever/src/` | Dataset generation logic | `main.ts`, `query-generator.ts` |
| `veeds-llmops/src/` | Proofreader application | `proofreader.ts`, `langfuse-client.ts` |
| `llm-eval-observability-toolkit/` | Evaluation framework | Various promptfoo configs |

---

## Tech Stack

### Languages and Versions
- **TypeScript 5.3+** (ES2022, ESNext modules)
- **Node.js 18+** (required)
- **Python** (for some assertions)
- **Scala** (for Gatling load tests)

### Frameworks and Major Libraries

#### LLM \u0026 AI
- `@aws-sdk/client-bedrock-runtime` ^3.700.0
- `@aws-sdk/client-bedrock-agentcore` ^3.978.0
- `langfuse` ^3.0.0
- `promptfoo` ^0.120.20

#### Observability
- `@opentelemetry/api` ^1.9.0
- `@opentelemetry/sdk-trace-node` ^1.30.0
- `@opentelemetry/exporter-trace-otlp-http` ^0.57.0
- `@opentelemetry/id-generator-aws-xray` ^1.2.3

#### Utilities
- `commander` ^12.0.0 (CLI)
- `pino` ^10.3.0 (logging)
- `uuid` ^10.0.0

### Build Tools and Package Managers
- **npm** (primary package manager)
- **tsx** ^4.16.0 (TypeScript execution)
- **tsc** (TypeScript compiler)
- **Docker Compose** (orchestration)

### Testing Frameworks
- **Promptfoo** - LLM evaluation and testing
- **Vitest** ^2.0.0 - Unit testing
- **k6** - Load and performance testing
- **Gatling** - Scala-based performance testing
- **fast-check** ^4.5.3 - Property-based testing

---

## Core Principles

### Code Style and Conventions
1. **TypeScript Strict Mode** - All projects use strict TypeScript
2. **ES Modules** - `"type": "module"` in all package.json files
3. **Async/Await** - Modern async patterns throughout
4. **Functional Composition** - Modular, composable functions
5. **Error Handling** - Exponential backoff, graceful degradation

### Documentation Standards
1. **Comprehensive READMEs** - Each submodule has detailed README
2. **Inline Comments** - TypeScript interfaces well-documented
3. **Architecture Diagrams** - ASCII art and Mermaid diagrams
4. **Step-by-Step Guides** - Complete setup instructions

### Testing Approach
1. **Golden Dataset Testing** - Reference datasets for validation
2. **LLM-as-Judge** - AI-powered evaluation
3. **Multi-Level Testing:**
   - Unit tests (Vitest)
   - Integration tests (Promptfoo)
   - Load tests (k6)
   - Security tests (Red Team)
4. **Observability-First** - All tests traced and monitored

---

## Current State

### Active Branch
⚠️ **Not a Git repository** - This workspace is not under version control

### Recent Development Focus
Based on the documentation and structure:

1. **Golden Dataset Generation** - Automated test case generation for GraphQL APIs
2. **Langfuse Integration** - Full observability stack with Langfuse v3
3. **Promptfoo Evaluation** - Comprehensive LLM testing framework
4. **OpenTelemetry Tracing** - Dual-export to Jaeger and AWS X-Ray
5. **Remote Agentic Coding Platform** - Planning phase (PRD complete)

### Immediate Observations

#### ✅ Strengths
- **Comprehensive Documentation** - Excellent README files and architecture docs
- **Production-Ready** - Full CI/CD, observability, and testing infrastructure
- **Modular Design** - Clean separation of concerns across submodules
- **Modern Stack** - Latest TypeScript, Node.js, and tooling
- **Enterprise-Grade** - Langfuse, OpenTelemetry, AWS Bedrock integration

#### ⚠️ Concerns
1. **No Git Repository** - Workspace is not version controlled
2. **Multiple Package.json** - 3 separate Node.js projects (intentional but requires coordination)
3. **Complex Setup** - Requires Docker Compose, AWS credentials, multiple services
4. **Documentation Spread** - Important info across multiple README files

#### 🔍 Key Files to Review
- `.agents/PRD.md` - Remote Agentic Coding Platform specification (934 lines)
- `docs/Technical-Architecture-All-Submodules.md` - Complete architecture overview
- `veeds-llmops/README.md` - LLMOps stack guide (616 lines)
- `llm-eval-observability-toolkit/README.md` - Evaluation framework guide (1928 lines)

---

## Submodule Details

### 1. Golden Retriever
**Purpose:** Automated golden dataset generation for GraphQL query testing

**Key Components:**
- Archetype Generator (LLM-based)
- Query Generator (GraphQL)
- Paraphraser (5 variants per query)
- Validator \u0026 Verifier

**Tech Stack:** TypeScript, AWS Bedrock, Commander CLI

**Entry Point:** `src/main.ts`

---

### 2. VEEDS LLMOps
**Purpose:** Production LLM-based YAML proofreading with full observability

**Key Components:**
- Proofreader (Bedrock + Langfuse)
- Test Generator (automatic test cases)
- CI Pipeline (full automation)
- Load Testing (k6)

**Tech Stack:** TypeScript, Langfuse v3, Promptfoo, k6, Docker Compose

**Infrastructure:**
- Langfuse Web (port 3000)
- PostgreSQL (users, prompts)
- ClickHouse (traces, scores)
- Redis (queue)
- MinIO (S3 storage)

**Entry Point:** `src/index.ts`

---

### 3. LLM Eval Observability Toolkit
**Purpose:** Comprehensive LLM evaluation framework with tracing

**Key Features:**
- 17 Promptfoo features demonstrated
- Custom OTEL provider
- Dual-export tracing (Jaeger + X-Ray)
- Red Team security testing
- ASTRO GraphQL golden dataset testing

**Tech Stack:** TypeScript, Promptfoo, OpenTelemetry, Jaeger, Grafana

**Configurations:** 12+ promptfoo config files for different scenarios

---

### 4. Remote Agentic Coding Platform (Planning)
**Status:** PRD complete, implementation pending

**Purpose:** Remote coding assistant platform with Slack/Telegram/GitHub integration

**Key Concepts:**
- Generic command system
- Session management
- Multi-platform adapters
- AI assistant clients (Claude, Codex)

**Database Schema:** 3 tables (conversations, codebases, sessions)

---

## Environment Setup

### Required Environment Variables

```env
# AWS Bedrock
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=yyy

# Langfuse (veeds-llmops)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://localhost:3000

# Platform Streaming (veeds-llmops)
TELEGRAM_STREAMING_MODE=stream
SLACK_STREAMING_MODE=stream
GITHUB_STREAMING_MODE=batch
```

### Docker Services

**VEEDS LLMOps Stack:**
- Langfuse Web (3000)
- Langfuse Worker (3030)
- PostgreSQL (5432)
- ClickHouse (8123/9000)
- Redis (6379)
- MinIO (9090/9091)

**Tracing Stack:**
- Jaeger (16686)
- ADOT Collector (4317/4318)
- Grafana (3000)
- Tempo (3200)

---

## Getting Started

### Quick Start Commands

```bash
# VEEDS LLMOps
cd veeds-llmops
npm install
docker compose up -d
npm run eval

# Golden Retriever
cd golden-retriever
npm install
npm run generate

# LLM Eval Toolkit
cd llm-eval-observability-toolkit
npm install
npm run eval
```

### Common Workflows

#### 1. Run Evaluation
```bash
cd veeds-llmops
npm run eval              # Run evaluation
npm run eval:view         # View results
npm run eval:assert       # CI mode with assertions
```

#### 2. Generate Test Data
```bash
cd veeds-llmops
npm run generate          # Generate test cases
npm run generate:validate # Generate + validate
```

#### 3. Load Testing
```bash
cd veeds-llmops
npm run test:load:smoke   # Quick smoke test
npm run test:load         # Standard load test
npm run test:load:stress  # Stress test
```

#### 4. Tracing
```bash
cd veeds-llmops
npm run tracing:start     # Start Jaeger
npm run eval:astro-jaeger # Run with tracing
npm run tracing:jaeger    # Open Jaeger UI
```

---

## Integration Points

### Cross-Module Integration
```
golden-retriever → Generates → Golden Dataset (JSON)
                                      ↓
                              Used by ↓
                    ┌─────────────────┴──────────────┐
                    ↓                                ↓
            veeds-llmops                  llm-eval-toolkit
            (Proofreader)                 (Evaluation)
                    ↓                                ↓
                    └─────────→ Langfuse/OTEL ←─────┘
                              (Unified Observability)
```

### External Integrations
- **AWS Bedrock** - Primary LLM provider
- **Langfuse Cloud** - Optional hosted observability
- **AWS X-Ray** - Cloud tracing
- **GitHub/Slack/Telegram** - Platform adapters (planned)

---

## Next Steps

### Recommended Actions

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LLM Toolkit"
   ```

2. **Review Environment Setup**
   - Ensure AWS credentials are configured
   - Set up Langfuse API keys
   - Configure Docker Compose

3. **Run Health Checks**
   ```bash
   cd veeds-llmops
   docker compose up -d
   npm run health
   ```

4. **Explore Documentation**
   - Read `.agents/PRD.md` for Remote Agentic Coding Platform
   - Review `docs/Technical-Architecture-All-Submodules.md`
   - Check individual submodule READMEs

---

## Summary

This is a **sophisticated, enterprise-grade LLM evaluation and observability toolkit** with:

- ✅ **3 Production-Ready Submodules** (golden-retriever, veeds-llmops, llm-eval-toolkit)
- ✅ **Comprehensive Observability** (Langfuse v3, OpenTelemetry, Jaeger, X-Ray)
- ✅ **Full Testing Stack** (Promptfoo, k6, Vitest, Red Team)
- ✅ **Modern TypeScript** (ES2022, strict mode, async/await)
- ✅ **Docker-Based Infrastructure** (PostgreSQL, ClickHouse, Redis, MinIO)
- ✅ **Excellent Documentation** (detailed READMEs, architecture diagrams)

**Primary Use Cases:**
1. Generate golden datasets for GraphQL API testing
2. LLM-based YAML validation with full tracing
3. Comprehensive LLM evaluation and testing
4. Remote agentic coding platform (planned)

**Recommended for:** Teams building production LLM applications that need robust testing, evaluation, and observability infrastructure.

---

*Report generated by Antigravity AI Agent*  
*Timestamp: 2026-02-07T16:44:21+01:00*
