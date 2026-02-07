import { anonymizeText } from '../src/privacy/pii-filter.js';
import 'dotenv/config';

// =============================================================================
// PII Redaction Verification Script
// =============================================================================

async function testPII() {
    const testYaml = `
materialNumber: ABC-12345
description: Reparatur für Herr Max Mustermann aus der Berliner Straße 12.
unit: mm
technician: Thomas Schmidt
phone: +49 170 1234567
email: max.mustermann@gmail.com
  `;

    console.log("🔍 Testing PII Redaction...");
    console.log("Original YAML:", testYaml);

    try {
        const { anonymizedText, detectedEntities } = await anonymizeText(testYaml);

        console.log("\n✅ Redaction Complete!");
        console.log("Detected Entities:", detectedEntities);
        console.log("\nAnonymized Result:");
        console.log(anonymizedText);

        const success = anonymizedText.includes("<PERSON>") || anonymizedText.includes("<REDACTED>");
        if (success) {
            console.log("\n✨ Verification PASSED: PII was successfully identified and masked.");
        } else {
            console.log("\n❌ Verification FAILED: PII tags not found in output.");
        }

    } catch (error: any) {
        console.error("❌ Test failed:", error.message);
    }
}

testPII();
