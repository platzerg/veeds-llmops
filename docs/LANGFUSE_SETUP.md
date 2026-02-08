# Langfuse Configuration Guide (Self-Hosting & Headless)

Hier ist eine Übersicht der sinnvollsten Environment Variables für Ihr Setup.

## 1. Headless Initialization (Automatisches Setup)
Diese Variablen sorgen dafür, dass Langfuse beim Start bereits "fertig" ist (Projekt, User, API Keys), ohne dass Sie durchs UI klicken müssen.

| Variable | Nutzen | Ihr Status |
| :--- | :--- | :--- |
| `LANGFUSE_INIT_ORG_ID` | Setzt eine feste ID für die Organisation. | ✅ Genutzt (`default-org`) |
| `LANGFUSE_INIT_ORG_NAME` | Der Anzeigename der Organisation im UI. | ✅ Genutzt ("VEEDS Org") |
| `LANGFUSE_INIT_PROJECT_ID` | Setzt eine feste Projekt-ID. Wichtig für Datenbank-Queries. | ✅ Genutzt (`clx...def`) |
| `LANGFUSE_INIT_PROJECT_NAME` | Anzeigename des Projekts. | ✅ Genutzt ("VEEDS Proofreader") |
| `LANGFUSE_INIT_PROJECT_PUBLIC_KEY` | **Sehr Wichtig:** Legt den Public Key fest. Muss mit `.env` übereinstimmen. | ✅ Genutzt (Variable) |
| `LANGFUSE_INIT_PROJECT_SECRET_KEY` | **Sehr Wichtig:** Legt den Secret Key fest. Muss mit `.env` übereinstimmen. | ✅ Genutzt (Variable) |
| `LANGFUSE_INIT_USER_EMAIL` | Erstellt automatisch einen Admin-User (Admin-Zugriff). | ✅ Genutzt (`admin@langfuse.com`) |
| `LANGFUSE_INIT_USER_PASSWORD` | Setzt das Passwort für den Admin-User. | ✅ Genutzt (`password`) |

## 2. Sicherheit & Zugriff
Für ein lokales oder internes Setup wichtig, um unerwünschte Zugriffe zu verhindern.

| Variable | Nutzen | Empfehlung |
| :--- | :--- | :--- |
| `AUTH_DISABLE_SIGNUP` | Deaktiviert die Registrierung für Fremde. | ✅ `true` (Sehr sinnvoll) |
| `AUTH_DISABLE_USERNAME_PASSWORD_UI` | Versteckt Login-Maske (nur SSO). | ❌ `false` (Sonst kein Login möglich) |
| `NEXTAUTH_URL` | Die genaue URL der Instanz (für Redirects). | ✅ `http://127.0.0.1:3310` |

## 3. Telemetrie & Datenschutz
Langfuse sendet standardmäßig anonyme Nutzungsstatistiken.

| Variable | Nutzen | Empfehlung |
| :--- | :--- | :--- |
| `TELEMETRY_ENABLED` | Schaltet das "Nach-Hause-Telefonieren" ab. | `false` (Wenn strikter Datenschutz gewünscht) |

## 4. Performance & Logging
Nützlich bei Problemen oder hoher Last.

| Variable | Nutzen | Empfehlung |
| :--- | :--- | :--- |
| `LANGFUSE_LOG_LEVEL` | Detailgrad der Logs (`debug`, `info`, `error`). | `info` (Standard), `debug` bei Problemen |
| `LANGFUSE_TRACING_BATCH_SIZE` | Wie viele Traces gebündelt gesendet werden. | Standard lassen, außer bei Netzwerkproblemen. |

## Ihre aktuelle Konfiguration (Zusammenfassung)
Sie nutzen bereits die **wichtigsten** Variablen für ein wartungsfreies Setup. 
Das `docker-compose.yml` ist so eingestellt, dass:
1.  Ein Admin-User existiert.
2.  Das Projekt mit exakt den API-Keys aus der `.env` erstellt wird.
3.  Fremde sich nicht registrieren können.

**Tipp:** Falls Sie keine Daten an die Langfuse-Entwickler senden wollen, fügen Sie `TELEMETRY_ENABLED: "false"` zu `docker-compose.yml` hinzu.
