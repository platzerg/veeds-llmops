# VEEDS Proofreader — LLMOps Stack

Komplettes Setup für LLM-basiertes Proofreading von YAML-Fahrzeugdaten mit Observability, Evaluation und Load Testing.

## 🚀 Komplette Step-by-Step Anleitung

### **📋 Voraussetzungen prüfen**

```bash
# Node.js Version prüfen (benötigt: 18+)
node --version

# Docker Status prüfen
docker --version
docker compose ps

# Git Status prüfen
git status
```

docker-compose --profile llm-eval-observability-toolkit up promptfoo-ui

### **🔧 Schritt 1: Setup und Dependencies**

#### **1.1 Dependencies installieren**
```bash
npm install
```

#### **1.2 AWS Credentials konfigurieren**
Bearbeiten Sie die `.env`-Datei und fügen Sie Ihre AWS-Zugangsdaten hinzu:

```env
# --- AWS Bedrock ---
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=IHRE_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=IHR_AWS_SECRET_ACCESS_KEY
```

#### **1.3 AWS Berechtigung testen**
```bash
# AWS CLI testen (falls installiert)
aws sts get-caller-identity

# Bedrock Zugriff prüfen
aws bedrock list-foundation-models --region eu-central-1
```

#### **1.4 Prompts automatisch in Langfuse erstellen**
```bash
# Prompts automatisch erstellen (empfohlen)
npm run setup:prompts

# Verifikation der erstellten Prompts
npm run setup:prompts:verify

# Setup + Verifikation in einem Schritt
npm run setup:prompts:all
```

**Was passiert:**
- Erstellt `veeds-proofreader` Prompt mit Label `production`
- Erstellt `veeds-proofreader-dev` Prompt mit Label `development`
- Lädt Prompt-Inhalt aus `eval/prompt.txt`
- Konfiguriert Model-Parameter und Tags automatisch

### **🎯 Schritt 2: Basis-Demo ausführen**

```bash
npx tsx src/index.ts
```

**Erwartete Ausgabe:**
```
🔍 VEEDS Proofreader Demo

--- Test 1: Valid Entry ---
Valid: true
Errors: 0
Time: 1234ms

--- Test 2: Invalid Entry ---
Valid: false
Errors: 3
Time: 1567ms

✅ Done! Check traces at http://localhost:9222
```

**Traces prüfen:** http://localhost:9222 → Tracing → Traces

### **🤖 Schritt 3: Automatische Test-Generierung**

```bash
# Test-Cases generieren (100+ automatische Tests)
npm run generate

# Test-Cases validieren
npx tsx scripts/validate-test-data.ts

# Generierte Tests anzeigen
cat eval/golden_dataset.json | jq '.testCases | length'
```

### **🧪 Schritt 4: Evaluation ausführen**

```bash
# Basis-Evaluation (alle generierten Tests)
npm run eval

# CI-Mode mit Assertions
npm run eval:assert

# Ergebnisse im Browser anzeigen
npm run eval:view
```

### **⚡ Schritt 5: Load Testing**

```bash
# Smoke Test (schnell)
npm run test:load:smoke

# Standard Load Test
npm run test:load

# Stress Test (intensiv)
npm run test:load:stress
```

### **🔄 Schritt 6: Vollständige CI Pipeline**

```bash
# Komplette Pipeline (Generation + Validation + Evaluation)
npx tsx scripts/ci-test-pipeline.ts

# Pipeline mit Load Tests
npx tsx scripts/ci-test-pipeline.ts --load-tests
```

## 🎯 Was Sie alles testen können

### **1. 🧠 LLM-Qualität testen**

#### **Correctness Testing**
- ✅ Erkennt ungültige materialNumber Formate
- ✅ Erkennt ungültige SI-Einheiten  
- ✅ Erkennt leere Beschreibungen
- ✅ Erkennt min > max Probleme
- ✅ Lässt gültige Eingaben durch

