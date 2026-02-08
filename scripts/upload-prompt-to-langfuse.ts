// =============================================================================
// Langfuse Prompt Upload Script
// =============================================================================
// Uploads/Updates the prompt template from eval/prompt.txt to Langfuse.
//
// Usage:
//   npm run prompt:upload
// =============================================================================

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Langfuse from "langfuse";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
const required = ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
}

const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
    secretKey: process.env.LANGFUSE_SECRET_KEY!,
    baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
});

async function main() {
    const PROMPT_NAME = "veeds-proofreader";
    const PROMPT_FILE = resolve(ROOT, "eval/prompt.txt");

    console.log(`📤 Uploading prompt "${PROMPT_NAME}" from ${PROMPT_FILE}...`);

    try {
        const promptText = readFileSync(PROMPT_FILE, "utf-8");

        const prompt = await langfuse.createPrompt({
            name: PROMPT_NAME,
            prompt: promptText,
            labels: ["production", "latest"],
            config: {
                model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
                temperature: 0,
                max_tokens: 2048,
            },
        });

        console.log(`✅ Success! Created new version: ${prompt.version}`);
        console.log(`🔗 View in UI: ${process.env.LANGFUSE_HOST || "http://localhost:3000"}/prompts/${PROMPT_NAME}`);
    } catch (err: any) {
        console.error(`❌ Upload failed: ${err.message || err}`);
        process.exit(1);
    } finally {
        await langfuse.shutdownAsync();
    }
}

main();
