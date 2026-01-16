#!/bin/bash
# Update Coaching OS API keys on the server

cd ~/ongozacyberhub/frontend/nextjs_app || exit 1

cat > .env.production << 'ENVEOF'
# Next.js Environment Variables
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com

# Grok API Configuration (xAI) - Coaching OS
GROK_API_KEY=${GROK_API_KEY}

# Anthropic Claude API Configuration (Claude 3.5 Sonnet) - Coaching OS
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Llama Fallback Endpoint (Ollama)
LLAMA_ENDPOINT=http://localhost:11434
ENVEOF

echo "✅ Updated .env.production with Coaching OS API keys"
echo ""
echo "Verification:"
grep -E "GROK_API_KEY|ANTHROPIC_API_KEY" .env.production