#### **Edge Case Testing**
- ⚠️ Beschreibung mit exakt 200 Zeichen
- ⚠️ ValueRange mit min = max
- ⚠️ Kleinbuchstaben in materialNumber
- ⚠️ Unicode-Zeichen

#### **Security Testing**
- 🛡️ Prompt Injection Resistenz
- 🛡️ YAML Injection Schutz
- 🛡️ XSS Attempt Handling
- 🛡️ JSON Injection Schutz

### **2. 📊 Performance testen**

#### **Response Time Testing**
```bash
# Einzelner Test
npx tsx -e "
import { proofreadEntry } from './src/proofreader.js';
const start = Date.now();
const result = await proofreadEntry('materialNumber: ABC-12345\ndescription: Test\nunit: mm');
console.log('Time:', Date.now() - start, 'ms');
"
```

#### **Load Testing Szenarien**
- 📈 Smoke Test: 1 User, 10s
- 📈 Standard: 20 Users, 2min  
- 📈 Stress: 200 Users, 6min

#### **Cost Testing**
```bash
# Cost-Analyse in Promptfoo
npm run eval | grep -i cost
```

### **3. 🔄 Regression Testing**

#### **Prompt-Änderungen testen**
```bash
# 1. Prompt in Langfuse ändern
# 2. Tests ausführen
npm run generate:validate

# 3. Vergleiche Ergebnisse
diff eval/validation-report-old.json eval/validation-report.json
```

#### **Model-Vergleich**
```bash
# Verschiedene Claude-Versionen testen
npm run eval:compare
```

### **4. 🎛️ A/B Testing**

#### **Prompt-Versionen vergleichen**
```bash
# 1. Erstelle Prompt v2 in Langfuse
# 2. Ändere promptfooconfig.yaml
# 3. Vergleiche
npm run eval:compare
```

### **5. 📈 Monitoring & Observability**

#### **Langfuse Dashboard**
- **URL**: http://localhost:9222
- **Metriken**: Cost, Latency, Volume, Quality
- **Traces**: Detaillierte Request-Analyse
- **Scores**: Custom Metrics tracking

### **6. 🔧 Development Testing**

#### **Einzelne Test-Cases debuggen**
```bash
npx tsx -e "
import { proofreadEntry } from './src/proofreader.js';
const result = await proofreadEntry('materialNumber: INVALID\ndescription: Test\nunit: bananas');
console.log(JSON.stringify(result, null, 2));
"
```

#### **Neue Test-Cases hinzufügen**
```bash
# 1. Bearbeite scripts/generate-test-data.ts
# 2. Regeneriere Tests
npm run generate
```

## 📊 Generierte Reports

- `eval/golden_dataset.json` - Master Test Dataset (100+ Cases)
- `eval/validation-report.json` - Validierungs-Ergebnisse  
- `eval/ci-pipeline-report.json` - CI Pipeline Status
- `promptfoo-output.html` - Evaluation Dashboard

## 🚨 Troubleshooting

### **AWS Bedrock Fehler**
```bash
# Prüfe Credentials
aws sts get-caller-identity

# Prüfe Bedrock-Zugriff
aws bedrock list-foundation-models --region eu-central-1
```

### **Langfuse Connection Error**
```bash
# Prüfe Docker-Status
docker compose ps

# Prüfe Logs
docker compose logs langfuse-web
```

### **Test-Generierung Fehler**
```bash
# Debug-Modus
DEBUG=1 npm run generate

# Validierungs-Report prüfen
cat eval/validation-report.json | jq '.results[] | select(.passed == false)'
```

