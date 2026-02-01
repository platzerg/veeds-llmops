// =============================================================================
// Promptfoo → Langfuse Score Bridge
// =============================================================================
// Reads promptfoo evaluation results and pushes scores to Langfuse,
// so you see eval metrics alongside production traces in one dashboard.
//
// Usage:
//   npx promptfoo eval -c promptfooconfig.yaml --output eval/results/latest.json
//   npx tsx scripts/push-scores-to-langfuse.ts eval/results/latest.json
//
// What it creates in Langfuse:
//   - A trace per eval run (tagged "promptfoo-eval")
//   - Scores per test case: pass/fail, latency, cost
//   - Aggregate score for the entire run
// =============================================================================

import { readFileSync } from "fs";
import { resolve } from "path";
import Langfuse from "langfuse";

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const resultsFile = process.argv[2] || "eval/results/latest.json";
const resolvedPath = resolve(resultsFile);

let results: any;
try {
  results = JSON.parse(readFileSync(resolvedPath, "utf-8"));
} catch (err) {
  console.error(`❌ Cannot read results file: ${resolvedPath}`);
  console.error(`   Run promptfoo eval first: npm run eval`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Connect to Langfuse
// ---------------------------------------------------------------------------
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
});

async function main() {
  console.log("📊 Pushing promptfoo results → Langfuse\n");

  const evalResults = results.results?.results || results.results || [];
  if (evalResults.length === 0) {
    console.error("❌ No results found in file");
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Create parent trace for this eval run
  // -------------------------------------------------------------------------
  const runId = `promptfoo-${Date.now()}`;
  const evalTrace = langfuse.trace({
    name: "promptfoo-evaluation",
    id: runId,
    tags: ["promptfoo-eval", "ci"],
    metadata: {
      source: "promptfoo",
      resultsFile: resolvedPath,
      timestamp: new Date().toISOString(),
      totalTests: evalResults.length,
    },
  });

  // -------------------------------------------------------------------------
  // Process each test result
  // -------------------------------------------------------------------------
  let passed = 0;
  let failed = 0;
  let totalLatency = 0;
  let totalCost = 0;

  for (const result of evalResults) {
    const testDesc =
      result.description || result.vars?.yaml_entry?.substring(0, 50) || "unknown";

    // Determine pass/fail
    const allAssertionsPassed =
      result.gradingResult?.pass ??
      result.success ??
      (result.score !== undefined ? result.score >= 0.5 : true);

    if (allAssertionsPassed) {
      passed++;
    } else {
      failed++;
    }

    // Create span for each test case
    const span = evalTrace.span({
      name: `test: ${testDesc}`,
      input: result.vars || result.prompt,
      output: result.response?.output || result.output,
      level: allAssertionsPassed ? "DEFAULT" : "ERROR",
      metadata: {
        provider: result.provider?.id || result.provider,
        assertions: result.gradingResult?.componentResults?.map((c: any) => ({
          type: c.assertion?.type,
          pass: c.pass,
          score: c.score,
          reason: c.reason,
        })),
      },
    });

    // Score: pass/fail
    span.score({
      name: "eval_pass",
      value: allAssertionsPassed ? 1 : 0,
      comment: allAssertionsPassed
        ? "All assertions passed"
        : `Failed: ${result.gradingResult?.componentResults?.filter((c: any) => !c.pass).map((c: any) => c.assertion?.type).join(", ") || "unknown"}`,
    });

    // Score: latency
    const latency = result.latencyMs || result.response?.latencyMs;
    if (latency) {
      totalLatency += latency;
      span.score({
        name: "eval_latency_ms",
        value: latency,
      });
    }

    // Score: cost
    const cost = result.cost || result.response?.cost;
    if (cost) {
      totalCost += cost;
      span.score({
        name: "eval_cost_usd",
        value: cost,
      });
    }

    span.end();
  }

  // -------------------------------------------------------------------------
  // Aggregate scores on the eval trace
  // -------------------------------------------------------------------------
  const total = passed + failed;
  const passRate = total > 0 ? passed / total : 0;

  evalTrace.score({
    name: "eval_pass_rate",
    value: passRate,
    comment: `${passed}/${total} tests passed (${(passRate * 100).toFixed(1)}%)`,
  });

  evalTrace.score({
    name: "eval_total_cost_usd",
    value: totalCost,
    comment: `Total eval cost: $${totalCost.toFixed(4)}`,
  });

  if (totalLatency > 0) {
    evalTrace.score({
      name: "eval_avg_latency_ms",
      value: totalLatency / total,
      comment: `Average: ${(totalLatency / total).toFixed(0)}ms across ${total} tests`,
    });
  }

  evalTrace.update({
    output: {
      passed,
      failed,
      total,
      passRate: `${(passRate * 100).toFixed(1)}%`,
      totalCost: `$${totalCost.toFixed(4)}`,
      avgLatency: `${(totalLatency / total).toFixed(0)}ms`,
    },
  });

  // -------------------------------------------------------------------------
  // Flush and report
  // -------------------------------------------------------------------------
  await langfuse.shutdownAsync();

  console.log(`✅ Pushed to Langfuse:`);
  console.log(`   Tests:     ${total} (${passed} passed, ${failed} failed)`);
  console.log(`   Pass rate: ${(passRate * 100).toFixed(1)}%`);
  console.log(`   Cost:      $${totalCost.toFixed(4)}`);
  console.log(`   Trace ID:  ${runId}`);
  console.log(
    `\n🔗 View: ${process.env.LANGFUSE_HOST || "http://localhost:3000"}/trace/${runId}`
  );
}

main().catch((err) => {
  console.error("❌ Push failed:", err.message || err);
  process.exit(1);
});
