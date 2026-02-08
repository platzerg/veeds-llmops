# Docker Stack Status

## ✅ Laufende Container

Ihr vollständiger LLMOps-Stack ist jetzt aktiv:

### Core Services (Langfuse)
- **langfuse** - Hauptanwendung auf Port `3310`
- **langfuse-worker** - Async Event Processing
- **postgres** - PostgreSQL Datenbank
- **clickhouse** - Analytics Engine
- **redis** - Caching Layer
- **minio** - S3-kompatible Object Storage

### Evaluation & Testing
- **promptfoo** - Evaluation UI auf Port `3210`

### Security & PII
- **presidio-analyzer** - PII Detection auf Port `5001`
- **presidio-anonymizer** - PII Anonymization auf Port `5002`

### Observability & Tracing
- **jaeger** - Distributed Tracing UI auf Port `16686`
  - OTLP gRPC: `4317`
  - OTLP HTTP: `4318`
- **tempo** - Alternative Tracing Backend
  - OTLP gRPC: `4319`
  - OTLP HTTP: `4320`
- **grafana** - Dashboards & Visualization auf Port `8222`
- **otel-collector** - OpenTelemetry Collector
  - gRPC: `4321`
  - HTTP: `4322`

## 🌐 Wichtige URLs

| Service | URL | Beschreibung |
|---------|-----|--------------|
| Langfuse | http://localhost:3310 | LLM Observability Platform |
| Promptfoo | http://localhost:3210 | Evaluation Results |
| Jaeger | http://localhost:16686 | Distributed Tracing |
| Grafana | http://localhost:8222 | Dashboards (admin/admin) |
| Presidio Analyzer | http://localhost:5001 | PII Detection API |

## 🔧 Nächste Schritte

### Red Team Tests mit Jaeger Tracing
```bash
npm run redteamFull
```
Traces erscheinen automatisch in Jaeger unter Service: `promptfoo-redteam`

### DeepEval Synthetic Data
```bash
npm run eval:deepeval:generate
```

### Langfuse Prompts hochladen
```bash
npm run prompt:upload
```

## ⚠️ Hinweise

- **OTEL Endpoint**: Konfiguriert auf `http://localhost:4318` (Jaeger OTLP HTTP)
- **Service Name**: `promptfoo-redteam` für Red Team Traces
- **OpenAI**: Alle Services nutzen jetzt `gpt-4o` statt Bedrock
