import pytest
import os
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.models import GPTModel
# from langfuse.deepeval import LangfuseCallbackHandler

# =============================================================================
# OpenTelemetry Jaeger Tracing Configuration
# =============================================================================
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Configure OpenTelemetry to export to Jaeger
resource = Resource(attributes={
    "service.name": "deepeval-service",
    "service.version": "1.0.0",
    "deployment.environment": "development"
})

# Initialize tracer provider
tracer_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(tracer_provider)

# Configure OTLP exporter to Jaeger (HTTP endpoint)
otlp_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces"),
    headers={}
)

# Add span processor
span_processor = BatchSpanProcessor(otlp_exporter)
tracer_provider.add_span_processor(span_processor)

# Get tracer
tracer = trace.get_tracer(__name__)

# Initialize model and metrics
# Note: GPT-4o is used as the 'Judge' model
model = GPTModel(model="gpt-4o")
# langfuse_handler = LangfuseCallbackHandler()

def test_proofreader_logic():
    """Test proofreader logic with OpenTelemetry tracing to Jaeger"""
    with tracer.start_as_current_span("test_proofreader_logic") as span:
        # Example input and output (normally this would come from your real application)
        input_text = "materialNumber: ABC-12345\ndescription: Test Engine\nunit: m"
        actual_output = "Valid: true\nErrors: 0\nSuggestions: None"
        retrieval_context = ["The materialNumber must follow the pattern [A-Z]{3}-\\d{5}.", "Unit 'm' is valid for length components."]

        # Add span attributes
        span.set_attribute("test.input_size", len(input_text))
        span.set_attribute("test.model", "gpt-4o")
        span.set_attribute("test.framework", "deepeval")

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
        # assert_test(test_case, [faithfulness_metric, relevancy_metric], callbacks=[langfuse_handler])
        assert_test(test_case, [faithfulness_metric, relevancy_metric])
        
        span.set_attribute("test.status", "passed")

if __name__ == "__main__":
    # To run this manually without pytest
    # deepeval test run eval/deepeval/test_proofreader.py
    pass
