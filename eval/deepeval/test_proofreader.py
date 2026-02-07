import pytest
import os
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from bedrock_model import BedrockClaude
from langfuse.deepeval import LangfuseCallbackHandler

# Initialize model and metrics
# Note: Claude 3.5 Sonnet is used as the 'Judge' model
model = BedrockClaude()
langfuse_handler = LangfuseCallbackHandler()

def test_proofreader_logic():
    # Example input and output (normally this would come from your real application)
    input_text = "materialNumber: ABC-12345\ndescription: Test Engine\nunit: m"
    actual_output = "Valid: true\nErrors: 0\nSuggestions: None"
    retrieval_context = ["The materialNumber must follow the pattern [A-Z]{3}-\\d{5}.", "Unit 'm' is valid for length components."]

    # Define Metrics
    # Faithfulness: Does the answer match the context/facts?
    faithfulness_metric = FaithfulnessMetric(threshold=0.7, model=model)
    # Relevancy: Is the answer relevant to the input?
    relevancy_metric = AnswerRelevancyMetric(threshold=0.7, model=model)

    test_case = LLMTestCase(
        input=input_text,
        actual_output=actual_output,
        retrieval_context=retrieval_context
    )

    # Execute tests with Langfuse callback
    # This automatically pushes metrics to Langfuse
    assert_test(test_case, [faithfulness_metric, relevancy_metric], callbacks=[langfuse_handler])

if __name__ == "__main__":
    # To run this manually without pytest
    # deepeval test run eval/deepeval/test_proofreader.py
    pass
