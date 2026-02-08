# Jaeger Tracing Integration - Walkthrough

## Zusammenfassung

Erfolgreich OpenTelemetry Tracing für **Promptfoo** und **DeepEval** konfiguriert, um alle Traces an **Jaeger** zu senden.

## Durchgeführte Änderungen

### 1. Promptfoo Tracing (YAML-Konfiguration)

**Dateien aktualisiert:**
- `redteamconfig.yaml`
- `redteamconfigFiull.yaml`
- `promptfooconfig.yaml`

**Konfiguration:**
```yaml
tracing:
  enabled: true
  forward:
    endpoint: http://localhost:4318  # Jaeger OTLP HTTP
```

**Service Name:** `promptfoo-service`

### 2. DeepEval Tracing (OpenTelemetry Python)

**Dateien aktualisiert:**
- `eval/deepeval/test_proofreader.py` - OpenTelemetry SDK Integration
- `eval/deepeval/requirements.txt` - OTLP Exporter Dependencies
- `docker-compose.yml` - Umgebungsvariablen
- `.env` - PYTHONPATH Konfiguration

**OpenTelemetry Setup:**
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

resource = Resource(attributes={
    "service.name": "deepeval-service",
    "service.version": "1.0.0",
    "deployment.environment": "development"
})

tracer_provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
)
```

**Service Name:** `deepeval-service`

### 3. Service Namen Standardisierung

Alle Services verwenden jetzt das Format `<component>-service`:
- ✅ `promptfoo-service` (vorher: `promptfoo-redteam`)
- ✅ `deepeval-service` (vorher: `deepeval-proofreader`)

### 4. DeepEval Persistent Container

**Änderungen:**
- Entfernt: `profiles: - deepeval` (startet jetzt automatisch)
- Hinzugefügt: `restart: unless-stopped`
- Command: `tail -f /dev/null` (hält Container am Laufen)

**NPM Scripts:**
```json
{
  "eval:deepeval:start": "docker compose up -d deepeval",
  "eval:deepeval:stop": "docker compose stop deepeval",
  "eval:deepeval": "docker exec deepeval-runner deepeval test run eval/deepeval/test_proofreader.py",
  "eval:deepeval:generate": "docker exec deepeval-runner python eval/deepeval/generate_synthetic_data.py",
  "eval:deepeval:logs": "docker logs -f deepeval-runner"
}
```

### 5. Windows PowerShell Kompatibilität

**Problem:** `sh -c '...'` funktioniert nicht in Windows PowerShell

**Lösung:** Direkte Befehlsausführung ohne `sh -c` Wrapper
```json
// Vorher (fehlerhaft)
"eval:deepeval": "docker exec deepeval-runner sh -c 'deepeval test run ...'"

// Nachher (funktioniert)
"eval:deepeval": "docker exec deepeval-runner deepeval test run ..."
```

## Verifikation

### DeepEval Test erfolgreich

```bash
npm run eval:deepeval
```

**Ergebnis:**
- ✅ 1 Test passed
- ✅ Token cost: $0.010157500000000002 USD
- ✅ Pass Rate: 100.0%

### Jaeger UI

**URL:** http://localhost:16686

**Services:**
- `promptfoo-service` - Red Team & Evaluation Traces
- `deepeval-service` - DeepEval Test Traces

## Dokumentation

Erstellt:
1. `docs/PROMPTFOO_JAEGER_TRACING.md` - Promptfoo Tracing Guide
2. `docs/DEEPEVAL_JAEGER_TRACING.md` - DeepEval Tracing Guide
3. `docs/JAEGER_SERVICE_NAMES.md` - Service Namen Referenz
4. `docs/DEEPEVAL_PERSISTENT_CONTAINER.md` - Persistent Container Guide

## Verwendung

### Promptfoo mit Tracing

```bash
# Red Team Tests
npm run redteam
npm run redteamFull

# Evaluation
npm run eval
```

### DeepEval mit Tracing

```bash
# Container starten (einmalig)
docker compose up -d

# Tests ausführen (beliebig oft)
npm run eval:deepeval
npm run eval:deepeval:generate

# Logs anzeigen
npm run eval:deepeval:logs
```

### Traces in Jaeger anzeigen

1. Öffnen: http://localhost:16686
2. Service auswählen: `promptfoo-service` oder `deepeval-service`
3. "Find Traces" klicken

## Behobene Probleme

1. ✅ Promptfoo sendete keine Traces → YAML `tracing:` Konfiguration hinzugefügt
2. ✅ DeepEval sendete keine Traces → OpenTelemetry SDK integriert
3. ✅ Inkonsistente Service-Namen → Standardisiert mit `-service` Suffix
4. ✅ DeepEval Container wurde jedes Mal neu erstellt → Persistent Container mit `tail -f /dev/null`
5. ✅ `npm run eval:deepeval` funktionierte nicht auf Windows → Quote-Escaping behoben
6. ✅ `PYTHONPATH` Warning → `.env` und Docker Compose aktualisiert

## Nächste Schritte

Mögliche Erweiterungen:
- Langfuse SDK Tracing konfigurieren (`langfuse-service`)
- VEEDS Proofreader API Tracing hinzufügen (`proofreader-service`)
- Presidio Tracing aktivieren (`presidio-service`)
- Grafana Dashboards für Jaeger Traces erstellen
