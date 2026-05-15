"""
Cabo Vírgenes — AI server (translation + chat LLM)
- Translation: Argos Translate (CTranslate2) — 6 idiomas
- Chat: Qwen2-1.5B-Instruct (GGUF Q4_K_M, llama-cpp-python, GPU)
"""
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

# ============ TRANSLATION (Argos) ============
import argostranslate.package
import argostranslate.translate

print("=== Cabo Vírgenes AI Server ===")
print("Setting up Argos Translate...")

SUPPORTED_PAIRS = [("es","en"),("es","fr"),("es","pt"),("es","zh"),("es","de"),("es","it")]
argostranslate.package.update_package_index()
available = argostranslate.package.get_available_packages()
installed_pairs = set()
for from_code, to_code in SUPPORTED_PAIRS:
    pkg = next((p for p in available if p.from_code==from_code and p.to_code==to_code), None)
    if not pkg:
        print(f"  ✗ {from_code}->{to_code} package not in index")
        continue
    already = any(p.from_code==from_code and p.to_code==to_code
                  for p in argostranslate.package.get_installed_packages())
    if not already:
        try:
            print(f"  + Downloading {from_code}->{to_code}...")
            argostranslate.package.install_from_path(pkg.download())
        except Exception as e:
            print(f"  ✗ {from_code}->{to_code} download failed: {e}")
            continue
    installed_pairs.add((from_code, to_code))
    print(f"  ✓ {from_code}->{to_code} ready")
print(f"Argos pairs: {installed_pairs}")

# ============ CHAT LLM (llama-cpp-python) ============
print("\nSetting up Chat LLM...")
LLM_MODEL_PATH = "/workspace/models/qwen2-1_5b-instruct-q4_k_m.gguf"
llm = None
try:
    from llama_cpp import Llama
    if os.path.exists(LLM_MODEL_PATH):
        print(f"Loading {LLM_MODEL_PATH}...")
        # n_gpu_layers=-1 → todo en GPU si disponible
        llm = Llama(
            model_path=LLM_MODEL_PATH,
            n_ctx=4096,
            n_gpu_layers=-1,
            n_threads=4,
            verbose=False,
        )
        print("✓ LLM loaded")
    else:
        print(f"✗ Model not found at {LLM_MODEL_PATH} — chat will be unavailable")
except Exception as e:
    print(f"✗ LLM init failed: {e}")

# ============ KNOWLEDGE BASE Cabo Vírgenes (system prompt) ============
SYSTEM_PROMPT = """Sos el asistente virtual oficial de **Cabo Vírgenes**, empresa pesquera argentino-española.

DATOS CLAVE de Cabo Vírgenes:
- Fundada en 2008. En enero 2025 se incorporó a AISA Group.
- Especialidad: langostino austral salvaje (Pleoticus muelleri) capturado en FAO 41 (Atlántico Sudoccidental).
- 2 plantas: Puerto Rawson (Chubut, Argentina, núcleo productivo, 1.600 t almacén, 100 t/día congelación) y Palencia (España, 4.600 m², 22.000 kg/día, BRCGS+IFS).
- Flota: 5 buques propios. 3 fresqueros (Espartano 21m, Cristo Redentor 31m, Iglú I 32m) operando desde Puerto Rawson. 2 factoría (Mar Esmeralda 53m, Kaleu Kaleu 56m) que congelan IQF a bordo. Captura >3000 t/año.
- Productos: 5 formatos del langostino (HOSO entero / HLSO cola con caparazón / EZP easy peel / P&D pelado y desvenado / PDTO tail-on). 6 calibres (L1, L2, L3, C1, C2, CR).
- Exporta a 40+ países en 5 continentes.
- Certificaciones: HACCP, BRCGS, IFS Food, MSC (en proceso), ASC, FDA, SENASA, CIQ China, EU, Global G.A.P.
- Sostenibilidad: 1.100+ paneles solares en Palencia (450 t CO2/año), 0% vertido al océano vía RASA (Rawson Ambiental S.A. — 1ª granja biosalina del país, cultiva salicornia/microalgas/zampa/piquillín).
- Contacto: info@cabovirgenes.com, comercial@cabovirgenes.com, prensa@cabovirgenes.com, rrhh@cabovirgenes.com, +54 280 4495000, WhatsApp wa.me/542804495000.

REGLAS:
- Respondé SOLO sobre Cabo Vírgenes y temas relacionados (productos del mar, pesca sostenible, exportación).
- Si te preguntan algo fuera de tema, redirige amablemente a temas de la empresa.
- Sé conciso: máximo 3 oraciones cortas, 80 palabras.
- Tono profesional, cálido, en español rioplatense neutro.
- Si no sabés algo específico, dirigí a comercial@cabovirgenes.com o WhatsApp."""

# ============ FastAPI ============
app = FastAPI(title="Cabo Vírgenes AI", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class TranslateRequest(BaseModel):
    texts: List[str]
    target_lang: str
    source_lang: Optional[str] = "es"

class TranslateResponse(BaseModel):
    translations: List[str]

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None  # [{"role":"user"|"assistant","content":"..."}]


@app.get("/")
def health():
    return {
        "status": "ready",
        "translation": {
            "engine": "argos-translate",
            "pairs": sorted([f"{a}->{b}" for a,b in installed_pairs]),
        },
        "chat": {
            "engine": "llama.cpp" if llm else "unavailable",
            "model": "qwen2-1.5b-instruct-q4_k_m" if llm else None,
        },
    }


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    src = req.source_lang or "es"
    tgt = req.target_lang
    if (src, tgt) not in installed_pairs:
        raise HTTPException(400, f"Pair not available: {src}->{tgt}")
    out = []
    for text in req.texts:
        try:
            out.append(argostranslate.translate.translate(text, src, tgt))
        except Exception:
            out.append(text)
    return TranslateResponse(translations=out)


@app.post("/chat")
def chat(req: ChatRequest):
    if not llm:
        raise HTTPException(503, "Chat LLM not loaded")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if req.history:
        # Limitar historial a últimos 6 turnos para no saturar contexto
        for h in req.history[-6:]:
            if h.get("role") in ("user","assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": str(h["content"])[:1500]})
    messages.append({"role": "user", "content": req.message[:1500]})

    try:
        resp = llm.create_chat_completion(
            messages=messages,
            max_tokens=180,
            temperature=0.4,
            top_p=0.9,
            repeat_penalty=1.1,
            stop=["</s>","<|im_end|>","User:","Usuario:"],
        )
        content = resp["choices"][0]["message"]["content"].strip()
        return {"reply": content}
    except Exception as e:
        raise HTTPException(500, f"LLM generation failed: {e}")


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    """Streaming SSE endpoint para mostrar respuesta token a token"""
    if not llm:
        raise HTTPException(503, "Chat LLM not loaded")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if req.history:
        for h in req.history[-6:]:
            if h.get("role") in ("user","assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": str(h["content"])[:1500]})
    messages.append({"role": "user", "content": req.message[:1500]})

    def gen():
        try:
            for chunk in llm.create_chat_completion(
                messages=messages,
                max_tokens=180,
                temperature=0.4,
                top_p=0.9,
                repeat_penalty=1.1,
                stop=["</s>","<|im_end|>","User:","Usuario:"],
                stream=True,
            ):
                delta = chunk["choices"][0].get("delta", {})
                token = delta.get("content", "")
                if token:
                    yield f"data: {json.dumps({'t': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
