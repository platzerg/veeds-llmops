/**
 * Amazon Bedrock AgentCore Evaluations - Vollständiges TypeScript Example
 *
 * Dieses Beispiel zeigt ALLE verfügbaren AgentCore Evaluations APIs:
 *
 * DATA PLANE (bedrock-agentcore):
 * - Evaluate: On-Demand Evaluation von Agent Traces
 * - InvokeAgentRuntime: Agent aufrufen
 *
 * CONTROL PLANE (bedrock-agentcore-control):
 * - CreateEvaluator: Custom Evaluator erstellen
 * - GetEvaluator: Evaluator Details abrufen
 * - UpdateEvaluator: Evaluator aktualisieren
 * - DeleteEvaluator: Evaluator löschen
 * - ListEvaluators: Alle Evaluatoren auflisten
 * - CreateOnlineEvaluationConfig: Online Evaluation konfigurieren
 * - GetOnlineEvaluationConfig: Online Evaluation Details
 * - UpdateOnlineEvaluationConfig: Online Evaluation aktualisieren
 * - DeleteOnlineEvaluationConfig: Online Evaluation löschen
 * - ListOnlineEvaluationConfigs: Alle Online Evaluations auflisten
 *
 * HINWEIS: Die AWS SDK Pakete für AgentCore sind möglicherweise noch in Preview.
 * Dieses Beispiel zeigt die erwartete API-Struktur basierend auf der Dokumentation.
 *
 * Voraussetzungen:
 * - AWS SDK v3
 * - AWS Credentials konfiguriert
 * - Ein deployed AgentCore Agent
 */

// ============================================================================
// Mock Types - Da die SDK Pakete möglicherweise noch nicht vollständig sind
// ============================================================================

// Simulierte SDK Imports - ersetzen Sie diese durch echte Imports wenn verfügbar
// Diese Interfaces zeigen die erwartete SDK-Struktur und werden für Dokumentationszwecke beibehalten
interface _BedrockAgentCoreClientConfig {
  region: string;
}

interface _EvaluateCommandInput {
  evaluatorId: string;
  evaluationInput: {
    sessionSpans: unknown[];
  };
  evaluationTarget?: {
    traceIds?: string[];
    spanIds?: string[];
  };
}

interface EvaluationResultItem {
  evaluatorId: string;
  evaluatorName: string;
  score?: number;
  label?: string;
  explanation?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  errorMessage?: string;
  errorCode?: string;
  context: {
    spanContext: {
      sessionId: string;
      traceId?: string;
      spanId?: string;
    };
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  region: "eu-central-1", // Frankfurt
  agentArn: "arn:aws:bedrock:eu-central-1:928640081799:agent/SS96NRZA0Zt",
  sessionId: `session-${Date.now()}`,
};

// ============================================================================
// Built-in Evaluators - Alle verfügbaren AgentCore Evaluatoren
// ============================================================================

const BUILTIN_EVALUATORS = {
  // Trace-Level Evaluators (bewerten einzelne Request-Response Interaktionen)
  CORRECTNESS: "Builtin.Correctness",
  HELPFULNESS: "Builtin.Helpfulness",
  COHERENCE: "Builtin.Coherence",
  CONCISENESS: "Builtin.Conciseness",
  FAITHFULNESS: "Builtin.Faithfulness",
  HARMFULNESS: "Builtin.Harmfulness",
  STEREOTYPING: "Builtin.Stereotyping",
  REFUSAL: "Builtin.Refusal",
  RESPONSE_RELEVANCE: "Builtin.ResponseRelevance",
  CONTEXT_RELEVANCE: "Builtin.ContextRelevance",
  INSTRUCTION_FOLLOWING: "Builtin.InstructionFollowing",

  // Tool-Level Evaluators (bewerten einzelne Tool-Calls)
  TOOL_SELECTION_ACCURACY: "Builtin.ToolSelectionAccuracy",
  TOOL_PARAMETER_ACCURACY: "Builtin.ToolParameterAccuracy",

  // Session-Level Evaluators (bewerten gesamte Konversation)
  GOAL_SUCCESS_RATE: "Builtin.GoalSuccessRate",
} as const;

type EvaluatorId = (typeof BUILTIN_EVALUATORS)[keyof typeof BUILTIN_EVALUATORS];

// ============================================================================
// Types
// ============================================================================

interface SpanLog {
  [key: string]: unknown;
}

interface FailureAnalysis {
  evaluator: string;
  passed: boolean;
  score?: number;
  label?: string;
  explanation?: string;
  failureCategory?: string;
}

interface CICDCheckResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  failures: FailureAnalysis[];
  summary: Record<string, number>;
}

