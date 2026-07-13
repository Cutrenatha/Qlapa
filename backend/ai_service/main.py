import os
import sys
from tempfile import NamedTemporaryFile

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, ".env"))

from ai_engine import (  # noqa: E402
    ai_suggest_product_fields,
    analyze_product_image,
    generate_ai_description,
    get_recommendation,
    chat_with_ai,
)


app = FastAPI(
    title="Qlapa AI Service",
    version="1.0.0",
    description="Service terpisah untuk chatbot, rekomendasi pemanfaatan, dan analisis foto produk Qlapa.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class SuggestProductRequest(BaseModel):
    name: str = ""
    category: str = ""
    type: str = ""
    condition: str = ""
    quality: str = ""
    notes: str = ""


class GenerateDescriptionRequest(BaseModel):
    name: str
    category: str
    type: str
    condition: str = ""
    notes: str = ""


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "qlapa-ai"}


@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    """Bercakap-cakap dengan AI."""
    try:
        reply = chat_with_ai(message=req.message)
        return {"reply": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/recommendation")
def get_recommendation_endpoint(category: str = ""):
    """Mengembalikan rekomendasi pemanfaatan bahan berdasarkan jenis."""
    try:
        rec = get_recommendation(category)
        return {"recommendation": rec}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/suggest-fields")
def suggest_fields(req: SuggestProductRequest):
    """Menghasilkan tebakan pintar untuk field produk berdasarkan input mentah."""
    try:
        return ai_suggest_product_fields(
            name=req.name,
            category=req.category,
            type=req.type,
            condition=req.condition,
            quality=req.quality,
            notes=req.notes,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/generate-description")
def generate_desc(req: GenerateDescriptionRequest):
    """(Opsional) Sama dengan suggest-fields, tapi fokus pada deskripsi saja."""
    try:
        desc = generate_ai_description(
            name=req.name,
            category=req.category,
            type=req.type,
            condition=req.condition,
            notes=req.notes,
        )
        return {"ai_description": desc, "name": req.name}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")

    uploads_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    suffix = os.path.splitext(image.filename or "")[1] or ".png"
    if suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]:
        suffix = ".png"

    with NamedTemporaryFile(delete=False, suffix=suffix, dir=uploads_dir) as tmp:
        tmp.write(await image.read())
        tmp_path = tmp.name

    try:
        result = analyze_product_image(tmp_path)
        result["image_url"] = f"/uploads/{os.path.basename(tmp_path)}"
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
