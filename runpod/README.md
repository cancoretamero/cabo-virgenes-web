# Cabo Vírgenes — RunPod Translation Server

## Setup en el Pod

1. SSH al pod (o abre Web Terminal):
   ```bash
   ssh root@157.157.221.29 -p 25226 -i ~/.ssh/id_ed25519
   ```

2. Sube los archivos `server.py` e `install.sh` al pod (con SCP o pegándolos):
   ```bash
   scp -P 25226 -i ~/.ssh/id_ed25519 server.py install.sh root@157.157.221.29:/workspace/
   ```

3. Ejecuta el setup:
   ```bash
   chmod +x /workspace/install.sh
   bash /workspace/install.sh
   ```

4. Al final imprime una URL `https://xxxxx.trycloudflare.com`. Esa es tu API pública.

## Endpoint

- **Health**: `GET https://xxxxx.trycloudflare.com/`
- **Translate**: `POST https://xxxxx.trycloudflare.com/translate`
  ```json
  {
    "texts": ["Hola mundo", "Hasta luego"],
    "target_lang": "en",
    "source_lang": "es"
  }
  ```
  Respuesta:
  ```json
  { "translations": ["Hello world", "See you later"] }
  ```

## Idiomas soportados

`es, en, fr, pt, zh, de, it, ja, ko, ar, ru` (NLLB-200 soporta 200, fácil de extender)

## Logs

- API: `/workspace/logs/api.log`
- Tunnel: `/workspace/logs/tunnel.log`
- URL pública: `/workspace/PUBLIC_URL.txt`
