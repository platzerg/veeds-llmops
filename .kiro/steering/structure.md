# Project Structure

## Directory Layout

```
veeds-llmops/
├── .env.example                # Environment template
├── .env                        # Local secrets (not in Git)
├── .gitignore                  # Git exclusions
├── .gitlab-ci.yml              # CI/CD pipeline definition
├── docker-compose.yml          # Langfuse v3 infrastructure (6 services)
├── package.json                # Dependencies and npm scripts
├── package-lock.json           # Locked dependency versions
├── promptfooconfig.yaml        # Promptfoo evaluation configuration
├── README.md                   # Comprehensive setup guide
├── setup.sh                    # Secret generation script
├── tsconfig.json               # TypeScript configuration
├── test-generation.md          # Test data generation documentation
├── test-setup.js               # Test setup utilities
│
├── .kiro/                      # Kiro IDE configuration
│   ├── documentation/          # Auto-generated docs
│   ├── prompts/               # Custom prompts
│   └── steering/              # Project guidance (this file)
│
├── .vscode/                    # VS Code settings
│
├── docs/                       # Architecture documentation
│   ├── GOLDEN-DATASET-ARCHITECTURE.md    # Detailed dataset architecture
│   ├── TEST-DATA-GENERATION.md           # Test generation guide
│   ├── veeds-llmops-architecture-detail.html  # Visual architecture
│   └── veeds-llmops-architecture-detail.md    # Complete architecture docs
│
├── eval/                       # Evaluation and testing
│   ├── generate-promptfoo-tests.ts       # Golden dataset → Promptfoo converter
│   ├── generated-tests.yaml              # Auto-generated test cases
│   ├── golden_dataset.json               # Single source of truth (16 test cases)
│   ├── prompt.txt                        # Prompt template (fallback)
│   ├── results/                          # Evaluation results
│   │   └── .gitkeep
│   └── upload-dataset-to-langfuse.ts     # Dataset uploader
│
├── scripts/                    # Automation and utilities
│   ├── ci-test-pipeline.ts               # Complete CI pipeline runner
│   ├── generate-test-data.ts             # Test data generation
│   ├── health-check.sh                   # Infrastructure health check
│   ├── push-scores-to-langfuse.ts        # Score bridge (Promptfoo → Langfuse)
│   ├── seed-langfuse.ts                  # Langfuse initialization
│   ├── setup-prompts-simple.ts           # Simple prompt setup
│   └── validate-test-data.ts             # Test data validation
│
├── src/                        # Application source code
│   ├── index.ts                          # Demo entry point
│   ├── langfuse-client.ts                # Langfuse singleton client
│   └── proofreader.ts                    # Core proofreading logic
│
└── tests/                      # Load and performance tests
    └── load/
        └── graphql-test.js               # k6 load testing script
```

## File Naming Conventions

### TypeScript Files
- **kebab-case**: `langfuse-client.ts`, `generate-test-data.ts`
- **Extensions**: `.ts` for source, `.js` imports for ESM compatibility
- **Descriptive Names**: Function-based naming (e.g., `push-scores-to-langfuse.ts`)

### Configuration Files
- **Standard Names**: `package.json`, `tsconfig.json`, `docker-compose.yml`
- **Tool-Specific**: `promptfooconfig.yaml`, `.gitlab-ci.yml`
- **Environment**: `.env.example` (template), `.env` (local secrets)

### Documentation
- **UPPERCASE**: `README.md` for main documentation
- **Descriptive**: `GOLDEN-DATASET-ARCHITECTURE.md` for specific topics
- **Format Suffix**: `.md` for Markdown, `.html` for generated docs

### Data Files
- **snake_case**: `golden_dataset.json` for data files
- **Descriptive**: `generated-tests.yaml` indicates auto-generated content
- **Extension Match**: `.json` for JSON, `.yaml` for YAML, `.txt` for plain text

## Module Organization

### Core Application (`src/`)
- **Single Responsibility**: Each file has one primary concern
- **Client Pattern**: `langfuse-client.ts` provides singleton access
- **Business Logic**: `proofreader.ts` contains main application logic
- **Demo/Testing**: `index.ts` for demonstration and manual testing

