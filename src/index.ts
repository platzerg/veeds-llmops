// =============================================================================
// VEEDS Proofreader Demo - With Structured Logging
// Usage: npx tsx src/index.ts
// =============================================================================
import { proofreadEntry } from "./proofreader.js";
import { shutdownLangfuse } from "./langfuse-client.js";
import logger from "./logger.js";

async function main() {
  logger.info("🔍 VEEDS Proofreader Demo", { operation: 'demo-start' });

  // -------------------------------------------------------------------------
  // Test Case 1: Valid entry
  // -------------------------------------------------------------------------
  logger.info("--- Test 1: Valid Entry ---", { operation: 'demo-test', testCase: 1 });
  
  const result1 = await proofreadEntry(
    `materialNumber: ABC-12345
description: Bremsscheibe vorne links
unit: mm
valueRange:
  min: 20
  max: 35
category: Bremsanlage`,
    {
      userId: "demo-user",
      sessionId: "demo-session-1",
      tags: ["demo", "valid-entry"],
    }
  );
  
  logger.info("Test 1 Results", {
    operation: 'demo-test',
    testCase: 1,
    isValid: result1.isValid,
    errorCount: result1.errors.length,
    processingTimeMs: result1.processingTimeMs
  });

  // -------------------------------------------------------------------------
  // Test Case 2: Invalid entry
  // -------------------------------------------------------------------------
  logger.info("--- Test 2: Invalid Entry ---", { operation: 'demo-test', testCase: 2 });
  
  const result2 = await proofreadEntry(
    `materialNumber: INVALID
description: ""
unit: bananas
valueRange:
  min: 100
  max: 5`,
    {
      userId: "demo-user",
      sessionId: "demo-session-1",
      tags: ["demo", "invalid-entry"],
    }
  );
  
  logger.info("Test 2 Results", {
    operation: 'demo-test',
    testCase: 2,
    isValid: result2.isValid,
    errorCount: result2.errors.length,
    processingTimeMs: result2.processingTimeMs,
    errors: result2.errors.map(e => ({
      field: e.field,
      severity: e.severity,
      message: e.message
    }))
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  await shutdownLangfuse();
  logger.info("✅ Demo completed! Check traces at http://localhost:3000", { 
    operation: 'demo-complete' 
  });
}

main().catch((error) => {
  logger.error("Demo failed", {
    operation: 'demo-error',
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error)
  });
  process.exit(1);
});