interface OnlineEvaluationConfig {
  samplingRate: number;
  evaluators: EvaluatorId[];
  alertThresholds: Record<string, number>;
  onAlert?: (evaluator: string, score: number, threshold: number) => void;
}

// ============================================================================
// AgentCore Evaluations Client
// ============================================================================

class AgentCoreEvaluationsClient {
  private region: string;
  private agentArn: string;

  constructor(region: string, agentArn: string) {
    this.region = region;
    this.agentArn = agentArn;
  }

  /**
   * Invoke the agent and get a response
   */
  async invokeAgent(prompt: string, sessionId: string): Promise<string> {
    console.log(
      `[Mock] Invoking agent ${this.agentArn} with prompt: ${prompt.substring(0, 50)}...`
    );
    console.log(`[Mock] Session ID: ${sessionId}, Region: ${this.region}`);

    // In production, use:
    // const command = new InvokeAgentRuntimeCommand({
    //   agentRuntimeArn: this.agentArn,
    //   runtimeSessionId: sessionId,
    //   payload: Buffer.from(JSON.stringify({ prompt })),
    // });
    // const response = await this.client.send(command);

    return `[Mock Response] Agent response for: ${prompt}`;
  }

  /**
   * Download span logs from CloudWatch for a session
   */
  async getSessionSpanLogs(
    agentId: string,
    sessionId: string,
    lookbackMinutes: number = 60
  ): Promise<SpanLog[]> {
    console.log(
      `[Mock] Getting span logs for agent: ${agentId}, session: ${sessionId}`
    );
    console.log(`[Mock] Lookback: ${lookbackMinutes} minutes`);

    // In production, query CloudWatch Logs:
    // const runtimeLogGroup = `/aws/bedrock-agentcore/runtimes/${agentId}-DEFAULT`;
    // Use StartQueryCommand and GetQueryResultsCommand

    return [
      {
        "scope.name": "bedrock-agentcore",
        "attributes.session.id": sessionId,
        "@timestamp": new Date().toISOString(),
      },
    ];
  }

  /**
   * Run a single evaluation
   */
  async evaluate(
    evaluatorId: EvaluatorId,
    sessionSpans: SpanLog[],
    options?: {
      traceIds?: string[];
      spanIds?: string[];
    }
  ): Promise<EvaluationResultItem[]> {
    console.log(`[Mock] Running evaluation: ${evaluatorId}`);
    console.log(`[Mock] Spans count: ${sessionSpans.length}`);
    if (options?.traceIds) {
      console.log(`[Mock] Filtering by trace IDs: ${options.traceIds.join(", ")}`);
    }
    if (options?.spanIds) {
      console.log(`[Mock] Filtering by span IDs: ${options.spanIds.join(", ")}`);
    }

    // In production, use:
    // const input: _EvaluateCommandInput = {
    //   evaluatorId,
    //   evaluationInput: { sessionSpans },
    //   evaluationTarget: options?.traceIds ? { traceIds: options.traceIds } : undefined,
    // };
    // const command = new EvaluateCommand(input);
    // const response = await this.client.send(command);

    // Mock response
    return [
      {
        evaluatorId,
        evaluatorName: evaluatorId.replace("Builtin.", ""),
        score: 0.85,
        label: "Good",
        explanation: `[Mock] The response meets quality standards for ${evaluatorId}`,
        context: {
          spanContext: {
            sessionId: CONFIG.sessionId,
            traceId: options?.traceIds?.[0] ?? "trace-123",
            spanId: options?.spanIds?.[0] ?? "span-456",
          },
        },
      },
    ];
  }

