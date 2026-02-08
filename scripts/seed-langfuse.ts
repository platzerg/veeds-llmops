// =============================================================================
// Langfuse Seed Script
// =============================================================================
// Uploads prompt template and golden dataset to Langfuse on first setup.
// Run once after docker compose up + account creation + API key config.
//
// Usage:
//   npx tsx scripts/seed-langfuse.ts
//
// What it does:
//   1. Creates prompt "veeds-proofreader" (production label)
//   2. Uploads golden dataset "veeds-proofreader-golden"
//   3. Verifies connectivity
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
  console.error(`   Set them in .env or export them.`);
  console.error(`   → Get keys from http://localhost:3000 → Settings → API Keys`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
});

async function main() {
  console.log("🌱 VEEDS LLMOps — Langfuse Seed\n");

  // =========================================================================
  // Step 1: Create Prompt
  // =========================================================================
  console.log("📝 Step 1: Creating prompt...");

  const promptText = readFileSync(
    resolve(ROOT, "eval/prompt.txt"),
    "utf-8"
  );

  try {
    await langfuse.createPrompt({
      name: "veeds-proofreader",
      prompt: promptText,
      labels: ["production", "latest"],
      config: {
        model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        temperature: 0,
        max_tokens: 2048,
      },
    });
    console.log('   ✅ Prompt "veeds-proofreader" created with label "production"');
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.status === 409) {
      console.log('   ⚠️  Prompt "veeds-proofreader" already exists (skipping)');
    } else {
      throw err;
    }
  }

  // =========================================================================
  // Step 2: Upload Golden Dataset
  // =========================================================================
  console.log("\n📦 Step 2: Uploading golden dataset...");

  const goldenData = JSON.parse(
    readFileSync(resolve(ROOT, "eval/golden_dataset.json"), "utf-8")
  );

  const DATASET_NAME = "veeds-proofreader-golden";

  try {
    await langfuse.createDataset({
      name: DATASET_NAME,
      description:
        "Golden dataset for VEEDS Proofreader evaluation (TP, TN, Edge, Adversarial)",
      metadata: {
        version: goldenData.version,
        specVersion: goldenData.specVersion,
      },
    });
    console.log(`   ✅ Dataset "${DATASET_NAME}" created`);
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.status === 409) {
      console.log(`   ⚠️  Dataset "${DATASET_NAME}" already exists (updating items)`);
    } else {
      throw err;
    }
  }

  let uploaded = 0;
  for (const tc of goldenData.testCases) {
    await langfuse.createDatasetItem({
      datasetName: DATASET_NAME,
      id: tc.id,
      input: { yaml_entry: tc.input },
      expectedOutput: {
        isValid: tc.expectedIsValid,
        errors: tc.expectedErrors,
      },
      metadata: {
        category: tc.category,
        description: tc.description,
      },
    });
    uploaded++;
  }
  console.log(`   ✅ ${uploaded} dataset items uploaded`);

  // =========================================================================
  // Step 3: Verify
  // =========================================================================
  console.log("\n🔍 Step 3: Verifying...");

  try {
    const prompt = await langfuse.getPrompt("veeds-proofreader", undefined, {
      label: "production",
    });
    console.log(
      `   ✅ Prompt loadable (version ${prompt.version}, label: production)`
    );
  } catch {
    console.log("   ⚠️  Prompt not immediately available (may need a few seconds)");
  }

  // =========================================================================
  // Done
  // =========================================================================
  await langfuse.shutdownAsync();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Seed complete!");
  console.log("=".repeat(60));
  console.log(`\n  Langfuse UI:  ${process.env.LANGFUSE_HOST || "http://localhost:3000"}`);
  console.log(`  Prompt:       veeds-proofreader (production)`);
  console.log(`  Dataset:      ${DATASET_NAME} (${uploaded} items)`);
  console.log(`\n  Next: npx tsx src/index.ts  (run demo with tracing)`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message || err);
  process.exit(1);
});
