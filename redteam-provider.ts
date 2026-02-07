import { proofreadEntry } from './src/proofreader.js';

/**
 * Custom Promptfoo Provider for Red Teaming.
 * This allows us to test our integrated defenses (PII Filter) 
 * instead of just the raw LLM.
 */
export default async function (prompt: string, context: any) {
    try {
        const result = await proofreadEntry(prompt, {
            userId: 'redteam-bot',
            tags: ['redteam', context.vars.category || 'general']
        });

        return {
            output: result.rawResponse,
            metadata: {
                isValid: result.isValid,
                errors: result.errors
            }
        };
    } catch (error: any) {
        return {
            error: error.message
        };
    }
}
