# Task: DeepEval Integration (Tier 2 LLMOps Evolution)

This task tracks the integration of [DeepEval](https://deepeval.com) into the VEEDS LLMOps stack for advanced metric-based evaluations, synthetic data generation, and LLM-as-a-Judge benchmarking.

## Phase 1: Environment & Foundation
- [ ] Create `eval/deepeval/` directory structure
- [ ] Set up Python environment/requirements for DeepEval
- [ ] Configure `docker-compose.yml` for DeepEval (Confident AI / Local Python Runner)
- [ ] Implement Bedrock Model Wrapper for DeepEval

## Phase 2: Metric Implementation (Proofreader Focus)
- [ ] Implement **Faithfulness & Relevancy** metrics
- [ ] Implement **Hallucination & Bias** detection
- [ ] Set up **LLM-as-a-Judge (Arena)** for model comparison (Claude 3.5 vs others)

## Phase 3: Data & Sync
- [ ] Map `golden_dataset.json` to DeepEval test cases
- [ ] Implement **Synthetic Data Generation** script using DeepEval
- [ ] Configure automatic export of scores to **Langfuse**

## Phase 4: Verification
- [ ] Run benchmark suite via DeepEval
- [ ] Verify Langfuse dashboard shows DeepEval scores
- [ ] Update README with Tier 2 instructions
