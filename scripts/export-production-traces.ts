import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import "dotenv/config";

// =============================================================================
// Full Circle Feedback Loop - Trace Export Script
// =============================================================================
// This script fetches traces from Langfuse and converts them into 
// golden dataset test cases for regression testing.
// =============================================================================

const LANGFUSE_HOST = process.env.LANGFUSE_HOST || "http://localhost:3000";
const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY!;
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY!;
const DATASET_PATH = resolve(process.cwd(), "eval/golden_dataset.json");

if (!PUBLIC_KEY || !SECRET_KEY) {
    console.error("❌ Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY");
    process.exit(1);
}

async function exportTraces() {
    console.log("🔍 Fetching traces from Langfuse...");

    const auth = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString("base64");

    try {
        // 1. Get traces with the tag 'proofreader'
        // In a real scenario, you might filter by a tag like 'needs-eval' or high scores
        const response = await axios.get(`${LANGFUSE_HOST}/api/public/traces`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
            params: {
                name: "veeds-proofreader",
                limit: 50,
            },
        });

        const traces = response.data.data;
        console.log(`✅ Found ${traces.length} traces`);

        // 2. Load existing dataset
        const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
        const existingIds = new Set(dataset.testCases.map((tc: any) => tc.id));

        let addedCount = 0;

        // 3. Transform and append new cases
        for (const trace of traces) {
            const traceId = trace.id;

            // Skip if already in dataset
            if (existingIds.has(`prod-${traceId.substring(0, 8)}`)) continue;

            // In a real production system, you would fetch the full trace details 
            // to get the actual input and output.
            const detailResponse = await axios.get(`${LANGFUSE_HOST}/api/public/traces/${traceId}`, {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            });

            const traceDetail = detailResponse.data;
            const yamlInput = traceDetail.input;
            const llmOutput = traceDetail.output;

            if (!yamlInput || !llmOutput) continue;

            // Determine category (this is a heuristic for the demo)
            const isValid = llmOutput.isValid ?? true;
            const category = isValid ? "true_negative" : "true_positive";

            const newTestCase = {
                id: `prod-${traceId.substring(0, 8)}`,
                category: category,
                description: `Imported from production trace ${traceId.substring(0, 8)}`,
                input: typeof yamlInput === 'string' ? yamlInput : JSON.stringify(yamlInput),
                expectedErrors: llmOutput.errors || [],
                expectedIsValid: isValid,
                metadata: {
                    source: "production-export",
                    traceId: traceId,
                    exportedAt: new Date().toISOString()
                }
            };

            dataset.testCases.push(newTestCase);
            addedCount++;
        }

        if (addedCount > 0) {
            writeFileSync(DATASET_PATH, JSON.stringify(dataset, null, 2));
            console.log(`✨ Successfully added ${addedCount} new test cases to golden_dataset.json`);
        } else {
            console.log("ℹ️ No new traces to import.");
        }

    } catch (error: any) {
        console.error("❌ Export failed:", error.response?.data || error.message);
    }
}

exportTraces();
