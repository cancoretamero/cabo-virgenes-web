#!/bin/bash
# Cabo Vírgenes — Setup en el Pod RunPod (Argos Translate, sin transformers)

set -e

echo "=== 1) Instalando dependencias mínimas ==="
pip install --quiet --root-user-action=ignore --upgrade pip

# Argos Translate trae su propio CTranslate2; es independiente de transformers/torch.
# Esto evita cualquier conflicto de versiones con transformers nuevos.
pip install --quiet --root-user-action=ignore \
  "argostranslate==1.9.6" \
  "fastapi==0.110.0" \
  "uvicorn[standard]==0.27.1" \
  "pydantic==2.6.1"

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

echo "=== 3) Liberando puerto 8000 (si había un server previo) ==="
pkill -f "python3 .*server.py" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

echo "=== 4) Arrancando API en background (descarga modelos al boot) ==="
mkdir -p /workspace/logs
nohup python3 /workspace/server.py > /workspace/logs/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

# Esperar a que arranque (descarga modelos, puede tardar 1-2 min)
echo "Esperando a que la API esté lista..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ API responde en localhost:8000"
    curl -s http://localhost:8000/ | head -3
    break
  fi
  sleep 2
  if [ $i -eq 60 ]; then
    echo "✗ API tardó >120s. Mostrando últimas 30 líneas del log:"
    tail -30 /workspace/logs/api.log
    exit 1
  fi
done

echo ""
echo "=== 5) Arrancando Cloudflare Tunnel ==="
nohup cloudflared tunnel --url http://localhost:8000 --no-autoupdate > /workspace/logs/tunnel.log 2>&1 &
sleep 8

PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /workspace/logs/tunnel.log | head -1)
if [ -n "$PUBLIC_URL" ]; then
  echo ""
  echo "==========================================="
  echo "✓ TODO LISTO"
  echo ""
  echo "  URL pública: $PUBLIC_URL"
  echo "  Health:    $PUBLIC_URL/"
  echo "  Translate: POST $PUBLIC_URL/translate"
  echo "==========================================="
  echo "$PUBLIC_URL" > /workspace/PUBLIC_URL.txt

  echo ""
  echo "=== Test rápido ==="
  curl -s -X POST "$PUBLIC_URL/translate" \
    -H "Content-Type: application/json" \
    -d '{"texts":["Hola mundo"],"target_lang":"en","source_lang":"es"}' | head -3
else
  echo "Tunnel no listo aún. Mira: tail -f /workspace/logs/tunnel.log"
fi
