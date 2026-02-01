// =============================================================================
// Option A: Golden Dataset → Promptfoo Test Cases
// =============================================================================
// Generates promptfoo-compatible test cases from golden_dataset.json
// so that the golden dataset is the SINGLE SOURCE OF TRUTH.
//
// Usage:
//   npx tsx eval/generate-promptfoo-tests.ts
//   → writes eval/generated-tests.yaml
//   → referenced by promptfooconfig.yaml via `tests: file://eval/generated-tests.yaml`
// =============================================================================

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  testCases: GoldenTestCase[];
}

// ---------------------------------------------------------------------------
// Load golden dataset
// ---------------------------------------------------------------------------
const datasetPath = resolve(__dirname, "golden_dataset.json");
const dataset: GoldenDataset = JSON.parse(readFileSync(datasetPath, "utf-8"));

console.log(`📂 Loaded ${dataset.testCases.length} test cases from golden_dataset.json`);

// ---------------------------------------------------------------------------
// Transform to promptfoo format
// ---------------------------------------------------------------------------
interface PromptfooTest {
  description: string;
  vars: { yaml_entry: string };
  assert: Array<{
    type: string;
    value?: string;
    threshold?: number;
    metric?: string;
  }>;
  metadata?: Record<string, string>;
}

const tests: PromptfooTest[] = dataset.testCases.map((tc) => {
  const assertions: PromptfooTest["assert"] = [];

  // --- Assertion 1: isValid correctness ---
  assertions.push({
    type: "javascript",
    value: `const p = JSON.parse(output);\nreturn p.isValid === ${tc.expectedIsValid};`,
    metric: "correctness/is_valid",
  });

  // --- Assertion 2: Expected errors detected (more flexible) ---
  if (tc.expectedErrors.length > 0) {
    // For true positives: just check that isValid is false and at least one expected error field is present
    for (const err of tc.expectedErrors) {
      assertions.push({
        type: "javascript",
        value: `const p = JSON.parse(output);\nreturn p.errors.some(e => e.field === '${err.field}' || e.field.includes('${err.field}'));`,
        metric: `correctness/field_${err.field}`,
      });
    }
  } else {
    // True negative: no errors expected
    assertions.push({
      type: "javascript",
      value: "const p = JSON.parse(output);\nreturn p.errors.length === 0;",
      metric: "correctness/no_false_positives",
    });
  }

  // --- Assertion 3: Category-specific semantic checks ---
  if (tc.category === "adversarial") {
    assertions.push({
      type: "javascript",
      value: `const p = JSON.parse(output);\nreturn p.hasOwnProperty('isValid') && p.hasOwnProperty('errors');`,
      metric: "injection_resistance",
    });
  }

  if (tc.category === "edge_case") {
    assertions.push({
      type: "javascript",
      value: `const p = JSON.parse(output);\nreturn p.hasOwnProperty('isValid') && p.hasOwnProperty('errors');`,
      metric: "edge_case_handling",
    });
  }

  return {
    description: `[${tc.id}] ${tc.description}`,
    vars: { yaml_entry: tc.input },
    assert: assertions,
    metadata: {
      goldenId: tc.id,
      category: tc.category,
    },
  };
});

// ---------------------------------------------------------------------------
// Write YAML output
// ---------------------------------------------------------------------------
// We write JSON that promptfoo can also consume as test file
const outputPath = resolve(__dirname, "generated-tests.yaml");

// Manual YAML generation (no dependency needed)
let yaml = `# =============================================================================\n`;
yaml += `# AUTO-GENERATED from golden_dataset.json\n`;
yaml += `# Do not edit manually! Run: npx tsx eval/generate-promptfoo-tests.ts\n`;
yaml += `# Generated: ${new Date().toISOString()}\n`;
yaml += `# Test cases: ${tests.length}\n`;
yaml += `# =============================================================================\n\n`;

for (const test of tests) {
  yaml += `- description: "${test.description}"\n`;
  yaml += `  vars:\n`;
  yaml += `    yaml_entry: |\n`;
  for (const line of test.vars.yaml_entry.split("\n")) {
    yaml += `      ${line}\n`;
  }
  yaml += `  assert:\n`;
  for (const a of test.assert) {
    yaml += `    - type: ${a.type}\n`;
    if (a.value) {
      const trimmedValue = a.value.trim();
      // Always use block scalar format for JavaScript assertions to avoid syntax errors
      yaml += `      value: |\n`;
      for (const line of trimmedValue.split("\n")) {
        yaml += `        ${line}\n`;
      }
    }
    if (a.threshold !== undefined) {
      yaml += `      threshold: ${a.threshold}\n`;
    }
    // Temporarily remove metric to debug
    // if (a.metric) {
    //   yaml += `      metric: ${a.metric}\n`;
    // }
  }
  if (test.metadata) {
    yaml += `  metadata:\n`;
    for (const [k, v] of Object.entries(test.metadata)) {
      yaml += `    ${k}: "${v}"\n`;
    }
  }
  yaml += `\n`;
}

writeFileSync(outputPath, yaml, "utf-8");
console.log(`✅ Generated ${tests.length} test cases → ${outputPath}`);
console.log(`\n📋 Category breakdown:`);

const categories = new Map<string, number>();
for (const tc of dataset.testCases) {
  categories.set(tc.category, (categories.get(tc.category) || 0) + 1);
}
for (const [cat, count] of categories) {
  console.log(`   ${cat}: ${count}`);
}

console.log(`\n💡 Update promptfooconfig.yaml to use:`);
console.log(`   tests: file://eval/generated-tests.yaml`);
