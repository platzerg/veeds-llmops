# Promptfoo Jaeger Tracing Setup

## Problem
Promptfoo sendet standardmäßig **keine** OpenTelemetry Traces, auch wenn `OTEL_*` Umgebungsvariablen gesetzt sind.

## Lösung
Tracing muss **explizit in der YAML-Konfiguration** aktiviert werden.

## Konfiguration

### redteamconfig.yaml
```yaml
purpose: "..."

# =============================================================================
# TRACING CONFIGURATION (OpenTelemetry → Jaeger)
# =============================================================================
tracing:
  enabled: true
  forward:
    endpoint: http://localhost:4318  # Jaeger OTLP HTTP

targets:
  - id: "file://redteam-provider.ts"
    # ...
```

### Wichtige Parameter
- `tracing.enabled: true` - Aktiviert Tracing
- `tracing.forward.endpoint` - Jaeger OTLP HTTP Endpoint (Port 4318)

## Verwendung

```bash
# Red Team mit Tracing starten
npm run redteam

# Jaeger UI öffnen
start http://localhost:16686

# Service suchen: "promptfoo-redteam" oder "promptfoo"
```

## Verifikation

1. **Jaeger UI öffnen**: http://localhost:16686
2. **Service auswählen**: Dropdown "Service" → `promptfoo` oder `promptfoo-redteam`
3. **Traces anzeigen**: "Find Traces" klicken

## Trace-Informationen

Jeder Trace enthält:
- **Span Name**: Test-Beschreibung
- **Duration**: Ausführungszeit
- **Tags**: Provider, Model, Test-ID
- **Logs**: LLM Request/Response Details

## Troubleshooting

### Keine Services in Jaeger sichtbar
```bash
# 1. Prüfen ob Jaeger läuft
docker ps | grep jaeger

# 2. Prüfen ob Port 4318 erreichbar
curl http://localhost:4318/v1/traces

# 3. YAML-Konfiguration prüfen
cat redteamconfig.yaml | grep -A 3 "tracing:"
```

### Traces werden nicht angezeigt
- **Warten**: Traces können 5-10 Sekunden verzögert erscheinen
- **Zeitbereich**: In Jaeger UI "Last 15 minutes" auswählen
- **Service Name**: Verschiedene Namen probieren (promptfoo, promptfoo-redteam)

## Beispiel-Output

```bash
npm run redteam
# ...
Running scan...
[OtelSdk] OpenTelemetry SDK initialized successfully
# ✅ Traces werden an Jaeger gesendet
```

## Alternative: Tempo

Für Tempo statt Jaeger:
```yaml
tracing:
  enabled: true
  forward:
    endpoint: http://localhost:4320  # Tempo OTLP HTTP
```

Dann Grafana öffnen: http://localhost:8222
