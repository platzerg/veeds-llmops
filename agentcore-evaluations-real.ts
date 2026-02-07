/**
 * Amazon Bedrock AgentCore Evaluations - Real AWS SDK Implementation
 *
 * This implementation uses the actual AWS SDK packages to call AgentCore Evaluations APIs.
 * Requires AWS credentials configured (via environment variables, ~/.aws/credentials, or IAM role).
 *
 * Prerequisites:
 * - AWS SDK v3 packages installed
 * - AWS credentials configured with appropriate permissions
 * - A deployed AgentCore Agent (for full functionality)
 */

import {
  BedrockAgentCoreClient,
  EvaluateCommand,
  type EvaluateCommandInput,
  type EvaluationResultContent,
} from "@aws-sdk/client-bedrock-agentcore";

import {
  BedrockAgentCoreControlClient,
  CreateEvaluatorCommand,
  GetEvaluatorCommand,
  ListEvaluatorsCommand,
  DeleteEvaluatorCommand,
  CreateOnlineEvaluationConfigCommand,
  GetOnlineEvaluationConfigCommand,
  UpdateOnlineEvaluationConfigCommand,
  DeleteOnlineEvaluationConfigCommand,
  ListOnlineEvaluationConfigsCommand,
} from "@aws-sdk/client-bedrock-agentcore-control";

import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  region: process.env.AWS_REGION || "eu-central-1",
  agentArn: process.env.AGENT_ARN || "arn:aws:bedrock:eu-central-1:928640081799:agent/SS96NRZA0Zt",
};

// ============================================================================
// Built-in Evaluators
// ============================================================================

export const BUILTIN_EVALUATORS = {
  // Trace-Level Evaluators (11)
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

  // Tool-Level Evaluators (2)
  TOOL_SELECTION_ACCURACY: "Builtin.ToolSelectionAccuracy",
  TOOL_PARAMETER_ACCURACY: "Builtin.ToolParameterAccuracy",

  // Session-Level Evaluators (1)
  GOAL_SUCCESS_RATE: "Builtin.GoalSuccessRate",
} as const;

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

// ============================================================================
// Real AgentCore Evaluations Client
// ============================================================================

export class RealAgentCoreEvaluationsClient {
  private dataPlaneClient: BedrockAgentCoreClient;
  private controlPlaneClient: BedrockAgentCoreControlClient;
  private logsClient: CloudWatchLogsClient;

  constructor(region: string = CONFIG.region) {
    this.dataPlaneClient = new BedrockAgentCoreClient({ region });
    this.controlPlaneClient = new BedrockAgentCoreControlClient({ region });
    this.logsClient = new CloudWatchLogsClient({ region });
  }

  // ==========================================================================
  // DATA PLANE APIs
  // ==========================================================================

  /**
   * Run evaluation using the real AWS SDK
   */
  async evaluate(
    evaluatorId: string,
    sessionSpans: SpanLog[],
    options?: {
      traceIds?: string[];
      spanIds?: string[];
    }
  ): Promise<EvaluationResultContent[]> {
    const input: EvaluateCommandInput = {
      evaluatorId,
      evaluationInput: {
        sessionSpans: sessionSpans as any,
      },
      evaluationTarget: options?.traceIds
        ? { traceIds: options.traceIds }
        : options?.spanIds
        ? { spanIds: options.spanIds }
        : undefined,
    };

    const command = new EvaluateCommand(input);
    const response = await this.dataPlaneClient.send(command);

    return (response.evaluationResults || []) as EvaluationResultContent[];
  }

