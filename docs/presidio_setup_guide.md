# Presidio Setup & Troubleshooting

**Stand:** 2026-02-08  
**Problem:** Presidio Analyzer gibt 500 Fehler - "No matching recognizers were found"

---

## 🔴 Aktuelles Problem

Das Presidio Demo schlägt fehl mit:
```
❌ Analyzer Error: Request failed with status code 500
Error: No matching recognizers were found to serve the request
```

**Grund:** Presidio benötigt **Sprachmodelle** (spaCy), die im Docker-Image nicht vorinstalliert sind.

---

## 🛠️ Lösung 1: Custom Docker Image mit Sprachmodellen

### Schritt 1: Dockerfile für Presidio Analyzer erstellen

Erstelle `infra/presidio/Dockerfile.analyzer`:

```dockerfile
FROM mcr.microsoft.com/presidio-analyzer:latest

# Install German and English spaCy models
RUN python -m spacy download de_core_news_sm
RUN python -m spacy download en_core_web_lg

# Copy language config
COPY languages-config.yml /app/config/languages-config.yml
```

### Schritt 2: docker-compose.yml anpassen

```yaml
presidio-analyzer:
  build:
    context: ./infra/presidio
    dockerfile: Dockerfile.analyzer
  # image: mcr.microsoft.com/presidio-analyzer:latest  # Auskommentieren
  container_name: presidio-analyzer
  ports:
    - "5001:3000"
  environment:
    - ANALYZER_CONF_FILE=/app/config/languages-config.yml
  networks:
    - aiqa
  restart: unless-stopped
```

### Schritt 3: Image bauen und starten

```bash
# Image bauen
docker compose build presidio-analyzer

# Container neu starten
docker compose up -d presidio-analyzer

# Demo testen
npm run demo:presidio
```

---

## 🛠️ Lösung 2: Pattern-basierte Erkennung (ohne Sprachmodelle)

Presidio kann auch **ohne Sprachmodelle** arbeiten, wenn du nur pattern-basierte Recognizer verwendest.

### Funktioniert OHNE Sprachmodelle:
- ✅ `EMAIL_ADDRESS` - Regex-Pattern
- ✅ `PHONE_NUMBER` - Regex-Pattern  
- ✅ `CREDIT_CARD` - Luhn-Algorithmus
- ✅ `IBAN_CODE` - Regex-Pattern
- ✅ `IP_ADDRESS` - Regex-Pattern
- ✅ `URL` - Regex-Pattern

### Benötigt Sprachmodelle:
- ❌ `PERSON` - NER (Named Entity Recognition)
- ❌ `LOCATION` - NER
- ❌ `ORGANIZATION` - NER

### Beispiel: Pattern-only Demo

```typescript
// Nur pattern-basierte Entities verwenden
const response = await axios.post('http://localhost:5001/analyze', {
  text: 'Contact: john@example.com, Phone: +1-555-1234, Card: 4532-1234-5678-9010',
  language: 'en',
  entities: [
    'EMAIL_ADDRESS',
    'PHONE_NUMBER',
    'CREDIT_CARD'
    // NICHT: 'PERSON', 'LOCATION' (benötigen Sprachmodelle)
  ]
});
```

---

## 🛠️ Lösung 3: Presidio deaktivieren (temporär)

Wenn du Presidio aktuell nicht benötigst:

```bash
# Container stoppen
docker compose stop presidio-analyzer presidio-anonymizer

# Oder aus docker-compose.yml entfernen
```

---

## ✅ Empfohlene Lösung

**Für Production:** Lösung 1 (Custom Docker Image)  
**Für Quick Testing:** Lösung 2 (Pattern-only)  
**Wenn nicht benötigt:** Lösung 3 (Deaktivieren)

---

## 📝 Aktualisierte languages-config.yml

Die Datei wurde bereits aktualisiert mit:

```yaml
nlp_engine_name: spacy
models:
  - lang_code: de
    model_name: de_core_news_sm
  - lang_code: en
    model_name: en_core_web_lg
```

**Aber:** Die Modelle müssen noch installiert werden (siehe Lösung 1).

---

## 🧪 Test nach Fix

Nach der Implementierung von Lösung 1:

```bash
# Demo ausführen
npm run demo:presidio
```

**Erwartete Ausgabe:**
```
🔍 Presidio PII Detection & Anonymization Demo
================================================================================

🏥 Checking Presidio Services Health...

✅ Presidio Analyzer: Healthy
✅ Presidio Anonymizer: Healthy

📝 Test: Email and Phone Numbers
────────────────────────────────────────────────────────────────────────────────
Original Text:
Please contact me at john.doe@example.com or call +1-555-123-4567.

🔍 Analyzing for PII...
   ✅ Found 2 PII entities:
   1. EMAIL_ADDRESS (confidence: 100.0%)
      Text: "john.doe@example.com"
   2. PHONE_NUMBER (confidence: 100.0%)
      Text: "+1-555-123-4567"

🔒 Anonymizing PII...
   ✅ Anonymized Text:
   Please contact me at <EMAIL> or call <PHONE>.
```

---

## 🔍 Debugging

### Container Logs prüfen
```bash
docker compose logs presidio-analyzer --tail 50
```

### Health Check
```bash
curl http://localhost:5001/health
# Sollte: 200 OK zurückgeben
```

### Manuelle API-Tests
```bash
# Test mit pattern-basierter Entity
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Email: test@example.com",
    "language": "en",
    "entities": ["EMAIL_ADDRESS"]
  }'
```

---

## 📚 Weitere Informationen

- **Presidio Docs:** https://microsoft.github.io/presidio/
- **spaCy Models:** https://spacy.io/models
- **Supported Recognizers:** https://microsoft.github.io/presidio/supported_entities/

---

**Status:** ⚠️ Presidio benötigt Custom Docker Image für vollständige Funktionalität  
**Nächste Schritte:** Implementiere Lösung 1 für Production-ready Setup
