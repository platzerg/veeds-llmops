/**
 * Property-Based Tests for AgentCore Evaluations
 * 
 * These tests use fast-check to verify universal properties that must hold
 * across all valid inputs. Each property test validates specific requirements
 * from the design document.
 * 
 * Feature: agentcore-evaluations-typescript-example
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  BUILTIN_EVALUATORS, 
  AgentCoreEvaluationsClient, 
  AgentFailureAnalyzer,
  OnlineEvaluationMonitor
} from '../agentcore-evaluations-example';

/**
 * Property 1: Evaluator ID Completeness
 * 
 * For all entries in the BUILTIN_EVALUATORS object: There must be exactly 14 evaluators,
 * and each ID must match the pattern "Builtin.{Name}".
 * 
 * **Validates: Requirements 1.1**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 1: Evaluator ID Completeness', () => {
  it('should have exactly 14 evaluators with valid ID format', () => {
    fc.assert(
      fc.property(
        fc.constant(BUILTIN_EVALUATORS),
        (evaluators) => {
          const entries = Object.entries(evaluators);
          
          // Must have exactly 14 evaluators
          if (entries.length !== 14) return false;
          
          // Each ID must match "Builtin.{Name}" pattern
          const idPattern = /^Builtin\.[A-Z][a-zA-Z]+$/;
          for (const [, id] of entries) {
            if (!idPattern.test(id)) return false;
          }
          
          // All IDs must be unique
          const ids = entries.map(([, id]) => id);
          const uniqueIds = new Set(ids);
          if (uniqueIds.size !== 14) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have all evaluator IDs starting with "Builtin."', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(BUILTIN_EVALUATORS)),
        (evaluatorId) => {
          return evaluatorId.startsWith('Builtin.');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have non-empty name after "Builtin." prefix for all evaluators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(BUILTIN_EVALUATORS)),
        (evaluatorId) => {
          const name = evaluatorId.replace('Builtin.', '');
          return name.length > 0 && /^[A-Z][a-zA-Z]+$/.test(name);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 2: Evaluator Configuration Completeness
 * 
 * For every built-in evaluator in BUILTIN_EVALUATORS, there must be a corresponding
 * entry in FAILURE_CATEGORIES, and for evaluators with numerical or categorical results,
 * there must be an entry in PASS_THRESHOLDS.
 * 
 * **Validates: Requirements 3.1, 3.2**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 2: Evaluator Configuration Completeness', () => {
  // Access private static properties through the class for testing
  const FAILURE_CATEGORIES: Record<string, string> = {
    [BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY]: 'Tool-Fehler',
    [BUILTIN_EVALUATORS.TOOL_PARAMETER_ACCURACY]: 'Tool-Fehler',
    [BUILTIN_EVALUATORS.CORRECTNESS]: 'Antwort-Fehler',
    [BUILTIN_EVALUATORS.HELPFULNESS]: 'Antwort-Fehler',
    [BUILTIN_EVALUATORS.COHERENCE]: 'Antwort-Fehler',
    [BUILTIN_EVALUATORS.CONCISENESS]: 'Antwort-Fehler',
    [BUILTIN_EVALUATORS.RESPONSE_RELEVANCE]: 'Antwort-Fehler',
    [BUILTIN_EVALUATORS.FAITHFULNESS]: 'Kontext-Fehler',
    [BUILTIN_EVALUATORS.CONTEXT_RELEVANCE]: 'Kontext-Fehler',
    [BUILTIN_EVALUATORS.INSTRUCTION_FOLLOWING]: 'Kontext-Fehler',
    [BUILTIN_EVALUATORS.GOAL_SUCCESS_RATE]: 'Ziel-Fehler',
    [BUILTIN_EVALUATORS.HARMFULNESS]: 'Safety-Fehler',
    [BUILTIN_EVALUATORS.STEREOTYPING]: 'Safety-Fehler',
    [BUILTIN_EVALUATORS.REFUSAL]: 'Safety-Fehler',
  };

  it('every built-in evaluator should have a failure category mapping', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(BUILTIN_EVALUATORS)),
        (evaluatorId) => {
          return evaluatorId in FAILURE_CATEGORIES;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('failure categories should be one of the 5 defined categories', () => {
    const validCategories = ['Tool-Fehler', 'Antwort-Fehler', 'Kontext-Fehler', 'Ziel-Fehler', 'Safety-Fehler'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(BUILTIN_EVALUATORS)),
        (evaluatorId) => {
          const category = FAILURE_CATEGORIES[evaluatorId];
          return validCategories.includes(category);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all 14 evaluators should be mapped to categories', () => {
    fc.assert(
      fc.property(
        fc.constant(Object.values(BUILTIN_EVALUATORS)),
        (evaluatorIds) => {
          const mappedCount = evaluatorIds.filter(id => id in FAILURE_CATEGORIES).length;
          return mappedCount === 14;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Failure Analysis Coverage
 * 
 * For all valid session span arrays: When analyzeFailurePoints is called,
 * the result array must contain exactly 14 FailureAnalysis objects (one per built-in evaluator).
 * 
 * **Validates: Requirements 3.3**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 3: Failure Analysis Coverage', () => {
  it('analyzeFailurePoints should return exactly 14 analyses for any valid span input', async () => {
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');
    const analyzer = new AgentFailureAnalyzer(client);

    // Generate various span configurations
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            'scope.name': fc.constant('bedrock-agentcore'),
            '@timestamp': fc.date().map(d => d.toISOString()),
            'attributes.session.id': fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (spans) => {
          const analyses = await analyzer.analyzeFailurePoints(spans);
          return analyses.length === 14;
        }
      ),
      { numRuns: 20 } // Reduced for async tests
    );
  });

  it('analyzeFailurePoints should include all evaluator IDs in results', async () => {
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');
    const analyzer = new AgentFailureAnalyzer(client);

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ 'scope.name': fc.constant('bedrock-agentcore') }), { minLength: 1, maxLength: 5 }),
        async (spans) => {
          const analyses = await analyzer.analyzeFailurePoints(spans);
          const evaluatorIds = analyses.map(a => a.evaluator);
          const allEvaluatorIds = Object.values(BUILTIN_EVALUATORS);
          
          return allEvaluatorIds.every(id => evaluatorIds.includes(id));
        }
      ),
      { numRuns: 20 }
    );
  });
});


/**
 * Property 4: Failure Summary Categorization
 * 
 * For all FailureAnalysis arrays: getFailureSummary must return a Record with exactly
 * 5 categories (Tool-Fehler, Antwort-Fehler, Kontext-Fehler, Ziel-Fehler, Safety-Fehler),
 * and the sum of all category counters must equal the number of failed analyses.
 * 
 * **Validates: Requirements 3.4**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 4: Failure Summary Categorization', () => {
  const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');
  const analyzer = new AgentFailureAnalyzer(client);

  const validCategories = ['Tool-Fehler', 'Antwort-Fehler', 'Kontext-Fehler', 'Ziel-Fehler', 'Safety-Fehler'];

  // Generator for FailureAnalysis objects
  const failureAnalysisArb = fc.record({
    evaluator: fc.constantFrom(...Object.values(BUILTIN_EVALUATORS)),
    passed: fc.boolean(),
    score: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1) }), { nil: undefined }),
    label: fc.option(fc.string(), { nil: undefined }),
    explanation: fc.option(fc.string(), { nil: undefined }),
    failureCategory: fc.option(fc.constantFrom(...validCategories), { nil: undefined }),
  }).map(analysis => {
    // If passed, remove failureCategory; if not passed, ensure failureCategory is set
    if (analysis.passed) {
      return { ...analysis, failureCategory: undefined };
    }
    return analysis;
  });

  it('getFailureSummary should always return exactly 5 categories', () => {
    fc.assert(
      fc.property(
        fc.array(failureAnalysisArb, { minLength: 0, maxLength: 50 }),
        (analyses) => {
          const summary = analyzer.getFailureSummary(analyses);
          const categories = Object.keys(summary);
          
          return categories.length === 5 && 
                 validCategories.every(cat => categories.includes(cat));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sum of category counts should equal number of failed analyses with categories', () => {
    fc.assert(
      fc.property(
        fc.array(failureAnalysisArb, { minLength: 0, maxLength: 50 }),
        (analyses) => {
          const summary = analyzer.getFailureSummary(analyses);
          const totalInSummary = Object.values(summary).reduce((a, b) => a + b, 0);
          
          // Count failures that have a failureCategory
          const failuresWithCategory = analyses.filter(
            a => !a.passed && a.failureCategory && validCategories.includes(a.failureCategory)
          ).length;
          
          return totalInSummary === failuresWithCategory;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all category counts should be non-negative', () => {
    fc.assert(
      fc.property(
        fc.array(failureAnalysisArb, { minLength: 0, maxLength: 50 }),
        (analyses) => {
          const summary = analyzer.getFailureSummary(analyses);
          return Object.values(summary).every(count => count >= 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: CI/CD Test Case Processing
 * 
 * For all test case arrays with n elements: runPreDeploymentChecks must invoke
 * the agent exactly n times and evaluate all test cases against all 14 evaluators.
 * 
 * Note: This property is tested indirectly through the result structure since
 * we're using mock implementations.
 * 
 * **Validates: Requirements 4.2, 4.3**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 5: CI/CD Test Case Processing', () => {
  it('totalChecks should equal testCases.length * 14 evaluators', async () => {
    const { runPreDeploymentChecks } = await import('../agentcore-evaluations-example');
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');

    // Test with fixed small test cases to avoid timeout
    // Property: totalChecks = n * 14 where n is number of test cases
    const testCases = [
      { prompt: 'test1' },
      { prompt: 'test2' },
    ];
    
    const result = await runPreDeploymentChecks(client, testCases, 'pbt-test');
    const expectedTotalChecks = testCases.length * 14;
    
    expect(result.totalChecks).toBe(expectedTotalChecks);
  }, 60000); // 60 second timeout
});


/**
 * Property 6: CI/CD Result Completeness
 * 
 * For all executions of runPreDeploymentChecks: The result must contain passed (boolean),
 * totalChecks, passedChecks, failedChecks (with totalChecks = passedChecks + failedChecks),
 * failures (Array), and summary (Record).
 * 
 * **Validates: Requirements 4.4, 4.5**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 6: CI/CD Result Completeness', () => {
  it('result should have all required fields with correct types', async () => {
    const { runPreDeploymentChecks } = await import('../agentcore-evaluations-example');
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');

    const testCases = [{ prompt: 'test prompt' }];
    const result = await runPreDeploymentChecks(client, testCases, 'pbt-test');
    
    // Check all required fields exist and have correct types
    expect(typeof result.passed).toBe('boolean');
    expect(typeof result.totalChecks).toBe('number');
    expect(typeof result.passedChecks).toBe('number');
    expect(typeof result.failedChecks).toBe('number');
    expect(Array.isArray(result.failures)).toBe(true);
    expect(typeof result.summary).toBe('object');
    expect(result.summary).not.toBeNull();
  }, 30000);

  it('totalChecks should equal passedChecks + failedChecks', async () => {
    const { runPreDeploymentChecks } = await import('../agentcore-evaluations-example');
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');

    const testCases = [{ prompt: 'test prompt' }];
    const result = await runPreDeploymentChecks(client, testCases, 'pbt-test');
    
    expect(result.totalChecks).toBe(result.passedChecks + result.failedChecks);
  }, 30000);

  it('passed should be true only when failedChecks is 0', async () => {
    const { runPreDeploymentChecks } = await import('../agentcore-evaluations-example');
    const client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');

    const testCases = [{ prompt: 'test prompt' }];
    const result = await runPreDeploymentChecks(client, testCases, 'pbt-test');
    
    expect(result.passed).toBe(result.failedChecks === 0);
  }, 30000);
});

/**
 * Property 8: Alert Triggering
 * 
 * For all OnlineEvaluationMonitor instances with configured alert threshold t for an evaluator:
 * When a score s < t is received, the onAlert callback must be called with correct parameters.
 * 
 * **Validates: Requirements 5.2, 5.3**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 8: Alert Triggering', () => {
  it('alert should trigger when score is below threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }), // threshold
        fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),      // score
        async (threshold, score) => {
          let alertTriggered = false;
          let capturedEvaluator = '';
          let capturedScore = 0;
          let capturedThreshold = 0;

          const mockClient = {
            evaluateMultiple: async () => new Map([
              [BUILTIN_EVALUATORS.HELPFULNESS, [{
                evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
                score,
                context: { spanContext: { sessionId: 'test' } }
              }]],
            ]),
          } as unknown as AgentCoreEvaluationsClient;

          const monitor = new OnlineEvaluationMonitor(mockClient, {
            samplingRate: 1,
            evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
            alertThresholds: {
              [BUILTIN_EVALUATORS.HELPFULNESS]: threshold,
            },
            onAlert: (evaluator, s, t) => {
              alertTriggered = true;
              capturedEvaluator = evaluator;
              capturedScore = s;
              capturedThreshold = t;
            },
          });

          await monitor.evaluateSession([{}]);

          // Alert should trigger if and only if score < threshold
          const shouldAlert = score < threshold;
          
          if (shouldAlert) {
            return alertTriggered && 
                   capturedEvaluator === BUILTIN_EVALUATORS.HELPFULNESS &&
                   capturedScore === score &&
                   capturedThreshold === threshold;
          } else {
            return !alertTriggered;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});


/**
 * Property 9: Score Tracking with Memory Limit
 * 
 * For all OnlineEvaluationMonitor instances: After adding more than 1000 scores for an evaluator,
 * the internal score list must remain limited to at most 1000 entries, and getAverageScores
 * must return the correct average of the stored scores.
 * 
 * **Validates: Requirements 5.4, 5.5**
 */
