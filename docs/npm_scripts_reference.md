# VEEDS LLMOps - NPM Scripts Referenz

**Stand:** 2026-02-08
**Quelle:** `package.json`
**Gesamtzahl Scripts:** 90+

---

## Inhaltsverzeichnis

1. [Docker Management](#1-docker-management-7-scripts)
2. [Langfuse Setup & Seeding](#2-langfuse-setup--seeding-3-scripts)
3. [Evaluation - Promptfoo Tier 1](#3-evaluation---promptfoo-tier-1-12-scripts)
4. [Evaluation - DeepEval Tier 2](#4-evaluation---deepeval-tier-2-5-scripts)
5. [Dataset Management](#5-dataset-management-2-scripts)
6. [Red Team Security Testing](#6-red-team-security-testing-6-scripts)
7. [Load Testing (k6)](#7-load-testing-k6-3-scripts)
8. [Unit Tests (Jest)](#8-unit-tests-jest-3-scripts)
9. [Demo & Security-Verifikation](#9-demo--security-verifikation-4-scripts)
10. [Build & Development](#10-build--development-4-scripts)
11. [Automation & Datengenerierung](#11-automation--datengenerierung-4-scripts)
12. [Tracing & Observability](#12-tracing--observability-9-scripts)
13. [Legacy/Experimentelle Scripts](#13-legacyexperimentelle-scripts-15-scripts)
14. [Kompletter End-to-End Workflow](#14-kompletter-end-to-end-workflow)
15. [Quick Reference](#15-quick-reference)

---

## 1. Docker Management (7 Scripts)

### `npm run up`
**Befehl:** `docker compose up -d`
**Beschreibung:** Startet den gesamten Langfuse v3 Stack im Hintergrund.
**Container:** langfuse-web (:3000), langfuse-worker (:3030), PostgreSQL (:5432), ClickHouse (:8123/:9000), Redis (:6379), MinIO (:9090/:9091)

### `npm run down`
**Befehl:** `docker compose down`
**Beschreibung:** Stoppt und entfernt alle Container. Daten bleiben in Docker-Volumes erhalten.

### `npm run logs`
**Befehl:** `docker compose logs -f`
**Beschreibung:** Zeigt Live-Logs aller Container im Follow-Mode. `Ctrl+C` zum Beenden.

### `npm run logs:web`
**Befehl:** `docker compose logs -f langfuse-web`
**Beschreibung:** Zeigt nur Logs des Langfuse Web-Containers (Next.js UI + REST API).

### `npm run logs:worker`
**Befehl:** `docker compose logs -f langfuse-worker`
**Beschreibung:** Zeigt nur Logs des Langfuse Worker-Containers (async Queue-Processing, ClickHouse-Writes).

### `npm run status`
**Befehl:** `docker compose ps`
**Beschreibung:** Zeigt den Status aller Container (running/stopped/healthy).

### `npm run health`
**Befehl:** `./scripts/health-check.sh`
**Beschreibung:** Prueft Health-Endpoints aller Services und gibt pro Service ein Pass/Fail aus.

---

## 2. Langfuse Setup & Seeding (3 Scripts)

### `npm run seed`
**Befehl:** `npx tsx scripts/seed-langfuse.ts`
**Beschreibung:** Laedt den Prompt `veeds-proofreader` (Label `production`) und das Golden Dataset in Langfuse hoch.
**Wann verwenden:** Nach `npm run up` beim ersten Setup oder nach einem Reset.

### `npm run prompt:upload`
**Befehl:** `npx tsx scripts/upload-prompt-to-langfuse.ts`
**Beschreibung:** Laedt nur den Prompt aus `eval/prompt.txt` als neue Version in Langfuse hoch.

### `npm run prompt:sync`
**Befehl:** `docker compose --profile deepeval run --rm deepeval sh -c "pip install langfuse python-dotenv && python scripts/prompt-sync.py"`
**Beschreibung:** Synchronisiert Prompts bidirektional zwischen Git (`eval/prompt.txt`) und Langfuse. Laeuft im DeepEval-Python-Container.

---

## 3. Evaluation - Promptfoo Tier 1 (12 Scripts)

### `npm run eval:generate`
**Befehl:** `npx tsx eval/generate-promptfoo-tests.ts`
**Beschreibung:** Generiert Promptfoo-Testdatei aus `eval/golden_dataset.json`.
**Output:** `eval/generated-tests.yaml` (16 Test Cases mit ~70 Assertions)

### `npm run eval`
**Befehl:** `docker compose exec -t promptfoo npx promptfoo eval -c /app/promptfooconfig.yaml`
**Beschreibung:** Fuehrt Promptfoo-Evaluation **im Docker-Container** aus. Die Config und Testdaten sind via Volume gemountet. Ruft AWS Bedrock (Claude 3.5) auf.

### `npm run eval:share`
**Befehl:** `docker compose exec -t promptfoo npx promptfoo share`
**Beschreibung:** Teilt die letzten Eval-Ergebnisse ueber Promptfoo Cloud (oeffentlicher Link).

### `npm run eval:view`
**Befehl:** `start http://localhost:3210`
**Beschreibung:** Oeffnet die Promptfoo Web-UI im Browser auf Port 3210.

### `npm run eval:all`
**Befehl:** `npm run eval && npm run eval:view`
**Beschreibung:** Fuehrt Evaluation aus und oeffnet anschliessend die Web-UI.

### `npm run eval:assert`
**Befehl:** `npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --assert`
**Beschreibung:** **CI/CD Quality Gate.** Generiert Tests und fuehrt Eval mit `--assert` aus. Exit Code 1 bei fehlschlagenden Assertions - blockiert die Pipeline.
**Wann verwenden:** In GitLab CI/CD als Merge-Request-Gate.

### `npm run eval:compare`
**Befehl:** `npm run eval:generate && npx promptfoo eval -c promptfooconfig.yaml --output eval/results/latest.html && open eval/results/latest.html`
**Beschreibung:** Generiert HTML-Vergleichsreport und oeffnet ihn im Browser.
**Output:** `eval/results/latest.html`

### `npm run eval:push`
**Befehl:** `npx tsx scripts/push-scores-to-langfuse.ts eval/results/latest.json`
**Beschreibung:** Pusht Promptfoo-Ergebnisse als Scores zu Langfuse. Erstellt einen Trace mit 16 Spans und Aggregate-Scores: `eval_pass_rate`, `eval_cost`, `eval_latency`.

### `npm run eval:full`
**Befehl:** `npm run eval && npm run eval:push`
**Beschreibung:** **Kompletter Eval-Workflow:** Docker-Evaluation + Scores zu Langfuse pushen.
**Wann verwenden:** Fuer vollstaendige Evaluation mit Langfuse-Integration und Trend-Tracking.

### `npm run eval:no-cache`
**Befehl:** `npx promptfoo eval --no-cache`
**Beschreibung:** Evaluation ohne Cache - erzwingt frische LLM-Calls fuer jeden Test Case.

### `npm run eval:staging`
**Befehl:** `dotenv -e .env.staging -- npx promptfoo eval`
**Beschreibung:** Evaluation gegen die Staging-Umgebung (laedt `.env.staging` Variablen).

### `npm run eval:production`
**Befehl:** `dotenv -e .env.production -- npx promptfoo eval --no-cache`
**Beschreibung:** Evaluation gegen Production ohne Cache. Nutzt `.env.production` Variablen.

---

## 4. Evaluation - DeepEval Tier 2 (5 Scripts)

### `npm run eval:deepeval:start`
**Befehl:** `docker compose up -d deepeval`
**Beschreibung:** Startet den DeepEval Docker-Container im Hintergrund.

### `npm run eval:deepeval:stop`
**Befehl:** `docker compose stop deepeval`
**Beschreibung:** Stoppt den DeepEval-Container.

### `npm run eval:deepeval`
**Befehl:** `docker exec deepeval-runner deepeval test run eval/deepeval/test_proofreader.py`
**Beschreibung:** Fuehrt wissenschaftliche DeepEval-Metriken aus.
**Metriken:** Faithfulness, Answer Relevancy, Hallucination Detection

### `npm run eval:deepeval:generate`
**Befehl:** `docker exec deepeval-runner python eval/deepeval/generate_synthetic_data.py`
**Beschreibung:** Generiert synthetische Testdaten fuer Edge Cases und adversarial Szenarien.

### `npm run eval:deepeval:logs`
**Befehl:** `docker logs -f deepeval-runner`
**Beschreibung:** Follow-Logs des DeepEval-Containers.

---

## 5. Dataset Management (2 Scripts)

### `npm run dataset:upload`
**Befehl:** `npx tsx eval/upload-dataset-to-langfuse.ts`
**Beschreibung:** Laedt `eval/golden_dataset.json` als Langfuse-Dataset hoch.
**Dataset Name:** `veeds-proofreader-golden`

### `npm run dataset:export`
**Befehl:** `npx tsx scripts/export-production-traces.ts`
**Beschreibung:** Exportiert interessante Production-Traces aus Langfuse fuer den Feedback Loop.
**Use Case:** Gute/problematische Production-Faelle ins Golden Dataset uebernehmen.

---

## 6. Red Team Security Testing (6 Scripts)

### `npm run redteam`
**Befehl:** `dotenv -e .env -- npx promptfoo redteam run --config redteamconfig.yaml`
**Beschreibung:** Fuehrt adversarial Security-Tests aus: Prompt Injection, Jailbreaking, PII Leakage, Hallucination.
**Output:** 50+ generierte Angriffsszenarien mit Pass/Fail.

### `npm run redteam:docker`
**Befehl:** `docker compose exec -t promptfoo npx promptfoo redteam run --config /app/redteamconfig-docker.yaml`
**Beschreibung:** Red Team Tests im Docker-Container mit separater Config.

### `npm run redteamFull`
**Befehl:** `dotenv -e .env -- npx promptfoo redteam run --config redteamconfigFiull.yaml`
**Beschreibung:** Erweiterte Red Team Config (voller Angriffsumfang).

### `npm run redteam:report`
**Befehl:** `npx promptfoo redteam report`
**Beschreibung:** Generiert Security-Report mit Vulnerability-Analyse, Pass/Fail Rate und Risiko-Level.

### `npm run redteam:setup`
**Befehl:** `npx promptfoo redteam setup`
**Beschreibung:** Interaktiver Setup-Wizard fuer Red Team Konfiguration.

### `npm run redteam:full`
**Befehl:** `npm run redteam && npm run redteam:report && npx promptfoo view`
**Beschreibung:** **Kompletter Security-Workflow:** Angriffe ausfuehren + Report generieren + Web-UI oeffnen.

---

## 7. Load Testing - k6 (3 Scripts)

Alle k6-Tests laufen als Docker-Container gegen den GraphQL-Endpoint.

### `npm run test:load`
**Befehl:** `docker run --rm -i -v %cd%:/app -e API_URL=http://host.docker.internal:4000/graphql grafana/k6 run /app/tests/load/graphql-test.js`
**Beschreibung:** Standard Load Test mit 20 Virtual Users ueber 2 Minuten.
**Metriken:** p95/p99 Latency, Error Rate, Throughput

### `npm run test:load:smoke`
**Befehl:** `... k6 run --vus 1 --duration 10s /app/tests/load/graphql-test.js`
**Beschreibung:** Smoke Test: 1 VU, 10 Sekunden. Schneller Sanity-Check ob der Endpoint antwortet.

### `npm run test:load:stress`
**Befehl:** `... -e K6_SCENARIO=stress k6 run /app/tests/load/graphql-test.js`
**Beschreibung:** Stress Test mit bis zu 200 VUs. Findet Performance-Limits und Bottlenecks.

---

## 8. Unit Tests - Jest (3 Scripts)

Alle Tests nutzen Jest mit ESM-Support (`--experimental-vm-modules`) und `ts-jest` fuer TypeScript.

### `npm run test`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js`
**Beschreibung:** Fuehrt alle Jest Unit Tests aus. Beinhaltet Property-based Tests (fast-check).

### `npm run test:watch`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --watch`
**Beschreibung:** Jest im Watch-Mode. Re-run bei Datei-Aenderungen.

### `npm run test:coverage`
**Befehl:** `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage`
**Beschreibung:** Tests mit Coverage-Report.

---

## 9. Demo & Security-Verifikation (4 Scripts)

### `npm run demo`
**Befehl:** `npx tsx scripts/demo-proofreader.ts`
**Beschreibung:** E2E-Demo: Schickt YAML-Fahrzeugdaten durch den Proofreader mit Live-Langfuse-Tracing. Zeigt den kompletten Request-Lifecycle.

### `npm run test:verify`
**Befehl:** `npx tsx scripts/verify-security.ts`
**Beschreibung:** Verifiziert Security-Features: PII-Filter, Input-Sanitization, Prompt-Injection-Schutz.

### `npm run test:pii`
**Befehl:** `npx tsx scripts/debug-pii.ts`
**Beschreibung:** Debug-Tool fuer PII-Filter. Zeigt welche personenbezogenen Daten (Namen, E-Mails, Telefonnummern) erkannt und anonymisiert werden.

### `npm run demo:presidio`
**Befehl:** `npx tsx scripts/demo-presidio.ts`
**Beschreibung:** Demonstriert die Microsoft Presidio PII-Redaction im Detail.

---

## 10. Build & Development (4 Scripts)

### `npm run build`
**Befehl:** `tsc`
**Beschreibung:** Kompiliert TypeScript zu JavaScript (ES2022, ESM).
**Output:** `dist/` Verzeichnis

### `npm run dev`
**Befehl:** `tsx watch src/index.ts`
**Beschreibung:** Development-Mode mit Hot-Reload via tsx.

### `npm run serve`
**Befehl:** `tsx src/server.ts`
**Beschreibung:** Startet den GraphQL-Server (graphql-yoga). Endpoint fuer Proofreading-Mutations.

### `npm run start`
**Befehl:** `node dist/agentcore-evaluations-example.js`
**Beschreibung:** Startet die kompilierte Anwendung aus `dist/`.

---

## 11. Automation & Datengenerierung (4 Scripts)

### `npm run automation:score`
**Befehl:** `docker compose --profile deepeval run --rm deepeval python scripts/auto-scorer.py`
**Beschreibung:** Automatisches Scoring von Production-Traces in Langfuse. Bewertet neue Traces nach Qualitaetskriterien.

### `npm run generate`
**Befehl:** `npx promptfoo generate dataset --config promptfooconfig.yaml --output datasets/generated-tests.yaml`
**Beschreibung:** Nutzt Promptfoos eigene Datengenerierung um synthetische Testdaten zu erzeugen.

### `npm run generate:de`
**Befehl:** `npx promptfoo generate dataset --config promptfooconfig.yaml --instructions "Generiere Test-Fragen auf Deutsch fuer einen Fahrzeuginformations-Assistenten. Themen: VIN, LKW-Technik, Elektro-LKW, Abgasnormen." --numPersonas 5 --numTestCasesPerPersona 4 --output datasets/generated-tests.yaml`
**Beschreibung:** Generiert deutsche Testdaten mit 5 Personas und je 4 Test Cases fuer den Fahrzeug-Domaenenkontext.

### `npm run cache:clear`
**Befehl:** `npx promptfoo cache clear`
**Beschreibung:** Leert den Promptfoo-Cache. Nuetzlich wenn gecachte LLM-Antworten veraltet sind.

---

## 12. Tracing & Observability (9 Scripts)

Diese Scripts steuern optionale Tracing-Profile im Docker Compose.

### `npm run tracing:start`
**Befehl:** `docker-compose --profile tracing up -d`
**Beschreibung:** Startet OpenTelemetry Collector + Tracing-Backend.

### `npm run tracing:stop`
**Befehl:** `docker-compose --profile tracing down`
**Beschreibung:** Stoppt den Tracing-Stack.

### `npm run tracing:jaeger`
**Befehl:** `start http://localhost:16686`
**Beschreibung:** Oeffnet die Jaeger UI im Browser (Distributed Tracing Visualisierung).

### `npm run xray:start` / `npm run xray:stop`
**Befehl:** `docker-compose --profile xray up -d` / `docker-compose --profile xray down`
**Beschreibung:** Startet/stoppt AWS X-Ray kompatibles Tracing (ADOT Collector).

### `npm run tempo:start` / `npm run tempo:stop`
**Befehl:** `docker-compose --profile tempo up -d` / `docker-compose --profile tempo down`
**Beschreibung:** Startet/stoppt Grafana Tempo als Trace-Backend.

### `npm run grafana:open`
**Befehl:** `start http://localhost:8222`
**Beschreibung:** Oeffnet das Grafana Dashboard im Browser.

### `npm run langfuse:open`
**Befehl:** `start http://localhost:3310`
**Beschreibung:** Oeffnet die Langfuse UI im Browser.

---

## 13. Legacy/Experimentelle Scripts (15+ Scripts)

Die folgenden Scripts stammen aus frueheren Entwicklungsphasen und sollten **nicht** fuer den regulaeren Betrieb verwendet werden.

### Veraltete Build/Dev-Scripts
| Script | Befehl | Grund |
|---|---|---|
| `build1` | `tsc` | Duplikat von `build` |
| `dev1` | `ts-node agentcore-evaluations-example.ts` | Nutzt `ts-node` statt `tsx` |
| `dev:real` | `ts-node agentcore-evaluations-real.ts` | Alter Entwicklungs-Entry-Point |
| `dev:promptfoo` | `ts-node promptfoo-evaluations.ts` | Altes Promptfoo-Prototyping |

### Veraltete Eval-Configs
| Script | Config-Datei | Grund |
|---|---|---|
| `eval1` | (default) | Einfaches `npx promptfoo eval` ohne Config |
| `eval:advanced` | `promptfooconfig-advanced.yaml` | Experimentell |
| `eval:modular` | `promptfooconfig-modular.yaml` | Experimentell |
| `eval:all-features` | `promptfooconfig-all-features.yaml` | Experimentell |
| `eval:scenarios` | `promptfooconfig-scenarios.yaml` | Experimentell |
| `eval:comparison` | `promptfooconfig-comparison.yaml` | Experimentell |
| `eval:python` | `promptfooconfig-python-assertions.yaml` | Python-Assertions |
| `eval:astro` | `promptfooconfig-astro-graphql.yaml` | Astro GraphQL Prototyp |
| `eval:astro-extended` | `promptfooconfig-astro-graphql-extended.yaml` | Astro GraphQL Prototyp |
| `eval:astro-tracing` | `promptfooconfig-astro-graphql-with-tracing.yaml` | Astro + OTel Prototyp |
| `eval:astro-jaeger` | `promptfooconfig-astro-graphql-jaeger.yaml` | Astro + Jaeger Prototyp |
| `eval:astro-dual` | `promptfooconfig-astro-graphql-dual-export.yaml` | Astro Dual-Export Prototyp |
| `eval:view1` | - | `npx promptfoo view --port 3210` (lokal) |

### Veraltete Test-Scripts (Vitest)
| Script | Befehl | Grund |
|---|---|---|
| `test1` | `vitest run` | Projekt nutzt jetzt Jest |
| `test:watch1` | `vitest` | Projekt nutzt jetzt Jest |
| `test:coverage1` | `vitest run --coverage` | Projekt nutzt jetzt Jest |

---

## 14. Kompletter End-to-End Workflow

### Uebersicht aller Phasen

```
Phase 1: SETUP          Phase 2: DEVELOP        Phase 3: EVALUATE
----------------         ---------------         -----------------
npm run up               npm run dev             npm run eval:generate
       |                        |                        |
       v                        v                        v
npm run health           npm run test            npm run eval
       |                        |                        |
       v                        v                        v
npm run seed             npm run demo            npm run eval:push
       |                                                 |
       v                                                 v
npm run demo                                    npm run eval:view


Phase 4: SECURITY        Phase 5: PERFORMANCE    Phase 6: FEEDBACK LOOP
-----------------        --------------------    ----------------------
npm run redteam          npm run test:load:smoke npm run dataset:export
       |                        |                        |
       v                        v                        v
npm run redteam:report   npm run test:load       Golden Dataset anpassen
       |                        |                        |
       v                        v                        v
npm run test:pii         npm run test:load:stress npm run dataset:upload
```

### Phase 1 - Ersteinrichtung

```bash
npm run up              # 1. Docker-Stack starten (6 Container)
npm run health          # 2. Warten bis alle Services healthy sind
npm run seed            # 3. Prompt + Golden Dataset in Langfuse laden
npm run demo            # 4. Smoke-Test: Ein Proofreading mit Tracing
```

**Ergebnis:** Langfuse laeuft auf http://localhost:3000 mit geseedertem Prompt und Dataset.

### Phase 2 - Taegliche Entwicklung

```bash
npm run dev             # Hot-Reload Entwicklung an src/
npm run test            # Unit Tests (Jest + fast-check Property Tests)
npm run test:watch      # Optional: Watch-Mode fuer schnelles Feedback
npm run demo            # Manuelle Verifikation gegen AWS Bedrock
npm run serve           # GraphQL Server starten (fuer k6 Tests oder Frontend)
```

### Phase 3 - LLM-Evaluation (Tier 1: Promptfoo)

```bash
npm run eval:generate   # Golden Dataset -> Promptfoo YAML (16 Cases, ~70 Assertions)
npm run eval            # Evaluation im Docker gegen AWS Bedrock
npm run eval:push       # Scores -> Langfuse (pass_rate, cost, latency)
npm run eval:view       # Ergebnisse im Browser inspizieren

# Oder als Einzeiler:
npm run eval:full       # = eval + eval:push (empfohlen)
```

**Ergebnis:** Eval-Scores in Langfuse sichtbar, Trend-Tracking ueber Zeit.

### Phase 4 - Security Audit (Red Team)

```bash
npm run redteam:full    # Prompt Injection + Jailbreaking + PII Tests -> Report -> UI
npm run test:verify     # Security-Features verifizieren
npm run test:pii        # PII-Anonymisierung pruefen
npm run demo:presidio   # Presidio PII-Redaction testen
```

**Ergebnis:** Security-Report mit Vulnerabilities und Risiko-Bewertung.

### Phase 5 - Performance Testing (k6)

```bash
npm run serve           # GraphQL Server starten (falls nicht schon laufend)
npm run test:load:smoke # Quick Sanity (1 VU, 10s)
npm run test:load       # Standard (20 VUs, 2min)
npm run test:load:stress # Stress (200 VUs) - Performance-Limits finden
```

**Ergebnis:** p95/p99 Latency, Error Rates, Throughput-Metriken.

### Phase 6 - CI/CD Integration (GitLab)

```bash
npm run eval:assert     # Quality Gate: Exit 1 bei Failures -> blockiert MR
npm run test            # Unit Tests
npm run test:load       # Performance Regression Detection
npm run eval:push       # Scores fuer Langfuse Trending
```

**Reihenfolge in .gitlab-ci.yml:** quality (eval:assert) -> performance (k6) -> report

### Phase 7 - Feedback Loop (Continuous Improvement)

```bash
npm run dataset:export    # Interessante Production-Traces aus Langfuse exportieren
# -> Manuell: Gute/problematische Cases ins eval/golden_dataset.json uebernehmen
npm run dataset:upload    # Aktualisiertes Dataset -> Langfuse
npm run prompt:sync       # Prompt-Versionen zwischen Git und Langfuse synchronisieren
npm run eval:full         # Erneute Evaluation mit erweiterten Daten
```

**Ergebnis:** Stetig wachsendes Golden Dataset, bessere Abdeckung.

### Phase 8 - Erweiterte Evaluation (Tier 2: DeepEval)

```bash
npm run eval:deepeval:start    # DeepEval Container starten
npm run eval:deepeval:generate # Synthetische Daten generieren
npm run eval:deepeval          # Wissenschaftliche Metriken ausfuehren
npm run eval:deepeval:logs     # Ergebnisse pruefen
npm run eval:deepeval:stop     # Container stoppen
```

**Ergebnis:** Faithfulness, Answer Relevancy und Hallucination Scores.

---

## 15. Quick Reference

| Aufgabe | Script | Kategorie |
|---------|--------|-----------|
| Container starten | `npm run up` | Infrastruktur |
| Container stoppen | `npm run down` | Infrastruktur |
| Health Check | `npm run health` | Infrastruktur |
| Langfuse seeden | `npm run seed` | Setup |
| Demo ausfuehren | `npm run demo` | Entwicklung |
| Dev-Server starten | `npm run dev` | Entwicklung |
| GraphQL Server | `npm run serve` | Entwicklung |
| TypeScript kompilieren | `npm run build` | Entwicklung |
| Unit Tests | `npm run test` | Testing |
| Evaluation (komplett) | `npm run eval:full` | Evaluation |
| Evaluation (CI Gate) | `npm run eval:assert` | Evaluation |
| Ergebnisse ansehen | `npm run eval:view` | Evaluation |
| Security-Test (komplett) | `npm run redteam:full` | Security |
| PII pruefen | `npm run test:pii` | Security |
| Load-Test (Smoke) | `npm run test:load:smoke` | Performance |
| Load-Test (Standard) | `npm run test:load` | Performance |
| Load-Test (Stress) | `npm run test:load:stress` | Performance |
| Dataset exportieren | `npm run dataset:export` | Feedback Loop |
| Dataset hochladen | `npm run dataset:upload` | Feedback Loop |
| Logs ansehen | `npm run logs` | Debugging |

---

**Letzte Aktualisierung:** 2026-02-08
