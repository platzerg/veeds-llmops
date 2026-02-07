/**
 * Unit Tests for OnlineEvaluationMonitor
 * 
 * Tests the OnlineEvaluationMonitor class to verify:
 * - Sampling behavior (0%, 50%, 100%)
 * - Alert triggering when scores fall below thresholds
 * - Score tracking with memory limit (max 1000 per evaluator)
 * - Average score calculation
 * 
 * _Requirements: 5.1, 5.2, 5.3, 5.5_
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentCoreEvaluationsClient, OnlineEvaluationMonitor, BUILTIN_EVALUATORS } from '../agentcore-evaluations-example';

describe('OnlineEvaluationMonitor', () => {
  let client: AgentCoreEvaluationsClient;

  beforeEach(() => {
    client = new AgentCoreEvaluationsClient('eu-central-1', 'arn:aws:bedrock:eu-central-1:123456789012:agent/test');
  });

  describe('Sampling Behavior', () => {
    it('should never evaluate when sampling rate is 0', async () => {
      const evaluateMultipleSpy = vi.spyOn(client, 'evaluateMultiple');
      
      const monitor = new OnlineEvaluationMonitor(client, {
        samplingRate: 0,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      const mockSpans = [{ 'scope.name': 'bedrock-agentcore' }];
      
      // Call multiple times
      for (let i = 0; i < 100; i++) {
        await monitor.evaluateSession(mockSpans);
      }

      expect(evaluateMultipleSpy).not.toHaveBeenCalled();
    });

    it('should always evaluate when sampling rate is 1', async () => {
      const evaluateMultipleSpy = vi.spyOn(client, 'evaluateMultiple');
      
      const monitor = new OnlineEvaluationMonitor(client, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      const mockSpans = [{ 'scope.name': 'bedrock-agentcore' }];
      
      await monitor.evaluateSession(mockSpans);
      await monitor.evaluateSession(mockSpans);
      await monitor.evaluateSession(mockSpans);

      expect(evaluateMultipleSpy).toHaveBeenCalledTimes(3);
    });

    it('should evaluate approximately 50% of sessions with 0.5 sampling rate', async () => {
      const evaluateMultipleSpy = vi.spyOn(client, 'evaluateMultiple');
      
      // Mock Math.random to return predictable values
      const randomValues = [0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.45, 0.55];
      let callIndex = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => randomValues[callIndex++ % randomValues.length]);
      
      const monitor = new OnlineEvaluationMonitor(client, {
        samplingRate: 0.5,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      const mockSpans = [{ 'scope.name': 'bedrock-agentcore' }];
      
      for (let i = 0; i < 10; i++) {
        await monitor.evaluateSession(mockSpans);
      }

      // With our mocked values: 0.3, 0.2, 0.4, 0.1, 0.45 are < 0.5 (5 calls)
      expect(evaluateMultipleSpy).toHaveBeenCalledTimes(5);
      
      vi.restoreAllMocks();
    });
  });


  describe('Alert Triggering', () => {
    it('should trigger alert when score falls below threshold', async () => {
      const alertCallback = vi.fn();
      
      // Mock client to return low score
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            evaluatorName: 'Helpfulness',
            score: 0.3, // Below threshold of 0.5
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {
          [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
        },
        onAlert: alertCallback,
      });

      await monitor.evaluateSession([{}]);

      expect(alertCallback).toHaveBeenCalledWith(
        BUILTIN_EVALUATORS.HELPFULNESS,
        0.3,
        0.5
      );
    });

    it('should not trigger alert when score is above threshold', async () => {
      const alertCallback = vi.fn();
      
      // Mock client to return high score
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            evaluatorName: 'Helpfulness',
            score: 0.8, // Above threshold of 0.5
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {
          [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
        },
        onAlert: alertCallback,
      });

      await monitor.evaluateSession([{}]);

      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should not trigger alert when score equals threshold', async () => {
      const alertCallback = vi.fn();
      
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            evaluatorName: 'Helpfulness',
            score: 0.5, // Exactly at threshold
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {
          [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
        },
        onAlert: alertCallback,
      });

      await monitor.evaluateSession([{}]);

      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should not trigger alert when no threshold is configured', async () => {
      const alertCallback = vi.fn();
      
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            evaluatorName: 'Helpfulness',
            score: 0.1, // Very low score
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {}, // No thresholds configured
        onAlert: alertCallback,
      });

      await monitor.evaluateSession([{}]);

      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should trigger multiple alerts for multiple failing evaluators', async () => {
      const alertCallback = vi.fn();
      
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            score: 0.3,
            context: { spanContext: { sessionId: 'test' } }
          }]],
          [BUILTIN_EVALUATORS.CORRECTNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.CORRECTNESS,
            score: 0.4,
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS, BUILTIN_EVALUATORS.CORRECTNESS],
        alertThresholds: {
          [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
          [BUILTIN_EVALUATORS.CORRECTNESS]: 0.7,
        },
        onAlert: alertCallback,
      });

      await monitor.evaluateSession([{}]);

      expect(alertCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Score Tracking', () => {
    it('should track scores and calculate average correctly', async () => {
      const mockClient = {
        evaluateMultiple: vi.fn()
          .mockResolvedValueOnce(new Map([
            [BUILTIN_EVALUATORS.HELPFULNESS, [{ evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS, score: 0.8, context: { spanContext: { sessionId: 'test' } } }]],
          ]))
          .mockResolvedValueOnce(new Map([
            [BUILTIN_EVALUATORS.HELPFULNESS, [{ evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS, score: 0.6, context: { spanContext: { sessionId: 'test' } } }]],
          ]))
          .mockResolvedValueOnce(new Map([
            [BUILTIN_EVALUATORS.HELPFULNESS, [{ evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS, score: 0.7, context: { spanContext: { sessionId: 'test' } } }]],
          ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      await monitor.evaluateSession([{}]);
      await monitor.evaluateSession([{}]);
      await monitor.evaluateSession([{}]);

      const averages = monitor.getAverageScores();
      // Average of 0.8, 0.6, 0.7 = 0.7
      expect(averages[BUILTIN_EVALUATORS.HELPFULNESS]).toBeCloseTo(0.7, 5);
    });

    it('should return empty object when no scores recorded', () => {
      const monitor = new OnlineEvaluationMonitor(client, {
        samplingRate: 0, // Never evaluate
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      const averages = monitor.getAverageScores();
      expect(Object.keys(averages).length).toBe(0);
    });

    it('should track scores for multiple evaluators independently', async () => {
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{ evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS, score: 0.9, context: { spanContext: { sessionId: 'test' } } }]],
          [BUILTIN_EVALUATORS.CORRECTNESS, [{ evaluatorId: BUILTIN_EVALUATORS.CORRECTNESS, score: 0.5, context: { spanContext: { sessionId: 'test' } } }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS, BUILTIN_EVALUATORS.CORRECTNESS],
        alertThresholds: {},
      });

      await monitor.evaluateSession([{}]);

      const averages = monitor.getAverageScores();
      expect(averages[BUILTIN_EVALUATORS.HELPFULNESS]).toBe(0.9);
      expect(averages[BUILTIN_EVALUATORS.CORRECTNESS]).toBe(0.5);
    });
  });

  describe('Memory Limit', () => {
    it('should limit stored scores to 1000 per evaluator', async () => {
      let callCount = 0;
      const mockClient = {
        evaluateMultiple: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve(new Map([
            [BUILTIN_EVALUATORS.HELPFULNESS, [{
              evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
              score: callCount / 1100, // Varying scores
              context: { spanContext: { sessionId: 'test' } }
            }]],
          ]));
        }),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      // Add 1100 scores
      for (let i = 0; i < 1100; i++) {
        await monitor.evaluateSession([{}]);
      }

      // The average should be calculated from the last 1000 scores
      // Scores 101-1100 (values 101/1100 to 1100/1100)
      const averages = monitor.getAverageScores();
      
      // Average of scores 101/1100 to 1100/1100
      // Sum = (101 + 102 + ... + 1100) / 1100 = (sum of 101 to 1100) / 1100
      // Sum of 101 to 1100 = (1100 * 1101 / 2) - (100 * 101 / 2) = 605550 - 5050 = 600500
      // Average = 600500 / (1000 * 1100) = 600500 / 1100000 ≈ 0.546
      expect(averages[BUILTIN_EVALUATORS.HELPFULNESS]).toBeGreaterThan(0.5);
      expect(averages[BUILTIN_EVALUATORS.HELPFULNESS]).toBeLessThan(0.6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle evaluation results without scores', async () => {
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            label: 'Good', // No score, only label
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      await monitor.evaluateSession([{}]);

      const averages = monitor.getAverageScores();
      // Should not have recorded any scores
      expect(averages[BUILTIN_EVALUATORS.HELPFULNESS]).toBeUndefined();
    });

    it('should handle empty evaluation results', async () => {
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, []],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {},
      });

      await monitor.evaluateSession([{}]);

      const averages = monitor.getAverageScores();
      expect(Object.keys(averages).length).toBe(0);
    });

    it('should work without onAlert callback configured', async () => {
      const mockClient = {
        evaluateMultiple: vi.fn().mockResolvedValue(new Map([
          [BUILTIN_EVALUATORS.HELPFULNESS, [{
            evaluatorId: BUILTIN_EVALUATORS.HELPFULNESS,
            score: 0.1, // Below any reasonable threshold
            context: { spanContext: { sessionId: 'test' } }
          }]],
        ])),
      } as unknown as AgentCoreEvaluationsClient;

      const monitor = new OnlineEvaluationMonitor(mockClient, {
        samplingRate: 1,
        evaluators: [BUILTIN_EVALUATORS.HELPFULNESS],
        alertThresholds: {
          [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
        },
        // No onAlert callback
      });

      // Should not throw
      await expect(monitor.evaluateSession([{}])).resolves.not.toThrow();
    });
  });
});
