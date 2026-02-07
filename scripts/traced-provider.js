/**
 * Custom Provider mit OpenTelemetry Tracing
 * 
 * Dieses Beispiel zeigt wie man einen Custom Provider mit Tracing implementiert.
 * Die Traces werden in der Promptfoo Web UI unter "Trace Timeline" angezeigt.
 * 
 * Usage in promptfooconfig.yaml:
 *   providers:
 *     - file://scripts/traced-provider.js
 * 
 * Dokumentation: https://www.promptfoo.dev/docs/tracing/
 */

// OpenTelemetry Imports (optional - nur wenn externes Tracing gewünscht)
let trace, context, SpanStatusCode;
let tracerInitialized = false;

try {
  const otelApi = require('@opentelemetry/api');
  trace = otelApi.trace;
  context = otelApi.context;
  SpanStatusCode = otelApi.SpanStatusCode;
  
  // Nur initialisieren wenn OTEL_EXPORTER_OTLP_ENDPOINT gesetzt ist
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
    const { resourceFromAttributes } = require('@opentelemetry/resources');
    
    const provider = new NodeTracerProvider({
      resource: resourceFromAttributes({ 
        'service.name': 'vehicle-info-provider',
        'service.version': '1.0.0'
      }),
      spanProcessors: [
        new SimpleSpanProcessor(
          new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
          }),
        ),
      ],
    });
    
    provider.register();
    tracerInitialized = true;
    console.log('[TracedProvider] OpenTelemetry initialized');
  }
} catch (e) {
  console.log('[TracedProvider] OpenTelemetry not available, using basic provider');
}

/**
 * Simulierter LLM-Aufruf (ersetze mit echtem API-Call)
 */
async function mockLLMCall(prompt, config) {
  // Simuliere Latenz
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  // Simulierte Antwort basierend auf Prompt
  if (prompt.toLowerCase().includes('vin')) {
    return {
      output: 'Eine VIN (Vehicle Identification Number) ist eine 17-stellige Fahrzeug-Identifikationsnummer.',
      tokenUsage: { prompt: 50, completion: 30, total: 80 }
    };
  }
  
  return {
    output: 'Ich bin ein Fahrzeuginformations-Assistent und kann Fragen zu VIN, LKW-Technik und MAN-Produkten beantworten.',
    tokenUsage: { prompt: 40, completion: 25, total: 65 }
  };
}

/**
 * Provider mit Tracing Support
 * 
 * @param {string} prompt - Der Prompt
 * @param {object} promptfooContext - Kontext von Promptfoo (enthält traceparent)
 * @param {object} options - Provider-Optionen
 */
async function callApi(prompt, promptfooContext, options) {
  const startTime = Date.now();
  
  // Wenn Tracing aktiviert und traceparent vorhanden
  if (tracerInitialized && promptfooContext?.traceparent && trace) {
    const tracer = trace.getTracer('vehicle-info-provider');
    
    // Parse trace context von Promptfoo
    const activeContext = trace.propagation.extract(context.active(), {
      traceparent: promptfooContext.traceparent,
    });
    
    return context.with(activeContext, async () => {
      const span = tracer.startSpan('vehicle-info.llm-call', {
        attributes: {
          // GenAI Semantic Conventions
          'gen_ai.system': 'custom-provider',
          'gen_ai.request.model': 'mock-model',
          'gen_ai.request.temperature': options?.temperature || 0.3,
          'gen_ai.request.max_tokens': options?.max_tokens || 1024,
          // Custom Attributes
          'prompt.length': prompt.length,
          'prompt.preview': prompt.substring(0, 100),
        }
      });
      
      try {
        const result = await mockLLMCall(prompt, options);
        
        // Response Attributes
        span.setAttribute('gen_ai.response.finish_reason', 'stop');
        span.setAttribute('gen_ai.usage.prompt_tokens', result.tokenUsage.prompt);
        span.setAttribute('gen_ai.usage.completion_tokens', result.tokenUsage.completion);
        span.setAttribute('gen_ai.usage.total_tokens', result.tokenUsage.total);
        span.setAttribute('response.length', result.output.length);
        span.setAttribute('latency_ms', Date.now() - startTime);
        
        span.setStatus({ code: SpanStatusCode.OK });
        
        return result;
        
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
        
      } finally {
        span.end();
      }
    });
  }
  
  // Fallback ohne Tracing
  return mockLLMCall(prompt, options);
}

/**
 * Provider ID für Promptfoo
 */
function id() {
  return 'custom:traced-vehicle-provider';
}

/**
 * Provider Label für UI
 */
function label() {
  return 'Traced Vehicle Provider';
}

module.exports = {
  callApi,
  id,
  label,
};
