// =============================================================================
// VEEDS Proofreader - With Langfuse Tracing + Prompt Management + Structured Logging
// =============================================================================
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getLangfuse } from "./langfuse-client.js";
import logger from "./logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProofreadError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ProofreadResult {
  errors: ProofreadError[];
  isValid: boolean;
  processingTimeMs: number;
  rawResponse: string;
}

// ---------------------------------------------------------------------------
// Bedrock Client
// ---------------------------------------------------------------------------
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-central-1",
});

// ---------------------------------------------------------------------------
// Retry Helper (exponential backoff for Bedrock throttling)
// ---------------------------------------------------------------------------
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; retryableErrors?: string[] } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, retryableErrors = ["ThrottlingException", "ServiceUnavailableException", "TooManyRequestsException"] } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = retryableErrors.some(
        (e) => error?.name === e || error?.Code === e || error?.message?.includes(e)
      );

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
      
      // Replace console.warn with structured logging
      logger.warn('Bedrock retry attempt', {
        operation: 'bedrock-retry',
        attempt: attempt + 1,
        maxRetries,
        delayMs: Math.round(delay),
        errorName: error.name,
        errorMessage: error.message,
        retryableErrors
      });
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Retry exhausted"); // unreachable, satisfies TS
}

// ---------------------------------------------------------------------------
// Default Prompt — loaded from eval/prompt.txt (single source of truth)
// Falls back to inline prompt if file not found.
// ---------------------------------------------------------------------------
import { readFileSync } from "fs";
import { resolve } from "path";