  /**
   * Run multiple evaluations in parallel
   */
  async evaluateMultiple(
    evaluatorIds: string[],
    sessionSpans: SpanLog[]
  ): Promise<Map<string, EvaluationResultContent[]>> {
    const results = new Map<string, EvaluationResultContent[]>();

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

  /**
   * Get session span logs from CloudWatch
   */
  async getSessionSpanLogs(
    agentId: string,
    sessionId: string,
    lookbackMinutes: number = 60
  ): Promise<SpanLog[]> {
    const runtimeLogGroup = `/aws/bedrock-agentcore/runtimes/${agentId}-DEFAULT`;
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - lookbackMinutes * 60;

    const startQuery = await this.logsClient.send(
      new StartQueryCommand({
        logGroupName: runtimeLogGroup,
        startTime,
        endTime,
        queryString: `
          fields @timestamp, @message
          | filter \`attributes.session.id\` = '${sessionId}'
          | sort @timestamp asc
          | limit 1000
        `,
      })
    );

    // Wait for query to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const results = await this.logsClient.send(
      new GetQueryResultsCommand({
        queryId: startQuery.queryId,
      })
    );

    return (results.results || [])
      .map((row) => {
        const message = row.find((f) => f.field === "@message")?.value;
        try {
          return message ? JSON.parse(message) : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as SpanLog[];
  }

  // ==========================================================================
  // CONTROL PLANE APIs - Custom Evaluator Management
  // ==========================================================================

  /**
   * Create a custom evaluator using the actual SDK structure
   */
  async createCustomEvaluator(config: {
    name: string;
    description?: string;
    level: "TOOL_CALL" | "TRACE" | "SESSION";
    modelId: string;
    instructions: string;
    ratingScale: {
      type: "numerical" | "categorical";
      values: Array<{ value?: number; label: string; definition: string }>;
    };
    inferenceConfig?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    };
  }): Promise<{ evaluatorArn?: string; evaluatorId?: string }> {
    const command = new CreateEvaluatorCommand({
      evaluatorName: config.name,
      description: config.description,
      level: config.level,
      evaluatorConfig: {
        llmAsAJudge: {
          instructions: config.instructions,
          modelConfig: {
            bedrockEvaluatorModelConfig: {
              modelId: config.modelId,
              inferenceConfig: config.inferenceConfig
                ? {
                    maxTokens: config.inferenceConfig.maxTokens,
                    temperature: config.inferenceConfig.temperature,
                    topP: config.inferenceConfig.topP,
                  }
                : undefined,
            },
          },
          ratingScale:
            config.ratingScale.type === "numerical"
              ? {
                  numerical: config.ratingScale.values.map((v) => ({
                    value: v.value ?? 0,
                    label: v.label,
                    definition: v.definition,
                  })),
                }
              : {
                  categorical: config.ratingScale.values.map((v) => ({
                    label: v.label,
                    definition: v.definition,
                  })),
                },
        },
      },
    });

    const response = await this.controlPlaneClient.send(command);
    return {
      evaluatorArn: response.evaluatorArn,
      evaluatorId: response.evaluatorId,
    };
  }

  /**
   * Get evaluator details
   */
  async getEvaluator(evaluatorId: string) {
    const command = new GetEvaluatorCommand({ evaluatorId });
    return await this.controlPlaneClient.send(command);
  }

  /**
   * List all evaluators
   */
  async listEvaluators(options?: { maxResults?: number; nextToken?: string }) {
    const command = new ListEvaluatorsCommand({
      maxResults: options?.maxResults,
      nextToken: options?.nextToken,
    });
    return await this.controlPlaneClient.send(command);
  }

  /**
   * Delete a custom evaluator
   */
  async deleteEvaluator(evaluatorId: string): Promise<void> {
    const command = new DeleteEvaluatorCommand({ evaluatorId });
    await this.controlPlaneClient.send(command);
  }

  // ==========================================================================
  // CONTROL PLANE APIs - Online Evaluation Configuration
  // ==========================================================================

  /**
   * Create online evaluation configuration using actual SDK structure
   */
  async createOnlineEvaluationConfig(config: {
    name: string;
    description?: string;
    logGroupNames: string[];
    serviceNames: string[];
    evaluatorIds: string[];
    samplingPercentage?: number;
    sessionTimeoutMinutes?: number;
    roleArn: string;
    enableOnCreate?: boolean;
  }) {
    const command = new CreateOnlineEvaluationConfigCommand({
      onlineEvaluationConfigName: config.name,
      description: config.description,
      dataSourceConfig: {
        cloudWatchLogs: {
          logGroupNames: config.logGroupNames,
          serviceNames: config.serviceNames,
        },
      },
      evaluators: config.evaluatorIds.map((id) => ({ evaluatorId: id })),
      rule: {
        samplingConfig: {
          samplingPercentage: config.samplingPercentage ?? 10,
        },
        sessionConfig: {
          sessionTimeoutMinutes: config.sessionTimeoutMinutes ?? 15,
        },
      },
      evaluationExecutionRoleArn: config.roleArn,
      enableOnCreate: config.enableOnCreate ?? true,
    });

    return await this.controlPlaneClient.send(command);
  }

  /**
   * Get online evaluation configuration
   */
  async getOnlineEvaluationConfig(configId: string) {
    const command = new GetOnlineEvaluationConfigCommand({
      onlineEvaluationConfigId: configId,
    });
    return await this.controlPlaneClient.send(command);
  }

  /**
   * Update online evaluation configuration
   */
  async updateOnlineEvaluationConfig(
    configId: string,
    updates: {
      description?: string;
      evaluatorIds?: string[];
      samplingPercentage?: number;
      executionStatus?: "ENABLED" | "DISABLED";
    }
  ) {
    const command = new UpdateOnlineEvaluationConfigCommand({
      onlineEvaluationConfigId: configId,
      description: updates.description,
      evaluators: updates.evaluatorIds?.map((id) => ({ evaluatorId: id })),
      rule: updates.samplingPercentage
        ? {
            samplingConfig: {
              samplingPercentage: updates.samplingPercentage,
            },
          }
        : undefined,
      executionStatus: updates.executionStatus,
    });
    return await this.controlPlaneClient.send(command);
  }

  /**
   * Delete online evaluation configuration
   */
  async deleteOnlineEvaluationConfig(configId: string): Promise<void> {
    const command = new DeleteOnlineEvaluationConfigCommand({
      onlineEvaluationConfigId: configId,
    });
    await this.controlPlaneClient.send(command);
  }

  /**
   * List online evaluation configurations
   */
  async listOnlineEvaluationConfigs(options?: {
    maxResults?: number;
    nextToken?: string;
  }) {
    const command = new ListOnlineEvaluationConfigsCommand({
      maxResults: options?.maxResults,
      nextToken: options?.nextToken,
    });
    return await this.controlPlaneClient.send(command);
  }
}

// ============================================================================
// Failure Analyzer (uses real client)
// ============================================================================

export class RealAgentFailureAnalyzer {
  private client: RealAgentCoreEvaluationsClient;

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

  private static readonly PASS_THRESHOLDS: Record<string, number | string[]> = {
    [BUILTIN_EVALUATORS.HELPFULNESS]: 0.5,
    [BUILTIN_EVALUATORS.CORRECTNESS]: ["Perfectly Correct", "Partially Correct"],
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

  constructor(client: RealAgentCoreEvaluationsClient) {
    this.client = client;
  }

  async analyzeFailurePoints(sessionSpans: SpanLog[]): Promise<FailureAnalysis[]> {
    const allEvaluators = Object.values(BUILTIN_EVALUATORS);
    const results = await this.client.evaluateMultiple(allEvaluators, sessionSpans);

    const analyses: FailureAnalysis[] = [];

    for (const [evaluatorId, evalResults] of results) {
      for (const result of evalResults) {
        const passed = this.checkPassed(evaluatorId, result);

        analyses.push({
          evaluator: evaluatorId,
          passed,
          score: result.value,
          label: result.label,
          explanation: result.explanation,
          failureCategory: passed
            ? undefined
            : RealAgentFailureAnalyzer.FAILURE_CATEGORIES[evaluatorId],
        });
      }
    }

    return analyses;
  }

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

  private checkPassed(evaluatorId: string, result: EvaluationResultContent): boolean {
    if (result.errorMessage) {
      return false;
    }

    const threshold = RealAgentFailureAnalyzer.PASS_THRESHOLDS[evaluatorId];

    if (typeof threshold === "number" && result.value !== undefined) {
      return result.value >= threshold;
    }

    if (Array.isArray(threshold) && result.label) {
      return threshold.includes(result.label);
    }

    return true;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log("=== Amazon Bedrock AgentCore Evaluations - Real SDK Demo ===\n");

  const client = new RealAgentCoreEvaluationsClient();

  try {
    // Example 1: List available evaluators
    console.log("1. Listing Evaluators...");
    const evaluators = await client.listEvaluators({ maxResults: 20 });
    console.log(`Found ${evaluators.evaluators?.length || 0} evaluators`);
    evaluators.evaluators?.slice(0, 5).forEach((e) => {
      console.log(`  - ${e.evaluatorName} (${e.evaluatorType})`);
    });

    // Example 2: Run a single evaluation with sample data
    // NOTE: The Evaluate API requires spans from actual agent executions
    // (from AgentCore Runtime or agents instrumented with OpenTelemetry/Strands SDK)
    // The spans must contain model/tool/agent invocation details in the correct format.
    // This example shows the expected structure, but may fail without real agent spans.
    console.log("\n2. Running Helpfulness Evaluation...");
    console.log("   (Note: This requires spans from actual agent executions)");
    
    // Generate timestamps
    const nowMs = Date.now();
    const startTime = new Date(nowMs - 2000); // 2 seconds ago
    const endTime = new Date(nowMs - 1000);   // 1 second ago
    
    // IDs must match specific lengths: traceId=32 chars, spanId=16 chars
    const traceId = "abc123def456789012345678901234ab";
    const spanId = "1234567890abcdef";
    const sessionId = "demo-session-123";
    
    // Sample span structure based on Strands SDK telemetry format
    // The API expects spans with events containing gen_ai.* attributes
    const sampleSpans: SpanLog[] = [
      {
        spanId: spanId,
        traceId: traceId,
        parentSpanId: "",
        name: "chat",
        scope: {
          name: "strands.telemetry.tracer",
        },
        startTimeUnixNano: startTime.toISOString(),
        endTimeUnixNano: endTime.toISOString(),
        attributes: {
          "session.id": sessionId,
          "gen_ai.system": "strands-agents",
          "gen_ai.operation.name": "chat",
          "gen_ai.request.model": "anthropic.claude-3-sonnet-20240229-v1:0",
          "gen_ai.usage.input_tokens": 25,
          "gen_ai.usage.output_tokens": 50,
          "gen_ai.usage.total_tokens": 75,
          "gen_ai.event.start_time": startTime.toISOString(),
          "gen_ai.event.end_time": endTime.toISOString(),
        },
        status: { code: "OK" },
        kind: "INTERNAL",
        events: [
          {
            name: "gen_ai.user.message",
            timeUnixNano: startTime.toISOString(),
            attributes: {
              "content": JSON.stringify([{ text: "What is the capital of France?" }]),
            },
          },
          {
            name: "gen_ai.choice",
            timeUnixNano: endTime.toISOString(),
            attributes: {
              "message": JSON.stringify([{ text: "The capital of France is Paris." }]),
              "finish_reason": "end_turn",
            },
          },
        ],
      },
    ];

    try {
      const results = await client.evaluate(
        BUILTIN_EVALUATORS.HELPFULNESS,
        sampleSpans
      );
      console.log("Evaluation Results:", JSON.stringify(results, null, 2));
    } catch (evalError: any) {
      console.log("   Evaluation requires real agent spans from:");
      console.log("   - AgentCore Runtime hosted agents");
      console.log("   - Agents instrumented with Strands SDK + OpenTelemetry");
      console.log("   - LangGraph with OpenInference instrumentation");
      console.log(`   Error: ${evalError.message?.substring(0, 100)}...`);
    }

    // Example 3: List online evaluation configs
    console.log("\n3. Listing Online Evaluation Configs...");
    const configs = await client.listOnlineEvaluationConfigs({ maxResults: 10 });
    console.log(`Found ${configs.onlineEvaluationConfigs?.length || 0} configs`);

  } catch (error: any) {
    if (error.name === "CredentialsProviderError") {
      console.error("\n❌ AWS credentials not configured.");
      console.error("Please configure credentials via:");
      console.error("  - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
      console.error("  - AWS credentials file (~/.aws/credentials)");
      console.error("  - IAM role (for EC2/Lambda/ECS)");
    } else if (error.name === "AccessDeniedException") {
      console.error("\n❌ Access denied. Check IAM permissions for:");
      console.error("  - bedrock-agentcore:Evaluate");
      console.error("  - bedrock-agentcore:ListEvaluators");
      console.error("  - bedrock-agentcore:ListOnlineEvaluationConfigs");
    } else {
      console.error("\n❌ Error:", error.message || error);
    }
  }

  console.log("\n=== Demo Complete ===");
}

// Run if executed directly
main().catch(console.error);