  /**
   * Run multiple evaluations in parallel
   */
  async evaluateMultiple(
    evaluatorIds: EvaluatorId[],
    sessionSpans: SpanLog[]
  ): Promise<Map<EvaluatorId, EvaluationResultItem[]>> {
    const results = new Map<EvaluatorId, EvaluationResultItem[]>();

    const promises = evaluatorIds.map(async (evaluatorId) => {
      try {
        const evalResults = await this.evaluate(evaluatorId, sessionSpans);
        results.set(evaluatorId, evalResults);
      } catch (error) {
        console.error(`Evaluation failed for ${evaluatorId}:`, error);
        results.set(evaluatorId, []);
      }
    });

    await Promise.all(promises);
    return results;
  }

  // ==========================================================================
  // CONTROL PLANE APIs - Custom Evaluator Management
  // ==========================================================================

  /**
   * Create a custom evaluator with LLM-as-a-Judge configuration
   */
  async createCustomEvaluator(config: {
    name: string;
    description?: string;
    evaluationLevel: "TOOL_CALL" | "TRACE" | "SESSION";
    modelId: string;
    instructions: string;
    ratingScale: {
      type: "numerical" | "categorical";
      values: Array<{ value: number; label: string; definition: string }>;
    };
    inferenceConfig?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    };
  }): Promise<{ evaluatorArn: string; evaluatorId: string }> {
    console.log(`[Mock] Creating custom evaluator: ${config.name}`);
    console.log(
      `[Mock] Level: ${config.evaluationLevel}, Model: ${config.modelId}`
    );

    // In production, use CreateEvaluatorCommand

    const evaluatorId = `custom-${Date.now()}`;
    return {
      evaluatorArn: `arn:aws:bedrock-agentcore:${this.region}:123456789012:evaluator/${evaluatorId}`,
      evaluatorId,
    };
  }

  /**
   * Get details of an evaluator (built-in or custom)
   */
  async getEvaluator(evaluatorId: string): Promise<{
    evaluatorArn: string;
    evaluatorName: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
  }> {
    console.log(`[Mock] Getting evaluator: ${evaluatorId}`);

    return {
      evaluatorArn: `arn:aws:bedrock-agentcore:${this.region}:123456789012:evaluator/${evaluatorId}`,
      evaluatorName: evaluatorId,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * List all evaluators (built-in + custom)
   */
  async listEvaluators(_options?: {
    maxResults?: number;
    nextToken?: string;
  }): Promise<{
    evaluators: Array<{
      evaluatorArn: string;
      evaluatorId: string;
      evaluatorName: string;
      evaluatorType: string;
      evaluationLevel: string;
      status: string;
    }>;
    nextToken?: string;
  }> {
    console.log(
      `[Mock] Listing evaluators (max: ${_options?.maxResults ?? 100})`
    );

    // Return built-in evaluators as mock
    const builtinEvaluators = Object.entries(BUILTIN_EVALUATORS).map(
      ([key, id]) => ({
        evaluatorArn: `arn:aws:bedrock-agentcore:${this.region}::evaluator/${id}`,
        evaluatorId: id,
        evaluatorName: key,
        evaluatorType: "BUILTIN",
        evaluationLevel: id.includes("Tool")
          ? "TOOL_CALL"
          : id.includes("Goal")
          ? "SESSION"
          : "TRACE",
        status: "ACTIVE",
      })
    );

    return {
      evaluators: builtinEvaluators,
      nextToken: _options?.nextToken,
    };
  }

  /**
   * Delete a custom evaluator
   */
  async deleteEvaluator(evaluatorId: string): Promise<void> {
    console.log(`[Mock] Deleting evaluator: ${evaluatorId}`);
  }

  // ==========================================================================
  // CONTROL PLANE APIs - Online Evaluation Configuration
  // ==========================================================================

  /**
   * Create an online evaluation configuration for continuous monitoring
   */
  async createOnlineEvaluationConfig(config: {
    name: string;
    description?: string;
    agentEndpointArn: string;
    evaluatorIds: string[];
    samplingPercentage?: number;
    sessionIdleTimeoutMinutes?: number;
    roleArn: string;
    enableOnCreate?: boolean;
  }): Promise<{ configArn: string; configId: string }> {
    console.log(`[Mock] Creating online evaluation config: ${config.name}`);
    console.log(`[Mock] Sampling: ${config.samplingPercentage ?? 10}%`);

    const configId = `online-config-${Date.now()}`;
    return {
      configArn: `arn:aws:bedrock-agentcore:${this.region}:123456789012:online-evaluation/${configId}`,
      configId,
    };
  }

  /**
   * Get details of an online evaluation configuration
   */
  async getOnlineEvaluationConfig(configId: string): Promise<{
    configArn: string;
    configName: string;
    status: string;
    executionStatus: string;
    evaluatorIds: string[];
    samplingPercentage: number;
  }> {
    console.log(`[Mock] Getting online evaluation config: ${configId}`);

    return {
      configArn: `arn:aws:bedrock-agentcore:${this.region}:123456789012:online-evaluation/${configId}`,
      configName: "ProductionMonitoring",
      status: "ACTIVE",
      executionStatus: "ENABLED",
      evaluatorIds: [
        BUILTIN_EVALUATORS.HELPFULNESS,
        BUILTIN_EVALUATORS.CORRECTNESS,
      ],
      samplingPercentage: 10,
    };
  }

  /**
   * Update an online evaluation configuration
   */
  async updateOnlineEvaluationConfig(
    configId: string,
    updates: {
      description?: string;
      evaluatorIds?: string[];
      samplingPercentage?: number;
      executionStatus?: "ENABLED" | "DISABLED";
    }
  ): Promise<void> {
    console.log(`[Mock] Updating online evaluation config: ${configId}`);
    console.log(`[Mock] Updates:`, updates);
  }

  /**
   * Delete an online evaluation configuration
   */
  async deleteOnlineEvaluationConfig(configId: string): Promise<void> {
    console.log(`[Mock] Deleting online evaluation config: ${configId}`);
  }

  /**
   * List all online evaluation configurations
   */
  async listOnlineEvaluationConfigs(_options?: {
    maxResults?: number;
    nextToken?: string;
  }): Promise<{
    configs: Array<{
      configArn: string;
      configId: string;
      configName: string;
      status: string;
      executionStatus: string;
    }>;
    nextToken?: string;
  }> {
    console.log(`[Mock] Listing online evaluation configs (max: ${_options?.maxResults ?? 100})`);

    return {
      configs: [
        {
          configArn: `arn:aws:bedrock-agentcore:${this.region}:123456789012:online-evaluation/config-1`,
          configId: "config-1",
          configName: "ProductionMonitoring",
          status: "ACTIVE",
          executionStatus: "ENABLED",
        },
      ],
      nextToken: _options?.nextToken,
    };
  }
}

// ============================================================================
// Failure Analysis - Analysiert Agent Failures basierend auf Evaluations
// ============================================================================

class AgentFailureAnalyzer {
  private client: AgentCoreEvaluationsClient;

  // Mapping von Evaluatoren zu Failure-Kategorien
  private static readonly FAILURE_CATEGORIES: Record<string, string> = {
    [BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY]: "Tool-Fehler",
    [BUILTIN_EVALUATORS.TOOL_PARAMETER_ACCURACY]: "Tool-Fehler",
    [BUILTIN_EVALUATORS.CORRECTNESS]: "Antwort-Fehler",
    [BUILTIN_EVALUATORS.HELPFULNESS]: "Antwort-Fehler",
    [BUILTIN_EVALUATORS.COHERENCE]: "Antwort-Fehler",
    [BUILTIN_EVALUATORS.CONCISENESS]: "Antwort-Fehler",
    [BUILTIN_EVALUATORS.RESPONSE_RELEVANCE]: "Antwort-Fehler",
    [BUILTIN_EVALUATORS.FAITHFULNESS]: "Kontext-Fehler",
    [BUILTIN_EVALUATORS.CONTEXT_RELEVANCE]: "Kontext-Fehler",
    [BUILTIN_EVALUATORS.INSTRUCTION_FOLLOWING]: "Kontext-Fehler",
    [BUILTIN_EVALUATORS.GOAL_SUCCESS_RATE]: "Ziel-Fehler",
    [BUILTIN_EVALUATORS.HARMFULNESS]: "Safety-Fehler",
    [BUILTIN_EVALUATORS.STEREOTYPING]: "Safety-Fehler",
    [BUILTIN_EVALUATORS.REFUSAL]: "Safety-Fehler",
  };

  // Score-Thresholds für Pass/Fail
  private static readonly PASS_THRESHOLDS: Record<string, number | string[]> = {
    [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
    [BUILTIN_EVALUATORS.CORRECTNESS]: [
      "Perfectly Correct",
      "Partially Correct",
    ],
    [BUILTIN_EVALUATORS.COHERENCE]: ["Completely Yes", "Generally Yes"],
    [BUILTIN_EVALUATORS.FAITHFULNESS]: ["Completely Yes", "Generally Yes"],
    [BUILTIN_EVALUATORS.HARMFULNESS]: ["Not Harmful"],
    [BUILTIN_EVALUATORS.STEREOTYPING]: ["Not Stereotyping"],
    [BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY]: ["Yes"],
    [BUILTIN_EVALUATORS.TOOL_PARAMETER_ACCURACY]: ["Yes"],
    [BUILTIN_EVALUATORS.GOAL_SUCCESS_RATE]: ["Yes"],
    [BUILTIN_EVALUATORS.REFUSAL]: ["No"],
    [BUILTIN_EVALUATORS.INSTRUCTION_FOLLOWING]: ["Yes"],
  };

  constructor(client: AgentCoreEvaluationsClient) {
    this.client = client;
  }

  /**
   * Analyze all failure points for a session
   */
  async analyzeFailurePoints(
    sessionSpans: SpanLog[]
  ): Promise<FailureAnalysis[]> {
    const allEvaluators = Object.values(BUILTIN_EVALUATORS);
    const results = await this.client.evaluateMultiple(
      allEvaluators,
      sessionSpans
    );

    const analyses: FailureAnalysis[] = [];

    for (const [evaluatorId, evalResults] of results) {
      for (const result of evalResults) {
        const passed = this.checkPassed(evaluatorId, result);

        analyses.push({
          evaluator: evaluatorId,
          passed,
          score: result.score,
          label: result.label,
          explanation: result.explanation,
          failureCategory: passed
            ? undefined
            : AgentFailureAnalyzer.FAILURE_CATEGORIES[evaluatorId],
        });
      }
    }

    return analyses;
  }

  /**
   * Get summary of failures by category
   */
  getFailureSummary(analyses: FailureAnalysis[]): Record<string, number> {
    const summary: Record<string, number> = {
      "Tool-Fehler": 0,
      "Antwort-Fehler": 0,
      "Kontext-Fehler": 0,
      "Ziel-Fehler": 0,
      "Safety-Fehler": 0,
    };

    for (const analysis of analyses) {
      if (!analysis.passed && analysis.failureCategory) {
        summary[analysis.failureCategory]++;
      }
    }

    return summary;
  }

  /**
   * Check if an evaluation result passes
   */
  private checkPassed(
    evaluatorId: string,
    result: EvaluationResultItem
  ): boolean {
    if (result.errorMessage) {
      return false;
    }

    const threshold = AgentFailureAnalyzer.PASS_THRESHOLDS[evaluatorId];

    if (typeof threshold === "number" && result.score !== undefined) {
      return result.score >= threshold;
    }

    if (Array.isArray(threshold) && result.label) {
      return threshold.includes(result.label);
    }

    return true;
  }
}

// ============================================================================
// CI/CD Integration - Pre-Deployment Checks
// ============================================================================

async function runPreDeploymentChecks(
  client: AgentCoreEvaluationsClient,
  testCases: Array<{ prompt: string; expectedBehavior?: string }>,
  sessionIdPrefix: string = "cicd-test"
): Promise<CICDCheckResult> {
  const analyzer = new AgentFailureAnalyzer(client);
  const allFailures: FailureAnalysis[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const sessionId = `${sessionIdPrefix}-${i}-${Date.now()}`;

    console.log(
      `Running test case ${i + 1}/${
        testCases.length
      }: ${testCase.prompt.substring(0, 50)}...`
    );

    try {
      await client.invokeAgent(testCase.prompt, sessionId);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const agentId = "my-agent";
      const spans = await client.getSessionSpanLogs(agentId, sessionId, 10);

      if (spans.length === 0) {
        console.warn(`No spans found for session ${sessionId}`);
        continue;
      }

      const analyses = await analyzer.analyzeFailurePoints(spans);
      const failures = analyses.filter((a) => !a.passed);
      allFailures.push(...failures);
    } catch (error) {
      console.error(`Test case ${i + 1} failed:`, error);
      allFailures.push({
        evaluator: "TestExecution",
        passed: false,
        explanation: `Test execution failed: ${error}`,
        failureCategory: "Ziel-Fehler",
      });
    }
  }

  const summary = analyzer.getFailureSummary(allFailures);
  const totalChecks = testCases.length * Object.keys(BUILTIN_EVALUATORS).length;
  const failedChecks = allFailures.length;

  return {
    passed: failedChecks === 0,
    totalChecks,
    passedChecks: totalChecks - failedChecks,
    failedChecks,
    failures: allFailures,
    summary,
  };
}

// ============================================================================
// Online Evaluation Monitor - Production Monitoring
// ============================================================================

class OnlineEvaluationMonitor {
  private client: AgentCoreEvaluationsClient;
  private config: OnlineEvaluationConfig;
  private scores: Map<string, number[]> = new Map();

  constructor(
    client: AgentCoreEvaluationsClient,
    config: OnlineEvaluationConfig
  ) {
    this.client = client;
    this.config = config;
  }

  /**
   * Evaluate a session (call this after each agent interaction)
   */
  async evaluateSession(sessionSpans: SpanLog[]): Promise<void> {
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const results = await this.client.evaluateMultiple(
      this.config.evaluators,
      sessionSpans
    );

    for (const [evaluatorId, evalResults] of results) {
      for (const result of evalResults) {
        if (result.score !== undefined) {
          this.recordScore(evaluatorId, result.score);
          this.checkAlert(evaluatorId, result.score);
        }
      }
    }
  }

  /**
   * Get average scores over time window
   */
  getAverageScores(): Record<string, number> {
    const averages: Record<string, number> = {};

    for (const [evaluator, scores] of this.scores) {
      if (scores.length > 0) {
        averages[evaluator] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    return averages;
  }

  private recordScore(evaluator: string, score: number): void {
    if (!this.scores.has(evaluator)) {
      this.scores.set(evaluator, []);
    }

    const scores = this.scores.get(evaluator)!;
    scores.push(score);

    if (scores.length > 1000) {
      scores.shift();
    }
  }

  private checkAlert(evaluator: string, score: number): void {
    const threshold = this.config.alertThresholds[evaluator];

    if (threshold !== undefined && score < threshold) {
      console.warn(
        `🚨 ALERT: ${evaluator} score ${score} below threshold ${threshold}`
      );
      this.config.onAlert?.(evaluator, score, threshold);
    }
  }
}

// ============================================================================
// Example Usage - Main Function
// ============================================================================

async function main() {
  console.log("=== Amazon Bedrock AgentCore Evaluations Demo ===\n");

  // Initialize client
  const client = new AgentCoreEvaluationsClient(CONFIG.region, CONFIG.agentArn);

  // Example 1: Single Evaluation
  console.log("1. Single Evaluation Example");
  console.log("----------------------------");

  const mockSessionSpans: SpanLog[] = [
    {
      "scope.name": "bedrock-agentcore",
      "attributes.session.id": CONFIG.sessionId,
      "@timestamp": new Date().toISOString(),
    },
  ];

  const helpfulnessResults = await client.evaluate(
    BUILTIN_EVALUATORS.HELPFULNESS,
    mockSessionSpans
  );
  console.log(
    "Helpfulness Results:",
    JSON.stringify(helpfulnessResults, null, 2)
  );

  // Example 2: Failure Analysis
  console.log("\n2. Failure Analysis Example");
  console.log("---------------------------");

  const analyzer = new AgentFailureAnalyzer(client);
  const analyses = await analyzer.analyzeFailurePoints(mockSessionSpans);
  const summary = analyzer.getFailureSummary(analyses);

  console.log("Failure Summary:", summary);
  console.log("Failed Checks:", analyses.filter((a) => !a.passed).length);

  // Example 3: List Evaluators
  console.log("\n3. List All Evaluators");
  console.log("----------------------");

  const evaluatorList = await client.listEvaluators();
  console.log(`Found ${evaluatorList.evaluators.length} evaluators:`);
  evaluatorList.evaluators.slice(0, 5).forEach((e) => {
    console.log(
      `  - ${e.evaluatorName} (${e.evaluatorType}, ${e.evaluationLevel})`
    );
  });

  // Example 4: Online Monitoring Setup
  console.log("\n4. Online Monitoring Setup");
  console.log("--------------------------");

  const monitor = new OnlineEvaluationMonitor(client, {
    samplingRate: 0.1, // 10% der Sessions evaluieren
    evaluators: [
      BUILTIN_EVALUATORS.HELPFULNESS,
      BUILTIN_EVALUATORS.CORRECTNESS,
      BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY,
      BUILTIN_EVALUATORS.HARMFULNESS,
    ],
    alertThresholds: {
      [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
      [BUILTIN_EVALUATORS.CORRECTNESS]: 0.7,
    },
    onAlert: (evaluator, score, threshold) => {
      console.error(
        `🚨 ALERT: ${evaluator} score ${score.toFixed(
          2
        )} below threshold ${threshold}`
      );
    },
  });

  console.log("Online Monitor configured with 10% sampling rate");

  // Demonstrate monitor usage by evaluating a session
  await monitor.evaluateSession(mockSessionSpans);
  console.log("Monitor average scores:", monitor.getAverageScores());

  // Example 5: Custom Evaluator Creation
  console.log("\n5. Custom Evaluator Creation");
  console.log("----------------------------");

  const customEvaluator = await client.createCustomEvaluator({
    name: "DomainSpecificAccuracy",
    description:
      "Evaluiert domänenspezifische Korrektheit für Fahrzeuginformationen",
    evaluationLevel: "TRACE",
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    instructions: `
      Bewerte die Antwort des Agenten auf Korrektheit bezüglich Fahrzeuginformationen.
      Prüfe insbesondere:
      - Korrekte Fahrzeugidentifikationsnummern (VIN)
      - Gültige Modellbezeichnungen
      - Korrekte technische Spezifikationen
    `,
    ratingScale: {
      type: "categorical",
      values: [
        {
          value: 1,
          label: "Incorrect",
          definition: "Enthält faktische Fehler",
        },
        {
          value: 2,
          label: "Partially Correct",
          definition: "Teilweise korrekt",
        },
        { value: 3, label: "Correct", definition: "Vollständig korrekt" },
      ],
    },
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.0,
    },
  });
  console.log("Custom Evaluator created:", customEvaluator.evaluatorId);

  // Example 6: Online Evaluation Configuration
  console.log("\n6. Online Evaluation Configuration");
  console.log("----------------------------------");

  const onlineConfig = await client.createOnlineEvaluationConfig({
    name: "ProductionMonitoring",
    description: "Kontinuierliche Überwachung der Produktions-Agenten",
    agentEndpointArn: CONFIG.agentArn,
    evaluatorIds: [
      BUILTIN_EVALUATORS.HELPFULNESS,
      BUILTIN_EVALUATORS.CORRECTNESS,
      BUILTIN_EVALUATORS.HARMFULNESS,
      BUILTIN_EVALUATORS.TOOL_SELECTION_ACCURACY,
    ],
    samplingPercentage: 10,
    sessionIdleTimeoutMinutes: 15,
    roleArn: "arn:aws:iam::123456789012:role/AgentCoreEvaluationRole",
    enableOnCreate: true,
  });
  console.log("Online Evaluation Config created:", onlineConfig.configId);

  // Example 7: CI/CD Integration
  console.log("\n7. CI/CD Pre-Deployment Check");
  console.log("-----------------------------");

  const testCases = [
    { prompt: "What is the weather in Berlin?" },
    { prompt: "Book a flight from Munich to Hamburg" },
    { prompt: "Calculate 15% tip on $85.50" },
  ];

  const cicdResult = await runPreDeploymentChecks(client, testCases);
  console.log("CI/CD Result:", cicdResult.passed ? "✅ PASSED" : "❌ FAILED");
  console.log("Summary:", cicdResult.summary);

  console.log("\n=== Demo Complete ===");
  console.log("\nHinweis: Dies ist eine Mock-Implementierung.");
  console.log(
    "Für Produktion ersetzen Sie die Mock-Methoden durch echte AWS SDK Aufrufe."
  );
}

// ============================================================================
// API Reference Summary
// ============================================================================

/**
 * AgentCore Evaluations API Reference
 *
 * DATA PLANE (bedrock-agentcore):
 * ================================
 * - Evaluate: On-demand evaluation of agent traces
 * - InvokeAgentRuntime: Invoke an AgentCore agent
 *
 * CONTROL PLANE (bedrock-agentcore-control):
 * ==========================================
 * Custom Evaluator Management:
 * - CreateEvaluator, GetEvaluator, UpdateEvaluator, DeleteEvaluator, ListEvaluators
 *
 * Online Evaluation Management:
 * - CreateOnlineEvaluationConfig, GetOnlineEvaluationConfig
 * - UpdateOnlineEvaluationConfig, DeleteOnlineEvaluationConfig
 * - ListOnlineEvaluationConfigs
 *
 * BUILT-IN EVALUATORS (14 total):
 * ===============================
 * Trace-Level (11): Correctness, Helpfulness, Coherence, Conciseness,
 *                   Faithfulness, Harmfulness, Stereotyping, Refusal,
 *                   ResponseRelevance, ContextRelevance, InstructionFollowing
 * Tool-Level (2): ToolSelectionAccuracy, ToolParameterAccuracy
 * Session-Level (1): GoalSuccessRate
 */

// Run main function
main().catch(console.error);

// ============================================================================
// Exports
// ============================================================================

export {
  AgentCoreEvaluationsClient,
  AgentFailureAnalyzer,
  OnlineEvaluationMonitor,
  runPreDeploymentChecks,
  BUILTIN_EVALUATORS,
  CONFIG,
};
