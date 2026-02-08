# VEEDS LLMOps - NPM Scripts Referenz

**Stand:** 2026-02-08  
**Quelle:** [package.json](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/package.json)

---

## 📋 Inhaltsverzeichnis

1. [Docker Management](#docker-management)
2. [Langfuse Setup & Seeding](#langfuse-setup--seeding)
3. [Evaluation (Promptfoo)](#evaluation-promptfoo)
4. [DeepEval Integration](#deepeval-integration)
5. [Dataset Management](#dataset-management)
6. [Red Team Security Testing](#red-team-security-testing)
7. [Load Testing (k6)](#load-testing-k6)
8. [Unit Tests (Jest)](#unit-tests-jest)
9. [Demo & Debugging](#demo--debugging)
10. [Build & Development](#build--development)
11. [Legacy/Experimental Scripts](#legacyexperimental-scripts)

---

## 🐳 Docker Management

### `npm run setup`
**Befehl:** `./setup.sh`  
**Beschreibung:** Initialisiert die gesamte Umgebung (Docker-Container, Langfuse-Setup)  
**Wann verwenden:** Beim ersten Setup oder nach einem Clean-Reset

### `npm run up`
**Befehl:** `docker compose up -d`  
**Beschreibung:** Startet alle Docker-Container im Hintergrund  
**Container:** Langfuse (Web, Worker, PostgreSQL, ClickHouse, Redis, MinIO)

### `npm run down`
**Befehl:** `docker compose down`  
**Beschreibung:** Stoppt und entfernt alle Container  
**⚠️ Warnung:** Daten bleiben in Volumes erhalten

### `npm run logs`
**Befehl:** `docker compose logs -f`  
**Beschreibung:** Zeigt Live-Logs aller Container  
**Tipp:** `Ctrl+C` zum Beenden

### `npm run logs:web`
**Befehl:** `docker compose logs -f langfuse-web`  
**Beschreibung:** Zeigt nur Logs vom Langfuse Web-Container

### `npm run logs:worker`
**Befehl:** `docker compose logs -f langfuse-worker`  
**Beschreibung:** Zeigt nur Logs vom Langfuse Worker-Container

### `npm run status`
**Befehl:** `docker compose ps`  
**Beschreibung:** Zeigt Status aller Container (running/stopped)

### `npm run health`
**Befehl:** `./scripts/health-check.sh`  
**Beschreibung:** Prüft Health-Status aller Services  
**Ausgabe:** ✅/❌ für jeden Service

---

## 🌱 Langfuse Setup & Seeding

### `npm run seed`
**Befehl:** `npx tsx scripts/seed-langfuse.ts`  
**Beschreibung:** Lädt Prompts und Golden Dataset in Langfuse hoch  
**Was wird geladen:**
- Prompt `veeds-proofreader` mit Label `production`
- Golden Dataset als Langfuse Dataset
**Wann verwenden:** Nach `npm run up` beim ersten Setup

---

## 🧪 Evaluation (Promptfoo)

### `npm run eval:generate`
**Befehl:** `npx tsx eval/generate-promptfoo-tests.ts`  
**Beschreibung:** Generiert Promptfoo-Tests aus `golden_dataset.json`  
**Output:** `eval/generated-tests.yaml` (16 Tests mit ~70 Assertions)

### `npm run eval`
**Befehl:** `npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml`  
**Beschreibung:** Generiert Tests und führt Evaluation aus  
**Was passiert:**
1. Tests generieren
2. 16 Test Cases gegen AWS Bedrock ausführen
3. Ergebnisse in `eval/results/latest.json` speichern

### `npm run eval:assert`
**Befehl:** `npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --assert`  
**Beschreibung:** Wie `eval`, aber **blockiert bei Fehlern** (Exit Code 1)  
**Wann verwenden:** In CI/CD Pipeline als Quality Gate

### `npm run eval:view`
**Befehl:** `npx promptfoo view --port 3210`  
**Beschreibung:** Öffnet Promptfoo Web-UI auf Port 3210  
**URL:** http://localhost:3210  
**Zeigt:** Interaktive Ergebnis-Übersicht mit Assertions

### `npm run eval:compare`
**Befehl:** `npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --output eval/results/latest.html && open eval/results/latest.html`  
**Beschreibung:** Generiert HTML-Report und öffnet ihn im Browser  
**Output:** `eval/results/latest.html`

### `npm run eval:push`
**Befehl:** `npx tsx scripts/push-scores-to-langfuse.ts eval/results/latest.json`  
**Beschreibung:** Pusht Promptfoo-Ergebnisse als Scores zu Langfuse  
**Was wird gepusht:**
- Trace mit 16 Spans (ein Span pro Test)
- Aggregate Scores: `eval_pass_rate`, `eval_cost`, `eval_latency`

### `npm run eval:full`
**Befehl:** `npm run eval && npm run eval:push`  
**Beschreibung:** Kompletter Workflow: Eval ausführen + Scores zu Langfuse pushen  
**Wann verwenden:** Für vollständige Evaluation mit Langfuse-Integration

### `npm run eval:no-cache`
**Befehl:** `npx promptfoo eval --no-cache`  
**Beschreibung:** Evaluation ohne Cache (erzwingt neue LLM-Calls)

---

## 🔬 DeepEval Integration

### `npm run eval:deepeval`
**Befehl:** `docker compose --profile deepeval run --rm deepeval`  
**Beschreibung:** Führt DeepEval-Tests im Docker-Container aus  
**Metriken:** Faithfulness, Answer Relevancy, Hallucination

### `npm run eval:deepeval:generate`
**Befehl:** `docker compose --profile deepeval run --rm deepeval sh -c "pip install -r eval/deepeval/requirements.txt && python eval/deepeval/generate_synthetic_data.py"`  
**Beschreibung:** Generiert synthetische Test-Daten mit DeepEval  
**Output:** Neue Test Cases für Edge Cases und Adversarial Tests

### `npm run eval:deepeval:arena`
**Befehl:** `docker compose --profile deepeval run --rm deepeval sh -c "pip install -r eval/deepeval/requirements.txt && python eval/deepeval/arena_battle.py"`  
**Beschreibung:** Arena Battle zwischen verschiedenen Prompt-Versionen  
**Vergleicht:** Prompt v1 vs v2 vs v3 auf Golden Dataset

### `npm run eval:deepeval:view`
**Befehl:** `docker compose --profile deepeval-ui up deepeval-ui`  
**Beschreibung:** Startet DeepEval Web-UI  
**URL:** http://localhost:8501 (Streamlit)

---

## 📦 Dataset Management

### `npm run dataset:upload`
**Befehl:** `npx tsx eval/upload-dataset-to-langfuse.ts`  
**Beschreibung:** Lädt Golden Dataset zu Langfuse hoch  
**Dataset Name:** `veeds-proofreader-golden`  
**Items:** 16 Test Cases mit Expected Output

### `npm run dataset:export`
**Befehl:** `npx tsx scripts/export-production-traces.ts`  
**Beschreibung:** Exportiert Production-Traces aus Langfuse  
**Use Case:** Interessante Production-Fälle ins Golden Dataset übernehmen

---

## 🛡️ Red Team Security Testing

### `npm run redteam`
**Befehl:** `npx promptfoo redteam run --config redteamconfig.yaml`  
**Beschreibung:** Führt Red Team Security-Tests aus  
**Tests:** Prompt Injection, Jailbreaking, PII Leakage, Hallucination  
**Output:** 50+ adversarial Test Cases

### `npm run redteam:report`
**Befehl:** `npx promptfoo redteam report`  
**Beschreibung:** Generiert Security-Report aus Red Team Tests  
**Zeigt:** Vulnerabilities, Pass/Fail Rate, Risiko-Level

### `npm run redteam:setup`
**Befehl:** `npx promptfoo redteam setup`  
**Beschreibung:** Interaktives Setup für Red Team Config

### `npm run redteam:full`
**Befehl:** `npm run redteam && npm run redteam:report && npx promptfoo view`  
**Beschreibung:** Kompletter Red Team Workflow mit Report und UI  
**Wann verwenden:** Für vollständige Security-Analyse

---

## 🏋️ Load Testing (k6)

### `npm run test:load`
**Befehl:** `k6 run tests/load/graphql-test.js`  
**Beschreibung:** Standard Load Test (20 VUs, 2 Minuten)  
**Metriken:** p95/p99 Latency, Error Rate, Throughput

### `npm run test:load:smoke`
**Befehl:** `k6 run --vus 1 --duration 10s tests/load/graphql-test.js`  
**Beschreibung:** Smoke Test (1 VU, 10 Sekunden)  
**Wann verwenden:** Schneller Sanity-Check

### `npm run test:load:stress`
**Befehl:** `k6 run -e K6_SCENARIO=stress tests/load/graphql-test.js`  
**Beschreibung:** Stress Test (hohe Last)  
**Wann verwenden:** Performance-Limits testen

---

## 🧪 Unit Tests (Jest)

### `npm run test`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js`  
**Beschreibung:** Führt alle Jest Unit Tests aus

### `npm run test:watch`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --watch`  
**Beschreibung:** Jest im Watch-Mode (re-runs bei Datei-Änderungen)

### `npm run test:coverage`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage`  
**Beschreibung:** Führt Tests aus und generiert Coverage-Report

---

## 🔍 Demo & Debugging

### `npm run demo`
**Befehl:** `npx tsx scripts/demo-proofreader.ts`  
**Beschreibung:** Führt Demo-Proofreading aus  
**Zeigt:** Live-Beispiel mit Langfuse-Tracing

### `npm run test:verify`
**Befehl:** `npx tsx scripts/verify-security.ts`  
**Beschreibung:** Verifiziert Security-Features (PII-Filter, etc.)

### `npm run test:pii`
**Befehl:** `npx tsx scripts/debug-pii.ts`  
**Beschreibung:** Debuggt PII-Filter mit Test-Daten  
**Zeigt:** Welche PII erkannt und anonymisiert wird

---

## 🔧 Build & Development

### `npm run build`
**Befehl:** `tsc`  
**Beschreibung:** Kompiliert TypeScript zu JavaScript  
**Output:** `dist/` Verzeichnis

### `npm run dev`
**Befehl:** `tsx watch src/index.ts`  
**Beschreibung:** Development-Mode mit Hot-Reload

### `npm run start`
**Befehl:** `node dist/agentcore-evaluations-example.js`  
**Beschreibung:** Startet kompilierte Anwendung

---

## 🔄 Automation Scripts

### `npm run automation:score`
**Befehl:** `docker compose --profile deepeval run --rm deepeval python scripts/auto-scorer.py`  
**Beschreibung:** Automatisches Scoring von Production-Traces

### `npm run prompt:sync`
**Befehl:** `docker compose --profile deepeval run --rm deepeval python scripts/prompt-sync.py`  
**Beschreibung:** Synchronisiert Prompts zwischen Langfuse und Git

---

## 🗂️ Legacy/Experimental Scripts

Die folgenden Scripts sind veraltet oder experimentell und sollten **nicht** verwendet werden:

### Veraltete Eval-Configs
- `eval1`, `eval:advanced`, `eval:modular`, `eval:all-features`, `eval:scenarios`, `eval:comparison`
- `eval:python`, `eval:astro*` (verschiedene Astro-GraphQL Configs)

### Veraltete Tracing-Scripts
- `tracing:start`, `tracing:stop`, `tracing:jaeger`
- `xray:start`, `xray:stop`
- `tempo:start`, `tempo:stop`
- `grafana:open`

**Grund:** Diese wurden durch Langfuse v3 ersetzt

### Veraltete Test-Scripts
- `test1`, `test:watch1`, `test:coverage1` (Vitest)

**Grund:** Projekt verwendet Jest

### Veraltete Build-Scripts
- `build1`, `dev1`, `dev:real`, `dev:promptfoo`

**Grund:** Alte Entwicklungs-Workflows

---

## 📊 Häufige Workflows

### Komplettes Setup (Neu)
```bash
npm run setup
npm run up
npm run seed
npm run demo
```

### Tägliche Entwicklung
```bash
npm run eval:full          # Evaluation + Langfuse Push
npm run eval:view          # Ergebnisse ansehen
```

### CI/CD Pipeline
```bash
npm run eval:assert        # Quality Gate (blockiert bei Fehlern)
npm run test:load          # Performance Test
npm run redteam            # Security Test
```

### Security Audit
```bash
npm run redteam:full       # Kompletter Red Team Workflow
npm run test:verify        # Security-Features verifizieren
```

### DeepEval Workflow
```bash
npm run eval:deepeval:generate  # Synthetische Daten generieren
npm run eval:deepeval:arena     # Arena Battle
npm run eval:deepeval:view      # UI öffnen
```

---

## 🎯 Quick Reference

| Aufgabe | Script |
|---------|--------|
| Erste Einrichtung | `npm run setup` |
| Container starten | `npm run up` |
| Evaluation ausführen | `npm run eval:full` |
| Ergebnisse ansehen | `npm run eval:view` |
| Security-Test | `npm run redteam:full` |
| Load-Test | `npm run test:load` |
| Demo ausführen | `npm run demo` |
| Logs ansehen | `npm run logs` |
| Container stoppen | `npm run down` |

---

**Letzte Aktualisierung:** 2026-02-08  
**Quelle:** [package.json](file:///c:/Dev/ai/projects/llmqu/llm-toolkit/veeds-llmops/package.json)
