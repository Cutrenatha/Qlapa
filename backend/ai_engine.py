"""
ai_engine.py
------------
Modul ini mensimulasikan dua fitur AI unggulan Qlapa:
  1. generate_ai_description() -> generator deskripsi produk otomatis (Seller)
  2. get_recommendation()      -> mesin rekomendasi pemanfaatan limbah (Buyer)

Saat ini logikanya rule-based (tanpa API key eksternal) supaya proyek bisa
langsung dijalankan tanpa biaya/konfigurasi tambahan. Untuk memakai LLM
sungguhan (GPT / Gemini) sesuai proposal, tinggal ganti isi kedua fungsi ini
dengan pemanggilan API, contoh untuk OpenAI:

    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    def generate_ai_description(name, category, condition, notes):
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": f"Buatkan deskripsi produk ..."}]
        )
        return resp.choices[0].message.content
"""

import base64
import json
import mimetypes
import os
import requests
import random
import re
import numpy as np
from PIL import Image, ImageStat, ImageFilter, ImageOps

# Load .env SEBELUM membaca env var agar GEMINI_API_KEY terbaca dengan benar
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Baca API key Gemini/Google (OPENAI_API_KEY sengaja TIDAK dipakai di sini
# karena formatnya beda dan bukan untuk client Gemini)
GEMINI_API_KEY = (
    os.environ.get("GEMINI_API_KEY")
    or os.environ.get("GOOGLE_API_KEY")
)

# Daftar model dicoba berurutan (fallback berjenjang) kalau model pertama
# kena rate-limit/quota (429). Bisa dioverride lewat .env:
#   GEMINI_MODEL_ID=gemini-2.0-flash,gemini-2.5-flash,gemini-1.5-flash
GEMINI_MODEL_CANDIDATES = [
    m.strip() for m in os.environ.get(
        "GEMINI_MODEL_ID",
        "gemini-2.0-flash,gemini-1.5-flash"
    ).split(",") if m.strip()
]
# Dipakai di beberapa tempat lain (mis. log) sebagai model utama/default
GEMINI_MODEL_ID = GEMINI_MODEL_CANDIDATES[0]

def _make_gemini_client():
    """Buat client Gemini setelah .env sudah terbaca."""
    key = (
        os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if key:
        key = key.strip()
    if genai and key:
        try:
            return genai.Client(api_key=key)
        except Exception as e:
            print(f"[Qlapa AI] Gagal inisialisasi Gemini client: {e}")
    return None

GEMINI_CLIENT = _make_gemini_client()
_GEMINI_COOLDOWN_UNTIL = 0.0
print(f"[Qlapa AI] Gemini client: {'AKTIF' if GEMINI_CLIENT else 'TIDAK TERSEDIA (cek GEMINI_API_KEY / GOOGLE_API_KEY di .env)'}")

# List of allowed categories in Qlapa marketplace
BAHAN_BAKU_LIST = [
    "Tempurung",
    "Sabut",
    "Ampas",
    "Daun",
    "Air Kelapa"
]

PRODUK_OLAHAN_LIST = [
    "Briket",
    "Cocopeat",
    "Cocofiber",
    "Arang Aktif",
    "Kerajinan",
    "Pot Sabut",
    "Keset Sabut",
    "Tali Sabut",
    "Pupuk Organik",
    "Pakan Ternak"
]

ALLOWED_TYPES = BAHAN_BAKU_LIST + PRODUK_OLAHAN_LIST
ALLOWED_CATEGORIES = ["Bahan Baku", "Produk Olahan"]

def get_category_for_type(product_type):
    for b in BAHAN_BAKU_LIST:
        if b.lower() in product_type.lower():
            return "Bahan Baku"
    for p in PRODUK_OLAHAN_LIST:
        if p.lower() in product_type.lower():
            return "Produk Olahan"
    return "Bahan Baku"  # Default fallback

CATEGORY_ALIASES = {
    "tempurung": "Tempurung",
    "batok": "Tempurung",
    "batok kelapa": "Tempurung",
    "tempurung kelapa": "Tempurung",
    "sabut": "Sabut",
    "sabut kelapa": "Sabut",
    "serabut": "Sabut",
    "serabut kelapa": "Sabut",
    "ampas": "Ampas",
    "ampas kelapa": "Ampas",
    "daun": "Daun",
    "daun kelapa": "Daun",
    "janur": "Daun",
    "air": "Air Kelapa",
    "air kelapa": "Air Kelapa",
    "air sisa": "Air Kelapa",
    "briket": "Briket",
    "briket arang": "Briket",
    "briket tempurung": "Briket",
    "briket batok": "Briket",
    "arang briket": "Briket",
    "arang aktif": "Arang Aktif",
    "karbon aktif": "Arang Aktif",
    "activated carbon": "Arang Aktif",
    "cocopeat": "Cocopeat",
    "coco peat": "Cocopeat",
    "serbuk sabut": "Cocopeat",
    "cocofiber": "Cocofiber",
    "coco fiber": "Cocofiber",
    "serat sabut": "Cocofiber",
    "pot sabut": "Pot Sabut",
    "pot kelapa": "Pot Sabut",
    "cocopot": "Pot Sabut",
    "keset": "Keset Sabut",
    "keset sabut": "Keset Sabut",
    "tali": "Tali Sabut",
    "tali sabut": "Tali Sabut",
    "kerajinan": "Kerajinan",
    "kerajinan tempurung": "Kerajinan",
    "dekorasi tempurung": "Kerajinan",
    "mangkuk": "Kerajinan",
    "mangkuk tempurung": "Kerajinan",
    "coconut bowl": "Kerajinan",
    "sendok": "Kerajinan",
    "sendok tempurung": "Kerajinan",
    "pupuk": "Pupuk Organik",
    "pupuk organik": "Pupuk Organik",
    "kompos": "Pupuk Organik",
    "pakan": "Pakan Ternak",
    "pakan ternak": "Pakan Ternak",
}

# Basis pengetahuan pemanfaatan hilir per jenis limbah kelapa yang valid
DOWNSTREAM_MAP = {
    "Tempurung": {
        "produk": ["briket", "arang aktif", "kerajinan"],
        "sektor": ["energi terbarukan", "industri kerajinan", "kuliner"],
        "karakteristik": "keras, padat, kandungan karbon tinggi, awet",
    },
    "Sabut": {
        "produk": ["cocopeat", "cocofiber", "pot sabut", "keset sabut", "tali sabut"],
        "sektor": ["pertanian", "hortikultura", "industri serat alam"],
        "karakteristik": "berserat tebal, elastis, berdaya serap air tinggi",
    },
    "Ampas": {
        "produk": ["pupuk organik", "pakan ternak"],
        "sektor": ["pertanian organik", "peternakan"],
        "karakteristik": "mengandung serat sisa dan lemak nabati tinggi, mudah difermentasi",
    },
    "Daun": {
        "produk": ["anyaman daun", "kompos", "bahan bakar alami"],
        "sektor": ["kerajinan tangan", "pertanian"],
        "karakteristik": "ringan, fleksibel untuk dianyam, mudah terurai",
    },
    "Air Kelapa": {
        "produk": ["pupuk organik cair", "starter nata de coco", "cuka kelapa"],
        "sektor": ["industri pangan fermentasi", "pertanian"],
        "karakteristik": "cair, kaya mineral elektrolit, mengandung gula alami",
    },
    "Briket": {
        "produk": ["bahan bakar barbeque", "bahan bakar shisha", "energi biomassa"],
        "sektor": ["kuliner", "energi terbarukan", "ekspor"],
        "karakteristik": "panas tinggi stabil, abu minim, tanpa asap berlebih",
    },
    "Arang Aktif": {
        "produk": ["filter air bersih", "filter udara", "adsorben industri"],
        "sektor": ["penyaringan air", "lingkungan hidup", "farmasi"],
        "karakteristik": "porositas sangat tinggi, daya serap zat kimia kuat",
    },
    "Cocopeat": {
        "produk": ["media tanam hidroponik", "campuran potting mix", "substrat pembibitan"],
        "sektor": ["pertanian modern", "nursery", "hidroponik"],
        "karakteristik": "ringan, menyimpan air dengan baik, aerasi tanah bagus",
    },
    "Cocofiber": {
        "produk": ["isi jok kasur", "keset sabut", "tali sabut", "geotekstil"],
        "sektor": ["industri manufaktur", "pertanian", "rumah tangga"],
        "karakteristik": "kuat, tahan lama, tidak mudah lapuk",
    },
    "Kerajinan": {
        "produk": ["mangkuk", "sendok", "lampu hias", "souvenir"],
        "sektor": ["industri kreatif", "pariwisata", "rumah tangga"],
        "karakteristik": "estetik, bernilai seni, awet, unik",
    },
    "Pot Sabut": {
        "produk": ["pot organik", "media tanam anggrek"],
        "sektor": ["hortikultura", "pertamanan"],
        "karakteristik": "ramah lingkungan, porous, mudah terurai di tanah",
    },
    "Keset Sabut": {
        "produk": ["keset pintu", "matras lantai"],
        "sektor": ["rumah tangga", "kebersihan"],
        "karakteristik": "menyerap air, mengikat debu, anti licin",
    },
    "Tali Sabut": {
        "produk": ["tali tambang", "tali pengikat tanaman", "bahan kerajinan"],
        "sektor": ["pertanian", "perikanan", "industri kreatif"],
        "karakteristik": "kuat, tahan air asin, elastis",
    },
    "Pupuk Organik": {
        "produk": ["pupuk kompos", "pupuk dasar"],
        "sektor": ["pertanian organik", "perkebunan"],
        "karakteristik": "kaya nutrisi hara, memperbaiki struktur tanah",
    },
    "Pakan Ternak": {
        "produk": ["konsentrat ternak sapi", "campuran pakan unggas"],
        "sektor": ["peternakan"],
        "karakteristik": "tinggi serat kasar, sumber lemak tambahan, hemat biaya",
    }
}

def _normalize_category(category: str = "", question: str = "") -> str:
    cat_clean = (category or "").strip()
    quest_clean = (question or "").strip()
    
    for allowed in ALLOWED_CATEGORIES:
        if cat_clean.lower() == allowed.lower():
            return allowed
            
    text = f"{cat_clean} {quest_clean}".strip().lower()
    if not text:
        return ""

    for alias, canonical in CATEGORY_ALIASES.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, text):
            return canonical

    for allowed in ALLOWED_CATEGORIES:
        if allowed.lower() in text:
            return allowed

    normalized = re.sub(r"[^a-z0-9\(\)]+", " ", text).strip()
    for allowed in ALLOWED_CATEGORIES:
        allowed_norm = re.sub(r"[^a-z0-9\(\)]+", " ", allowed.lower()).strip()
        if allowed_norm in normalized or normalized in allowed_norm:
            return allowed

    return ""

def normalize_category(category: str = "", question: str = "") -> str:
    return _normalize_category(category, question)

CONDITION_HINTS = {
    "Kering": "kadar air rendah, lebih tahan lama dan mudah didistribusikan",
    "Basah": "kadar air tinggi, sebaiknya segera diproses/dikeringkan setelah diterima",
    "Segar": "kondisi baru dipanen, kualitas optimal untuk pengolahan lanjutan",
}

PRICE_FALLBACK = {
    ("Tempurung Kelapa", "Kering"): 2800, ("Tempurung Kelapa", "Basah"): 1100, ("Tempurung Kelapa", "Segar"): 1400,
    ("Sabut Kelapa", "Kering"): 1900, ("Sabut Kelapa", "Basah"): 800, ("Sabut Kelapa", "Segar"): 1000,
    ("Ampas Kelapa", "Kering"): 4500, ("Ampas Kelapa", "Basah"): 1000, ("Ampas Kelapa", "Segar"): 1300,
    ("Daun Kelapa", "Kering"): 900, ("Daun Kelapa", "Basah"): 400, ("Daun Kelapa", "Segar"): 600,
    ("Air Kelapa (limbah/sisa produksi)", "Kering"): 1000, ("Air Kelapa (limbah/sisa produksi)", "Basah"): 1400, ("Air Kelapa (limbah/sisa produksi)", "Segar"): 1800,
    ("Briket Tempurung", "Kering"): 18000, ("Briket Tempurung", "Basah"): 10000, ("Briket Tempurung", "Segar"): 14000,
    ("Arang Aktif", "Kering"): 35000, ("Arang Aktif", "Basah"): 25000, ("Arang Aktif", "Segar"): 30000,
    ("Cocopeat", "Kering"): 12000, ("Cocopeat", "Basah"): 6000, ("Cocopeat", "Segar"): 8000,
    ("Cocofiber", "Kering"): 9500, ("Cocofiber", "Basah"): 5000, ("Cocofiber", "Segar"): 7000,
    ("Pot Sabut", "Kering"): 15000, ("Pot Sabut", "Basah"): 8000, ("Pot Sabut", "Segar"): 10000,
    ("Keset Sabut", "Kering"): 20000, ("Keset Sabut", "Basah"): 12000, ("Keset Sabut", "Segar"): 15000,
    ("Tali Sabut", "Kering"): 8000, ("Tali Sabut", "Basah"): 4000, ("Tali Sabut", "Segar"): 6000,
    ("Kerajinan Tempurung", "Kering"): 45000, ("Kerajinan Tempurung", "Basah"): 25000, ("Kerajinan Tempurung", "Segar"): 35000,
    ("Mangkuk Tempurung", "Kering"): 15000, ("Mangkuk Tempurung", "Basah"): 8000, ("Mangkuk Tempurung", "Segar"): 11000,
    ("Sendok Tempurung", "Kering"): 5000, ("Sendok Tempurung", "Basah"): 2500, ("Sendok Tempurung", "Segar"): 3500,
    ("Pupuk Organik", "Kering"): 12000, ("Pupuk Organik", "Basah"): 6000, ("Pupuk Organik", "Segar"): 8000,
    ("Pakan Ternak", "Kering"): 7500, ("Pakan Ternak", "Basah"): 4000, ("Pakan Ternak", "Segar"): 5500,
}


def _extract_json_object(text: str) -> dict:
    if not text:
        return {}
    start = text.find("{")
    if start == -1:
        return {}
    braces = 0
    end = None
    for idx, ch in enumerate(text[start:], start):
        if ch == "{":
            braces += 1
        elif ch == "}":
            braces -= 1
            if braces == 0:
                end = idx + 1
                break
    if end is None:
        return {}
    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        return {}


def _call_gemini(prompt: str, temperature: float = 0.25) -> str:
    """Panggil Gemini dengan retry per model + fallback berjenjang ke model
    berikutnya kalau kena rate-limit/quota (429) atau server sibuk (503)."""
    global _GEMINI_COOLDOWN_UNTIL
    if not GEMINI_CLIENT:
        raise RuntimeError("Gemini client tidak tersedia (cek GEMINI_API_KEY di .env)")
        
    import time
    if time.time() < _GEMINI_COOLDOWN_UNTIL:
        raise RuntimeError("Gemini API is cooling down due to previous failures")
        
    from google.genai import types as _types
    config = _types.GenerateContentConfig(temperature=temperature, top_p=0.95)

    max_retries_per_model = 1
    last_err = None

    for model_id in GEMINI_MODEL_CANDIDATES:
        try:
            response = GEMINI_CLIENT.models.generate_content(
                model=model_id,
                contents=prompt,
                config=config,
            )
            text = (getattr(response, "text", None) or "").strip()
            if text:
                return text
            last_err = RuntimeError(f"Respons kosong dari model {model_id}")
        except Exception as e:
            last_err = e
            err_str = str(e)
            print(f"[Qlapa AI] Model {model_id} gagal: {e}")
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str:
                _GEMINI_COOLDOWN_UNTIL = time.time() + 60
                break

    if last_err:
        raise last_err
    return ""


def _call_gemini_vision(image_path: str, prompt: str, temperature: float = 0.2) -> str:
    """Kirim gambar asli + prompt teks ke Gemini 2.5 Flash lewat google-genai SDK."""
    global _GEMINI_COOLDOWN_UNTIL
    if not GEMINI_CLIENT:
        raise RuntimeError("Gemini client tidak tersedia (cek GEMINI_API_KEY di .env)")

    import time
    if time.time() < _GEMINI_COOLDOWN_UNTIL:
        raise RuntimeError("Gemini API is cooling down due to previous failures")

    mime_type, _ = mimetypes.guess_type(image_path)
    mime_type = mime_type or "image/jpeg"
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    config = types.GenerateContentConfig(temperature=temperature, top_p=0.95)

    max_retries_per_model = 1
    last_err = None

    for model_id in GEMINI_MODEL_CANDIDATES:
        try:
            response = GEMINI_CLIENT.models.generate_content(
                model=model_id,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
                config=config,
            )
            text = (getattr(response, "text", None) or "").strip()
            if text:
                return text
            last_err = RuntimeError(f"Respons kosong dari model {model_id}")
        except Exception as e:
            last_err = e
            err_str = str(e)
            print(f"[Qlapa AI] Model {model_id} gagal: {e}")
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str:
                _GEMINI_COOLDOWN_UNTIL = time.time() + 60
                break

    if last_err:
        raise last_err
    return ""


def _ai_analyze_image(image_path: str) -> dict:
    """Kirim foto asli ke Gemini 2.5 Flash (vision) untuk identifikasi jenis limbah kelapa,
    kondisi, kualitas, estimasi berat, estimasi harga, dan deskripsi produk sekaligus."""
    if not GEMINI_CLIENT:
        return {}

    valid_types = ", ".join(DOWNSTREAM_MAP.keys())
    valid_conditions = ", ".join(CONDITION_HINTS.keys())

    category_visual_guide = (
        "Panduan ciri visual tiap jenis (gunakan ini untuk membedakan, JANGAN asal tebak):\n"
        "- Tempurung: bagian KERAS berwarna coklat tua/gelap sampai hampir hitam, permukaan keras "
        "mengkilap atau berserabut tipis di luar, bentuk melengkung seperti mangkuk/batok, "
        "TIDAK berserat panjang.\n"
        "- Sabut: serat-serat PANJANG dan kasar berwarna coklat muda-kecoklatan, terlihat seperti "
        "anyaman/gumpalan serat (mirip tali rami), tekstur berbulu/berserabut jelas, empuk saat ditekan.\n"
        "- Ampas: sisa parutan/perasan daging kelapa, berwarna putih-krem hingga kecoklatan, "
        "bertekstur seperti serbuk/butiran basah, bukan bentuk padat besar.\n"
        "- Daun: helai daun kelapa (janur/daun tua), bentuk memanjang pipih hijau atau coklat kering.\n"
        "- Air Kelapa: cairan bening/putih keruh di dalam wadah atau kelapa yang dibelah.\n\n"
        "Jika foto menunjukkan KELAPA UTUH (masih ada tempurung + sabut menyatu, belum dipisah), "
        "pilih jenis berdasarkan bagian yang PALING DOMINAN terlihat pada foto."
    )

    prompt = (
        "Kamu adalah Qlapa AI, asisten untuk marketplace limbah kelapa. "
        "Amati foto produk dengan teliti sebelum menjawab.\n\n"
        f"{category_visual_guide}\n\n"
        f"Jenis (type) HARUS salah satu dari: {valid_types}. "
        f"Kondisi HARUS salah satu dari: {valid_conditions}. "
        "Balas HANYA dengan JSON valid (tanpa markdown, tanpa teks lain) dengan kunci persis:\n"
        "name, type, condition, quality, stock_estimate_kg, description, confidence.\n"
        "- name: nama produk singkat yang menarik untuk listing (contoh: 'Tempurung Kelapa Kering Siap Olah')\n"
        "- type: jenis produk yang HARUS salah satu dari list di atas\n"
        "- quality: 1 kalimat pendek kondisi kebersihan/kualitas visual bahan\n"
        "- stock_estimate_kg: angka perkiraan berat dalam kg berdasarkan tampilan foto (integer)\n"
        "- description: deskripsi produk 3-5 kalimat dalam Bahasa Indonesia untuk pembeli B2B/UMKM, "
        "sebutkan potensi produk turunan dan sektor industri yang relevan.\n"
        "- confidence: angka 1-5 seberapa yakin kamu terhadap jenis yang dipilih "
        "(5 = sangat yakin ciri visualnya jelas, 1 = foto ambigu/sulit dibedakan)."
    )

    try:
        response_text = _call_gemini_vision(image_path, prompt, temperature=0.1)
        data = _extract_json_object(response_text)
        if not data:
            print(f"[Qlapa AI] Gagal parse JSON dari Gemini Vision. Raw response: {response_text!r}")
        else:
            confidence = data.get("confidence")
            product_type = data.get("type", "Lainnya")
            data["category"] = get_category_for_type(product_type)
            if confidence is not None:
                try:
                    if int(confidence) <= 2:
                        print(
                            f"[Qlapa AI] Peringatan: confidence rendah ({confidence}/5) untuk "
                            f"jenis '{product_type}' pada gambar {image_path}. "
                            "Sebaiknya pengguna mengecek ulang manual."
                        )
                except (TypeError, ValueError):
                    pass
        return data
    except Exception as exc:
        print(f"[Qlapa AI] Panggilan Gemini Vision gagal: {exc!r}")
        return {}


def _generate_ai_description_fallback(name: str, product_type: str, condition: str = "", notes: str = "") -> str:
    resolved_type = _normalize_category(product_type, name)
    display_type = resolved_type or product_type or "produk kelapa"
    info = DOWNSTREAM_MAP.get(resolved_type, {
        "produk": ["produk turunan bernilai tambah"],
        "sektor": ["agro-industri"],
        "karakteristik": "berpotensi diolah lebih lanjut",
    })
    kondisi_text = CONDITION_HINTS.get(condition, "kondisi sesuai foto yang diunggah penjual")
    produk_terkait = ", ".join(random.sample(info["produk"], k=min(3, len(info["produk"]))))
    sektor_terkait = " dan ".join(info["sektor"][:2])

    desc = (
        f"{name} merupakan jenis produk {display_type.lower()} dengan karakteristik {info['karakteristik']}. "
        f"Kondisi produk: {kondisi_text}. "
        f"Bahan ini berpotensi diolah menjadi {produk_terkait}, dan cocok dipasok ke pelaku industri "
        f"di sektor {sektor_terkait}. "
    )
    if notes:
        desc += f"Catatan tambahan dari penjual: {notes}. "
    desc += "Deskripsi ini dihasilkan otomatis oleh Qlapa AI dan dapat diedit kembali oleh penjual sebelum dipublikasikan."
    return desc


def ai_suggest_product_fields(
    name: str = "",
    category: str = "",
    type: str = "",
    condition: str = "",
    quality: str = "",
    notes: str = "",
) -> dict:
    
    if type.lower() == "lainnya" and notes:
        # User entered custom type. We check if it's coconut waste related.
        validation_prompt = (
            f"Apakah jenis limbah/produk '{notes}' masih berkaitan erat dengan limbah kelapa (tempurung, sabut, ampas, daun, air kelapa) "
            "atau produk hasil olahannya? Jawab 'YA' atau 'TIDAK'."
        )
        if GEMINI_CLIENT:
            try:
                val_res = _call_gemini(validation_prompt).strip().upper()
                if "TIDAK" in val_res:
                    type = "Lainnya (Bukan Limbah Kelapa)"
            except:
                pass

    prompt = (
        "Kamu adalah Qlapa AI. Berikan saran produk limbah kelapa dalam format JSON dengan kunci "
        "name dan description saja. "
        "Jangan ubah kategori, jenis, kondisi, kualitas, atau catatan penjual. "
        "Output hanya boleh berupa JSON valid tanpa teks lain.\n"
        f"Input:\nname: {name}\ncategory: {category}\ntype: {type}\ncondition: {condition}\nquality: {quality}\nnotes: {notes}\n"
    )

    if GEMINI_CLIENT:
        try:
            response_text = _call_gemini(prompt)
            data = _extract_json_object(response_text)
            if not data:
                print(f"[Qlapa AI] Gagal parse JSON dari Gemini. Raw response: {response_text!r}")
        except Exception as exc:
            print(f"[Qlapa AI] Panggilan Gemini gagal: {exc!r}")
            data = {}
    else:
        print("[Qlapa AI] GEMINI_CLIENT tidak tersedia (cek GEMINI_API_KEY di .env)")
        data = {}

    if not data:
        suggested_name = name or f"{type or category or 'Produk'} Kelapa {condition or 'Kering'}"
        suggested_category = category or "Bahan Baku"
        suggested_type = type or "Tempurung"
        suggested_condition = condition or "Kering"
        suggested_quality = quality or "Kualitas baik, siap dikirim"
        suggested_notes = notes or ""
        return {
            "name": suggested_name,
            "category": suggested_category,
            "type": suggested_type,
            "condition": suggested_condition,
            "quality": suggested_quality,
            "notes": suggested_notes,
            "description": _generate_ai_description_fallback(
                suggested_name, suggested_type, suggested_condition, suggested_notes
            ),
        }

    name = data.get("name") or name or f"{type or category or 'Produk'} Kelapa {condition or 'Kering'}"
    category = data.get("category") or category or "Bahan Baku"
    type = data.get("type") or type or "Tempurung"
    condition = data.get("condition") or condition or "Kering"
    quality = data.get("quality") or quality or "Kualitas baik, siap dikirim"
    notes = data.get("notes") or notes or ""
    description = data.get("description") or _generate_ai_description_fallback(name, type, condition, notes)

    return {
        "name": name,
        "category": category,
        "type": type,
        "condition": condition,
        "quality": quality,
        "notes": notes,
        "description": description,
    }


def generate_ai_description(name: str, category: str, type: str, condition: str = "", notes: str = "") -> str:
    return ai_suggest_product_fields(name=name, category=category, type=type, condition=condition, quality="", notes=notes)["description"]


def get_recommendation(category: str, question: str = "") -> str:
    """Rekomendasi pemanfaatan limbah kelapa menggunakan Gemini LLM jika tersedia. Parameter 'category' di sini mengacu pada 'type' (jenis produk)."""
    resolved_category = _normalize_category(category, question)
    display_category = resolved_category or category or "produk kelapa"

    if GEMINI_CLIENT:
        prompt = (
            "Kamu adalah Qlapa AI, asisten virtual platform Qlapa. "
            f"Berikan ide penggunaan kreatif, pengolahan, atau potensi jual (rekomendasi pemanfaatan) secara detail "
            f"untuk produk kelapa jenis '{display_category}'. "
        )
        if question:
            prompt += f"Pertanyaan atau produk spesifik dari pengguna: '{question}'. Berikan saran spesifik untuk pertanyaan/produk tersebut. "
        prompt += (
            "\nBerikan jawaban yang solutif, inspiratif, dan relevan dengan industri/bisnis. "
            "Gunakan bahasa Indonesia yang profesional namun hangat. "
            "Jawab langsung pada intinya, tidak terlalu panjang (1-3 paragraf saja). "
            "PENTING: Jangan gunakan format markdown seperti bintang (**) untuk teks tebal. "
            "Tulis jawaban mengalir seperti teks biasa agar enak dibaca."
        )
        try:
            response = _call_gemini(prompt, temperature=0.7)
            if response:
                return response
        except Exception as e:
            print(f"[Qlapa AI] Gagal get_recommendation via Gemini: {e}")

    # Fallback jika Gemini gagal/tidak aktif
    info = DOWNSTREAM_MAP.get(resolved_category)
    if not info:
        known_categories = ", ".join(DOWNSTREAM_MAP.keys())
        return (
            "Maaf, Qlapa AI belum memiliki data spesifik untuk kategori ini. "
            f"Coba tanyakan tentang kategori seperti {known_categories}."
        )

    produk_list = "\n".join([f"  • {p}" for p in info["produk"]])
    reply = (
        f"Produk kelapa kategori {display_category.lower()} bisa dimanfaatkan menjadi beberapa "
        f"produk hilir berikut:\n{produk_list}\n\n"
        f"Bahan ini paling relevan untuk sektor {', '.join(info['sektor'])}. "
        f"Karakteristik utamanya: {info['karakteristik']}."
    )
    return reply


def _extract_image_features(img: Image.Image) -> dict:
    """Extract multiple visual features for better classification."""
    w, h = img.size
    crop_box = (int(w * 0.15), int(h * 0.15), int(w * 0.85), int(h * 0.85))
    center_img = img.crop(crop_box)
    
    # Basic color stats
    stat = ImageStat.Stat(center_img)
    r, g, b = stat.mean
    r_sd, g_sd, b_sd = stat.stddev
    
    # Brightness dan color saturation
    brightness = (r + g + b) / 3
    color_variance = (r_sd + g_sd + b_sd) / 3
    
    # Hue dominance (untuk detect daun hijau, sabut cokelat, dll)
    r_norm = r / max(brightness, 1)
    g_norm = g / max(brightness, 1)
    b_norm = b / max(brightness, 1)
    
    # Texture via edge detection
    edges = center_img.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    edge_intensity = (edge_stat.mean[0] + edge_stat.mean[1] + edge_stat.mean[2]) / 3
    
    # Convert to numpy untuk histogram
    img_array = np.array(center_img)
    hist_r = np.histogram(img_array[:,:,0], bins=8)[0]
    hist_g = np.histogram(img_array[:,:,1], bins=8)[0]
    hist_b = np.histogram(img_array[:,:,2], bins=8)[0]
    
    # Color uniformity (entropy proxy)
    color_uniformity = np.std(np.concatenate([hist_r, hist_g, hist_b]))
    
    return {
        "brightness": brightness,
        "color_variance": color_variance,
        "r": r, "g": g, "b": b,
        "r_norm": r_norm, "g_norm": g_norm, "b_norm": b_norm,
        "edge_intensity": edge_intensity,
        "color_uniformity": color_uniformity,
    }


def _classify_category_improved(features: dict) -> str:
    """Enhanced category classification with multiple heuristics."""
    r, g, b = features["r"], features["g"], features["b"]
    brightness = features["brightness"]
    edge_intensity = features["edge_intensity"]
    r_norm, g_norm, b_norm = features["r_norm"], features["g_norm"], features["b_norm"]
    
    # Tempurung: sangat gelap, padat, sedikit tekstur (keras)
    if brightness < 100 and edge_intensity < 15:
        return "Tempurung"
    
    # Daun: hijau atau kuning-hijau, tepi tajam (serat daun)
    if g > r + 25 and g > b + 25 and g_norm > 1.1:
        return "Daun"
    if brightness > 130 and g > r + 15 and edge_intensity > 20:
        return "Daun"
    
    # Ampas: putih/krem, sangat uniform warna, sedikit tekstur
    if brightness > 170 and features["color_variance"] < 25:
        return "Ampas"
    
    # Sabut: cokelat/merah, serat terlihat (tekstur tinggi)
    if r > b + 15 and g > b + 5 and edge_intensity > 25:
        return "Sabut"
    if 120 < brightness < 160 and r > g and r > b:
        return "Sabut"
    
    # Air Kelapa: transparan/bening (terang tapi dengan variasi)
    if brightness > 180 and features["color_variance"] > 30 and edge_intensity < 10:
        return "Air Kelapa"
    
    # Default fallback
    return "Sabut"


def _classify_condition_improved(features: dict) -> str:
    """Enhanced condition classification."""
    brightness = features["brightness"]
    color_variance = features["color_variance"]
    
    # Segar: warna cerah, konsisten, tekstur halus
    if brightness > 160 and color_variance < 30:
        return "Segar"
    
    # Kering: terang atau gelap tapi matte (low variance)
    if brightness > 140 or (brightness < 120 and color_variance < 35):
        return "Kering"
    
    # Basah: mid-brightness dengan variasi warna
    return "Basah"


def _analyze_product_image_fallback(filepath: str) -> dict:
    """Fallback lama berbasis heuristik warna/tekstur (dipakai kalau Gemini Vision gagal/tidak tersedia)."""
    img = Image.open(filepath).convert("RGB")
    img.thumbnail((300, 300))

    features = _extract_image_features(img)
    category = _classify_category_improved(features)
    condition = _classify_condition_improved(features)

    color_uniformity = features["color_uniformity"]
    edge_intensity = features["edge_intensity"]

    if color_uniformity < 40 and edge_intensity < 20:
        quality = "Warna dan tekstur tampak merata, kondisi bersih dan siap kirim"
    elif color_uniformity < 80 or edge_intensity < 30:
        quality = "Kondisi cukup baik, ada sedikit variasi warna pada bahan"
    else:
        quality = "Tampak masih tercampur kotoran/serpihan lain, disarankan disortir dahulu"

    weight_map = {"Tempurung": 15, "Sabut": 10, "Ampas": 5, "Daun": 3, "Air Kelapa": 20}
    stock_estimate = weight_map.get(category, 5)

    price_estimate = PRICE_FALLBACK.get((category, condition), 1500)

    name = f"{category} Kelapa {condition}"
    suggestions = ai_suggest_product_fields(
        name=name,
        category=category,
        condition=condition,
        quality=quality,
        notes="",
    )

    return {
        "name": suggestions["name"],
        "category": suggestions["category"],
        "condition": suggestions["condition"],
        "quality": suggestions["quality"],
        "notes": suggestions["notes"],
        "stock_estimate": stock_estimate,
        "price_estimate": price_estimate,
        "ai_description": suggestions["description"],
        "confidence": 1,
        "low_confidence": True,
    }


def analyze_product_image(filepath: str) -> dict:
    """Menganalisis foto produk limbah kelapa murni menggunakan Gemini Vision.
    Jika Gemini gagal/sibuk, gunakan fallback lokal dengan confidence rendah."""

    ai_result = _ai_analyze_image(filepath)

    resolved_category = _normalize_category(
        ai_result.get("category") if ai_result else "",
        ai_result.get("name") if ai_result else "",
    )
    if not ai_result or resolved_category not in DOWNSTREAM_MAP:
        print("[Qlapa AI] Vision gagal/ambigu, memakai fallback analisis gambar lokal.")
        return _analyze_product_image_fallback(filepath)

    category = resolved_category
    condition = ai_result.get("condition") if ai_result.get("condition") in CONDITION_HINTS else "Kering"
    name = ai_result.get("name") or f"{category} Kelapa {condition}"
    quality = ai_result.get("quality") or "Kualitas baik, siap dikirim"
    description = ai_result.get("description") or _generate_ai_description_fallback(
        name, category, condition, ""
    )
    try:
        stock_estimate = int(ai_result.get("stock_estimate_kg"))
    except (TypeError, ValueError):
        stock_estimate = {"Tempurung": 15, "Sabut": 10, "Ampas": 5, "Daun": 3, "Air Kelapa": 20}.get(category, 5)

    # Harga konsisten dari data backend (tabel PRICE_FALLBACK global), tidak lagi
    # menebak-nebak via AI agar selalu presisi dan konsisten antar produk
    price_estimate = PRICE_FALLBACK.get((category, condition), 1500)

    try:
        confidence = int(ai_result.get("confidence"))
    except (TypeError, ValueError):
        confidence = 5
    low_confidence = confidence <= 2

    return {
        "name": name,
        "category": category,
        "condition": condition,
        "quality": quality,
        "notes": "",
        "stock_estimate": stock_estimate,
        "price_estimate": price_estimate,
        "ai_description": description,
        "confidence": confidence,
        "low_confidence": low_confidence,
    }


def detect_intent(message: str) -> str:
    """Mendeteksi intent dari pesan pengguna."""
    try:
        if not GEMINI_CLIENT:
            raise RuntimeError("Gemini client offline")

        prompt = f"""Kamu adalah sistem NLP intent detection. Klasifikasikan pesan pengguna berikut ke dalam salah satu kategori intent berikut (hanya balas dengan nama intent, tanpa tambahan lain):
- product_recommendation (pengguna mencari rekomendasi bahan/produk untuk kebutuhan tertentu, misal "untuk media tanam", "buat briket")
- product_search (pengguna mencari produk spesifik)
- product_information (bertanya info spesifik suatu produk kelapa)
- product_utilization (bertanya kegunaan suatu bahan kelapa, misal "sabut kelapa bisa untuk apa")
- seller_assistant (bertanya tentang cara jualan, buka toko, jualan di Qlapa)
- general_info (bertanya seputar Qlapa secara umum)
- off_topic (topik di luar kelapa, limbah kelapa, marketplace, misal "resep masakan", "berita hari ini")

Pesan: "{message}"
Intent:"""
        response = _call_gemini(prompt, temperature=0.1)
        if response:
            intent = response.strip().lower()
            if intent in ["product_recommendation", "product_search", "product_information", "product_utilization", "seller_assistant", "general_info", "off_topic"]:
                return intent
    except Exception as e:
        print(f"[Qlapa AI] Intent detection error, falling back to local: {e}")
        
    # Simple rule-based fallback
    msg = message.lower()
    if any(kw in msg for kw in ["beli", "cari", "jual", "rekomendasi", "cocok", "pakai apa", "buat", "harga", "ide", "olahan", "manfaat"]):
        return "product_recommendation"
    return "general_info"


def extract_product_types(message: str) -> list[str]:
    """Ekstraksi jenis produk dari pesan berdasarkan ALLOWED_TYPES."""
    all_types = BAHAN_BAKU_LIST + PRODUK_OLAHAN_LIST
    
    try:
        if not GEMINI_CLIENT:
            raise RuntimeError("Gemini client offline")
            
        prompt = f"""Kamu adalah sistem NLP entity extraction. Daftar Jenis Produk yang valid di Qlapa:
{', '.join(all_types)}

Pesan pengguna: "{message}"

Tentukan jenis produk apa saja dari daftar di atas yang relevan dengan kebutuhan pengguna tersebut. Balas dengan format JSON list of strings, misal: ["Cocopeat", "Cocofiber"]. Jika tidak ada, balas: []. Hanya balas JSON-nya.
"""
        response = _call_gemini(prompt, temperature=0.1)
        if response:
            import re, json
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                extracted = json.loads(match.group(0))
                # Validasi
                return [t for t in extracted if t in all_types]
    except Exception as e:
        print(f"[Qlapa AI] Entity extraction error, falling back to local: {e}")
        
    # Local fallback
    found = []
    msg = message.lower()
    for t in all_types:
        if t.lower() in msg:
            found.append(t)
    return found


_DB_QUERY_CALLBACK = None

def register_db_callback(cb):
    global _DB_QUERY_CALLBACK
    _DB_QUERY_CALLBACK = cb


def fetch_products_by_types(types: list[str]) -> list[dict]:
    """Mengambil data produk dari backend Flask."""
    if not types:
        return []
        
    if _DB_QUERY_CALLBACK:
        try:
            return _DB_QUERY_CALLBACK(types)
        except Exception as e:
            print(f"[Qlapa AI] DB query callback error: {e}")
    try:
        # Flask backend default port is 5000
        url = "http://127.0.0.1:5000/api/products/by-types"
        res = requests.get(url, params={"types": ",".join(types), "limit": 3})
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"[Qlapa AI] Error fetching products via HTTP: {e}")
    return []


