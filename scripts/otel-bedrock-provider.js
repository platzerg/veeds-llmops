/**
 * Custom Promptfoo Provider mit OpenTelemetry Tracing für AWS Bedrock
 * 
 * Unterstützt Dual-Export: Jaeger (lokal) + AWS X-Ray (optional)
 * 
 * Usage in promptfooconfig.yaml:
 *   providers:
 *     - id: file://scripts/otel-bedrock-provider.js
 *       config:
 *         modelId: eu.anthropic.claude-opus-4-5-20251101-v1:0
 *         region: eu-central-1
 *         # Jaeger (lokal)
 *         otlpEndpoint: http://localhost:4318
 *         serviceName: promptfoo-vehicle-info
 *         # AWS X-Ray (optional)
 *         enableXray: true
 *         xrayEndpoint: https://xray.eu-central-1.amazonaws.com
 */

const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { SimpleSpanProcessor, BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// AWS X-Ray Support
const { AWSXRayIdGenerator } = require('@opentelemetry/id-generator-aws-xray');
const { AWSXRayPropagator } = require('@opentelemetry/propagator-aws-xray');

// GenAI Semantic Conventions
const GEN_AI_SYSTEM = 'gen_ai.system';
const GEN_AI_REQUEST_MODEL = 'gen_ai.request.model';
const GEN_AI_REQUEST_MAX_TOKENS = 'gen_ai.request.max_tokens';
const GEN_AI_REQUEST_TEMPERATURE = 'gen_ai.request.temperature';
const GEN_AI_USAGE_PROMPT_TOKENS = 'gen_ai.usage.prompt_tokens';
const GEN_AI_USAGE_COMPLETION_TOKENS = 'gen_ai.usage.completion_tokens';
const GEN_AI_USAGE_TOTAL_TOKENS = 'gen_ai.usage.total_tokens';
const GEN_AI_RESPONSE_FINISH_REASON = 'gen_ai.response.finish_reason';

/**
 * OtelBedrockProvider - Custom Promptfoo Provider mit Dual-Export Tracing
 */
class OtelBedrockProvider {
  constructor(options = {}) {
    this.config = options.config || {};
    this.modelId = this.config.modelId || 'eu.anthropic.claude-opus-4-5-20251101-v1:0';
    this.region = this.config.region || 'eu-central-1';
    this.serviceName = this.config.serviceName || 'promptfoo-bedrock';
    this.temperature = this.config.temperature || 0.1;
    this.maxTokens = this.config.maxTokens || 2048;

    // Jaeger/OTLP Config
    this.otlpEndpoint = this.config.otlpEndpoint || 'http://localhost:4318';
    this.enableOtlp = this.config.enableOtlp !== false; // Default: true
    
    // AWS X-Ray Config
    this.enableXray = this.config.enableXray || false;
    this.xrayEndpoint = this.config.xrayEndpoint || `https://xray.${this.region}.amazonaws.com`;
    
    this.provider = null;
    this.tracer = null;
    this.bedrockClient = null;
    
    // Store values for id() and label() methods
    this._modelName = this.modelId.split(':').pop() || 'unknown';
    this._id = `otel-bedrock:${this.modelId}`;
    this._label = `OTEL Bedrock (${this._modelName})`;
    
    this.initTracer();
    this.initBedrockClient();
  }
  
  /**
   * Provider ID for Promptfoo
   */
  id() {
    return this._id;
  }
  
  /**
   * Provider Label for UI
   */
  label() {
    return this._label;
  }
  
  /**
   * String representation
   */
  toString() {
    return this._label;
  }
  
  /**
   * Initialize OpenTelemetry SDK with Dual-Export Support
   */
  initTracer() {
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: this.serviceName,
      [ATTR_SERVICE_VERSION]: '1.0.0',
      'cloud.provider': 'aws',
      'cloud.region': this.region,
    });
    
    const spanProcessors = [];
    const exporters = [];
    
    // Jaeger/OTLP Exporter (lokal oder remote)
    if (this.enableOtlp && this.otlpEndpoint) {
      const otlpExporter = new OTLPTraceExporter({
        url: `${this.otlpEndpoint}/v1/traces`,
      });
      spanProcessors.push(new SimpleSpanProcessor(otlpExporter));
      exporters.push(`OTLP: ${this.otlpEndpoint}`);
    }
    
    // AWS X-Ray Exporter (direkt ohne ADOT Sidecar)
    if (this.enableXray) {
      // X-Ray verwendet OTLP über den AWS Endpoint
      // Hinweis: Für direkten X-Ray Export ohne Collector wird der 
      // AWS X-Ray Daemon oder ADOT Collector empfohlen.
      // Hier verwenden wir den OTLP-kompatiblen Endpoint.
      const xrayExporter = new OTLPTraceExporter({
        url: `${this.xrayEndpoint}`,
        headers: {
          // AWS SigV4 wird automatisch vom SDK hinzugefügt wenn AWS Credentials vorhanden
        },
      });
      // BatchSpanProcessor für X-Ray (effizienter für Remote-Endpoints)
      spanProcessors.push(new BatchSpanProcessor(xrayExporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 10,
        scheduledDelayMillis: 1000,
      }));
      exporters.push(`X-Ray: ${this.xrayEndpoint}`);
    }
    
    // Provider mit X-Ray ID Generator für kompatible Trace IDs
    const providerConfig = { 
      resource,
      spanProcessors,
    };
    
    // X-Ray-kompatible Trace IDs wenn X-Ray aktiviert
    if (this.enableXray) {
      providerConfig.idGenerator = new AWSXRayIdGenerator();
    }
    
    this.provider = new NodeTracerProvider(providerConfig);
    
    // X-Ray Propagator registrieren wenn aktiviert
    if (this.enableXray) {
      this.provider.register({
        propagator: new AWSXRayPropagator(),
      });
    } else {
      this.provider.register();
    }
    
    this.tracer = trace.getTracer('otel-bedrock-provider', '1.0.0');
    
    console.log(`[OtelBedrockProvider] Tracer initialized - Service: ${this.serviceName}`);
    console.log(`[OtelBedrockProvider] Exporters: ${exporters.join(', ') || 'none'}`);
  }
  
  /**
   * Initialize AWS Bedrock Runtime Client
   */
  initBedrockClient() {
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: this.region,
    });
    
    console.log(`[OtelBedrockProvider] Bedrock client initialized - Region: ${this.region}, Model: ${this.modelId}`);
  }
  
  /**
   * Main API call method with OpenTelemetry tracing
   */
  async callApi(prompt, context = {}) {
    const startTime = Date.now();
    
    const span = this.tracer.startSpan('bedrock.invoke_model', {
      attributes: {
        [GEN_AI_SYSTEM]: 'bedrock',
        [GEN_AI_REQUEST_MODEL]: this.modelId,
        [GEN_AI_REQUEST_MAX_TOKENS]: this.maxTokens,
        [GEN_AI_REQUEST_TEMPERATURE]: this.temperature,
        'promptfoo.prompt_length': prompt.length,
        'promptfoo.test_description': context.vars?.__description || 'unknown',
        // AWS X-Ray spezifische Attribute
        'aws.region': this.region,
        'aws.service': 'bedrock-runtime',
      },
    });
    
    try {
      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [{ role: 'user', content: prompt }],
      };
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
      });
      
      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const output = responseBody.content?.[0]?.text || '';
      const stopReason = responseBody.stop_reason || 'unknown';
      const usage = responseBody.usage || {};
      
      const tokenUsage = {
        prompt: usage.input_tokens || 0,
        completion: usage.output_tokens || 0,
        total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      };
      
      const latencyMs = Date.now() - startTime;
      
      span.setAttribute(GEN_AI_USAGE_PROMPT_TOKENS, tokenUsage.prompt);
      span.setAttribute(GEN_AI_USAGE_COMPLETION_TOKENS, tokenUsage.completion);
      span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS, tokenUsage.total);
      span.setAttribute(GEN_AI_RESPONSE_FINISH_REASON, stopReason);
      span.setAttribute('response.length', output.length);
      span.setAttribute('latency_ms', latencyMs);
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return { output, tokenUsage, latencyMs };
      
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      
      // AWS-spezifische Fehler-Attribute
      if (error.$metadata) {
        span.setAttribute('aws.request_id', error.$metadata.requestId || 'unknown');
        span.setAttribute('http.status_code', error.$metadata.httpStatusCode || 0);
      }
      
      return { error: `Bedrock API Error: ${error.message}` };
      
    } finally {
      span.end();
    }
  }
  
  /**
   * Graceful shutdown - flush pending spans
   */
  async shutdown() {
    if (this.provider) {
      console.log('[OtelBedrockProvider] Shutting down tracer...');
      await this.provider.shutdown();
    }
  }
}

module.exports = OtelBedrockProvider;

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  if (global._otelProvider) await global._otelProvider.shutdown();
});
process.on('SIGINT', async () => {
  if (global._otelProvider) await global._otelProvider.shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  if (global._otelProvider) await global._otelProvider.shutdown();
  process.exit(0);
});
