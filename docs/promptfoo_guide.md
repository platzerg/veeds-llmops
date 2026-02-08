# Promptfoo - Komplette Anleitung

**Datum:** 2026-02-08  
**Setup:** Self-Hosted Docker Container + Multi-Provider Support

---

## 📋 Inhaltsverzeichnis

1. [Konfiguration](#konfiguration)
2. [Multi-Provider Setup](#multi-provider-setup)
3. [Workflow](#workflow)
4. [Troubleshooting](#troubleshooting)
5. [npm Scripts](#npm-scripts)

---

## 🔧 Konfiguration

### .env
```bash
# --- LLM API Keys ---
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...  # Von https://console.anthropic.com/

# AWS Bedrock
AWS_PROFILE=man-nasys-dev-Admin
AWS_REGION=eu-central-1

# --- Promptfoo Self-Hosting ---
# Disable automatic sharing (prevents email prompt hang)
PROMPTFOO_DISABLE_SHARING=true

# Self-hosted instance URLs (for manual sharing)
PROMPTFOO_REMOTE_API_BASE_URL=http://localhost:3210
PROMPTFOO_REMOTE_APP_BASE_URL=http://localhost:3210

# Email for sharing (optional)
PROMPTFOO_SHARE_EMAIL=admin@localhost
```

### promptfooconfig.yaml
```yaml
description: "VEEDS Proofreader Evaluation"

# Sharing config for self-hosted container
sharing:
  apiBaseUrl: http://localhost:3210
  appBaseUrl: http://localhost:3210

# Prompts: Local file (Langfuse disabled due to connection issues)
prompts:
  - file://eval/prompt.txt

# Multi-Provider Support
providers:
  # --- OpenAI (ChatGPT) ---
  - id: openai:chat:gpt-4o-mini
    label: "GPT-4o Mini"
    config:
      temperature: 0
      max_tokens: 2048
      apiKey: env:OPENAI_API_KEY

  - id: openai:chat:gpt-4o
    label: "GPT-4o"
    config:
      temperature: 0
      max_tokens: 2048
      apiKey: env:OPENAI_API_KEY

  # --- Anthropic (Direct API) ---
  - id: anthropic:messages:claude-3-5-sonnet-20241022
    label: "Claude 3.5 Sonnet (API)"
    config:
      temperature: 0
      max_tokens: 2048
      apiKey: env:ANTHROPIC_API_KEY

  - id: anthropic:messages:claude-3-5-haiku-20241022
    label: "Claude 3.5 Haiku (API)"
    config:
      temperature: 0
      max_tokens: 2048
      apiKey: env:ANTHROPIC_API_KEY

  # --- AWS Bedrock ---
  - id: bedrock:anthropic.claude-3-5-sonnet-20241022-v2:0
    label: "Claude 3.5 Sonnet (Bedrock)"
    config:
      region: eu-central-1
      max_tokens: 2048
      temperature: 0

  - id: bedrock:anthropic.claude-3-5-haiku-20241022-v1:0
    label: "Claude 3.5 Haiku (Bedrock)"
    config:
      region: eu-central-1
      max_tokens: 2048
      temperature: 0

# Output to shared directory (accessible by Docker container)
outputPath: ./promptfoo_data/output/latest.json

# Evaluation options
evaluateOptions:
  maxConcurrency: 5
  repeat: 1
  showProgressBar: true
```

### docker-compose.yml
```yaml
promptfoo-ui:
  image: ghcr.io/promptfoo/promptfoo:latest
  container_name: promptfoo-ui
  ports:
    - '3210:3000'
  volumes:
    - ./promptfoo_data:/home/promptfoo/.promptfoo
    - ./eval:/app/eval:ro  # Share eval directory
  environment:
    - PROMPTFOO_SHARE_CHUNK_SIZE=10
  networks:
    - aiqa
```

---

## 🎯 Multi-Provider Setup

### Verfügbare Provider

| Provider | Modell | Kosten | Empfehlung |
|----------|--------|--------|------------|
| **GPT-4o Mini** | OpenAI | $0.75/1M | Development |
| **GPT-4o** | OpenAI | $12.50/1M | Production |
| **Claude 3.5 Haiku** | Anthropic/Bedrock | $4.80/1M | Development |
| **Claude 3.5 Sonnet** | Anthropic/Bedrock | $18.00/1M | Production |

### Provider wechseln

**Alle Provider testen (Standard):**
```bash
npm run eval  # Testet alle 6 Provider
```

**Nur bestimmte Provider:**
```yaml
# promptfooconfig.yaml - Kommentiere ungewünschte Provider aus
providers:
  - id: openai:chat:gpt-4o-mini  # Aktiv
  # - id: anthropic:messages:claude-3-5-sonnet-20241022  # Deaktiviert
```

**Per CLI filtern:**
```bash
npx promptfoo eval --filter-providers "GPT-4o"
npx promptfoo eval --filter-providers "Claude.*API"
```

---

## 📊 Workflow

### Standard-Workflow (Empfohlen)

```bash
# 1. Evaluation durchführen (speichert lokal)
npm run eval

# 2. Zu Container uploaden
npm run eval:share

# 3. Im Browser ansehen
npm run eval:view
# → Öffnet http://localhost:3210
```

### Warum dieser Workflow?

**Offizielles Verhalten (aus Dokumentation):**
- `promptfoo eval` speichert Ergebnisse **lokal**
- `promptfoo share` uploaded sie zum **self-hosted Container**
- `PROMPTFOO_DISABLE_SHARING=true` verhindert automatisches Sharing (kein Email-Prompt)

### Alternative: Automatisches Sharing

```bash
# Evaluation + Upload in einem Schritt
npx promptfoo eval -c promptfooconfig.yaml --share
```

---

## 🐛 Troubleshooting

### Problem: Sharing hängt bei "Sharing..."

**Ursache:** Promptfoo fragt nach Email-Adresse

**Lösung:** ✅ `PROMPTFOO_DISABLE_SHARING=true` in `.env`

---

### Problem: Ergebnisse nicht im Container sichtbar

**Ursache:** `promptfoo eval` speichert nur lokal

**Lösung:**
```bash
npm run eval:share  # Manuell zu Container uploaden
```

---

### Problem: Port 3210 bereits belegt

**Ursache:** Promptfoo UI Container läuft bereits

**Lösung:** Nutze `npm run eval:view` statt `npx promptfoo view`
```bash
npm run eval:view  # Öffnet Browser zu Container
```

---

### Problem: "No matching recognizers found" (Presidio)

**Ursache:** Sprachmodelle nicht installiert oder falsche Sprache

**Lösung:**
- Englisch: ✅ Funktioniert (en_core_web_lg installiert)
- Deutsch: ❌ Nutze spaCy direkt (siehe `german_pii_solution.md`)

---

## 📝 npm Scripts

| Command | Aktion | Sharing |
|---------|--------|---------|
| `npm run eval` | Evaluation durchführen | ❌ Lokal |
| `npm run eval:share` | Zu Container uploaden | ✅ Upload |
| `npm run eval:view` | Browser öffnen | - |
| `npm run eval:generate` | Tests generieren | - |

### Script-Details

```json
{
  "eval": "npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml",
  "eval:share": "npx promptfoo share",
  "eval:view": "start http://localhost:3210"
}
```

---

## 🌐 Container-Integration

### Volume Mounts

```yaml
volumes:
  - ./promptfoo_data:/home/promptfoo/.promptfoo  # Persistente Daten
  - ./eval:/app/eval:ro                          # Evaluation-Ergebnisse
```

### Output Path

```yaml
outputPath: ./promptfoo_data/output/latest.json
```

→ Ergebnisse werden direkt in Container-Verzeichnis geschrieben

---

## ✅ Zusammenfassung

**Setup:**
- ✅ 6 Provider konfiguriert (OpenAI x2, Anthropic x2, Bedrock x2)
- ✅ Self-hosted Docker Container auf Port 3210
- ✅ Automatisches Sharing deaktiviert (kein Hang)
- ✅ Manuelles Sharing möglich

**Workflow:**
1. `npm run eval` → Lokal speichern
2. `npm run eval:share` → Zu Container uploaden
3. `npm run eval:view` → Im Browser ansehen

**Container:** http://localhost:3210

---

## 📚 Weitere Dokumentation

- **Multi-Provider:** `docs/multi_provider_guide.md`
- **German PII:** `german_pii_solution.md`
- **Presidio Setup:** `docs/presidio_setup_guide.md`

---

**Erstellt:** 2026-02-08  
**Quellen:**
- https://www.promptfoo.dev/docs/usage/self-hosting/
- https://www.promptfoo.dev/docs/usage/sharing/
