#!/bin/bash
# Cabo Vírgenes — Setup en el Pod RunPod
# Instala dependencias + descarga modelo + arranca server + cloudflared tunnel

set -e

echo "=== 1) Instalando deps Python ==="
pip install --quiet --upgrade pip
pip install --quiet \
  "torch>=2.0" \
  "transformers>=4.40" \
  "sentencepiece>=0.2" \
  "fastapi>=0.110" \
  "uvicorn[standard]>=0.27" \
  "pydantic>=2.5"

echo "=== 2) Instalando cloudflared (tunnel público gratis) ==="
if [ ! -f /usr/local/bin/cloudflared ]; then
  ARCH=$(uname -m)
  if [ "$ARCH" = "x86_64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  else
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  fi
  curl -sL "$URL" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi
cloudflared --version

echo "=== 3) Pre-descargando modelo NLLB-200 distilled (~1.3GB) ==="
python3 -c "
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
m = 'facebook/nllb-200-distilled-600M'
print('Downloading tokenizer...')
AutoTokenizer.from_pretrained(m)
print('Downloading model...')
AutoModelForSeq2SeqLM.from_pretrained(m)
print('Model cached.')
"

echo "=== 4) Arrancando API en background ==="
mkdir -p /workspace/logs
nohup python3 /workspace/server.py > /workspace/logs/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"
sleep 5

# Health check
if curl -sf http://localhost:8000/ > /dev/null; then
  echo "✓ API responde en localhost:8000"
else
  echo "✗ API no responde — revisar /workspace/logs/api.log"
  tail -20 /workspace/logs/api.log
  exit 1
fi

echo "=== 5) Arrancando Cloudflare Tunnel (URL pública gratuita) ==="
nohup cloudflared tunnel --url http://localhost:8000 --no-autoupdate > /workspace/logs/tunnel.log 2>&1 &
sleep 6

# Extrae la URL pública del log
PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /workspace/logs/tunnel.log | head -1)
if [ -n "$PUBLIC_URL" ]; then
  echo ""
  echo "==========================================="
  echo "✓ TODO LISTO"
  echo ""
  echo "  Endpoint público: $PUBLIC_URL"
  echo "  Health: $PUBLIC_URL/"
  echo "  Translate: POST $PUBLIC_URL/translate"
  echo "==========================================="
  echo "$PUBLIC_URL" > /workspace/PUBLIC_URL.txt
else
  echo "Tunnel aún no listo. Revisa /workspace/logs/tunnel.log en unos segundos."
fi