def _generate_local_fallback(intent: str, types: list[str], products: list[dict], message: str) -> str:
    """Membangun respons lokal berkualitas jika Gemini API rate-limited atau offline."""
    ideas = []
    for t in types:
        rec = get_recommendation(t)
        if rec and "Maaf, Qlapa AI belum memiliki data spesifik" not in rec:
            ideas.append(rec)
            
    reply_parts = []
    
    if ideas:
        reply_parts.append("\n\n".join(ideas))
    else:
        # Default responses based on keywords
        msg = message.lower()
        if "jual" in msg or "toko" in msg or "seller" in msg:
            reply_parts.append(
                "Untuk berjualan di Qlapa, Anda cukup membuka halaman toko di dashboard seller Anda, "
                "lalu unggah foto produk limbah kelapa Anda. AI kami akan membantu membuat deskripsi otomatis! 🌱"
            )
        elif "briket" in msg or "arang" in msg:
            reply_parts.append(
                "Briket dan Arang Aktif adalah hasil olahan tempurung kelapa yang bernilai tinggi. "
                "Keduanya sangat diminati untuk bahan bakar ramah lingkungan dan industri penyaringan air. 🌱"
            )
        elif "media tanam" in msg or "hidroponik" in msg or "tanaman" in msg:
            reply_parts.append(
                "Untuk media tanam hidroponik, produk hasil olahan kelapa yang paling cocok adalah Cocopeat dan Cocofiber. "
                "Keduanya memiliki daya serap air yang sangat baik dan ramah lingkungan. 🌱"
            )
        else:
            reply_parts.append(
                "Halo! Saya Qlapa AI, asisten virtual platform Qlapa 🌱. "
                "Saya dapat membantu Anda menemukan ide pemanfaatan limbah kelapa (sabut, tempurung, ampas, daun, air kelapa) "
                "atau merekomendasikan produk olahan kelapa (briket, cocopeat, cocofiber, arang aktif). "
                "Ada yang bisa saya bantu hari ini?"
            )
            
    if products:
        reply_parts.append(
            "Berikut adalah beberapa produk nyata di Qlapa yang cocok dengan kebutuhan Anda:"
        )
        
    return "\n\n".join(reply_parts)