let DEFAULT_PROMPT: string;
try {
  DEFAULT_PROMPT = readFileSync(
    resolve(process.cwd(), "eval/prompt.txt"),
    "utf-8"
  );
} catch {
  DEFAULT_PROMPT = `Du bist ein YAML-Prüfer für Fahrzeugdaten im VEEDS-Format.
Prüfe den folgenden YAML-Eintrag auf Fehler. Antworte NUR mit JSON:
{"errors": [{"field": "...", "message": "...", "severity": "error|warning|info"}], "isValid": true|false}

YAML-Eintrag:
{{yaml_entry}}`;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------
export async function proofreadEntry(
  yamlEntry: string,
  options?: {
    userId?: string;
    sessionId?: string;
    tags?: string[];
  }
): Promise<ProofreadResult> {
  const langfuse = getLangfuse();
  const startTime = Date.now();

  // Set up logging context
  logger.info('Starting YAML proofreading', {
    operation: 'proofread-entry',
    inputSize: yamlEntry.length,
    userId: options?.userId,
    sessionId: options?.sessionId,
    tags: options?.tags
  });

  // Create trace
  const trace = langfuse.trace({
    name: "veeds-proofreader",
    input: yamlEntry,
    userId: options?.userId,
    sessionId: options?.sessionId,
    tags: options?.tags || ["proofreader"],
    metadata: {
      specVersion: "2.1",
    },
  });

  // Set up trace correlation for logging
  logger.withLangfuseTrace(trace, options?.userId);

  try {
    // -----------------------------------------------------------------------
    // Step 1: Load prompt from Langfuse (with fallback)
    // -----------------------------------------------------------------------
    logger.debug('Loading prompt from Langfuse', { operation: 'load-prompt' });
    
    const promptSpan = trace.span({
      name: "load-prompt",
      metadata: { source: "langfuse" },
    });

    let compiledPrompt: string;
    try {
      const prompt = await langfuse.getPrompt("veeds-proofreader", undefined, {
        label: "production",
        cacheTtlSeconds: 300, // Cache 5 min client-side
      });

      compiledPrompt = prompt.compile({ yaml_entry: yamlEntry });

      promptSpan.end({
        output: { source: "langfuse", version: prompt.version },
      });

      logger.info('Prompt loaded successfully from Langfuse', {
        operation: 'load-prompt',
        source: 'langfuse',
        promptVersion: prompt.version,
        promptName: prompt.name
      });

      // Link prompt to trace for metrics correlation
      trace.update({
        metadata: {
          specVersion: "2.1",
          promptVersion: prompt.version,
          promptName: prompt.name,
        },
      });
    } catch (promptError) {
      // Fallback to default prompt
      compiledPrompt = DEFAULT_PROMPT.replace("{{yaml_entry}}", yamlEntry);
      
      promptSpan.end({
        output: { source: "fallback" },
        level: "WARNING",
        statusMessage: "Langfuse prompt not available, using fallback",
      });

      logger.warn('Falling back to default prompt', {
        operation: 'load-prompt',
        source: 'fallback',
        error: promptError instanceof Error ? promptError.message : String(promptError)
      });
    }

    // -----------------------------------------------------------------------
    // Step 2: Call Bedrock
    // -----------------------------------------------------------------------
    logger.debug('Calling Bedrock API', { 
      operation: 'bedrock-invoke',
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    });

    const generation = trace.generation({
      name: "bedrock-claude",
      model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      input: compiledPrompt,
      modelParameters: {
        max_tokens: 2048,
        temperature: 0,
      },
    });

    const bedrockStartTime = Date.now();
    const bedrockResponse = await withRetry(() =>
      bedrockClient.send(
        new InvokeModelCommand({
          modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2048,
            temperature: 0,
            messages: [
              {
                role: "user",
                content: compiledPrompt,
              },
            ],
          }),
        })
      )
    );
    const bedrockDuration = Date.now() - bedrockStartTime;

    const responseBody = JSON.parse(
      new TextDecoder().decode(bedrockResponse.body)
    );
    const rawResponse = responseBody.content[0].text;

    // Log Bedrock operation performance
    logger.logBedrock({
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      operation: 'invoke',
      duration: bedrockDuration,
      tokenUsage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
      },
      cost: 0, // Cost calculation would go here
    });

    // Track usage
    generation.end({
      output: rawResponse,
      usage: {
        input: responseBody.usage?.input_tokens,
        output: responseBody.usage?.output_tokens,
      },
    });

    // -----------------------------------------------------------------------
    // Step 3: Parse response
    // -----------------------------------------------------------------------
    logger.debug('Parsing LLM response', { 
      operation: 'parse-response',
      responseLength: rawResponse.length 
    });

    const parseSpan = trace.span({ name: "parse-response" });

    let parsed: { errors: ProofreadError[]; isValid: boolean };
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsed = JSON.parse(jsonMatch[0]);
      
      parseSpan.end({ output: { success: true } });
      
      logger.debug('Response parsed successfully', {
        operation: 'parse-response',
        errorsFound: parsed.errors?.length || 0,
        isValid: parsed.isValid
      });
    } catch (parseError) {
      parseSpan.end({
        output: { success: false, error: String(parseError) },
        level: "ERROR",
      });

      logger.error('Failed to parse LLM response', {
        operation: 'parse-response',
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
        responseLength: rawResponse.length
      });

      throw new Error(`Failed to parse LLM response: ${parseError}`);
    }

    // -----------------------------------------------------------------------
    // Result
    // -----------------------------------------------------------------------
    const processingTimeMs = Date.now() - startTime;

    const result: ProofreadResult = {
      errors: parsed.errors || [],
      isValid: parsed.isValid ?? parsed.errors?.length === 0,
      processingTimeMs,
      rawResponse,
    };

    // Update trace with final output
    trace.update({
      output: result,
    });

    // Score: processing time
    trace.score({
      name: "processing_time_ms",
      value: processingTimeMs,
      comment: `${processingTimeMs}ms end-to-end`,
    });

    logger.info('YAML proofreading completed successfully', {
      operation: 'proofread-entry',
      processingTimeMs,
      errorsFound: result.errors.length,
      isValid: result.isValid,
      inputSize: yamlEntry.length,
      outputSize: rawResponse.length
    });

    return result;
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    trace.update({
      output: { error: String(error) },
      level: "ERROR",
      statusMessage: String(error),
    });

    logger.error('YAML proofreading failed', {
      operation: 'proofread-entry',
      processingTimeMs,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      inputSize: yamlEntry.length
    });

    return {
      errors: [
        {
          field: "_system",
          message: `Proofreading failed: ${error}`,
          severity: "error",
        },
      ],
      isValid: false,
      processingTimeMs,
      rawResponse: "",
    };
  }
}
