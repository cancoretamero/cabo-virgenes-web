"""
Cabo Vírgenes — Translation API server
NLLB-200 distilled (1.3GB) servido vía FastAPI sobre GPU.
Endpoint POST /translate { "texts": [...], "target_lang": "en|fr|pt|zh" }
"""
import os
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# NLLB-200 distilled — 600M params, ~1.3GB, 200 idiomas, traducción state-of-the-art
MODEL_NAME = "facebook/nllb-200-distilled-600M"

# Mapeo idioma → código FLORES-200 que usa NLLB
LANG_MAP = {
    "es": "spa_Latn",
    "en": "eng_Latn",
    "fr": "fra_Latn",
    "pt": "por_Latn",
    "zh": "zho_Hans",
    "de": "deu_Latn",
    "it": "ita_Latn",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang",
    "ar": "arb_Arab",
    "ru": "rus_Cyrl",
}

print("=== Cabo Vírgenes Translation API ===")
print(f"Loading model {MODEL_NAME}...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {device}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME).to(device)
if device == "cuda":
    model = model.half()  # FP16 para más velocidad

print(f"Model loaded. Tokenizer vocab size: {tokenizer.vocab_size}")

app = FastAPI(title="Cabo Vírgenes Translator", version="1.0")
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
        "model": MODEL_NAME,
        "device": device,
        "languages": list(LANG_MAP.keys()),
    }


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    if req.source_lang not in LANG_MAP:
        raise HTTPException(400, f"source_lang not supported: {req.source_lang}")
    if req.target_lang not in LANG_MAP:
        raise HTTPException(400, f"target_lang not supported: {req.target_lang}")
    if not req.texts:
        return TranslateResponse(translations=[])

    src = LANG_MAP[req.source_lang]
    tgt = LANG_MAP[req.target_lang]

    # Configurar tokenizer source lang
    tokenizer.src_lang = src

    # Batch tokenize
    inputs = tokenizer(req.texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)

    # Generate translations
    forced_bos_id = tokenizer.convert_tokens_to_ids(tgt)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_id,
            max_length=512,
            num_beams=4,
            no_repeat_ngram_size=3,
        )
    translations = tokenizer.batch_decode(outputs, skip_special_tokens=True)
    return TranslateResponse(translations=translations)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
