// =============================================================================
// VEEDS Proofreader - OpenAI Version for Testing
// =============================================================================
import "dotenv/config";
import { getLangfuse } from "./langfuse-client.js";
import logger from "./logger.js";
import { readFileSync } from "fs";

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
// OpenAI API Call
// ---------------------------------------------------------------------------
async function callOpenAI(prompt: string): Promise<string> {
  // Load API key from environment variable
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Debug - API Key loaded:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT FOUND");
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Main Proofreading Function
// ---------------------------------------------------------------------------
export async function proofreadEntry(
  yamlEntry: string,
  options: {
    userId?: string;
    sessionId?: string;
    tags?: string[];
  } = {}
): Promise<ProofreadResult> {
  const startTime = Date.now();
  const { userId = "anonymous", sessionId, tags = [] } = options;

  // Create Langfuse trace
  const langfuse = getLangfuse();
  const trace = langfuse.trace({
    name: "veeds-proofreader",
    userId,
    sessionId,
    tags,
    input: { yamlEntry },
    metadata: {
      provider: "openai",
      model: "gpt-4o-mini",
      inputSize: yamlEntry.length,
    },
  });

  logger.info("Starting YAML proofreading", {
    operation: "proofread-entry",
    inputSize: yamlEntry.length,
    userId,
    sessionId,
    tags,
  });

  try {
    // Load prompt (with fallback)
    let promptTemplate: string;
    try {
      const langfusePrompt = await langfuse.getPrompt("veeds-proofreader", undefined, {
        label: "production",
        cacheTtlSeconds: 300, // 5 minutes
      });
      promptTemplate = langfusePrompt.prompt;
      logger.debug("Loaded prompt from Langfuse", {
        operation: "load-prompt",
        source: "langfuse",
        version: langfusePrompt.version,
      });
    } catch (error) {
      logger.warn("Falling back to default prompt", {
        operation: "load-prompt",
        source: "fallback",
        error: error instanceof Error ? error.message : String(error),
      });
      promptTemplate = readFileSync("eval/prompt.txt", "utf-8");
    }

    // Prepare prompt
    const fullPrompt = promptTemplate.replace("{{yaml_entry}}", yamlEntry);

    // Create generation span
    const generation = trace.generation({
      name: "openai-gpt-4o-mini",
      model: "gpt-4o-mini",
      input: fullPrompt,
      modelParameters: {
        temperature: 0,
        max_tokens: 2048,
      },
    });

    // Call OpenAI
    const rawResponse = await callOpenAI(fullPrompt);

    // End generation span
    generation.end({
      output: rawResponse,
    });

    // Parse response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);
    const processingTimeMs = Date.now() - startTime;

    // Update trace
    trace.update({
      output: result,
    });

    trace.score({
      name: "processing_time_ms",
      value: processingTimeMs,
    });

    logger.info("YAML proofreading completed", {
      operation: "proofread-entry",
      processingTimeMs,
      isValid: result.isValid,
      errorCount: result.errors?.length || 0,
    });

    return {
      errors: result.errors || [],
      isValid: result.isValid,
      processingTimeMs,
      rawResponse,
    };

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    
    logger.error("YAML proofreading failed", {
      operation: "proofread-entry",
      processingTimeMs,
      inputSize: yamlEntry.length,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });

    trace.update({
      output: { error: error instanceof Error ? error.message : String(error) },
    });

    return {
      errors: [
        {
          field: "_system",
          severity: "error",
          message: `Proofreading failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isValid: false,
      processingTimeMs,
      rawResponse: "",
    };
  }
}