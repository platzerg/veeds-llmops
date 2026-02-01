// =============================================================================
// Option B: Golden Dataset → Langfuse Dataset Upload
// =============================================================================
// Uploads golden_dataset.json to Langfuse as a managed Dataset.
// After upload, you can run Experiments against it in the Langfuse UI.
//
// Usage:
//   npx tsx eval/upload-dataset-to-langfuse.ts
//
// Prerequisites:
//   - Langfuse running (docker compose up)
//   - LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST set in .env
// =============================================================================

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Langfuse from "langfuse";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DATASET_NAME = "veeds-proofreader-golden";
const DATASET_DESCRIPTION =
  "Golden Dataset for VEEDS Proofreader evaluation. Contains true positives, true negatives, edge cases, and adversarial test cases.";

// ---------------------------------------------------------------------------
// Load golden dataset
// ---------------------------------------------------------------------------
interface GoldenTestCase {
  id: string;
  category: string;
  description: string;
  input: string;
  expectedErrors: Array<{
    field: string;
    severity?: string;
    pattern?: string;
  }>;
  expectedIsValid: boolean;
}

interface GoldenDataset {
  description: string;
  version: string;
  specVersion: string;
  testCases: GoldenTestCase[];
}

const datasetPath = resolve(__dirname, "golden_dataset.json");
const goldenData: GoldenDataset = JSON.parse(
  readFileSync(datasetPath, "utf-8")
);

console.log(
  `📂 Loaded ${goldenData.testCases.length} test cases (v${goldenData.version})`
);

// ---------------------------------------------------------------------------
// Connect to Langfuse
// ---------------------------------------------------------------------------
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
});

async function main() {
  // -------------------------------------------------------------------------
  // Step 1: Create or update dataset
  // -------------------------------------------------------------------------
  console.log(`\n📦 Creating dataset "${DATASET_NAME}"...`);

  const dataset = await langfuse.createDataset({
    name: DATASET_NAME,
    description: DATASET_DESCRIPTION,
    metadata: {
      version: goldenData.version,
      specVersion: goldenData.specVersion,
      generatedAt: new Date().toISOString(),
      source: "eval/golden_dataset.json",
    },
  });

  console.log(`   ✅ Dataset created/updated: ${DATASET_NAME}`);

  // -------------------------------------------------------------------------
  // Step 2: Upload items
  // -------------------------------------------------------------------------
  console.log(`\n📤 Uploading ${goldenData.testCases.length} items...`);

  let uploaded = 0;
  let errors = 0;

  for (const tc of goldenData.testCases) {
    try {
      await langfuse.createDatasetItem({
        datasetName: DATASET_NAME,
        id: tc.id,
        input: {
          yaml_entry: tc.input,
        },
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
      const icon =
        tc.category === "true_positive"
          ? "🔴"
          : tc.category === "true_negative"
            ? "🟢"
            : tc.category === "edge_case"
              ? "🟡"
              : "⚠️";
      console.log(`   ${icon} [${tc.id}] ${tc.description}`);
    } catch (err) {
      errors++;
      console.error(`   ❌ [${tc.id}] Failed: ${err}`);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Flush and report
  // -------------------------------------------------------------------------
  await langfuse.shutdownAsync();

  console.log(`\n📊 Upload Summary:`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Dataset:  ${DATASET_NAME}`);
  console.log(`\n🔗 View in Langfuse: ${process.env.LANGFUSE_HOST || "http://localhost:3000"}`);
  console.log(`   → Datasets → ${DATASET_NAME}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Go to Langfuse → Datasets → ${DATASET_NAME}`);
  console.log(`   2. Click "New Experiment"`);
  console.log(`   3. Select prompt "veeds-proofreader" and model`);
  console.log(`   4. Run experiment and compare scores`);
}

main().catch((err) => {
  console.error("❌ Upload failed:", err);
  process.exit(1);
});
