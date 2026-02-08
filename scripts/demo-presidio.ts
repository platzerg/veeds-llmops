/**
 * Presidio PII Detection & Anonymization Demo
 * 
 * Testet die Presidio Services für PII-Erkennung und Anonymisierung
 * 
 * Verwendung:
 *   npx tsx scripts/demo-presidio.ts
 */

import axios from 'axios';

const PRESIDIO_ANALYZER_URL = 'http://localhost:5001';
const PRESIDIO_ANONYMIZER_URL = 'http://localhost:5002'; // Aktuell laufender Port (docker-compose.yml sagt 5003)

// Test-Texte mit verschiedenen PII-Typen (English only - works without language models)
const testTexts = [
    {
        name: 'Email and Phone Numbers',
        text: 'Please contact me at john.doe@example.com or call +1-555-123-4567.',
        language: 'en'
    },
    {
        name: 'Credit Card and Personal Info',
        text: 'My credit card is 4532-1234-5678-9010 and my SSN is 123-45-6789.',
        language: 'en'
    },
    {
        name: 'YAML Entry with PII',
        text: `materialNumber: ABC-12345
description: Brake disc ordered by customer
contact: customer@company.com
phone: +1-555-987-6543
creditCard: 4532123456789010`,
        language: 'en'
    }
];

interface AnalyzerResult {
    entity_type: string;
    start: number;
    end: number;
    score: number;
}

interface AnonymizerResult {
    text: string;
    items: Array<{
        start: number;
        end: number;
        entity_type: string;
        text: string;
        operator: string;
    }>;
}

async function analyzePII(text: string, language: string = 'de'): Promise<AnalyzerResult[]> {
    try {
        const response = await axios.post(`${PRESIDIO_ANALYZER_URL}/analyze`, {
            text,
            language,
            entities: [
                'PERSON',
                'EMAIL_ADDRESS',
                'PHONE_NUMBER',
                'LOCATION',
                'CREDIT_CARD',
                'IBAN_CODE',
                'IP_ADDRESS',
                'URL'
            ]
        });
        return response.data;
    } catch (error: any) {
        console.error('❌ Analyzer Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        return [];
    }
}

async function anonymizePII(text: string, analyzerResults: AnalyzerResult[]): Promise<AnonymizerResult | null> {
    try {
        const response = await axios.post(`${PRESIDIO_ANONYMIZER_URL}/anonymize`, {
            text,
            analyzer_results: analyzerResults,
            anonymizers: {
                DEFAULT: { type: 'replace', new_value: '<REDACTED>' },
                PERSON: { type: 'replace', new_value: '<PERSON>' },
                EMAIL_ADDRESS: { type: 'replace', new_value: '<EMAIL>' },
                PHONE_NUMBER: { type: 'replace', new_value: '<PHONE>' },
                LOCATION: { type: 'replace', new_value: '<LOCATION>' },
                CREDIT_CARD: { type: 'mask', masking_char: '*', chars_to_mask: 12, from_end: false },
                IBAN_CODE: { type: 'mask', masking_char: '*', chars_to_mask: 8, from_end: false }
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('❌ Anonymizer Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        return null;
    }
}

async function checkHealth() {
    console.log('🏥 Checking Presidio Services Health...\n');

    try {
        const analyzerHealth = await axios.get(`${PRESIDIO_ANALYZER_URL}/health`);
        console.log('✅ Presidio Analyzer:', analyzerHealth.status === 200 ? 'Healthy' : 'Unhealthy');
    } catch (error) {
        console.log('❌ Presidio Analyzer: Not reachable');
    }

    try {
        const anonymizerHealth = await axios.get(`${PRESIDIO_ANONYMIZER_URL}/health`);
        console.log('✅ Presidio Anonymizer:', anonymizerHealth.status === 200 ? 'Healthy' : 'Unhealthy');
    } catch (error) {
        console.log('❌ Presidio Anonymizer: Not reachable');
    }

    console.log('');
}

async function runDemo() {
    console.log('🔍 Presidio PII Detection & Anonymization Demo\n');
    console.log('='.repeat(80));
    console.log('');

    await checkHealth();

    for (const test of testTexts) {
        console.log('📝 Test:', test.name);
        console.log('─'.repeat(80));
        console.log('Original Text:');
        console.log(test.text);
        console.log('');

        // Step 1: Analyze
        console.log('🔍 Analyzing for PII...');
        const analyzerResults = await analyzePII(test.text, test.language);

        if (analyzerResults.length === 0) {
            console.log('   ℹ️  No PII detected');
            console.log('');
            continue;
        }

        console.log(`   ✅ Found ${analyzerResults.length} PII entities:`);
        analyzerResults.forEach((result, index) => {
            const detectedText = test.text.substring(result.start, result.end);
            console.log(`   ${index + 1}. ${result.entity_type} (confidence: ${(result.score * 100).toFixed(1)}%)`);
            console.log(`      Text: "${detectedText}"`);
            console.log(`      Position: ${result.start}-${result.end}`);
        });
        console.log('');

        // Step 2: Anonymize
        console.log('🔒 Anonymizing PII...');
        const anonymizedResult = await anonymizePII(test.text, analyzerResults);

        if (anonymizedResult) {
            console.log('   ✅ Anonymized Text:');
            console.log('   ' + anonymizedResult.text);
            console.log('');

            console.log('   📊 Anonymization Details:');
            anonymizedResult.items.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.entity_type}: "${item.text}" → ${item.operator}`);
            });
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('');
    }

    // Bonus: Test mit YAML Entry
    console.log('🎯 Bonus: YAML Entry PII Protection Workflow\n');
    const yamlEntry = `materialNumber: BRK-12345
description: Bremsscheibe bestellt von Thomas Müller
unit: mm
contact: thomas.mueller@autoteile-gmbh.de
phone: +49 89 12345678
address: Hauptstraße 42, 80331 München`;

    console.log('Original YAML:');
    console.log(yamlEntry);
    console.log('');

    const yamlAnalysis = await analyzePII(yamlEntry, 'de');
    console.log(`Found ${yamlAnalysis.length} PII entities in YAML`);

    const yamlAnonymized = await anonymizePII(yamlEntry, yamlAnalysis);
    if (yamlAnonymized) {
        console.log('\nAnonymized YAML (safe to send to LLM):');
        console.log(yamlAnonymized.text);
    }

    console.log('\n✅ Demo completed!');
    console.log('\n💡 Tip: Use this in your proofreader pipeline:');
    console.log('   1. Analyze YAML entry for PII');
    console.log('   2. Anonymize before sending to AWS Bedrock');
    console.log('   3. Process anonymized text with LLM');
    console.log('   4. Return results (PII stays protected)');
}

// Run the demo
runDemo().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
