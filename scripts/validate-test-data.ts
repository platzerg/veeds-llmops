// =============================================================================
// Test Data Validation Script
// =============================================================================
// Usage: npx tsx scripts/validate-test-data.ts
// Purpose: Validates generated test cases against actual proofreader output
// =============================================================================

import { proofreadEntry } from "../src/proofreader.js";
import { shutdownLangfuse } from "../src/langfuse-client.js";
import fs from "fs/promises";

interface TestCase {
  id: string;
  category: string;
  description: string;
  input: string;
  expectedIsValid: boolean;
  expectedErrors?: Array<{
    field: string;
    severity: string;
    pattern?: string;
  }>;
  source: string;
  confidence?: number;
}

interface ValidationResult {
  testCase: TestCase;
  actualResult: any;
  passed: boolean;
  issues: string[];
}

async function validateTestData(): Promise<void> {
  console.log("🔍 Validating generated test data...\n");

  try {
    // Load golden dataset
    const datasetContent = await fs.readFile("eval/golden_dataset.json", "utf-8");
    const dataset = JSON.parse(datasetContent);
    
    const results: ValidationResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    // Validate each test case
    for (const testCase of dataset.testCases) {
      if (testCase.source !== "generated") {
        continue; // Only validate generated cases
      }

      console.log(`Testing: ${testCase.id} - ${testCase.description}`);
      
      try {
        // Run proofreader
        const actualResult = await proofreadEntry(testCase.input, {
          userId: "validation-script",
          sessionId: "validation-session",
          tags: ["validation", testCase.category]
        });

        // Validate result
        const issues: string[] = [];
        
        // Check isValid
        if (actualResult.isValid !== testCase.expectedIsValid) {
          issues.push(`Expected isValid: ${testCase.expectedIsValid}, got: ${actualResult.isValid}`);
        }

        // Check error fields if expected
        if (testCase.expectedErrors && testCase.expectedErrors.length > 0) {
          for (const expectedError of testCase.expectedErrors) {
            const hasMatchingError = actualResult.errors.some((actualError: any) => 
              actualError.field === expectedError.field &&
              actualError.severity === expectedError.severity
            );
            
            if (!hasMatchingError) {
              issues.push(`Missing expected error for field: ${expectedError.field}`);
            }
          }
        }

        const passed = issues.length === 0;
        if (passed) {
          passedCount++;
          console.log(`  ✅ PASSED`);
        } else {
          failedCount++;
          console.log(`  ❌ FAILED: ${issues.join(", ")}`);
        }

        results.push({
          testCase,
          actualResult,
          passed,
          issues
        });

      } catch (error) {
        failedCount++;
        console.log(`  💥 ERROR: ${error}`);
        
        results.push({
          testCase,
          actualResult: null,
          passed: false,
          issues: [`Runtime error: ${error}`]
        });
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate validation report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: passedCount,
        failed: failedCount,
        passRate: Math.round((passedCount / results.length) * 100)
      },
      results: results
    };

    // Save report
    await fs.writeFile(
      "eval/validation-report.json",
      JSON.stringify(report, null, 2),
      "utf-8"
    );

    // Print summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`   Total tests: ${results.length}`);
    console.log(`   Passed: ${passedCount} (${report.summary.passRate}%)`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`\n💾 Detailed report saved to: eval/validation-report.json`);

    if (failedCount > 0) {
      console.log(`\n⚠️  ${failedCount} test cases failed validation`);
      console.log("   Review the issues and update test expectations or fix the proofreader");
    } else {
      console.log(`\n🎉 All generated test cases passed validation!`);
    }

  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  } finally {
    await shutdownLangfuse();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTestData();
}

export { validateTestData };