// =============================================================================
// CI/CD Test Pipeline Script
// =============================================================================
// Usage: npx tsx scripts/ci-test-pipeline.ts
// Purpose: Complete test pipeline for CI/CD integration
// =============================================================================

import { TestDataManager } from "./generate-test-data.js";
import { validateTestData } from "./validate-test-data.js";
import { execSync } from "child_process";
import fs from "fs/promises";

interface PipelineConfig {
  generateTests: boolean;
  validateGenerated: boolean;
  runEvaluation: boolean;
  runLoadTests: boolean;
  failOnValidationErrors: boolean;
  failOnEvaluationErrors: boolean;
}

class CIPipeline {
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      generateTests: true,
      validateGenerated: true,
      runEvaluation: true,
      runLoadTests: false, // Disabled by default in CI
      failOnValidationErrors: true,
      failOnEvaluationErrors: true,
      ...config
    };
  }

  async run(): Promise<void> {
    console.log("🚀 Starting VEEDS CI/CD Test Pipeline\n");
    
    const startTime = Date.now();
    let exitCode = 0;

    try {
      // Step 0: Setup Langfuse prompts (if needed)
      console.log("📝 Step 0: Setting up Langfuse prompts...");
      try {
        const { AutoPromptSetup } = await import("./setup-langfuse-http.js");
        const promptSetup = new AutoPromptSetup();
        await promptSetup.setupPrompts();
        console.log("✅ Langfuse prompts setup completed\n");
      } catch (error) {
        console.warn("⚠️  Prompt setup failed (continuing anyway):", error);
      }

      // Step 1: Generate test data
      if (this.config.generateTests) {
        console.log("📝 Step 1: Generating test data...");
        const manager = new TestDataManager();
        const dataset = await manager.generateAndMerge();
        await manager.saveDataset(dataset);
        await manager.updatePromptfooConfig(dataset);
        console.log("✅ Test data generation completed\n");
      }

      // Step 2: Validate generated tests
      if (this.config.validateGenerated) {
        console.log("🔍 Step 2: Validating generated test cases...");
        try {
          await validateTestData();
          console.log("✅ Test validation completed\n");
        } catch (error) {
          console.error("❌ Test validation failed:", error);
          if (this.config.failOnValidationErrors) {
            exitCode = 1;
            throw error;
          }
        }
      }

      // Step 3: Run Promptfoo evaluation
      if (this.config.runEvaluation) {
        console.log("🧪 Step 3: Running Promptfoo evaluation...");
        try {
          execSync("npm run eval:assert", { stdio: "inherit" });
          console.log("✅ Evaluation completed successfully\n");
        } catch (error) {
          console.error("❌ Evaluation failed");
          if (this.config.failOnEvaluationErrors) {
            exitCode = 1;
            throw error;
          }
        }
      }

      // Step 4: Run load tests (optional)
      if (this.config.runLoadTests) {
        console.log("⚡ Step 4: Running load tests...");
        try {
          execSync("npm run test:load:smoke", { stdio: "inherit" });
          console.log("✅ Load tests completed\n");
        } catch (error) {
          console.error("❌ Load tests failed:", error);
          // Load test failures are warnings, not hard failures
        }
      }

      // Generate pipeline report
      await this.generateReport(startTime, exitCode === 0);

      if (exitCode === 0) {
        console.log("🎉 CI/CD Pipeline completed successfully!");
      } else {
        console.log("💥 CI/CD Pipeline failed with errors");
      }

    } catch (error) {
      console.error("💥 Pipeline failed:", error);
      exitCode = 1;
    }

    process.exit(exitCode);
  }

  private async generateReport(startTime: number, success: boolean): Promise<void> {
    const duration = Date.now() - startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      success,
      config: this.config,
      steps: {
        generateTests: this.config.generateTests,
        validateGenerated: this.config.validateGenerated,
        runEvaluation: this.config.runEvaluation,
        runLoadTests: this.config.runLoadTests
      }
    };

    await fs.writeFile(
      "eval/ci-pipeline-report.json",
      JSON.stringify(report, null, 2),
      "utf-8"
    );

    console.log(`📊 Pipeline Report:`);
    console.log(`   Duration: ${report.duration}`);
    console.log(`   Success: ${success ? "✅" : "❌"}`);
    console.log(`   Report saved to: eval/ci-pipeline-report.json\n`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const config: Partial<PipelineConfig> = {};

  // Parse CLI arguments
  if (args.includes("--no-generate")) config.generateTests = false;
  if (args.includes("--no-validate")) config.validateGenerated = false;
  if (args.includes("--no-eval")) config.runEvaluation = false;
  if (args.includes("--load-tests")) config.runLoadTests = true;
  if (args.includes("--no-fail-validation")) config.failOnValidationErrors = false;
  if (args.includes("--no-fail-eval")) config.failOnEvaluationErrors = false;

  const pipeline = new CIPipeline(config);
  await pipeline.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CIPipeline };