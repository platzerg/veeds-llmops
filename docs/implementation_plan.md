# Implementation Plan: LLMOps Evolution Tier 1

This plan covers the implementation of the three most critical improvements for the `veeds-llmops` stack to accelerate development and increase observability as suggested in recent industry research.

## 1. Native Langfuse Prompt Integration
**Goal**: Remove local `prompt.txt` as the source of truth for evaluation and use Langfuse's managed prompts directly.

### Proposed Changes
#### [MODIFY] [promptfooconfig.yaml](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/promptfooconfig.yaml)
- Change `prompts` section from local file to `langfuse://veeds-proofreader@production`.
- This ensures that `npm run eval` always tests against the exact same version that is labeled "production" in the UI.

---

## 2. Structured Logging with Pino & Trace-ID Correlation
**Goal**: Link every log line to a specific Langfuse trace, enabling sub-second debugging of production issues.

### Proposed Changes
#### [NEW] [logger.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/logging/logger.ts)
- Implement a `Pino` logger singleton.
- Add a middleware or helper that injects `traceId` from the Langfuse context into the log metadata.

#### [MODIFY] [proofreader.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/proofreader.ts)
- Replace `console.log` with the new structured logger.
- Log critical steps: "Prompt loaded", "Bedrock call started", "Parsing successful".

---

## 3. "Full Circle" Feedback Loop (Data Flywheel)
**Goal**: Automatically turn "interesting" production traces into evaluation test cases.

### Proposed Changes
#### [NEW] [export-production-traces.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/scripts/export-production-traces.ts)
- A script using the Langfuse SDK to fetch traces with specific tags (e.g., `needs_review`, `low_score`).
- Map the Input/Output components of the trace to the `golden_dataset.json` format.
- Append new cases to `eval/golden_dataset.json` so they are included in the next `npm run eval`.

---

---

## 4. PII Protection with Microsoft Presidio (German Support)
**Goal**: Automatically detect and redact German PII (names, addresses, phone numbers) from YAML entries before sending them to the LLM.

### Proposed Changes
#### [MODIFY] [docker-compose.yml](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/docker-compose.yml)
- Add `presidio-analyzer` service with `de_core_news_lg` model.
- Add `presidio-anonymizer` service.

#### [NEW] [pii-filter.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/privacy/pii-filter.ts)
- Implement a client to call the Presidio REST API.
- Function `anonymizeYaml(yaml: string): Promise<string>` that replaces sensitive data with placeholders (e.g., `<PERSON>`).

#### [MODIFY] [proofreader.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/proofreader.ts)
- Integrate the PII filter as the first step in the `proofreadEntry` function.
- Log PII detection events (without logging the actual PII).

---

## 5. Advanced Cost Tracking
**Goal**: Calculate and report the exact cost of each LLM call to Langfuse and include it in structured logs for financial observability.

### Proposed Changes
#### [NEW] [cost-calculator.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/monitoring/cost-calculator.ts)
- Define pricing for supported models (e.g., Anthropic Claude 3.5 Sonnet on Bedrock).
- Function `calculateCost(modelId: string, inputTokens: number, outputTokens: number): number`.

#### [MODIFY] [proofreader.ts](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/src/proofreader.ts)
- Use `cost-calculator.ts` to determine the cost after the Bedrock call.
- Pass the cost to `generation.end({ cost: ... })` in Langfuse.
- Update structured log with the cost value.

---

## 6. Automated Red Teaming
**Goal**: Identify and mitigate vulnerabilities in the VEEDS Proofreader using Promptfoo's Red Teaming capabilities.

### Proposed Changes
#### [NEW] [redteamconfig.yaml](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/redteamconfig.yaml)
- Define the `proofreader` as the target.
- Enable critical plugins: `pii`, `prompt-injection`, `hallucination`, `harmful`.
- Use the `jailbreak` strategy.

#### [MODIFY] [package.json](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/package.json)
- Ensure redteam scripts are correctly configured (already present but will be verified).

## Verification Plan
### Automated Tests
- Run `npm run redteam` to generate and execute 50+ adversarial test cases.
- Run `npm run redteam:report` to generate a vulnerability report.
- Verify that Promptfoo identifies failures for prompt injections or PII leakage attempts.
