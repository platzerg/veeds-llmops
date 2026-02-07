import os
import pytest
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric
from deepeval import assert_test
from bedrock_model import BedrockClaude
from langfuse.deepeval import LangfuseCallbackHandler

# Model for generation and judging
model = BedrockClaude()
langfuse_handler = LangfuseCallbackHandler()

def run_arena_battle():
    # TEST CASE: A complex vehicle YAML entry
    input_yaml = """
    components:
      - id: 1
        materialNumber: XYZ-99
        description: Dangerous material without proper padding
        unit: unknown
    """
    
    # PROMPT A: Concise and strict
    prompt_a = "Proofread this YAML. Check materialNumber (XXX-12345) and unit (mm, kg, m)."
    # PROMPT B: Detailed and helpful
    prompt_b = "You are a professional auditor. Check if materialNumber matches [A-Z]{3}-\\d{5}. Suggest correct units."

    # MOCK OUTPUTS (In a real scenario, you would call the LLM twice here)
    # Output A (Failed to catch XYZ-99 correctly)
    output_a = "Valid: true\nErrors: 0"
    
    # Output B (Caught the error)
    output_b = "Valid: false\nErrors: 1\nReason: materialNumber XYZ-99 is invalid."

    context = ["Standard format is [A-Z]{3}-\\d{5}.", "Valid units are mm, kg, m."]

    # METRIC: Which answer is more relevant to the input problem?
    metric = AnswerRelevancyMetric(threshold=0.7, model=model)

    # Test Case A (Prompt A)
    case_a = LLMTestCase(
        input=input_yaml,
        actual_output=output_a,
        retrieval_context=context,
        name="Prompt-A-Concise"
    )

    # Test Case B (Prompt B)
    case_b = LLMTestCase(
        input=input_yaml,
        actual_output=output_b,
        retrieval_context=context,
        name="Prompt-B-Detailed"
    )

    print("\n⚔️ Starting Arena Battle: Prompt A vs Prompt B...")
    
    # Test both in one run
    # Langfuse will automatically group these and you can see which score is higher
    assert_test(case_a, [metric], callbacks=[langfuse_handler])
    assert_test(case_b, [metric], callbacks=[langfuse_handler])

if __name__ == "__main__":
    run_arena_battle()
