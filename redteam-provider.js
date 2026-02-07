import { proofreadEntry } from './dist/proofreader.js';

/**
 * Custom Promptfoo Provider for Red Teaming (JS Version).
 */
export default async function (prompt, context) {
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
    } catch (error) {
        return {
            error: error.message
        };
    }
}
