#!/bin/bash
# DocuMind — Railway Deployment Script
# Run this AFTER: railway login

set -e

ROOT="/Users/shashu/Documents/ai-tools-wiki-rag"
RAILWAY="railway"

echo ""
echo "================================================"
echo "  DocuMind — Railway Deployment"
echo "================================================"
echo ""

# ── 1. Create project ─────────────────────────────
echo "→ Creating Railway project..."
cd "$ROOT"
$RAILWAY init --name "documind" 2>/dev/null || true

# ── 2. Deploy Backend ─────────────────────────────
echo ""
echo "→ Deploying backend service..."
cd "$ROOT/backend"
$RAILWAY service create --name "backend" 2>/dev/null || true
$RAILWAY variables set \
  OPENROUTER_API_KEY="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" \
  CLAUDE_MODEL="anthropic/claude-sonnet-4-5" \
  EMBEDDING_MODEL="all-mpnet-base-v2" \
  CHUNK_SIZE="512" \
  CHUNK_OVERLAP="50" \
  TOP_K_CHUNKS="5" \
  MAX_HISTORY_TURNS="10" \
  PDF_DIR="./pdfs" \
  CHROMA_PATH="./chroma_db" \
  PORT="8000"
$RAILWAY up --detach

echo ""
echo "⏳  Backend deploying... getting URL..."
sleep 5
BACKEND_URL=$($RAILWAY domain 2>/dev/null || echo "")
echo "   Backend URL: $BACKEND_URL"

# ── 3. Deploy Frontend ────────────────────────────
echo ""
echo "→ Deploying frontend service..."
cd "$ROOT/frontend"
$RAILWAY service create --name "frontend" 2>/dev/null || true
$RAILWAY variables set \
  NEXT_PUBLIC_API_URL="https://${BACKEND_URL}" \
  PORT="3000" \
  NODE_ENV="production"
$RAILWAY up --detach

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "  Backend: https://$BACKEND_URL"
echo "  Check dashboard: https://railway.app/dashboard"
echo "================================================"
echo ""
echo "NOTE: First deploy takes 5-10 min (building Docker images)."
echo "The backend will also download the 420MB embedding model on first start."
