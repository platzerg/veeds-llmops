# Multi-Provider Configuration Guide

**Datum:** 2026-02-08  
**Providers:** OpenAI (ChatGPT), Anthropic (Direct API), AWS Bedrock

---

## 🎯 Verfügbare Provider

### OpenAI (ChatGPT)
- ✅ `gpt-4o-mini` - Schnell & günstig
- ✅ `gpt-4o` - Beste Qualität

### Anthropic (Direct API)
- ✅ `claude-3-5-sonnet-20241022` - Beste Qualität
- ✅ `claude-3-5-haiku-20241022` - Schnell & günstig

### AWS Bedrock
- ✅ `claude-3-5-sonnet-20241022-v2:0` - Via Bedrock
- ✅ `claude-3-5-haiku-20241022-v1:0` - Via Bedrock

---

## 🔧 Setup

### 1. API Keys konfigurieren

Bearbeite `.env`:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Anthropic (Direct API)
ANTHROPIC_API_KEY=sk-ant-...  # Von https://console.anthropic.com/

# AWS Bedrock
AWS_PROFILE=man-nasys-dev-Admin
# Oder:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
```

---

## 🚀 Verwendung

### Option 1: Alle Provider testen (Standard)

Standardmäßig testet Promptfoo **alle 6 Provider gleichzeitig**:

```bash
npm run eval
```

**Ergebnis:** Vergleich aller Modelle in einer Tabelle

---

### Option 2: Nur bestimmte Provider

Bearbeite `promptfooconfig.yaml` und kommentiere ungewünschte Provider aus:

```yaml
providers:
  # Nur OpenAI
  - id: openai:chat:gpt-4o-mini
    label: "GPT-4o Mini"
    config:
      temperature: 0
      max_tokens: 2048
      apiKey: env:OPENAI_API_KEY

  # Anthropic auskommentiert
  # - id: anthropic:messages:claude-3-5-sonnet-20241022
  #   label: "Claude 3.5 Sonnet (API)"
  #   config:
  #     temperature: 0
  #     max_tokens: 2048
  #     apiKey: env:ANTHROPIC_API_KEY

  # Bedrock auskommentiert
  # - id: bedrock:anthropic.claude-3-5-sonnet-20241022-v2:0
  #   label: "Claude 3.5 Sonnet (Bedrock)"
  #   config:
  #     region: eu-central-1
  #     max_tokens: 2048
  #     temperature: 0
```

---

### Option 3: Provider per CLI wählen

```bash
# Nur GPT-4o Mini
npx promptfoo eval -c promptfooconfig.yaml --filter-providers "GPT-4o Mini"

# Nur Claude (Bedrock)
npx promptfoo eval -c promptfooconfig.yaml --filter-providers "Bedrock"