def chat_with_ai(message: str) -> str:
    """Chatbot Qlapa AI untuk pembeli menggunakan pipeline intent detection -> DB -> LLM."""
    
    intent = detect_intent(message)
    print(f"[Qlapa AI] Detected Intent: {intent}")
    
    if intent == "off_topic":
        return "Maaf, Qlapa AI difokuskan untuk membantu hal-hal seputar limbah kelapa dan produk hasil olahannya di platform Qlapa. Ada yang bisa saya bantu terkait produk kelapa?"
        
    types = extract_product_types(message)
    print(f"[Qlapa AI] Extracted Types: {types}")
    
    # Expand types to include downstream products for raw materials (Bahan Baku)
    search_types = list(types)
    all_types = BAHAN_BAKU_LIST + PRODUK_OLAHAN_LIST
    for t in types:
        if t in BAHAN_BAKU_LIST:
            downstream = DOWNSTREAM_MAP.get(t, {}).get("produk", [])
            for ds in downstream:
                for canonical in all_types:
                    if ds.lower() == canonical.lower() and canonical not in search_types:
                        search_types.append(canonical)
                        
    products = []
    if intent in ["product_recommendation", "product_search", "product_utilization"]:
        products = fetch_products_by_types(search_types)
        
    system_prompt = (
        "Kamu adalah Qlapa AI, asisten virtual ramah dari platform Qlapa "
        "(marketplace jual-beli limbah kelapa). Tugasmu membantu pembeli (B2B/UMKM/Industri) "
        "menemukan ide pemanfaatan bahan baku dan produk olahan kelapa. "
        "Berikan jawaban yang solutif, inspiratif, dan relevan dengan industri/bisnis. "
        "Gunakan bahasa Indonesia yang profesional namun hangat. "
        "Jawab langsung pada intinya, tidak terlalu panjang (1-3 paragraf saja). "
        "PENTING: Jangan gunakan format markdown seperti bintang (**) untuk teks tebal. "
        "Tulis jawaban mengalir seperti teks biasa agar enak dibaca."
    )
    
    context = ""
    if products:
        context += "Berikut adalah produk-produk nyata dari database Qlapa yang cocok dengan kebutuhan pengguna:\n"
        for p in products:
            context += f"- {p['name']} (Rp{p['price']}), Jenis: {p['type']}, Lokasi: {p['seller'].get('store_location', '')}\n"
        context += "\nPENTING: Jangan tulis ulang daftar produk ini secara manual dalam format teks (bullet points/list). Cukup katakan secara umum bahwa Anda merekomendasikan produk ini dan pengguna dapat melihat produk-produk tersebut langsung di bawah pesan ini.\n"
    elif types and intent in ["product_recommendation", "product_search"]:
        context += f"Pengguna mencari jenis produk: {', '.join(types)}. Sayangnya saat ini belum ada stok di database untuk jenis tersebut, beritahu pengguna dengan sopan.\n"

    prompt = f"{system_prompt}\n\n{context}\nPertanyaan pengguna: {message}\n\nJawaban Qlapa AI:"

    if not GEMINI_CLIENT:
        return _generate_local_fallback(intent, types, products, message)
        
    try:
        response = _call_gemini(prompt, temperature=0.7)
        if response:
            return response
    except Exception as e:
        print(f"[Qlapa AI] Chat error: {e}")
        
    return _generate_local_fallback(intent, types, products, message)
