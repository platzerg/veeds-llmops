# DeepEval Persistent Container Guide

## Übersicht

Der DeepEval Container läuft jetzt **dauerhaft** im Hintergrund, anstatt bei jedem Test neu erstellt zu werden.

## Vorteile

✅ **Schnellere Tests**: Keine Neuinstallation der Dependencies bei jedem Lauf  
✅ **Persistenz**: Container bleibt aktiv und kann mehrfach verwendet werden  
✅ **Einfachere Logs**: `docker logs -f deepeval-runner` zeigt alle Test-Läufe  

## Verwendung

### Container starten

```bash
# Einmalig: Container starten
npm run eval:deepeval:start

# Oder direkt mit Docker Compose
docker compose --profile deepeval up -d deepeval
```

### Tests ausführen

```bash
# DeepEval Tests ausführen (nutzt laufenden Container)
npm run eval:deepeval

# Synthetic Data generieren
npm run eval:deepeval:generate

# Logs anzeigen
npm run eval:deepeval:logs
```

### Container stoppen

```bash
# Container stoppen (bleibt erhalten)
npm run eval:deepeval:stop

# Container komplett entfernen
docker compose --profile deepeval down
```

## NPM Scripts

| Script | Befehl | Beschreibung |
|--------|--------|--------------|
| `eval:deepeval:start` | `docker compose --profile deepeval up -d` | Container starten |
| `eval:deepeval:stop` | `docker compose --profile deepeval stop` | Container stoppen |
| `eval:deepeval` | `docker exec deepeval-runner sh -c '...'` | Tests ausführen |
| `eval:deepeval:generate` | `docker exec deepeval-runner python ...` | Synthetic Data |
| `eval:deepeval:logs` | `docker logs -f deepeval-runner` | Logs anzeigen |

## Docker Compose Konfiguration

```yaml
deepeval:
  image: python:3.10-slim
  container_name: deepeval-runner
  restart: unless-stopped  # ✅ Automatischer Neustart
  working_dir: /app
  volumes:
    - .:/app
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
    - OTEL_SERVICE_NAME=deepeval-service
    - PYTHONPATH=/app
  command: >
    sh -c "pip install -r eval/deepeval/requirements.txt && tail -f /dev/null"
  networks:
    - aiqa
  profiles:
    - deepeval
```

**Wichtig:** `tail -f /dev/null` hält den Container am Laufen, ohne CPU zu verbrauchen.

## Workflow

### Erstmaliger Start

```bash
# 1. Container starten (installiert Dependencies)
npm run eval:deepeval:start

# 2. Warten bis Dependencies installiert sind (ca. 30 Sekunden)
npm run eval:deepeval:logs

# 3. Tests ausführen
npm run eval:deepeval
```

### Wiederholte Tests

```bash
# Container läuft bereits - direkt Tests ausführen
npm run eval:deepeval

# Oder mehrere Tests hintereinander
npm run eval:deepeval
npm run eval:deepeval:generate
npm run eval:deepeval
```

## Troubleshooting

### Container läuft nicht

```bash
# Status prüfen
docker ps --filter "name=deepeval-runner"

# Container neu starten
npm run eval:deepeval:start
```

### Dependencies fehlen

```bash
# In den Container einsteigen
docker exec -it deepeval-runner bash

# Dependencies manuell installieren
pip install -r eval/deepeval/requirements.txt
```

### Tests schlagen fehl

```bash
# Logs prüfen
npm run eval:deepeval:logs

# Container neu starten
npm run eval:deepeval:stop
npm run eval:deepeval:start
```

### Code-Änderungen werden nicht erkannt

Der Container mountet `.:/app`, daher werden Änderungen **sofort** sichtbar. Kein Neustart nötig!

## Vergleich: Vorher vs. Nachher

### Vorher (One-Shot)
```bash
# Jedes Mal: Container erstellen, Dependencies installieren, Test, Container löschen
npm run eval:deepeval  # ~60 Sekunden
npm run eval:deepeval  # ~60 Sekunden (wieder von vorne!)
```

### Nachher (Persistent)
```bash
# Einmalig: Container starten
npm run eval:deepeval:start  # ~30 Sekunden

# Danach: Nur Tests ausführen
npm run eval:deepeval  # ~5 Sekunden ✅
npm run eval:deepeval  # ~5 Sekunden ✅
npm run eval:deepeval  # ~5 Sekunden ✅
```

## Jaeger Tracing

Der Container sendet weiterhin Traces an Jaeger:
- **Service Name**: `deepeval-service`
- **Endpoint**: `http://jaeger:4318/v1/traces`
- **Jaeger UI**: http://localhost:16686
