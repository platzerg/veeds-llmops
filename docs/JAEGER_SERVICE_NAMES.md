# Jaeger Service Names Reference

## Standardized Service Naming Convention

Alle Services verwenden das Format: `<component>-service`

## Service Übersicht

| Service Name | Komponente | Zweck | Konfiguration |
|--------------|------------|-------|---------------|
| **promptfoo-service** | Promptfoo Red Team | LLM Security Testing & Evaluation | `.env`: `OTEL_SERVICE_NAME` |
| **deepeval-service** | DeepEval Tests | Metric-based LLM Evaluation | `docker-compose.yml`, `test_proofreader.py` |
| **langfuse-service** | Langfuse (geplant) | LLM Observability Platform | Zukünftige Integration |

## Konfigurationsdateien

### Promptfoo Service

**`.env`:**
```bash
OTEL_SERVICE_NAME=promptfoo-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

**Verwendung:**
- Red Team Tests: `npm run redteam`, `npm run redteamFull`
- Evaluation: `npm run eval`

### DeepEval Service

**`docker-compose.yml`:**
```yaml
deepeval:
  environment:
    - OTEL_SERVICE_NAME=deepeval-service
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

**`eval/deepeval/test_proofreader.py`:**
```python
resource = Resource(attributes={
    "service.name": "deepeval-service",
    "service.version": "1.0.0",
    "deployment.environment": "development"
})
```

**Verwendung:**
```bash
docker compose --profile deepeval run deepeval
# oder
npm run eval:deepeval
```

## Jaeger UI

**URL:** http://localhost:16686

**Services finden:**
1. Dropdown "Service" öffnen
2. Service auswählen:
   - `promptfoo-service` - Red Team & Evaluation Traces
   - `deepeval-service` - DeepEval Test Traces
3. "Find Traces" klicken

## Trace-Hierarchie

```
promptfoo-service
├─ Red Team Scan
│  ├─ PII Detection Test
│  ├─ Jailbreak Attempt
│  └─ Hallucination Check
└─ Evaluation Run
   ├─ Test Case 1
   └─ Test Case 2

deepeval-service
└─ test_proofreader_logic
   ├─ Faithfulness Metric
   └─ Answer Relevancy Metric
```

## Zukünftige Services

Geplante Erweiterungen:

- **langfuse-service**: Langfuse SDK Tracing
- **proofreader-service**: VEEDS Proofreader API Traces
- **presidio-service**: PII Detection/Anonymization Traces
- **rag-pipeline-service**: RAG Pipeline Traces

## Naming Best Practices

1. **Konsistenz**: Immer `-service` Suffix verwenden
2. **Beschreibend**: Service-Name sollte Komponente klar identifizieren
3. **Lowercase**: Nur Kleinbuchstaben und Bindestriche
4. **Kurz**: Maximal 3 Wörter (z.B. `deepeval-service`, nicht `deepeval-proofreader-test-service`)
