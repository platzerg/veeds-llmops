import os
import json
from deepeval.synthesizer import Synthesizer
from bedrock_model import BedrockClaude

def generate_synthetic_data():
    print("🚀 Starting Synthetic Data Generation...")
    
    # Initialize the LLM (Claude 3.5 Sonnet)
    model = BedrockClaude()
    
    # Define the context for synthesis
    # This guides the model on what kind of vehicle data to generate
    context = [
        "The system validates vehicle components in YAML format.",
        "A valid vehicle component needs a materialNumber (格式: [A-Z]{3}-\\d{5}), a description (max 200 chars), and a unit (e.g., mm, kg, m).",
        "Edge cases include missing units, extremely long descriptions, and special characters in material numbers.",
        "Financial data like price must be in positive floating point numbers."
    ]

    # Initialize Synthesizer
    synthesizer = Synthesizer(model=model)
    
    # Generate 10 high-quality test cases
    # In a real scenario, you can scale this to 100+
    goldens = synthesizer.synthesize_from_context(
        context=context,
        max_goldens_per_context=10,
        include_expected_output=True
    )

    # Convert to JSON for our Golden Dataset compatibility
    output_path = "eval/deepeval/synthetic_test_cases.json"
    
    test_cases = []
    for golden in goldens:
        test_cases.append({
            "input": golden.input,
            "expected": golden.expected_output,
            "metadata": {
                "source": "deepeval-synthetic",
                "metrics": ["faithfulness", "relevancy"]
            }
        })

    with open(output_path, "w") as f:
        json.dump(test_cases, f, indent=2)

    print(f"✅ Generated {len(test_cases)} test cases in {output_path}")

if __name__ == "__main__":
    generate_synthetic_data()