### **Automatische Prompt-Erstellung Fehler**
```bash
# Prüfe Langfuse Verbindung
curl http://localhost:9222/api/public/health

# Prüfe API Keys in .env
echo $LANGFUSE_PUBLIC_KEY
echo $LANGFUSE_SECRET_KEY

# Manueller Fallback über UI
# Browser → http://localhost:9222 → Prompts → New Prompt
```
```bash
# Debug-Modus
DEBUG=1 npm run generate

# Validierungs-Report prüfen
cat eval/validation-report.json | jq '.results[] | select(.passed == false)'
```

## 🤖 Automatische Prompt-Verwaltung

### **Warum automatische Prompt-Erstellung?**
- ✅ **Versionskontrolle**: Prompts sind im Git Repository
- ✅ **Reproduzierbarkeit**: Identische Setups in allen Umgebungen
- ✅ **CI/CD Integration**: Automatisches Deployment von Prompt-Änderungen
- ✅ **Team-Kollaboration**: Prompt-Änderungen über Pull Requests
- ✅ **Backup**: Prompts sind als Dateien gesichert

### **Verfügbare Befehle**
```bash
# Prompts automatisch erstellen/aktualisieren
npm run setup:prompts

# Verifikation der erstellten Prompts
npm run setup:prompts:verify

# Setup + Verifikation in einem Schritt
npm run setup:prompts:all

# Manuell mit erweiterten Optionen
npx tsx scripts/setup-langfuse-http.ts setup
npx tsx scripts/setup-langfuse-http.ts verify
```

### **Was wird erstellt**
- **`veeds-proofreader`** mit Label `production`
- **`veeds-proofreader-dev`** mit Label `development`
- Automatische Model-Konfiguration (Claude 3.5 Sonnet)
- Tags für bessere Organisation
- Versionierung und Rollback-Fähigkeit

### **Prompt-Anpassung**
Bearbeiten Sie `eval/prompt.txt` und führen Sie dann aus:
```bash
npm run setup:prompts
```
Die Änderungen werden automatisch als neue Version in Langfuse erstellt.

### **Multi-Environment Support**
```bash
# Verschiedene Umgebungen
LANGFUSE_HOST=http://staging.langfuse.com npm run setup:prompts
LANGFUSE_HOST=http://prod.langfuse.com npm run setup:prompts
```

## 📚 Weitere Dokumentation

