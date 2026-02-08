/**
 * Model Pricing Definition (USD per 1M tokens)
 * Based on AWS Bedrock pricing for eu-central-1 as of Feb 2026
 */
const PRICING: Record<string, { input: number; output: number }> = {
    "anthropic.claude-3-5-sonnet-20241022-v2:0": {
        input: 3.00,  // $3.00 per 1M tokens
        output: 15.00  // $15.00 per 1M tokens
    },
    "anthropic.claude-3-sonnet-20240229-v1:0": {
        input: 3.00,
        output: 15.00
    },
    "anthropic.claude-3-haiku-20240307-v1:0": {
        input: 0.25,
        output: 1.25
    },
    // OpenAI Pricing (as of Feb 2026)
    "gpt-4o": {
        input: 2.50,
        output: 10.00
    },
    "gpt-4o-mini": {
        input: 0.15,
        output: 0.60
    }
};

/**
 * Calculate the cost of an LLM call in USD.
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const modelPricing = PRICING[modelId];

    if (!modelPricing) {
        // Return 0 if model is unknown to avoid breaking the flow
        return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

    return Number((inputCost + outputCost).toFixed(6));
}