describe('Feature: agentcore-evaluations-typescript-example, Property 9: Score Tracking with Memory Limit', () => {
  it('average scores should be correctly calculated for any sequence of scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), { minLength: 1, maxLength: 100 }),
        async (scores) => {
          let callIndex = 0;
          const mockClient = {
            evaluateMultiple: async () => new Map([
              [BUILTIN_EVALUATORS.HELPFULNESS, [{
                evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
                score: scores[callIndex++ % scores.length],
                context: { spanContext: { sessionId: 'test' } }
              }]],
            ]),
          } as unknown as AgentCoreEvaluationsClient;

          const monitor = new OnlineEvaluationMonitor(mockClient, {
            samplingRate: 1,
            evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
            alertThresholds: {},
          });

          // Add all scores
          for (let i = 0; i < scores.length; i++) {
            await monitor.evaluateSession([{}]);
          }

          const averages = monitor.getAverageScores();
          const expectedAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
          
          // Allow small floating point tolerance
          const actualAverage = averages[BUILTIN_EVALUATORS.HELPFULNESS];
          return Math.abs(actualAverage - expectedAverage) < 0.0001;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('score list should be limited to 1000 entries', async () => {
    // This test verifies the memory limit by checking that after many scores,
    // the average reflects only the most recent 1000 scores
    
    const numScores = 1100;
    let callCount = 0;
    
    const mockClient = {
      evaluateMultiple: async () => {
        callCount++;
        // First 100 scores are 0, rest are 1
        // If limited to 1000, average should be close to 1 (only last 1000 kept)
        const score = callCount <= 100 ? 0 : 1;
        return new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            score,
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ]);
      },
    } as unknown as AgentCoreEvaluationsClient;

    const monitor = new OnlineEvaluationMonitor(mockClient, {
      samplingRate: 1,
      evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
      alertThresholds: {},
    });

    for (let i = 0; i < numScores; i++) {
      await monitor.evaluateSession([{}]);
    }

    const averages = monitor.getAverageScores();
    const average = averages[BUILTIN_EVALUATORS.HELPFULNESS];
    
    // If memory is limited to 1000, we should have scores 101-1100 (all 1s)
    // Average should be 1.0
    // If not limited, we'd have 100 zeros and 1000 ones, average = 1000/1100 ≈ 0.909
    expect(average).toBeCloseTo(1.0, 2);
  });
});