- **[Test Data Generation Guide](docs/TEST-DATA-GENERATION.md)** - Detaillierte Anleitung zur automatischen Test-Generierung
- **[Langfuse Documentation](https://langfuse.com/docs)** - Offizielle Langfuse Dokumentation
- **[Promptfoo Documentation](https://promptfoo.dev/docs)** - Promptfoo Evaluation Framework
- **[k6 Documentation](https://k6.io/docs)** - Load Testing mit k6

## Stack

| Tool | Zweck | Port |
|------|-------|------|
| **Langfuse v3** | Tracing, Metrics, Prompt Management, LLM-as-Judge, Playground | `:3000` |
| **Promptfoo** | CI/CD Evaluation (YAML-deklarativ, g-eval, llm-rubric) | CLI |
| **k6** | Load & Performance Testing (GraphQL API) | CLI |
| **AWS Bedrock** | LLM Provider (Claude 3.5 Sonnet) | — |

## Architektur

```
┌──────────────────────────────────────────────────────────────┐
│                     Langfuse v3 (Docker)                     │
│                                                              │
│  langfuse-web ──── langfuse-worker                           │
│       │                  │                                   │
│  ┌────┴────┐    ┌───────┴────────┐                          │
│  │Postgres │    │  ClickHouse    │   Redis    MinIO (S3)     │
│  │(Users,  │    │(Traces, Scores,│  (Queue)   (Blob Store)  │
│  │ Prompts)│    │ Observations)  │                           │
│  └─────────┘    └────────────────┘                           │
└──────────────────────────────────────────────────────────────┘
         │                    ▲                    ▲
         │                    │                    │
    Load Prompt          Push Traces          Push Scores
         │                    │                    │
         ▼                    │                    │
┌─────────────────┐  ┌───────┴───────┐  ┌────────┴────────┐
│  VEEDS App      │  │  Promptfoo    │  │    k6           │
│  (TypeScript)   │  │  (CI/CD Eval) │  │  (Load Test)    │
│                 │  │               │  │                 │
│  proofreadEntry │  │  g-eval       │  │  Smoke / Stress │
│  → Bedrock      │  │  llm-rubric   │  │  p95/p99        │
│  → Langfuse     │  │  javascript   │  │  Error Rate     │
└─────────────────┘  └───────────────┘  └─────────────────┘
```

## Quick Start

### 1. Setup

```bash
# Secrets generieren und .env erstellen
chmod +x setup.sh
./setup.sh

# Oder manuell
cp .env.example .env
# → Secrets in .env anpassen (openssl rand -hex 32)
```

### 2. Langfuse starten

```bash
docker compose up -d

# Warten bis Ready (~2-3 Min)
docker compose logs -f langfuse-web
# → "Ready" abwarten

# Status prüfen
docker compose ps
```

### 3. Langfuse konfigurieren

1. Browser → **http://localhost:3000**
2. Account erstellen (erster User = Admin)
3. Organisation anlegen (z.B. "VEEDS CORP")
4. Projekt anlegen (z.B. "VEEDS Proofreader")
5. **Settings → API Keys** → Keys kopieren
6. Keys in `.env` eintragen:
   ```
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   ```

### 4. Prompts in Langfuse anlegen

#### **Option A: Automatisch per Code (Empfohlen)**
```bash
# Prompts automatisch erstellen/aktualisieren
npm run setup:prompts

# Verifikation der erstellten Prompts
npm run setup:prompts:verify

# Setup + Verifikation in einem Schritt
npm run setup:prompts:all
```

#### **Option B: Manuell über UI**
1. **Prompts → New Prompt**
2. Name: `veeds-proofreader`
3. Inhalt aus `eval/prompt.txt` kopieren
4. Label: `production` setzen

### 5. Dependencies installieren

```bash
npm install
```

### 6. Demo ausführen

```bash
# AWS Credentials müssen gesetzt sein
npx tsx src/index.ts

# → Check Traces in http://localhost:3000
```

## Evaluation

### Automatic Test Data Generation

```bash
# Generate comprehensive test cases automatically
npm run generate

# Generate and validate test cases
npm run generate:validate

# Run full CI pipeline with generation
npx tsx scripts/ci-test-pipeline.ts
```

### Promptfoo

```bash
# Alle Tests ausführen
npm run eval

# Mit Assertion-Check (für CI/CD, exit code 1 bei Fehler)
npm run eval:assert

# Ergebnisse im Browser anzeigen
npm run eval:view

# HTML-Report erstellen
npm run eval:compare
```

### k6 Load Test

```bash
# k6 installieren: https://k6.io/docs/get-started/installation/

# Smoke Test (1 VU, 10s)
npm run test:load:smoke

# Default (Ramp to 20 VUs, 2 min)
npm run test:load

# Stress Test (Ramp to 200 VUs)
npm run test:load:stress
```

## Projektstruktur

```
veeds-llmops/
├── docker-compose.yml          # Langfuse v3 Full Stack
├── .env.example                # Environment Variables Template
├── .env                        # Secrets (nicht in Git!)
├── setup.sh                    # Secret Generator
├── package.json                # Dependencies + Scripts
├── tsconfig.json               # TypeScript Config
├── promptfooconfig.yaml        # Promptfoo Eval Config
├── .gitlab-ci.yml              # CI/CD Pipeline
├── .gitignore
│
├── src/                        # Application Code
│   ├── index.ts                # Demo / Entry Point
│   ├── langfuse-client.ts      # Langfuse Singleton
│   └── proofreader.ts          # Proofreader mit Tracing
│
├── scripts/                    # Automation Scripts
│   ├── generate-test-data.ts   # Automatische Test-Generierung
│   ├── validate-test-data.ts   # Test-Validierung
│   ├── ci-test-pipeline.ts     # CI/CD Pipeline
│   ├── setup-langfuse-http.ts  # Automatisches Prompt-Setup
│   └── setup-langfuse-prompts.ts # Alternative Prompt-Setup
│
├── eval/                       # Evaluation
│   ├── prompt.txt              # Prompt Template (lokal)
│   ├── golden_dataset.json     # Golden Dataset (100+ Cases)
│   └── results/                # Eval-Ergebnisse
│
└── tests/
    └── load/
        └── graphql-test.js     # k6 Load Test
```

## Nützliche Befehle

```bash
# --- Setup ---
npm install                     # Dependencies installieren
npm run setup:prompts           # Prompts automatisch in Langfuse erstellen
npm run setup:prompts:verify    # Prompts in Langfuse überprüfen
npm run generate                # Test-Cases generieren
npm run generate:validate       # Generieren + Validieren

# --- Testing ---
npx tsx src/index.ts            # Demo ausführen
npm run eval                    # Promptfoo Evaluation
npm run eval:assert             # CI-Mode (fail on threshold)
npm run eval:view               # Browser UI
npm run test:load:smoke         # Smoke Test
npm run test:load               # Standard Load Test
npm run test:load:stress        # Stress Test

# --- CI/CD ---
npx tsx scripts/ci-test-pipeline.ts  # Vollständige Pipeline
npx tsx scripts/validate-test-data.ts # Test-Validierung

# --- Docker ---
docker compose up -d            # Starten
docker compose down             # Stoppen
docker compose logs -f          # Alle Logs
docker compose ps               # Status

# --- Development ---
npm run dev                     # Watch mode
npm run build                   # TypeScript kompilieren
```

## CI/CD Pipeline

| Stage | Job | Trigger | Gate |
|-------|-----|---------|------|
| Generate | `generate-test-data` | Jede MR + Main | ❌ Fail = Pipeline blocked |
| Quality | `promptfoo-eval` | Nach Generation | ❌ Fail = MR blocked |
| Quality | `promptfoo-compare` | Nightly | ⚠️ Allow failure |
| Performance | `k6-load-test` | Main | ❌ Fail = p95 > 3s |
| Performance | `k6-stress-test` | Nightly | ⚠️ Allow failure |

### **Automatische Test-Generierung in CI**
- 🤖 **100+ Test-Cases** werden automatisch generiert
- 🔍 **Validierung** gegen echten Proofreader
- 📊 **Quality Gates** basierend auf Validierungs-Ergebnissen
- 🚀 **Zero-Maintenance** Testing Pipeline

## Langfuse Features (Self-Hosted)

Alle Features sind seit Juni 2025 unter MIT-Lizenz frei verfügbar:

- ✅ Tracing (End-to-End, Sessions, User Tracking)
- ✅ Metrics Dashboard (Quality, Cost, Latency, Volume)
- ✅ Prompt Management (Versioning, Labels, Rollback)
- ✅ LLM-as-a-Judge (managed Evaluations)
- ✅ Playground (Prompt testen, Model vergleichen)
- ✅ Datasets & Experiments
- ✅ Annotation Queues (Human-in-the-Loop)
- ✅ Cost & Token Tracking
- ✅ OpenTelemetry Integration
- ✅ API (REST + Daily Metrics)

## LLM-as-Judge in Langfuse einrichten

1. **Settings → LLM API Keys**
2. Provider hinzufügen (z.B. AWS Bedrock oder OpenAI)
3. **Evaluations → New Evaluator**
4. Template erstellen für Correctness, Completeness etc.
5. Auf Production-Traces oder Datasets anwenden

---

## 📁 Detaillierte Projektstruktur

Hier ist eine tiefergehende Aufschlüsselung der Verzeichnisse und ihrer Untermodule:

### **1. `src/` (Anwendungslogik)**
*   **`privacy/`**: Beinhaltet den `pii-filter.ts`, der die Schnittstelle zu Microsoft Presidio bildet.
*   **`monitoring/`**: Beinhaltet den `cost-calculator.ts` zur Berechnung der Bedrock-Kosten.
*   **`logging/`**: Konfiguration für das strukturierte Pino-Logging und Formatierer.
*   **`context-manager.ts`**: Verwalte den asynchronen Speicher (AsyncLocalStorage) für Trace-IDs.
*   **`proofreader.ts`**: Die Haupt-Pipeline, die alle Module (PII, Bedrock, Cost, Logging) zusammenführt.

### **2. `eval/` (Qualität & Daten)**
*   **`results/`**: Hier speichert Promptfoo die HTML/JSON Berichte deiner Tests.
*   **`golden_dataset.json`**: Deine kuratierte Liste an Referenz-Testfällen (Ground Truth).
*   **`prompt.txt`**: Das System-Prompt-Template, das als Single-Source-of-Truth dient.

### **3. `scripts/` (Automatisierung & Tools)**
*   **`demo-proofreader.ts`**: Ein schlüsselfertiges Skript, um den gesamten Flow live zu zeigen.
*   **`verify-security.ts`**: Deine automatisierte "Defense-Prüfung" gegen Angriffe.
*   **`export-production-traces.ts`**: Das Werkzeug für den Feedback-Loop (Produktion -> Testdaten).
*   **`setup-langfuse-*.ts`**: Helfer, um Prompts und Konfigurationen in Langfuse einzuspielen.

### **4. `docs/` (Wissensbasis)**
*   **`complete-workflow.md`**: Die "Bibel" für den gesamten LLMOps-Prozess.
*   **`walkthrough.md`**: Dokumentation der Meilensteine und Verifikations-Ergebnisse.
*   **`architecture/`**: (Optional) Platz für Deep-Dive Diagramme und Spezifikationen.

### **5. `tests/` & `assertions/`**
*   **`tests/load/`**: k6 Skripte für Last- und Performance-Tests.
*   **`tests/property-tests/`**: Mathematische Tests für Randfall-Stabilität.
*   **`assertions/`**: Eigene Prüflogik (JS/Python), um LLM-Antworten fachlich zu validieren.

### **6. `infra/`, `observability/` & `schemas/`**
*   **`infra/presidio/`**: Docker-Konfigurationen und YAML-Settings für die Anonymisierungs-Engine.
*   **`observability/`**: Setups für den OpenTelemetry Collector, Grafana Tempo und Dashboards.
*   **`schemas/`**: JSON- und JS-Schemas zur formalen Validierung von Fahrzeugdaten und LLM-Outputs.
*   **`datasets/`**: Verschiedene YAML- und CSV-Testdatenquellen für großflächige Evaluationen.

### **7. `eval/deepeval/` (Tier 2 Scientific Metrics)**
*   **`bedrock_model.py`**: Python-Adapter für AWS Bedrock (Claude 3.5).
*   **`test_proofreader.py`**: Definition der Faithfulness- und Relevancy-Tests.
*   **`generate_synthetic_data.py`**: KI-gestützte Generierung von Test-Cases.
*   **`arena_battle.py`**: A/B Testing Suite für Modell-Vergleiche.

---

## 🔬 Tier 2: DeepEval Integration

Für fortgeschrittene Szenarien nutzen wir **DeepEval**, um die Qualität unserer LLM-Antworten mit wissenschaftlichen Metriken zu messen.

### **Befehle**
- `npm run eval:deepeval`: Führt die Python-basierten Metrik-Tests via Docker aus.
- `npm run eval:deepeval:generate`: Erzeugt neue synthetische Test-Fälle für dein Modell.
- `npm run eval:deepeval:arena`: Startet eine Arena-Battle zwischen verschiedenen Prompt-Versionen.
- `npm run eval:deepeval:view`: Startet das interaktive DeepEval Dashboard auf Port 8080.

---

## 🔄 Detaillierter LLMOps Workflow & Deep Dive

Dieser Abschnitt bietet eine technische und prozessuale Vertiefung der in **Tier 1 Evolution** implementierten Funktionen.

## 🛡️ 1. Datenschutz & PII Anonymisierung (`src/privacy/`)
Das System schützt personenbezogene Daten (PII) lokal, bevor sie an Cloud-Provider wie AWS Bedrock oder Langfuse übertragen werden.

*   **Technologie**: Nutzt **Microsoft Presidio** via Docker.
*   **Ablauf**:
    1.  Eingabetext wird an `pii-filter.ts` übergeben.
    2.  Der **Presidio Analyzer** identifiziert Entitäten (Namen, E-Mails, Telefonnummern).
    3.  Der **Presidio Anonymizer** ersetzt diese durch Platzhalter (z.B. `<PERSON>`, `<EMAIL_ADDRESS>`).
    4.  Erst der anonymisierte Text wird für den LLM-Prompt und das Langfuse-Tracing verwendet.
*   **Skript**: `npm run test:pii` (verifiziert die Redaktion).

## 💸 2. Cost Tracking & Wirtschaftlichkeit (`src/monitoring/`)
Jeder LLM-Call wird finanziell überwacht, um die Profitabilität des Dienstes sicherzustellen.

*   **Implementierung**: `cost-calculator.ts` enthält die aktuellen Preislisten für **Claude 3.5 Sonnet** (Input/Output Tokens).
*   **Integration**: Die Kosten werden in `proofreader.ts` berechnet und:
    1.  An **Langfuse** als `metadata.cost` gesendet (für Dashboards).
    2.  Im strukturierten **Pino-Log** (`logBedrock`) erfasst.
    3.  Dem Endnutzer im Resultat-Objekt zurückgegeben.
*   **Vorteil**: Du siehst in Langfuse sofort, welche Query wie viel Cent gekostet hat.

## 🔄 3. Continuous Improvement Feedback-Loop
Wir nutzen echte Produktionsdaten, um unsere Testabdeckung automatisch zu verbessern.

*   **Mechanik**: `scripts/export-production-traces.ts`
*   **Workflow**:
    1.  Das Skript zieht Traces aus Langfuse, die vom System (oder manuell) als "verbesserungswürdig" markiert wurden.
    2.  Diese werden automatisch in das Format von `eval/golden_dataset.json` konvertiert.
    3.  Beim nächsten `npm run eval` wird sichergestellt, dass das System aus diesen realen Fehlern gelernt hat (Regression-Testing).

## 🛡️ 4. Security Verification Suite (`scripts/verify-security.ts`)
Ein spezialisiertes Test-Toolkit, das über normale Unit-Tests hinausgeht.

*   **npm run test:verify**: Führt eine Reihe von "Adversarial Attacks" aus:
    - **Prompt Injection**: Versucht, das System zu zwingen, seine Anweisungen zu ignorieren.
    - **PII Leakage**: Testet, ob das System sensible Daten im Output ausgibt.
    - **Harmful Content**: Stellt sicher, dass keine gefährlichen Antworten generiert werden.

---

## 🔬 Tier 2+: Advanced DeepEval & Automation

Für ultimative Kontrolle und Automatisierung bietet der Stack fortgeschrittene Python-basierte Werkzeuge:

### **1. DeepEval Arena (Befehl: `npm run eval:deepeval:arena`)**
Ermöglicht den **A/B Vergleich** von zwei verschiedenen Prompts oder Modellen.
*   **Workflow**: Schickt denselben Input an beide Varianten.
*   **Judge**: Claude 3.5 bewertet beide Antworten mathematisch auf Relevanz.
*   **Visualisierung**: Die Ergebnisse werden als direkt genutzte Scores nach Langfuse übertragen.

### **2. Langfuse Auto-Scorer (Befehl: `npm run automation:score`)**
Ein Hintergrund-Skript, das Traces automatisch "benotet".
*   **Funktion**: Scannt Traces auf Fehlermuster (z.B. `Valid: false`).
*   **Output**: Setzt automatisiert Scores (0 für Fehler, 1 für Erfolg) in Langfuse.
*   **Vorteil**: Massive Zeitersparnis beim manuellen Review von tausenden Traces.

### **3. Prompt-as-Code Sync (Befehl: `npm run prompt:sync`)**
Hält dein Repository und dein Langfuse-Dashboard synchron.
*   **Funktion**: Pusht den Inhalt von `eval/prompt.txt` als neue Version in die Langfuse Prompt Registry.
*   **Vorteil**: Ermöglicht echtes Version-Control für LLM-Prompts in Git.

---

## 🛠️ Detaillierte NPM Skript-Referenz

| Bereich | Befehl | Aktion / Kommando | Technischer Zweck |
| :--- | :--- | :--- | :--- |
| **Setup** | `npm run setup` | `./setup.sh` | Secrets & .env Initialisierung. |
| | `npm run up` | `docker up -d` | Startet den kompletten AI Stack. |
| **Dev** | `npm run demo` | `demo-proofreader.ts` | E2E Durchlauf (PII -> Bedrock -> Cost). |
| **Eval** | `npm run eval` | `promptfoo eval` | Logische Validierung (Tier 1). |
| | `npm run eval:deepeval` | `deepeval run` | Wissenschaftliche Metriken (Tier 2). |
| | `npm run eval:deepeval:generate`| `synthetic_data.py` | **Synthetische Daten** generieren. |
| | `npm run eval:deepeval:arena`| `arena_battle.py` | **A/B Testing** zweier Prompts. |
| | `npm run eval:deepeval:view` | `deepeval dashboard`| **DeepEval Dashboard** (Port 8080). |
| **Automation** | `npm run prompt:sync` | `prompt-sync.py` | **Git-to-Langfuse** Prompt Sync. |
| | `npm run automation:score` | `auto-scorer.py` | **Automatisches Grading** in Langfuse. |
| **Security** | `npm run redteam` | `promptfoo redteam` | Automatisierte Sicherheits-Angriffe. |

---

## 📖 Glossar & Fachbegriffe

*   **Golden Dataset**: Ein handverlesener Satz von Testfällen (Ground Truth).
*   **PII (Privacy)**: Schutz personenbezogener Daten vor dem Cloud-Versand.
*   **LLM-as-a-Judge**: Ein starkes Modell bewertet die Antwort eines anderen Modells.
*   **Auto-Scoring**: Automatische Qualitäts-Bewertung basierend auf Log-Patterns.

---

## 🚀 Best-Practice Workflows

### **Szenario A: Prompt-Änderung & Synchronisierung**
1.  Status-Quo in Langfuse prüfen.
2.  Lokalen Prompt in `eval/prompt.txt` editieren.
3.  `npm run prompt:sync` ausführen (neue Version in Langfuse).
4.  `npm run eval` zur Absicherung der Regressionen.

### **Szenario B: Sicherheitslücke schließen**
1.  Problem in `scripts/verify-security.ts` als neuen Test-Case ergänzen.
2.  Lücke reproduzieren (Test schlägt fehl).
3.  Prompt verbessern, bis `npm run test:verify` besteht.

### **Szenario C: A/B Testing (Arena Battle)**
1.  Zwei Prompt-Ideen in `eval/deepeval/arena_battle.py` definieren.
2.  `npm run eval:deepeval:arena` ausführen.
3.  In Langfuse die Scores vergleichen und den "Winner" zum Standard machen.

---
© 2026 VEEDS CORP - Advanced LLMOps Infrastructure
