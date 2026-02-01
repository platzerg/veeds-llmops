// =============================================================================
// k6 Load Test - VEEDS Proofreader GraphQL API
// =============================================================================
// Usage:
//   k6 run tests/load/graphql-test.js                    # Default scenario
//   k6 run -e K6_SCENARIO=smoke tests/load/graphql-test.js   # Smoke test
//   k6 run -e K6_SCENARIO=stress tests/load/graphql-test.js  # Stress test
//
// GitLab CI: Outputs JSON for load_performance reports
// =============================================================================

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ---------------------------------------------------------------------------
// Custom Metrics
// ---------------------------------------------------------------------------
const errorRate = new Rate("proofreader_errors");
const responseTime = new Trend("proofreader_response_time", true);
const validEntries = new Counter("proofreader_valid_entries");
const invalidEntries = new Counter("proofreader_invalid_entries");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_URL = __ENV.API_URL || "http://localhost:8080/graphql";
const API_TOKEN = __ENV.API_TOKEN || "";

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------
const scenarios = {
  // Default: Ramp up to 20 VUs over 2 minutes
  default: {
    stages: [
      { duration: "30s", target: 10 },
      { duration: "1m", target: 20 },
      { duration: "30s", target: 0 },
    ],
    thresholds: {
      http_req_duration: ["p(95)<3000", "p(99)<5000"],
      http_req_failed: ["rate<0.01"],
      checks: ["rate>0.99"],
      proofreader_errors: ["rate<0.05"],
    },
  },

  // Smoke: Quick sanity check
  smoke: {
    stages: [{ duration: "10s", target: 1 }],
    thresholds: {
      http_req_duration: ["p(95)<5000"],
      http_req_failed: ["rate<0.01"],
    },
  },

  // Stress: Find the breaking point
  stress: {
    stages: [
      { duration: "1m", target: 50 },
      { duration: "2m", target: 100 },
      { duration: "2m", target: 200 },
      { duration: "1m", target: 0 },
    ],
    thresholds: {
      http_req_duration: ["p(95)<10000"],
      http_req_failed: ["rate<0.10"],
    },
  },

  // Soak: Sustained load for endurance testing
  soak: {
    stages: [
      { duration: "2m", target: 30 },
      { duration: "10m", target: 30 },
      { duration: "2m", target: 0 },
    ],
    thresholds: {
      http_req_duration: ["p(95)<4000"],
      http_req_failed: ["rate<0.01"],
    },
  },
};

// Select scenario
const scenario = __ENV.K6_SCENARIO || "default";
const config = scenarios[scenario] || scenarios.default;

export const options = {
  stages: config.stages,
  thresholds: config.thresholds,
  // Output JSON for GitLab CI
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------
const testEntries = [
  // Valid entries (should return isValid: true)
  {
    yaml: "materialNumber: ABC-12345\ndescription: Bremsscheibe vorne\nunit: mm\nvalueRange:\n  min: 20\n  max: 35",
    expectValid: true,
  },
  {
    yaml: "materialNumber: FLT-00042\ndescription: Ölfiltergehäuse\nunit: bar\nvalueRange:\n  min: 1\n  max: 10",
    expectValid: true,
  },
  {
    yaml: 'materialNumber: TRQ-00001\ndescription: Anzugsmoment Radmutter\nunit: Nm\nvalueRange:\n  min: 450\n  max: 600',
    expectValid: true,
  },
  // Invalid entries (should return isValid: false)
  {
    yaml: 'materialNumber: INVALID\ndescription: ""\nunit: bananas',
    expectValid: false,
  },
  {
    yaml: "materialNumber: ABC-12345\ndescription: Test\nunit: mm\nvalueRange:\n  min: 100\n  max: 5",
    expectValid: false,
  },
  {
    yaml: 'materialNumber: 123\ndescription: ""\nunit: xyz',
    expectValid: false,
  },
];

// ---------------------------------------------------------------------------
// GraphQL Mutation
// ---------------------------------------------------------------------------
const PROOFREAD_MUTATION = `
  mutation ProofreadEntry($input: ProofreadInput!) {
    proofreadYamlEntry(input: $input) {
      errors {
        field
        message
        severity
      }
      isValid
      processingTimeMs
    }
  }
`;

// ---------------------------------------------------------------------------
// Main Test Function
// ---------------------------------------------------------------------------
export default function () {
  // Pick random test entry
  const entry = testEntries[Math.floor(Math.random() * testEntries.length)];

  const headers = {
    "Content-Type": "application/json",
  };
  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }

  const payload = JSON.stringify({
    query: PROOFREAD_MUTATION,
    variables: {
      input: {
        yamlEntry: entry.yaml,
        specVersion: "2.1",
      },
    },
  });

  const startTime = Date.now();
  const response = http.post(API_URL, payload, { headers });
  const duration = Date.now() - startTime;

  // Track custom response time
  responseTime.add(duration);

  // Checks
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.proofreadYamlEntry;
      } catch {
        return false;
      }
    },
    "no GraphQL errors": (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors || body.errors.length === 0;
      } catch {
        return false;
      }
    },
    "correctness check": (r) => {
      try {
        const body = JSON.parse(r.body);
        const result = body.data.proofreadYamlEntry;
        return result.isValid === entry.expectValid;
      } catch {
        return false;
      }
    },
  });

  // Track error rate
  errorRate.add(!success);

  // Track valid/invalid counters
  try {
    const body = JSON.parse(response.body);
    if (body.data?.proofreadYamlEntry?.isValid) {
      validEntries.add(1);
    } else {
      invalidEntries.add(1);
    }
  } catch {
    // ignore parse errors
  }

  // Think time between requests (simulate real user)
  sleep(Math.random() * 2 + 1);
}

// ---------------------------------------------------------------------------
// Custom Summary for GitLab CI
// ---------------------------------------------------------------------------
export function handleSummary(data) {
  // Console summary
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"] || 0;
  const p99 = data.metrics.http_req_duration?.values?.["p(99)"] || 0;
  const avg = data.metrics.http_req_duration?.values?.avg || 0;
  const reqs = data.metrics.http_reqs?.values?.count || 0;

  console.log(`\n📊 VEEDS Load Test Summary (${scenario})`);
  console.log(`   Requests: ${reqs}`);
  console.log(`   Avg: ${avg.toFixed(0)}ms | p95: ${p95.toFixed(0)}ms | p99: ${p99.toFixed(0)}ms`);

  return {
    // GitLab load_performance report
    "k6-results.json": JSON.stringify(data),
    // Human-readable summary
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}

// Simple text summary helper
function textSummary(data, opts) {
  const lines = [`\n  VEEDS Proofreader Load Test (${scenario})\n`];

  for (const [name, metric] of Object.entries(data.metrics)) {
    if (metric.type === "trend") {
      const v = metric.values;
      lines.push(
        `  ${name.padEnd(30)} avg=${v.avg?.toFixed(1)}ms  p95=${v["p(95)"]?.toFixed(1)}ms  max=${v.max?.toFixed(1)}ms`
      );
    } else if (metric.type === "rate") {
      lines.push(
        `  ${name.padEnd(30)} ${(metric.values.rate * 100).toFixed(1)}%`
      );
    } else if (metric.type === "counter") {
      lines.push(`  ${name.padEnd(30)} ${metric.values.count}`);
    }
  }

  return lines.join("\n") + "\n";
}
