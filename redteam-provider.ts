import { proofreadEntry } from './src/proofreader.ts';

export default class RedteamProvider {
    constructor(options: any) {
        // options coming from config
    }

    id() {
        return 'veeds-proofreader-integrated';
    }

    async callApi(prompt: string, context: any) {
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
}
