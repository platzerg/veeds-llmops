// =============================================================================
// Langfuse Client - Singleton with Tracing + Structured Logging
// =============================================================================
import Langfuse from "langfuse";

let langfuseInstance: Langfuse | null = null;

export function getLangfuse(): Langfuse {
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
      // Flush events every 1 second (default: 500ms)
      flushInterval: 1000,
    });
  }
  return langfuseInstance;
}

/**
 * Flush all pending events to Langfuse.
 * Call this before process exit.
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    try {
      await langfuseInstance.shutdownAsync();
      langfuseInstance = null;
    } catch (error) {
      // Don't use logger here to avoid circular dependencies
      console.error('Error during Langfuse shutdown:', error);
      throw error;
    }
  }
}
