// =============================================================================
// VEEDS Proofreader Demo - OpenAI Version
// =============================================================================
import "dotenv/config";
import { proofreadEntry } from "./proofreader-openai.js";
import { shutdownLangfuse } from "./langfuse-client.js";
import logger from "./logger.js";

async function main() {
  logger.info("🚀 VEEDS Proofreader Demo (OpenAI)", {
    operation: "demo-start",
  });

  // Test 1: Valid Entry
  logger.info("--- Test 1: Valid Entry ---", {
    operation: "demo-test",
    testCase: 1,
  });

  const validEntry = `materialNumber: ABC-12345
description: Bremsscheibe vorne links
unit: mm
valueRange:
  min: 20
  max: 35
category: Bremsanlage`;

  const result1 = await proofreadEntry(validEntry, {
    userId: "demo-user",
    sessionId: "demo-session-1",
    tags: ["demo", "valid-entry"],
  });

  logger.info("Test 1 Results", {
    operation: "demo-test",
    testCase: 1,
    isValid: result1.isValid,
    errorCount: result1.errors.length,
    processingTimeMs: result1.processingTimeMs,
  });

  console.log("✅ Valid Entry Result:", JSON.stringify(result1, null, 2));

  // Test 2: Invalid Entry
  logger.info("--- Test 2: Invalid Entry ---", {
    operation: "demo-test",
    testCase: 2,
  });

  const invalidEntry = `materialNumber: INVALID
description: Bremsscheibe
unit: bananas`;

  const result2 = await proofreadEntry(invalidEntry, {
    userId: "demo-user",
    sessionId: "demo-session-1",
    tags: ["demo", "invalid-entry"],
  });

  logger.info("Test 2 Results", {
    operation: "demo-test",
    testCase: 2,
    isValid: result2.isValid,
    errorCount: result2.errors.length,
    processingTimeMs: result2.processingTimeMs,
    errors: result2.errors,
  });

  console.log("❌ Invalid Entry Result:", JSON.stringify(result2, null, 2));

  logger.info("🎉 Demo completed! Check traces at http://localhost:9222", {
    operation: "demo-complete",
  });

  // Shutdown
  await shutdownLangfuse();
}

main().catch((error) => {
  logger.error("Demo failed", {
    operation: "demo-error",
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  });
  process.exit(1);
});