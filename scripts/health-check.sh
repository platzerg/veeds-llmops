#!/bin/bash
# =============================================================================
# VEEDS LLMOps — Health Check
# =============================================================================
# Checks all services are running and reachable.
#
# Usage: ./scripts/health-check.sh
# =============================================================================
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass=0
fail=0
warn=0

check() {
    local name="$1"
    local cmd="$2"
    local required="${3:-true}"

    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} $name"
        ((pass++))
    elif [ "$required" = "true" ]; then
        echo -e "  ${RED}❌${NC} $name"
        ((fail++))
    else
        echo -e "  ${YELLOW}⚠️${NC}  $name (optional)"
        ((warn++))
    fi
}

echo ""
echo "🏥 VEEDS LLMOps Health Check"
echo "=============================="
echo ""

# ---------------------------------------------------------------------------
# Docker Services
# ---------------------------------------------------------------------------
echo "🐳 Docker Services:"

check "Docker running" "docker info"
check "Compose project up" "docker compose ps --status running | grep -q langfuse"

echo ""
echo "📦 Containers:"

for svc in langfuse-web langfuse-worker langfuse-postgres langfuse-clickhouse langfuse-redis langfuse-minio; do
    check "$svc" "docker inspect -f '{{.State.Running}}' $svc 2>/dev/null | grep -q true"
done

# ---------------------------------------------------------------------------
# Service Endpoints
# ---------------------------------------------------------------------------
echo ""
echo "🌐 Endpoints:"

check "Langfuse Web (http://localhost:3000)" \
    "curl -sf http://localhost:3000/api/public/health | grep -qi ok"

check "Langfuse Worker (localhost:3030)" \
    "curl -sf http://localhost:3030/api/health" \
    "false"

check "PostgreSQL (localhost:5432)" \
    "docker exec langfuse-postgres pg_isready -U postgres -q"

check "ClickHouse (localhost:8123)" \
    "curl -sf http://localhost:8123/ping | grep -q Ok"

check "Redis (localhost:6379)" \
    "docker exec langfuse-redis redis-cli ping | grep -q PONG"

check "MinIO S3 (localhost:9090)" \
    "curl -sf http://localhost:9090/minio/health/live"

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
echo ""
echo "🔐 Environment:"

# Source .env if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
    check ".env file exists" "true"
else
    check ".env file exists" "false"
fi

check "LANGFUSE_PUBLIC_KEY set" "[ -n '${LANGFUSE_PUBLIC_KEY:-}' ]" "false"
check "LANGFUSE_SECRET_KEY set" "[ -n '${LANGFUSE_SECRET_KEY:-}' ]" "false"
check "AWS_REGION set" "[ -n '${AWS_REGION:-}' ]" "false"

# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------
echo ""
echo "🔧 CLI Tools:"

check "Node.js" "node --version"
check "npm" "npm --version"
check "npx" "npx --version"
check "k6" "k6 version" "false"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=============================="
total=$((pass + fail + warn))
echo -e "  ${GREEN}Passed:${NC}  $pass"
echo -e "  ${RED}Failed:${NC}  $fail"
echo -e "  ${YELLOW}Warnings:${NC} $warn"
echo ""

if [ $fail -eq 0 ]; then
    echo -e "  ${GREEN}🎉 All required checks passed!${NC}"
    exit 0
else
    echo -e "  ${RED}⚠️  $fail required check(s) failed${NC}"
    echo ""
    echo "  Troubleshooting:"
    echo "    docker compose up -d     # Start services"
    echo "    docker compose logs -f   # Check logs"
    echo "    ./setup.sh               # Regenerate .env"
    exit 1
fi
