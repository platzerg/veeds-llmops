# 🚀 VEEDS LLMOps - Vollständiger Workflow Guide

**Datum:** 2026-02-07  
**Version:** 1.0.0

---

## 📋 Inhaltsverzeichnis

1. [Docker Container Übersicht](#docker-container-übersicht)
2. [npm Scripts Übersicht](#npm-scripts-übersicht)
3. [Typische Workflows](#typische-workflows)
4. [Quick Reference](#quick-reference)

---

# 🐳 Docker Container Übersicht

## 1️⃣ Langfuse Stack (Basis - IMMER aktiv)

### **langfuse-web** (Port 9222)
**Wann:** Immer wenn du LLM Observability brauchst  
**Wozu:** 
- Haupt-UI für Langfuse
- Trace-Visualisierung
- Prompt-Management
- Score-Tracking
- Dataset-Management

**Starten:**
```bash
docker compose up -d
```

**Zugriff:**
```bash
start http://localhost:9222
```

**Verwendung:**
- Traces von deinen LLM-Calls anzeigen
- Prompts verwalten und versionieren
- Evaluations-Scores analysieren
- Datasets hochladen

---

### **langfuse-worker** (Port 3030)
**Wann:** Automatisch mit langfuse-web  
**Wozu:**
- Asynchrone Event-Verarbeitung
- Trace-Aggregation
- Score-Berechnung
- Background Jobs

**Verwendung:** Läuft im Hintergrund, keine direkte Interaktion nötig

---

### **postgres** (Port 5432)
**Wann:** Automatisch mit Langfuse  
**Wozu:**
- Transaktionale Daten (Users, Projects, API Keys)
- Prompt-Versionen
- Konfiguration

**Verwendung:** Nur für Debugging/Backup

---

### **clickhouse** (Ports 8123, 9000)
**Wann:** Automatisch mit Langfuse  
**Wozu:**
- OLAP Database für Traces
- Observations (LLM Calls)
- Scores
- Schnelle Aggregationen

**Verwendung:** Nur für Debugging/Backup

---

### **redis** (Port 6379)
**Wann:** Automatisch mit Langfuse  
**Wozu:**
- Queue für Worker
- Cache (256MB LRU)

**Verwendung:** Nur für Debugging

---

### **minio** (Port 9223)
**Wann:** Automatisch mit Langfuse  
**Wozu:**
- S3-kompatibler Blob Storage
- Event-Uploads
- Media-Uploads (Screenshots, etc.)

**Zugriff:**
```bash
start http://localhost:9223
# User: minio
# Password: siehe .env (MINIO_ROOT_PASSWORD)
```

---

## 2️⃣ Promptfoo Stack (Profile: eval, tracing, redteam)

### **promptfoo-ui** (Port 3210)
**Wann:** Wenn du Evaluation-Ergebnisse im Browser sehen willst  
**Wozu:**
- Evaluation-Results visualisieren
- Test-Cases vergleichen
- Assertions prüfen

**Starten:**
```bash
docker compose --profile llm-eval-observability-toolkit up -d
```

**Zugriff:**
```bash
start http://localhost:3210
```

**Verwendung:**
- Nach `npm run eval` Ergebnisse anzeigen
- Alternative zu `npm run eval:view`

---

### **eval** (Profile: eval)
**Wann:** Wenn du Promptfoo Tests in Docker ausführen willst  
**Wozu:**
- Promptfoo Evaluations in isolierter Umgebung
- CI/CD Pipeline

**Starten:**
```bash
# Option 1: Als Service
docker compose --profile eval up eval

# Option 2: Einmalig
docker compose run --rm eval
```

**Verwendung:**
- Nutzt `promptfooconfig.yaml`
- Schreibt Ergebnisse nach `eval-results.json`
- Mountet AWS Credentials von `~/.aws`

**Wann nutzen:**
- CI/CD Pipeline
- Reproduzierbare Umgebung
- Wenn lokale npm Installation Probleme macht

---

### **eval-traced** (Profile: tracing)
**Wann:** Wenn du Evaluations MIT OpenTelemetry Tracing willst  
**Wozu:**
- Traces von Promptfoo → Jaeger senden
- Performance-Analyse
- Debugging

**Starten:**
```bash
# 1. Jaeger starten
docker compose --profile tracing up -d

# 2. Evaluation mit Tracing
docker compose --profile tracing run --rm eval-traced
```

**Verwendung:**
- Nutzt `promptfooconfig-astro-graphql-with-tracing.yaml`
- Sendet OTEL Traces an Jaeger (Port 4318)
- Traces in Jaeger UI anzeigen: http://localhost:16686

---

### **redteam** (Profile: redteam)
**Wann:** Wenn du Security/Adversarial Tests ausführen willst  
**Wozu:**
- Prompt Injection Tests
- Jailbreak Versuche
- Toxicity Tests
- PII Leakage Tests

**Starten:**
```bash
docker compose --profile redteam up redteam
```

**Verwendung:**
- Nutzt `redteamconfig.yaml`
- Schreibt Ergebnisse nach `redteam-results.json`
- Generiert automatisch 100+ Adversarial Test Cases

**Wann nutzen:**
- Vor Production Deployment
- Security Audit
- Regelmäßige Sicherheitstests

---

### **redteam-report** (Profile: report)
**Wann:** Nach redteam Tests  
**Wozu:**
- HTML Report generieren
- Ergebnisse visualisieren

**Starten:**
```bash
docker compose --profile report up redteam-report
```

---

## 3️⃣ Observability Stack (Profile: tracing, tempo, monitor)

### **jaeger** (Port 16686)
**Wann:** Wenn du Distributed Tracing brauchst  
**Wozu:**
- OpenTelemetry Traces visualisieren
- Performance-Analyse
- Latency-Debugging
- Span-Details anzeigen

**Starten:**
```bash
docker compose --profile tracing up -d
```

**Zugriff:**
```bash
start http://localhost:16686
```

**Verwendung:**
- Traces von `eval-traced` anzeigen
- Traces von Custom OTEL Provider (otel-bedrock-provider.js)
- Service-Map anzeigen
- Latency-Histogramme

**Ports:**
- 16686: Jaeger UI
- 4317: OTLP gRPC
- 4318: OTLP HTTP

---

### **tempo** (Port 3200)
**Wann:** Alternative zu Jaeger für größere Deployments  
**Wozu:**
- Scalable Distributed Tracing Backend
- Langzeit-Speicherung von Traces

**Starten:**
```bash
docker compose --profile tempo up -d
```

**Verwendung:**
- Für Production-ähnliche Setups
- Wenn Jaeger zu viel RAM braucht

---

### **grafana** (Port 8222)
**Wann:** Wenn du Dashboards für Traces willst  
**Wozu:**
- Tempo Traces visualisieren
- Custom Dashboards
- Alerting

**Starten:**
```bash
docker compose --profile monitor up -d
```

**Zugriff:**
```bash
start http://localhost:8222
# User: admin
# Password: admin
```

---

### **otel-collector** (Ports 4321, 4322)
**Wann:** Für komplexe OTEL Setups  
**Wozu:**
- Traces sammeln und weiterleiten
- Sampling
- Filtering
- Multiple Exporters

**Starten:**
```bash
docker compose --profile collector up -d
```

**Verwendung:**
- Für Production-ähnliche Setups
- Wenn du Traces an mehrere Backends senden willst

---

### **adot-collector** (Ports 4317, 4318)
**Wann:** Wenn du AWS X-Ray UND Jaeger gleichzeitig willst  
**Wozu:**
- Dual-Export: Jaeger (lokal) + AWS X-Ray (Cloud)
- AWS-native Trace-Verarbeitung

**Starten:**
```bash
# 1. AWS Credentials exportieren
eval $(aws configure export-credentials --profile YOUR_PROFILE --format env)

# 2. ADOT starten
docker compose --profile xray up -d
```

**Verwendung:**
- Für Hybrid-Setups (lokal + Cloud)
- Production Monitoring mit X-Ray

---

### **jaeger-backend** (Port 16686)
**Wann:** Nur mit ADOT Collector  
**Wozu:**
- Jaeger UI für Traces vom ADOT Collector

**Starten:**
```bash
docker compose --profile xray up -d
```

---

# 📦 npm Scripts Übersicht

## 🔧 Docker Management

### **npm run up**
```bash
docker compose up -d
```
**Wann:** Start des Basis-Stacks (Langfuse)  
**Wozu:** Langfuse + Postgres + ClickHouse + Redis + MinIO starten

---

### **npm run down**
```bash
docker compose down
```
**Wann:** Alle Container stoppen  
**Wozu:** Cleanup

---

### **npm run logs**
```bash
docker compose logs -f
```
**Wann:** Debugging  
**Wozu:** Alle Container Logs live anzeigen

---

### **npm run logs:web**
```bash
docker compose logs -f langfuse-web
```
**Wann:** Langfuse Debugging  
**Wozu:** Nur Langfuse Web Logs

---

### **npm run logs:worker**
```bash
docker compose logs -f langfuse-worker
```
**Wann:** Worker Debugging  
**Wozu:** Nur Worker Logs

---

### **npm run status**
```bash
docker compose ps
```
**Wann:** Status prüfen  
**Wozu:** Welche Container laufen?

---

### **npm run health**
```bash
./scripts/health-check.sh
```
**Wann:** Health Check  
**Wozu:** Alle Services auf Gesundheit prüfen

---

## 🧪 Evaluation (Promptfoo)

### **npm run eval**
```bash
npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml
```
**Wann:** Standard Evaluation  
**Wozu:**
1. Generiert Test-Cases aus `eval/generate-promptfoo-tests.ts`
2. Führt Promptfoo Evaluation aus
3. Nutzt `promptfooconfig.yaml`

**Ergebnis:** `eval-results.json`

---

### **npm run eval:view**
```bash
npx promptfoo view
```
**Wann:** Nach Evaluation  
**Wozu:** Ergebnisse im Browser anzeigen (Port 3210)

---

### **npm run eval:assert**
```bash
npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --assert
```
**Wann:** CI/CD Pipeline  
**Wozu:** Evaluation mit Assertions (Exit Code 1 bei Failure)

---

### **npm run eval:compare**
```bash
npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --output eval/results/latest.html && open eval/results/latest.html
```
**Wann:** A/B Testing  
**Wozu:** Vergleich verschiedener Prompts/Modelle als HTML

---

### **npm run eval:push**
```bash
npx tsx scripts/push-scores-to-langfuse.ts eval/results/latest.json
```
**Wann:** Nach Evaluation  
**Wozu:** Scores zu Langfuse hochladen

---

### **npm run eval:full**
```bash
npm run eval && npm run eval:push
```
**Wann:** Kompletter Workflow  
**Wozu:** Evaluation + Scores zu Langfuse

---

## 🎯 Spezielle Evaluations

### **npm run eval:advanced**
```bash
npx promptfoo eval --config promptfooconfig-advanced.yaml
```
**Wann:** Erweiterte Tests  
**Wozu:** Nutzt `promptfooconfig-advanced.yaml`

---

### **npm run eval:all-features**
```bash
npx promptfoo eval --config promptfooconfig-all-features.yaml
```
**Wann:** Alle Features testen  
**Wozu:** Comprehensive Test Suite

---

### **npm run eval:scenarios**
```bash
npx promptfoo eval --config promptfooconfig-scenarios.yaml
```
**Wann:** Szenario-basierte Tests  
**Wozu:** Multi-Turn Conversations

---

### **npm run eval:comparison**
```bash
npx promptfoo eval --config promptfooconfig-comparison.yaml
```
**Wann:** A/B Testing  
**Wozu:** Vergleich verschiedener Modelle

---

### **npm run eval:python**
```bash
npx promptfoo eval --config promptfooconfig-python-assertions.yaml
```
**Wann:** Python Assertions  
**Wozu:** Custom Python Assertion Functions

---

### **npm run eval:astro**
```bash
npx promptfoo eval --config promptfooconfig-astro-graphql.yaml
```
**Wann:** ASTRO GraphQL Tests  
**Wozu:** Vehicle Info GraphQL Testing

---

### **npm run eval:astro-extended**
```bash
npx promptfoo eval --config promptfooconfig-astro-graphql-extended.yaml
```
**Wann:** Erweiterte ASTRO Tests  
**Wozu:** Mehr Test Cases

---

### **npm run eval:astro-tracing**
```bash
npx promptfoo eval --config promptfooconfig-astro-graphql-with-tracing.yaml
```
**Wann:** ASTRO mit Tracing  
**Wozu:** OTEL Traces zu Jaeger

---

### **npm run eval:astro-jaeger**
```bash
npx promptfoo eval --config promptfooconfig-astro-graphql-jaeger.yaml
```
**Wann:** ASTRO mit Jaeger  
**Wozu:** Direct Jaeger Export

---

### **npm run eval:astro-dual**
```bash
npx promptfoo eval --config promptfooconfig-astro-graphql-dual-export.yaml
```
**Wann:** ASTRO mit Dual Export  
**Wozu:** Jaeger + AWS X-Ray gleichzeitig

---

## 🔴 Red Team (Security Testing)

### **npm run redteam**
```bash
npx promptfoo redteam run --config redteamconfig.yaml
```
**Wann:** Security Audit  
**Wozu:**
- Prompt Injection Tests
- Jailbreak Versuche
- Toxicity Tests
- PII Leakage

**Ergebnis:** `redteam-results.json`

---

### **npm run redteam:report**
```bash
npx promptfoo redteam report
```
**Wann:** Nach redteam  
**Wozu:** HTML Report generieren

---

### **npm run redteam:setup**
```bash
npx promptfoo redteam setup
```
**Wann:** Erstes Mal  
**Wozu:** Red Team Konfiguration erstellen

---

### **npm run redteam:full**
```bash
npm run redteam && npm run redteam:report && npx promptfoo view
```
**Wann:** Kompletter Security Audit  
**Wozu:** Tests + Report + Visualisierung

---

## 📊 Dataset Management

### **npm run dataset:upload**
```bash
npx tsx eval/upload-dataset-to-langfuse.ts
```
**Wann:** Golden Dataset zu Langfuse hochladen  
**Wozu:** Datasets in Langfuse UI verwalten

---

### **npm run generate**
```bash
npx promptfoo generate dataset --config promptfooconfig.yaml --output datasets/generated-tests.yaml
```
**Wann:** Automatische Test-Generierung  
**Wozu:** KI generiert Test Cases

---

### **npm run generate:de**
```bash
npx promptfoo generate dataset --config promptfooconfig.yaml --instructions "Generiere Test-Fragen auf Deutsch..." --numPersonas 5 --numTestCasesPerPersona 4 --output datasets/generated-tests.yaml
```
**Wann:** Deutsche Test Cases generieren  
**Wozu:** Automatische deutsche Test-Generierung

---

## 🔍 Tracing Management

### **npm run tracing:start**
```bash
docker-compose --profile tracing up -d
```
**Wann:** Jaeger starten  
**Wozu:** Distributed Tracing aktivieren

---

### **npm run tracing:stop**
```bash
docker-compose --profile tracing down
```
**Wann:** Jaeger stoppen  
**Wozu:** Cleanup

---

### **npm run tracing:jaeger**
```bash
start http://localhost:16686
```
**Wann:** Jaeger UI öffnen  
**Wozu:** Traces visualisieren

---

### **npm run xray:start**
```bash
docker-compose --profile xray up -d
```
**Wann:** AWS X-Ray + Jaeger  
**Wozu:** Dual Export aktivieren

---

### **npm run xray:stop**
```bash
docker-compose --profile xray down
```
**Wann:** ADOT stoppen  
**Wozu:** Cleanup

---

### **npm run tempo:start**
```bash
docker-compose --profile tempo up -d
```
**Wann:** Tempo starten  
**Wozu:** Alternative zu Jaeger

---

### **npm run tempo:stop**
```bash
docker-compose --profile tempo down
```
**Wann:** Tempo stoppen  
**Wozu:** Cleanup

---

### **npm run grafana:open**
```bash
start http://localhost:3000
```
**Wann:** Grafana UI öffnen  
**Wozu:** Dashboards anzeigen

---

## 🧪 Testing

### **npm run test**
```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js
```
**Wann:** Unit Tests  
**Wozu:** Jest Tests ausführen

---

### **npm run test:watch**
```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --watch
```
**Wann:** Development  
**Wozu:** Tests im Watch Mode

---

### **npm run test:coverage**
```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage
```
**Wann:** Coverage Report  
**Wozu:** Code Coverage prüfen

---

### **npm run test:load**
```bash
k6 run tests/load/graphql-test.js
```
**Wann:** Load Testing  
**Wozu:** Performance Tests mit k6

---

### **npm run test:load:smoke**
```bash
k6 run --vus 1 --duration 10s tests/load/graphql-test.js
```
**Wann:** Quick Smoke Test  
**Wozu:** 1 User, 10 Sekunden

---

### **npm run test:load:stress**
```bash
k6 run -e K6_SCENARIO=stress tests/load/graphql-test.js
```
**Wann:** Stress Testing  
**Wozu:** Hohe Last simulieren

---

## 🛠️ Development

### **npm run build**
```bash
tsc
```
**Wann:** TypeScript kompilieren  
**Wozu:** dist/ Ordner erstellen

---

### **npm run dev**
```bash
tsx watch src/index.ts
```
**Wann:** Development  
**Wozu:** Hot Reload

---

### **npm run dev:real**
```bash
ts-node agentcore-evaluations-real.ts
```
**Wann:** AgentCore Real SDK Demo  
**Wozu:** Echte AWS Bedrock Calls

---

### **npm run dev:promptfoo**
```bash
ts-node promptfoo-evaluations.ts
```
**Wann:** Promptfoo Demo  
**Wozu:** Promptfoo Programmatic API

---

## 🧹 Utilities

### **npm run cache:clear**
```bash
npx promptfoo cache clear
```
**Wann:** Cache Probleme  
**Wozu:** Promptfoo Cache löschen

---

### **npm run seed**
```bash
npx tsx scripts/seed-langfuse.ts
```
**Wann:** Langfuse Setup  
**Wozu:** Prompts zu Langfuse hochladen

---

### **npm run eval:staging**
```bash
dotenv -e .env.staging -- npx promptfoo eval
```
**Wann:** Staging Environment  
**Wozu:** Mit Staging Credentials

---

### **npm run eval:production**
```bash
dotenv -e .env.production -- npx promptfoo eval --no-cache
```
**Wann:** Production Environment  
**Wozu:** Mit Production Credentials, ohne Cache

---

# 🎯 Typische Workflows

## Workflow 1: Erste Schritte

```bash
# 1. Langfuse Stack starten
npm run up

# 2. Langfuse UI öffnen
start http://localhost:9222

# 3. Account erstellen, Projekt anlegen, API Keys kopieren

# 4. API Keys in .env eintragen
# LANGFUSE_PUBLIC_KEY=pk-lf-...
# LANGFUSE_SECRET_KEY=sk-lf-...

# 5. Prompts zu Langfuse hochladen
npm run seed

# 6. Erste Evaluation
npm run eval

# 7. Ergebnisse anzeigen
npm run eval:view
```

---

## Workflow 2: Evaluation mit Langfuse Integration

```bash
# 1. Langfuse starten
npm run up

# 2. Evaluation mit Langfuse Tracing
npm run eval:full

# 3. Ergebnisse in Langfuse UI anzeigen
start http://localhost:9222
```

---

## Workflow 3: Evaluation mit Distributed Tracing

```bash
# 1. Langfuse + Jaeger starten
npm run up
npm run tracing:start

# 2. Evaluation mit OTEL Tracing
npm run eval:astro-tracing

# 3. Traces in Jaeger anzeigen
npm run tracing:jaeger

# 4. Ergebnisse in Promptfoo UI
npm run eval:view
```

---

## Workflow 4: Security Audit

```bash
# 1. Langfuse starten
npm run up

# 2. Red Team Tests
npm run redteam:full

# 3. Ergebnisse prüfen
# - redteam-results.json
# - Promptfoo UI (Port 3210)
```

---

## Workflow 5: Load Testing

```bash
# 1. Smoke Test (Quick Check)
npm run test:load:smoke

# 2. Standard Load Test
npm run test:load

# 3. Stress Test
npm run test:load:stress
```

---

## Workflow 6: CI/CD Pipeline

```bash
# 1. Unit Tests
npm run test

# 2. Evaluation mit Assertions
npm run eval:assert

# 3. Red Team Tests
npm run redteam

# 4. Load Tests
npm run test:load:smoke

# 5. Cleanup
npm run down
```

---

## Workflow 7: A/B Testing

```bash
# 1. Langfuse starten
npm run up

# 2. Comparison Evaluation
npm run eval:comparison

# 3. Ergebnisse vergleichen
npm run eval:view

# 4. Scores zu Langfuse
npm run eval:push
```

---

## Workflow 8: Dataset Generation

```bash
# 1. Deutsche Test Cases generieren
npm run generate:de

# 2. Dataset zu Langfuse hochladen
npm run dataset:upload

# 3. Evaluation mit generiertem Dataset
npm run eval
```

---

# 📚 Quick Reference

## Port Übersicht

| Service | Port | URL |
|---------|------|-----|
| **Langfuse** | 9222 | http://localhost:9222 |
| **MinIO** | 9223 | http://localhost:9223 |
| **Promptfoo UI** | 3210 | http://localhost:3210 |
| **Jaeger UI** | 16686 | http://localhost:16686 |
| **Grafana** | 8222 | http://localhost:8222 |
| **Tempo** | 3200 | http://localhost:3200 |
| PostgreSQL | 5432 | localhost:5432 |
| ClickHouse HTTP | 8123 | localhost:8123 |
| ClickHouse Native | 9000 | localhost:9000 |
| Redis | 6379 | localhost:6379 |

---

## Profile Übersicht

| Profile | Container | Wann nutzen |
|---------|-----------|-------------|
| **(default)** | Langfuse Stack | Immer |
| **eval** | promptfoo-eval | Evaluation in Docker |
| **tracing** | jaeger, eval-traced | Distributed Tracing |
| **redteam** | promptfoo-redteam | Security Tests |
| **report** | redteam-report | Red Team Report |
| **tempo** | tempo | Alternative zu Jaeger |
| **monitor** | grafana | Dashboards |
| **collector** | otel-collector | OTEL Collector |
| **xray** | adot-collector, jaeger-backend | AWS X-Ray |
| **llm-eval-observability-toolkit** | promptfoo-ui, jaeger, otel-collector | Promptfoo UI + OTEL |

---

## Wichtigste Kommandos

```bash
# Stack Management
npm run up                  # Langfuse starten
npm run down                # Alles stoppen
npm run status              # Status prüfen

# Evaluation
npm run eval                # Standard Evaluation
npm run eval:view           # Ergebnisse anzeigen
npm run eval:full           # Eval + Langfuse Push

# Security
npm run redteam:full        # Security Audit

# Tracing
npm run tracing:start       # Jaeger starten
npm run tracing:jaeger      # Jaeger UI öffnen

# Testing
npm run test                # Unit Tests
npm run test:load           # Load Tests
```

---

## Environment Variables

Wichtigste .env Variablen:

```bash
# Langfuse
LANGFUSE_PORT=9222
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://localhost:9222

# AWS
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Grafana
GRAFANA_PORT=8222

# MinIO
MINIO_PORT=9223
```

---

**🎉 Du bist jetzt bereit für Production-Grade LLMOps!**
