# Implementation Plan: DeepEval Integration (Tier 2)

Integrate DeepEval to enhance the VEEDS LLMOps stack with rigorous metric-based testing, synthetic data generation, and advanced LLM-as-a-Judge metrics.

## Problem Statement
While Promptfoo provides excellent assertion-based testing, DeepEval adds a layer of **scientific metrics** (Faithfulness, Hallucination, RAG Triad) and **synthetic data generation** that is essential for enterprise-grade LLM applications.

## Proposed Changes

### 🔧 1. Infrastructure Layer
- **Python Runtime**: Since DeepEval is Python-based, we will add a `python/` environment.
- **Docker Integration**: Add a `deepeval-bench` service to `docker-compose.yml` that can be triggered for full-suite evaluations.

### 🧪 2. Evaluation Layer (`eval/deepeval/`)
- **Metric Definitions**:
    - `Faithfulness`: Ensure the proofreader doesn't hallucinate facts.
    - `Answer Relevancy`: Verify the output directly addresses the vehicle data issues.
    - `Hallucination`: Critical check against non-existent vehicle specs.
- **Model Wrapper**: Implement a custom class to interface DeepEval with our AWS Bedrock models via the `boto3` library.

### 🔄 3. Langfuse Synchronization
- DeepEval will be configured to push scores directly to Langfuse.
- This allows a side-by-side comparison in Langfuse: Promptfoo Assertions vs. DeepEval Scientific Metrics.

### ⚡ 4. Synthetic Data Generation
- Use DeepEval's `Synthesizer` to generate 100+ high-quality adversarial and edge-case vehicle data YAMLs to stress-test the Proofreader.

## Verification Plan

### Automated Tests
- `npm run eval:deepeval`: A new script to trigger the Python-based evaluation.
- Langfuse UI check: Verify that new metric types (Faithfulness, etc.) appear in the "Scores" section.

### Manual Verification
- Review the generated synthetic dataset for quality and diversity.
- Compare Claude 3.5 vs. 3.0 results in the DeepEval Arena.

> [!IMPORTANT]
> This requires a Python 3.9+ installation on the host or careful Docker orchestration to avoid cross-language dependency issues.
