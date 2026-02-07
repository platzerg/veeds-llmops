/**
 * Unit Tests for BUILTIN_EVALUATORS
 * 
 * Tests the built-in evaluator constants to verify:
 * - Correct number of evaluators (14 total)
 * - ID format follows "Builtin.{Name}" pattern
 * - Correct categorization by level (Trace, Tool, Session)
 * 
 * _Requirements: 1.1_
 */

import { describe, it, expect } from 'vitest';
import { BUILTIN_EVALUATORS } from '../agentcore-evaluations-example';

describe('BUILTIN_EVALUATORS', () => {
  describe('Evaluator Count', () => {
    it('should have exactly 14 evaluators', () => {
      const evaluatorCount = Object.keys(BUILTIN_EVALUATORS).length;
      expect(evaluatorCount).toBe(14);
    });

    it('should have exactly 14 unique evaluator IDs', () => {
      const evaluatorIds = Object.values(BUILTIN_EVALUATORS);
      const uniqueIds = new Set(evaluatorIds);
      expect(uniqueIds.size).toBe(14);
    });
  });

  describe('ID Format', () => {
    it('all evaluator IDs should follow the "Builtin.{Name}" pattern', () => {
      const builtinPattern = /^Builtin\.[A-Z][a-zA-Z]+$/;
      
      for (const [key, id] of Object.entries(BUILTIN_EVALUATORS)) {
        expect(id).toMatch(builtinPattern);
      }
    });

    it('all evaluator IDs should start with "Builtin."', () => {
      for (const id of Object.values(BUILTIN_EVALUATORS)) {
        expect(id.startsWith('Builtin.')).toBe(true);
      }
    });

    it('all evaluator IDs should have a non-empty name after "Builtin."', () => {
      for (const id of Object.values(BUILTIN_EVALUATORS)) {
        const name = id.replace('Builtin.', '');
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Trace-Level Evaluators (11)', () => {
    const traceLevelEvaluators = [
      'CORRECTNESS',
      'HELPFULNESS',
      'COHERENCE',
      'CONCISENESS',
      'FAITHFULNESS',
      'HARMFULNESS',
      'STEREOTYPING',
      'REFUSAL',
      'RESPONSE_RELEVANCE',
      'CONTEXT_RELEVANCE',
      'INSTRUCTION_FOLLOWING',
    ];

    it('should have exactly 11 trace-level evaluators', () => {
      const existingTraceLevelEvaluators = traceLevelEvaluators.filter(
        (key) => key in BUILTIN_EVALUATORS
      );
      expect(existingTraceLevelEvaluators.length).toBe(11);
    });

    it.each(traceLevelEvaluators)('should include %s evaluator', (evaluatorKey) => {
      expect(BUILTIN_EVALUATORS).toHaveProperty(evaluatorKey);
    });

    it('trace-level evaluators should have correct IDs', () => {
      expect(BUILTIN_EVALUATORS.CORRECTNESS).toBe('Builtin.Correctness');
      expect(BUILTIN_EVALUATORS.HELPFULNESS).toBe('Builtin.Helpfulness');
      expect(BUILTIN_EVALUATORS.COHERENCE).toBe('Builtin.Coherence');
      expect(BUILTIN_EVALUATORS.CONCISENESS).toBe('Builtin.Conciseness');
      expect(BUILTIN_EVALUATORS.FAITHFULNESS).toBe('Builtin.Faithfulness');
      expect(BUILTIN_EVALUATORS.HARMFULNESS).toBe('Builtin.Harmfulness');
      expect(BUILTIN_EVALUATORS.STEREOTYPING).toBe('Builtin.Stereotyping');
      expect(BUILTIN_EVALUATORS.REFUSAL).toBe('Builtin.Refusal');
      expect(BUILTIN_EVALUATORS.RESPONSE_RELEVANCE).toBe('Builtin.ResponseRelevance');
      expect(BUILTIN_EVALUATORS.CONTEXT_RELEVANCE).toBe('Builtin.ContextRelevance');
      expect(BUILTIN_EVALUATORS.INSTRUCTION_FOLLOWING).toBe('Builtin.InstructionFollowing');
    });
  });

  describe('Tool-Level Evaluators (2)', () => {
    const toolLevelEvaluators = [
      'TOOL_SELECTION_ACCURACY',
      'TOOL_PARAMETER_ACCURACY',
    ];

    it('should have exactly 2 tool-level evaluators', () => {
      const existingToolLevelEvaluators = toolLevelEvaluators.filter(
        (key) => key in BUILTIN_EVALUATORS
      );
      expect(existingToolLevelEvaluators.length).toBe(2);
    });

    it.each(toolLevelEvaluators)('should include %s evaluator', (evaluatorKey) => {
      expect(BUILTIN_EVALUATORS).toHaveProperty(evaluatorKey);
    });

    it('tool-level evaluators should have correct IDs', () => {
      expect(BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY).toBe('Builtin.ToolSelectionAccuracy');
      expect(BUILTIN_EVALUATORS.TOOL_PARAMETER_ACCURACY).toBe('Builtin.ToolParameterAccuracy');
    });
  });

  describe('Session-Level Evaluators (1)', () => {
    const sessionLevelEvaluators = ['GOAL_SUCCESS_RATE'];

    it('should have exactly 1 session-level evaluator', () => {
      const existingSessionLevelEvaluators = sessionLevelEvaluators.filter(
        (key) => key in BUILTIN_EVALUATORS
      );
      expect(existingSessionLevelEvaluators.length).toBe(1);
    });

    it.each(sessionLevelEvaluators)('should include %s evaluator', (evaluatorKey) => {
      expect(BUILTIN_EVALUATORS).toHaveProperty(evaluatorKey);
    });

    it('session-level evaluator should have correct ID', () => {
      expect(BUILTIN_EVALUATORS.GOAL_SUCCESS_RATE).toBe('Builtin.GoalSuccessRate');
    });
  });

  describe('Evaluator Level Categorization', () => {
    it('total evaluators should equal sum of all levels (11 + 2 + 1 = 14)', () => {
      const traceLevelCount = 11;
      const toolLevelCount = 2;
      const sessionLevelCount = 1;
      
      const totalExpected = traceLevelCount + toolLevelCount + sessionLevelCount;
      const actualTotal = Object.keys(BUILTIN_EVALUATORS).length;
      
      expect(actualTotal).toBe(totalExpected);
      expect(actualTotal).toBe(14);
    });
  });
});
