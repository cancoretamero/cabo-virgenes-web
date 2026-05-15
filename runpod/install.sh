#!/bin/bash
# Cabo Vírgenes — Setup completo en Pod RunPod
# Translation (Argos) + Chat LLM (Qwen2-1.5B GGUF) + Cloudflare Tunnel

set -e

echo "=== 1) Dependencias Python ==="
pip install --quiet --root-user-action=ignore --upgrade pip
pip install --quiet --root-user-action=ignore \
  "argostranslate==1.9.6" \
  "fastapi==0.110.0" \
  "uvicorn[standard]==0.27.1" \
  "pydantic==2.6.1"

echo "=== 2) Instalando llama-cpp-python con CUDA (chat LLM) ==="
# Si hay GPU, intentamos versión con CUDA. Si falla, fallback a CPU.
if command -v nvidia-smi >/dev/null 2>&1; then
  CMAKE_ARGS="-DGGML_CUDA=on" pip install --quiet --root-user-action=ignore --upgrade --force-reinstall --no-cache-dir llama-cpp-python==0.2.85 2>&1 | tail -3 || \
  pip install --quiet --root-user-action=ignore llama-cpp-python==0.2.85
else
  pip install --quiet --root-user-action=ignore llama-cpp-python==0.2.85
fi

echo "=== 3) Descargando modelo Qwen2-1.5B-Instruct GGUF Q4_K_M (~1GB) ==="
mkdir -p /workspace/models
MODEL_FILE="/workspace/models/qwen2-1_5b-instruct-q4_k_m.gguf"
if [ ! -f "$MODEL_FILE" ]; then
  curl -L --progress-bar \
    "https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf?download=true" \
    -o "$MODEL_FILE"
  echo "✓ Modelo descargado ($(du -h $MODEL_FILE | cut -f1))"
else
  echo "✓ Modelo ya existe ($(du -h $MODEL_FILE | cut -f1))"
fi

echo "=== 4) Pre-instalando los 6 paquetes de Argos (es→en/fr/pt/zh/de/it) ==="
python3 -c "
import argostranslate.package as p
p.update_package_index()
av = p.get_available_packages()
for to in ['en','fr','pt','zh','de','it']:
    pk = next((x for x in av if x.from_code=='es' and x.to_code==to), None)
    already = any(x.from_code=='es' and x.to_code==to for x in p.get_installed_packages())
    if pk and not already:
        print(f'  + es->{to}')
        p.install_from_path(pk.download())
    elif already:
        print(f'  ✓ es->{to} ya instalado')
    else:
        print(f'  ✗ es->{to} no disponible')
"

echo "=== 5) Cloudflared ==="
if [ ! -f /usr/local/bin/cloudflared ]; then
  ARCH=$(uname -m)
  if [ "$ARCH" = "x86_64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  else
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  fi
  curl -sL "$URL" -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared
fi
cloudflared --version

echo "=== 6) Liberando puertos ==="
pkill -f "python3 .*server.py" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

echo "=== 7) Arrancando server (carga modelo en GPU) ==="
mkdir -p /workspace/logs
nohup python3 /workspace/server.py > /workspace/logs/api.log 2>&1 &
API_PID=$!
echo "PID: $API_PID. Esperando readiness (puede tardar 30-60s al cargar el LLM)..."

for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ API ready"
    curl -s http://localhost:8000/ | python3 -m json.tool
    break
  fi
  sleep 2
  if [ $i -eq 60 ]; then
    echo "✗ Timeout. Log:"
    tail -40 /workspace/logs/api.log
    exit 1
  fi
done

echo ""
echo "=== 8) Cloudflare Tunnel ==="
nohup cloudflared tunnel --url http://localhost:8000 --no-autoupdate > /workspace/logs/tunnel.log 2>&1 &
sleep 8

PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /workspace/logs/tunnel.log | head -1)
if [ -n "$PUBLIC_URL" ]; then
  echo "$PUBLIC_URL" > /workspace/PUBLIC_URL.txt
  echo ""
  echo "==========================================="
  echo "✓ TODO LISTO"
  echo ""
  echo "  URL pública: $PUBLIC_URL"
  echo "  Health:    GET  $PUBLIC_URL/"
  echo "  Translate: POST $PUBLIC_URL/translate"
  echo "  Chat:      POST $PUBLIC_URL/chat"
  echo "==========================================="
  echo ""
  echo "Test traducción:"
  curl -s -X POST "$PUBLIC_URL/translate" -H "Content-Type: application/json" \
    -d '{"texts":["Pesca, procesamiento y exportación"],"target_lang":"en"}' | python3 -m json.tool
  echo ""
  echo "Test chat:"
  curl -s -X POST "$PUBLIC_URL/chat" -H "Content-Type: application/json" \
    -d '{"message":"¿Qué productos venden?"}' | python3 -m json.tool
else
  echo "Tunnel no listo. Revisa: tail /workspace/logs/tunnel.log"
fi
