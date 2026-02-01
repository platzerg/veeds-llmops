#!/bin/bash
# =============================================================================
# VEEDS LLMOps - Setup Script
# Generates secure secrets and creates .env file
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "🔧 VEEDS LLMOps Stack - Setup"
echo "=============================="
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env already exists."
    read -p "   Overwrite? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Aborted."
        exit 0
    fi
fi

# Generate secrets
echo "🔑 Generating secrets..."
NEXTAUTH_SECRET=$(openssl rand -hex 32)
SALT=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
CLICKHOUSE_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)

cat > "$ENV_FILE" <<EOF
# =============================================================================
# VEEDS LLMOps Stack - Environment Variables
# Generated on: $(date -Iseconds)
# =============================================================================

# --- Langfuse Auth Secrets ---
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
SALT=${SALT}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# --- Langfuse URL ---
NEXTAUTH_URL=http://localhost:3000
LANGFUSE_PORT=3000

# --- PostgreSQL ---
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=langfuse

# --- ClickHouse ---
CLICKHOUSE_USER=clickhouse
CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD}

# --- Redis ---
REDIS_PASSWORD=

# --- MinIO (S3) ---
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_PORT=9090
S3_BUCKET=langfuse

# --- Langfuse API Keys (set after first login in UI) ---
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=http://localhost:3000

# --- AWS Bedrock ---
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# --- Promptfoo ---
PROMPTFOO_CACHE_ENABLED=true
EOF

echo "✅ .env created with secure random secrets"
echo ""
echo "📋 Next steps:"
echo "   1. Review .env and adjust if needed"
echo "   2. docker compose up -d"
echo "   3. Open http://localhost:3000"
echo "   4. Create account → Organization → Project"
echo "   5. Copy API keys to .env (LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY)"
echo "   6. npm install"
echo ""
echo "🔒 Keep .env secret! It's in .gitignore."
