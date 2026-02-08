import axios from 'axios';
import { getLogger } from '../logging/logger.ts';

const logger = getLogger();

const ANALYZER_URL = process.env.PRESIDIO_ANALYZER_URL || 'http://localhost:5001';
const ANONYMIZER_URL = process.env.PRESIDIO_ANONYMIZER_URL || 'http://localhost:5002';

export interface PIIFilterResult {
    anonymizedText: string;
    detectedEntities: string[];
}

/**
 * Filter PII from text using Microsoft Presidio.
 * Supports German and English.
 */
export async function anonymizeText(text: string, language: string = 'en'): Promise<PIIFilterResult> {
    try {
        // 1. Analyze text for PII
        const analyzeResponse = await axios.post(`${ANALYZER_URL}/analyze`, {
            text,
            language,
            entities: ["PERSON", "LOCATION", "PHONE_NUMBER", "EMAIL_ADDRESS", "CREDIT_CARD"],
            score_threshold: 0.4
        });

        const analysisResults = analyzeResponse.data;

        if (!analysisResults || analysisResults.length === 0) {
            return { anonymizedText: text, detectedEntities: [] };
        }

        const detectedEntities: string[] = Array.from(new Set(analysisResults.map((r: any) => r.entity_type as string)));

        logger.info('PII detected in input', {
            operation: 'pii-filter',
            entityCount: analysisResults.length,
            entityTypes: detectedEntities
        });

        // 2. Anonymize detected PII
        const anonymizeResponse = await axios.post(`${ANONYMIZER_URL}/anonymize`, {
            text,
            analyzer_results: analysisResults,
            operators: {
                "DEFAULT": {
                    "type": "replace",
                    "new_value": "<REDACTED>"
                },
                "PERSON": {
                    "type": "replace",
                    "new_value": "<PERSON>"
                },
                "LOCATION": {
                    "type": "replace",
                    "new_value": "<LOCATION>"
                }
            }
        });

        return {
            anonymizedText: anonymizeResponse.data.text,
            detectedEntities
        };

    } catch (error: any) {
        logger.error('PII filtering failed, falling back to original text', {
            operation: 'pii-filter',
            error: error.message
        });
        // Fallback security: in case of failure, we return the original text 
        // but log a warning. In a strict prod environment, we might want to throw.
        return { anonymizedText: text, detectedEntities: [] };
    }
}
