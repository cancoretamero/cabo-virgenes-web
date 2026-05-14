"""
Cabo Vírgenes — Translation API server (Argos Translate)
Modelos OPUS-MT pre-built, CTranslate2 backend (rápido, GPU opcional).
Endpoint POST /translate { "texts": [...], "target_lang": "en|fr|pt|zh" }
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import argostranslate.package
import argostranslate.translate

print("=== Cabo Vírgenes Translation API (Argos Translate) ===")

# Descargar e instalar paquetes de traducción
SUPPORTED = [("es", "en"), ("es", "fr"), ("es", "pt"), ("es", "zh"),
             ("es", "de"), ("es", "it")]

print("Updating package index...")
argostranslate.package.update_package_index()
available = argostranslate.package.get_available_packages()

installed_pairs = set()
for from_code, to_code in SUPPORTED:
    try:
        pkg = next((p for p in available if p.from_code == from_code and p.to_code == to_code), None)
        if pkg is None:
            print(f"  - {from_code}->{to_code}: package not found, skip")
            continue
        # Si ya está instalado, no descarga otra vez
        already_installed = any(
            p.from_code == from_code and p.to_code == to_code
            for p in argostranslate.package.get_installed_packages()
        )
        if not already_installed:
            print(f"  + Downloading {from_code}->{to_code}...")
            pkg_path = pkg.download()
            argostranslate.package.install_from_path(pkg_path)
        installed_pairs.add((from_code, to_code))
        print(f"  ✓ {from_code}->{to_code} ready")
    except Exception as e:
        print(f"  ✗ {from_code}->{to_code} failed: {e}")

print(f"Installed pairs: {installed_pairs}")

# FastAPI app
app = FastAPI(title="Cabo Vírgenes Translator", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslateRequest(BaseModel):
    texts: List[str]
    target_lang: str
    source_lang: Optional[str] = "es"


class TranslateResponse(BaseModel):
    translations: List[str]


@app.get("/")
def health():
    return {
        "status": "ready",
        "engine": "argos-translate",
        "languages": sorted({p[1] for p in installed_pairs}),
        "pairs": sorted([f"{a}->{b}" for a, b in installed_pairs]),
    }


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    src = req.source_lang or "es"
    tgt = req.target_lang
    if (src, tgt) not in installed_pairs:
        raise HTTPException(400, f"Pair not available: {src}->{tgt}. Available: {installed_pairs}")
    out = []
    for text in req.texts:
        try:
            t = argostranslate.translate.translate(text, src, tgt)
            out.append(t)
        except Exception as e:
            out.append(text)  # fallback al original
    return TranslateResponse(translations=out)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