### Evaluation System (`eval/`)
- **Golden Dataset**: `golden_dataset.json` as single source of truth
- **Code Generation**: TypeScript scripts generate test configurations
- **Template System**: `prompt.txt` for prompt management
- **Results Storage**: `results/` directory for evaluation outputs

### Automation (`scripts/`)
- **Infrastructure**: Setup and health checking scripts
- **Data Pipeline**: Test generation and validation
- **Integration**: Bridges between tools (Promptfoo ↔ Langfuse)
- **CI/CD**: Complete pipeline automation

### Testing (`tests/`)
- **Load Testing**: k6 scripts for performance validation
- **Organized by Type**: `load/` subdirectory for load tests
- **Tool-Specific**: Each testing tool has its own subdirectory

## Configuration Files

### Environment Configuration
- **`.env.example`**: Template with all required variables
- **`.env`**: Local secrets (never committed)
- **Location**: Project root for easy access

### Build Configuration
- **`tsconfig.json`**: TypeScript compiler settings
- **`package.json`**: Dependencies, scripts, and metadata
- **Target**: Modern Node.js (ES2022, ESNext modules)

### Tool Configuration
- **`promptfooconfig.yaml`**: Evaluation framework settings
- **`docker-compose.yml`**: Infrastructure definition
- **`.gitlab-ci.yml`**: CI/CD pipeline stages and jobs

### IDE Configuration
- **`.vscode/`**: VS Code specific settings
- **`.kiro/`**: Kiro IDE configuration and steering

## Documentation Structure

### Architecture Documentation (`docs/`)
- **Comprehensive**: Detailed system architecture and data flows
- **Visual**: HTML versions with diagrams and charts
- **Specific Topics**: Dedicated files for complex subsystems

### Inline Documentation
- **Code Comments**: Explain complex logic and business rules
- **README Sections**: Step-by-step setup and usage guides
- **Script Headers**: Purpose and usage for each automation script

### Generated Documentation
- **Auto-Generated**: Results and reports in `eval/results/`
- **Temporary**: CI artifacts with 30-day retention
- **Structured**: JSON and YAML for machine processing

## Asset Organization

### Static Assets
- **Minimal**: No traditional web assets (images, CSS, JS)
- **Configuration**: YAML and JSON configuration files
- **Templates**: Text templates for prompts and tests

### Generated Assets
- **Test Results**: JSON files in `eval/results/`
- **Build Artifacts**: TypeScript compilation output (not committed)
- **Docker Volumes**: Persistent data for infrastructure services

## Build Artifacts

### TypeScript Compilation
- **Output Directory**: `dist/` (excluded from Git)
- **Source Maps**: Generated for debugging
- **Declaration Files**: `.d.ts` files for type information

### Docker Volumes
- **Persistent Data**: Database and cache storage
- **Named Volumes**: Prefixed with `langfuse_`
- **Lifecycle**: Managed by Docker Compose

### CI/CD Artifacts
- **Evaluation Results**: JSON files with 30-day retention
- **Performance Reports**: k6 results for GitLab integration
- **Pipeline Logs**: Stored in GitLab CI system

## Environment-Specific Files

### Development Environment
- **Local Docker**: `docker-compose.yml` for full stack
- **Environment Variables**: `.env` for local secrets
- **Development Scripts**: `npm run dev` for watch mode

### CI/CD Environment
- **GitLab Variables**: Secrets managed in GitLab CI/CD
- **Ephemeral Containers**: Fresh environment per pipeline
- **Artifact Storage**: Results stored in GitLab

### Production Environment
- **Inferred Configuration**: Based on CI/CD patterns
- **Environment Variables**: Managed externally
- **Monitoring**: Langfuse dashboard for observability

## Import/Export Patterns

### ES Module Imports
- **File Extensions**: Use `.js` in imports for ESM compatibility
- **Relative Paths**: `./` for same directory, `../` for parent
- **Named Exports**: Prefer named exports over default exports

### Configuration Loading
- **Environment Variables**: `process.env` with fallbacks
- **File System**: `readFileSync` for templates and configuration
- **Dynamic Imports**: `import()` for conditional loading

### Data Exchange
- **JSON**: Structured data exchange between tools
- **YAML**: Human-readable configuration files
- **Text Templates**: Simple string replacement for prompts