# Mehrere Provider
npx promptfoo eval -c promptfooconfig.yaml --filter-providers "GPT-4o,Claude"
```

---

## 📊 Provider-Vergleich

### Kosten (pro 1M Tokens)

| Provider | Input | Output | Gesamt |
|----------|-------|--------|--------|
| **GPT-4o Mini** | $0.15 | $0.60 | $0.75 |
| **GPT-4o** | $2.50 | $10.00 | $12.50 |
| **Claude 3.5 Haiku (API)** | $0.80 | $4.00 | $4.80 |
| **Claude 3.5 Sonnet (API)** | $3.00 | $15.00 | $18.00 |
| **Claude 3.5 Haiku (Bedrock)** | $0.80 | $4.00 | $4.80 |
| **Claude 3.5 Sonnet (Bedrock)** | $3.00 | $15.00 | $18.00 |

### Performance

| Provider | Geschwindigkeit | Qualität | Empfehlung |
|----------|----------------|----------|------------|
| **GPT-4o Mini** | ⚡⚡⚡ | ⭐⭐⭐ | Development |
| **GPT-4o** | ⚡⚡ | ⭐⭐⭐⭐⭐ | Production |
| **Claude 3.5 Haiku** | ⚡⚡⚡ | ⭐⭐⭐⭐ | Development |
| **Claude 3.5 Sonnet** | ⚡⚡ | ⭐⭐⭐⭐⭐ | Production |

---

## 🔀 Wechseln zwischen Providern

### Schneller Wechsel (ohne Config-Änderung)

Erstelle npm-Scripts für jeden Provider:

```json
// package.json
{
  "scripts": {
    "eval:openai": "npx promptfoo eval --filter-providers 'GPT-4o'",
    "eval:anthropic": "npx promptfoo eval --filter-providers 'Claude.*API'",
    "eval:bedrock": "npx promptfoo eval --filter-providers 'Bedrock'",
    "eval:all": "npm run eval"
  }
}
```

**Verwendung:**
```bash
npm run eval:openai      # Nur OpenAI
npm run eval:anthropic   # Nur Anthropic Direct API
npm run eval:bedrock     # Nur Bedrock
npm run eval:all         # Alle Provider
```

---

## 🐛 Troubleshooting

### "API key not found"

**Problem:** `ANTHROPIC_API_KEY` nicht gesetzt

**Lösung:**
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### "AWS credentials not found"

**Problem:** AWS-Credentials fehlen

**Lösung:**
```bash
# Option 1: AWS Profile
AWS_PROFILE=your-profile-name

# Option 2: Direct credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### "Rate limit exceeded"

**Problem:** Zu viele Requests

**Lösung:**
```yaml
# promptfooconfig.yaml
evaluateOptions:
  maxConcurrency: 1  # Reduziere von 5 auf 1
  delay: 1000        # 1 Sekunde Pause zwischen Requests
```

---

## 💡 Best Practices

### Development
- Nutze **GPT-4o Mini** oder **Claude 3.5 Haiku**
- Schnell und günstig für Tests

### Production
- Nutze **GPT-4o** oder **Claude 3.5 Sonnet**
- Beste Qualität für echte Evaluationen

### A/B Testing
- Aktiviere **alle Provider**
- Vergleiche Ergebnisse direkt

### Cost Optimization
- Nutze **Bedrock** statt Direct API (gleiche Kosten, aber bessere Limits)
- Setze `maxConcurrency` niedrig

---

## 📝 Beispiel: Provider wechseln

### Schritt 1: Aktuell nur OpenAI

```yaml
providers:
  - id: openai:chat:gpt-4o-mini
    label: "GPT-4o Mini"
    # ...
```

```bash
npm run eval
# → Nutzt nur GPT-4o Mini
```

### Schritt 2: Zu Anthropic wechseln

```yaml
providers:
  # - id: openai:chat:gpt-4o-mini  # Auskommentiert
  #   label: "GPT-4o Mini"
  
  - id: anthropic:messages:claude-3-5-sonnet-20241022
    label: "Claude 3.5 Sonnet (API)"
    # ...
```

```bash
npm run eval
# → Nutzt nur Claude 3.5 Sonnet
```

### Schritt 3: Beide vergleichen

```yaml
providers:
  - id: openai:chat:gpt-4o-mini
    label: "GPT-4o Mini"
    # ...
  
  - id: anthropic:messages:claude-3-5-sonnet-20241022
    label: "Claude 3.5 Sonnet (API)"
    # ...
```

```bash
npm run eval
# → Vergleicht beide Modelle
```

---

## ✅ Zusammenfassung

**Jetzt hast du:**
- ✅ 6 verschiedene Provider konfiguriert
- ✅ Flexibles Wechseln zwischen Providern
- ✅ Alle API Keys in `.env`
- ✅ Vergleich mehrerer Modelle möglich

**Nächste Schritte:**
1. Setze `ANTHROPIC_API_KEY` in `.env` (falls du Anthropic nutzen willst)
2. Teste mit `npm run eval`
3. Vergleiche Ergebnisse in Promptfoo UI: `npm run eval:view`

---

**Erstellt:** 2026-02-08  
**Provider:** 6 (OpenAI x2, Anthropic x2, Bedrock x2)
