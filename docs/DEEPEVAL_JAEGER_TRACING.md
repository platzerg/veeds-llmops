# DeepEval Jaeger Tracing Setup

## Übersicht

DeepEval-Tests senden jetzt OpenTelemetry Traces an Jaeger für detaillierte Observability.

## Konfiguration

### 1. Python Dependencies

**`eval/deepeval/requirements.txt`:**
```txt
deepeval
boto3
langfuse
python-dotenv
pandas
pytest
opentelemetry-api
opentelemetry-sdk
opentelemetry-exporter-otlp-proto-http
```

### 2. OpenTelemetry Setup in Test

**`eval/deepeval/test_proofreader.py`:**
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Configure OpenTelemetry to export to Jaeger
resource = Resource(attributes={
    "service.name": "deepeval-proofreader",
    "service.version": "1.0.0",
    "deployment.environment": "development"
})

# Initialize tracer provider
tracer_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(tracer_provider)

# Configure OTLP exporter to Jaeger (HTTP endpoint)
otlp_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces"),
    headers={}
)

# Add span processor
span_processor = BatchSpanProcessor(otlp_exporter)
tracer_provider.add_span_processor(span_processor)

# Get tracer
tracer = trace.get_tracer(__name__)
```

### 3. Wrap Tests with Spans

```python
def test_proofreader_logic():
    """Test proofreader logic with OpenTelemetry tracing to Jaeger"""
    with tracer.start_as_current_span("test_proofreader_logic") as span:
        # Add span attributes
        span.set_attribute("test.input_size", len(input_text))
        span.set_attribute("test.model", "gpt-4o")
        span.set_attribute("test.framework", "deepeval")
        
        # Your test logic here
        assert_test(test_case, [faithfulness_metric, relevancy_metric])
        
        span.set_attribute("test.status", "passed")
```

### 4. Docker Compose Configuration

**`docker-compose.yml`:**
```yaml
deepeval:
  image: python:3.10-slim
  container_name: deepeval-runner
  working_dir: /app
  volumes:
    - .:/app
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC_KEY}
    - LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY}
    - LANGFUSE_HOST=${LANGFUSE_HOST}
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
    - OTEL_SERVICE_NAME=deepeval-proofreader
    - PYTHONPATH=/app
  command: >
    sh -c "pip install -r eval/deepeval/requirements.txt && 
           deepeval test run eval/deepeval/test_proofreader.py"
  networks:
    - aiqa
  profiles:
    - deepeval
```

### 5. Environment Variables

**`.env`:**
```bash
# OpenTelemetry Configuration (Jaeger Export)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=deepeval-proofreader
OTEL_TRACES_EXPORTER=otlp

# Python Configuration
PYTHONPATH=.
```

## Verwendung

### DeepEval Tests mit Tracing ausführen

```bash
# Via Docker Compose
docker compose --profile deepeval run deepeval

# Oder via npm
npm run eval:deepeval
```

### Traces in Jaeger anzeigen

1. **Jaeger UI öffnen**: http://localhost:16686
2. **Service auswählen**: `deepeval-proofreader`
3. **Traces anzeigen**: "Find Traces" klicken

## Trace-Informationen

Jeder DeepEval Test-Trace enthält:

- **Service Name**: `deepeval-proofreader`
- **Span Name**: `test_proofreader_logic`
- **Attributes**:
  - `test.input_size`: Größe des Test-Inputs
  - `test.model`: Verwendetes LLM-Modell (`gpt-4o`)
  - `test.framework`: `deepeval`
  - `test.status`: `passed` oder `failed`

## Troubleshooting

### Keine Traces in Jaeger

```bash
# 1. Prüfen ob Jaeger läuft
docker ps | grep jaeger

# 2. Prüfen ob OTLP Endpoint erreichbar (im Container)
docker exec deepeval-runner curl -v http://jaeger:4318/v1/traces

# 3. Test-Logs prüfen
docker logs deepeval-runner
```

### Import-Fehler

```bash
# OpenTelemetry Pakete installieren
pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

### PYTHONPATH Warning

Die Warnung `PYTHONPATH variable is not set` wurde durch Hinzufügen von `PYTHONPATH=.` in `.env` und `PYTHONPATH=/app` im Docker Container behoben.

## Beispiel-Trace

```
Service: deepeval-proofreader
├─ Span: test_proofreader_logic (2.5s)
   ├─ test.input_size: 56
   ├─ test.model: gpt-4o
   ├─ test.framework: deepeval
   └─ test.status: passed
```

## Integration mit Langfuse

DeepEval kann gleichzeitig Traces an **Jaeger** (OpenTelemetry) und **Langfuse** senden:

```python
from langfuse.deepeval import LangfuseCallbackHandler

langfuse_handler = LangfuseCallbackHandler()

# Beide Callbacks verwenden
assert_test(test_case, metrics, callbacks=[langfuse_handler])
```

- **Jaeger**: Technische Traces (Spans, Timing, Attributes)
- **Langfuse**: LLM-spezifische Metriken (Tokens, Costs, Prompts)
