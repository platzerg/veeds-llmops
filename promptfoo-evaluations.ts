/**
 * Promptfoo Evaluations - TypeScript Integration
 */

import promptfoo, {
  type EvaluateSummaryV2,
  type TestCase,
  type Assertion,
} from "promptfoo";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  region: process.env.AWS_REGION || "eu-central-1",
  defaultModel: "bedrock:eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
};

// ============================================================================
// Types
// ============================================================================

export interface PromptTestCase {
  input: string;
  expectedOutput?: string;
  context?: string[];
  assertions?: Assertion[];
  description?: string;
}

export interface EvaluationConfig {
  systemPrompt: string;
  provider?: string;
  testCases: PromptTestCase[];
  defaultAssertions?: Assertion[];
  maxConcurrency?: number;
}

export interface EvaluationResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{
    input: string;
    output: string;
    passed: boolean;
    assertions: Array<{
      type: string;
      passed: boolean;
      reason?: string;
      score?: number;
    }>;
  }>;
  stats: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}

// ============================================================================
// Promptfoo Evaluator Class
// ============================================================================

export class PromptfooEvaluator {
  private defaultProvider: string;

  constructor(provider: string = CONFIG.defaultModel) {
    this.defaultProvider = provider;
  }

  async evaluate(config: EvaluationConfig): Promise<EvaluationResult> {
    const provider = config.provider || this.defaultProvider;

    const promptTemplate = `${config.systemPrompt}

User: {{input}}
Assistant:`;

    const tests: TestCase[] = config.testCases.map((tc) => ({
      vars: { input: tc.input },
      assert: this.buildAssertions(tc, config.defaultAssertions),
      description: tc.description,
    }));

    const evalResult = await promptfoo.evaluate({
      prompts: [promptTemplate],
      providers: [provider],
      tests,
    });

    return this.transformResults(evalResult);
  }

  private buildAssertions(
    testCase: PromptTestCase,
    defaultAssertions?: Assertion[]
  ): Assertion[] {
    const assertions: Assertion[] = [];

    if (testCase.assertions) {
      assertions.push(...testCase.assertions);
    }

    if (testCase.expectedOutput) {
      assertions.push({
        type: "similar",
        value: testCase.expectedOutput,
        threshold: 0.7,
      });
    }

    if (assertions.length === 0 && defaultAssertions) {
      assertions.push(...defaultAssertions);
    }

    return assertions;
  }

  private transformResults(evalResult: any): EvaluationResult {
    const results = evalResult.results.map((r: any) => ({
      input: String(r.vars?.input || ""),
      output: String(r.response?.output || ""),
      passed: r.success || false,
      assertions: (r.gradingResult?.componentResults || []).map((a: any) => ({
        type: a.assertion?.type || "unknown",
        passed: a.pass || false,
        reason: a.reason,
        score: a.score,
      })),
    }));

    const passedTests = results.filter((r: any) => r.passed).length;

    return {
      passed: passedTests === results.length,
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      results,
      stats: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
      },
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export const createAssertions = {
  contains: (text: string): Assertion => ({
    type: "contains",
    value: text,
  }),

  llmRubric: (criteria: string, threshold?: number): Assertion => ({
    type: "llm-rubric",
    value: criteria,
    threshold: threshold || 0.7,
  }),

  similar: (expected: string, threshold?: number): Assertion => ({
    type: "similar",
    value: expected,
    threshold: threshold || 0.8,
  }),
};
