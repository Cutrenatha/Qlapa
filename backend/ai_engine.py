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
        "gemini-2.0-flash,gemini-2.5-flash,gemini-1.5-flash"
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
    if genai and key:
        try:
            return genai.Client(api_key=key)
        except Exception as e:
            print(f"[Qlapa AI] Gagal inisialisasi Gemini client: {e}")
    return None

GEMINI_CLIENT = _make_gemini_client()
print(f"[Qlapa AI] Gemini client: {'AKTIF' if GEMINI_CLIENT else 'TIDAK TERSEDIA (cek GEMINI_API_KEY / GOOGLE_API_KEY di .env)'}")

# Basis pengetahuan pemanfaatan hilir per kategori limbah kelapa
DOWNSTREAM_MAP = {
    "Tempurung": {
        "produk": ["briket bioarang", "karbon aktif", "kerajinan tangan", "media tanam arang sekam"],
        "sektor": ["energi terbarukan", "kerajinan/UMKM", "pertanian"],
        "karakteristik": "keras, padat karbon tinggi, cocok dibakar suhu tinggi tanpa banyak asap",
    },
    "Sabut": {
        "produk": ["cocofiber", "cocopeat", "geotekstil", "matras/jok otomotif", "media tanam hidroponik"],
        "sektor": ["pertanian/hortikultura", "otomotif", "konstruksi ramah lingkungan"],
        "karakteristik": "berserat, elastis, daya serap air tinggi",
    },
    "Ampas": {
        "produk": ["tepung kelapa bebas gluten", "pakan ternak fermentasi", "bioplastik biodegradable", "kompos"],
        "sektor": ["pangan sehat", "peternakan", "kemasan ramah lingkungan"],
        "karakteristik": "kadar serat & lemak sisa tinggi, cocok difermentasi atau dikeringkan",
    },
    "Daun": {
        "produk": ["anyaman/kerajinan", "kompos", "bahan bakar alami", "media tanam"],
        "sektor": ["kerajinan/UMKM", "pertanian"],
        "karakteristik": "ringan, mudah dianyam saat masih segar, mudah terurai",
    },
    "Air Kelapa": {
        "produk": ["nata de coco", "minuman kesehatan/isotonik", "cuka kelapa", "starter fermentasi (VCO)"],
        "sektor": ["industri minuman", "pangan fermentasi"],
        "karakteristik": "mengandung elektrolit alami, gula, dan enzim aktif",
    },
}

CONDITION_HINTS = {
    "Kering": "kadar air rendah, lebih tahan lama dan mudah didistribusikan",
    "Basah": "kadar air tinggi, sebaiknya segera diproses/dikeringkan setelah diterima",
    "Segar": "kondisi baru dipanen, kualitas optimal untuk pengolahan lanjutan",
}

# Estimasi harga per kg (Rupiah) berdasarkan riset harga pasar bahan baku limbah
# kelapa di tingkat petani/pengepul (bukan harga produk jadi/kerajinan).
# Referensi kasar: cocopeat ~Rp1.100/kg & cocofiber ~Rp1.900/kg di tingkat petani,
# batok kelapa mentah jauh di bawah harga arang olahan (Rp15rb-22rb/kg di retail),
# ampas kering (bahan baku tepung kelapa) bernilai jauh lebih tinggi dari ampas
# basah (cuma layak jadi pakan ternak/kompos).
# Kondisi "Kering" > "Segar" > "Basah" karena kondisi kering lebih siap olah,
# tahan lama, dan lebih diminati industri hilir - kecuali Air Kelapa yang
# justru paling bernilai saat masih segar/baru (cepat rusak).
PRICE_FALLBACK = {
    ("Tempurung", "Kering"): 2800, ("Tempurung", "Basah"): 1100, ("Tempurung", "Segar"): 1400,
    ("Sabut", "Kering"): 1900, ("Sabut", "Basah"): 800, ("Sabut", "Segar"): 1000,
    ("Ampas", "Kering"): 4500, ("Ampas", "Basah"): 1000, ("Ampas", "Segar"): 1300,
    ("Daun", "Kering"): 900, ("Daun", "Basah"): 400, ("Daun", "Segar"): 600,
    ("Air Kelapa", "Kering"): 1000, ("Air Kelapa", "Basah"): 1400, ("Air Kelapa", "Segar"): 1800,
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
    if not GEMINI_CLIENT:
        raise RuntimeError("Gemini client tidak tersedia (cek GEMINI_API_KEY di .env)")
    import time
    config = types.GenerateContentConfig(temperature=temperature, top_p=0.95)

    max_retries_per_model = 2
    last_err = None

    for model_id in GEMINI_MODEL_CANDIDATES:
        for attempt in range(max_retries_per_model):
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
                break  # respons kosong, coba model lain, bukan retry model sama
            except Exception as e:
                last_err = e
                err_str = str(e)
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt == 0:
                    # Rate-limit: langsung coba model berikutnya, jangan buang waktu retry di model sama
                    print(f"[Qlapa AI] Model {model_id} kena rate-limit (429), pindah ke model berikutnya...")
                    break
                if "503" in err_str and attempt < max_retries_per_model - 1:
                    print(f"[Qlapa AI] Model {model_id} 503 (server sibuk), retry dalam 2 detik... (Attempt {attempt + 1}/{max_retries_per_model})")
                    time.sleep(2)
                else:
                    print(f"[Qlapa AI] Model {model_id} gagal: {e}")
                    break

    if last_err:
        raise last_err
    return ""


def _call_gemini_vision(image_path: str, prompt: str, temperature: float = 0.2) -> str:
    """Kirim gambar asli + prompt teks ke Gemini 2.5 Flash lewat google-genai SDK."""
    if not GEMINI_CLIENT:
        raise RuntimeError("Gemini client tidak tersedia (cek GEMINI_API_KEY di .env)")

    mime_type, _ = mimetypes.guess_type(image_path)
    mime_type = mime_type or "image/jpeg"
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    import time
    config = types.GenerateContentConfig(temperature=temperature, top_p=0.95)

    max_retries_per_model = 2
    last_err = None

    for model_id in GEMINI_MODEL_CANDIDATES:
        for attempt in range(max_retries_per_model):
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
                break
            except Exception as e:
                last_err = e
                err_str = str(e)
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt == 0:
                    print(f"[Qlapa AI] Model {model_id} kena rate-limit (429), pindah ke model berikutnya...")
                    break
                if "503" in err_str and attempt < max_retries_per_model - 1:
                    print(f"[Qlapa AI] Model {model_id} 503 (server sibuk), retry dalam 2 detik... (Attempt {attempt + 1}/{max_retries_per_model})")
                    time.sleep(2)
                else:
                    print(f"[Qlapa AI] Model {model_id} gagal: {e}")
                    break

    if last_err:
        raise last_err
    return ""


def _ai_analyze_image(image_path: str) -> dict:
    """Kirim foto asli ke Gemini 2.5 Flash (vision) untuk identifikasi jenis limbah kelapa,
    kondisi, kualitas, estimasi berat, estimasi harga, dan deskripsi produk sekaligus."""
    if not GEMINI_CLIENT:
        return {}

    valid_categories = ", ".join(DOWNSTREAM_MAP.keys())
    valid_conditions = ", ".join(CONDITION_HINTS.keys())

    # Ciri visual spesifik per kategori supaya Gemini tidak salah tebak antar kategori yang mirip
    category_visual_guide = (
        "Panduan ciri visual tiap kategori (gunakan ini untuk membedakan, JANGAN asal tebak):\n"
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
        "pilih kategori berdasarkan bagian yang PALING DOMINAN terlihat pada foto."
    )

    prompt = (
        "Kamu adalah Qlapa AI, asisten untuk marketplace limbah kelapa. "
        "Amati foto produk dengan teliti sebelum menjawab.\n\n"
        f"{category_visual_guide}\n\n"
        f"Kategori HARUS salah satu dari: {valid_categories}. "
        f"Kondisi HARUS salah satu dari: {valid_conditions}. "
        "Balas HANYA dengan JSON valid (tanpa markdown, tanpa teks lain) dengan kunci persis:\n"
        "name, category, condition, quality, stock_estimate_kg, description, confidence.\n"
        "- name: nama produk singkat yang menarik untuk listing (contoh: 'Tempurung Kelapa Kering Siap Olah')\n"
        "- quality: 1 kalimat pendek kondisi kebersihan/kualitas visual bahan\n"
        "- stock_estimate_kg: angka perkiraan berat dalam kg berdasarkan tampilan foto (integer)\n"
        "- description: deskripsi produk 3-5 kalimat dalam Bahasa Indonesia untuk pembeli B2B/UMKM, "
        "sebutkan potensi produk turunan dan sektor industri yang relevan.\n"
        "- confidence: angka 1-5 seberapa yakin kamu terhadap kategori yang dipilih "
        "(5 = sangat yakin ciri visualnya jelas, 1 = foto ambigu/sulit dibedakan)."
    )

    try:
        # temperature rendah supaya hasil klasifikasi lebih konsisten/deterministik
        response_text = _call_gemini_vision(image_path, prompt, temperature=0.1)
        data = _extract_json_object(response_text)
        if not data:
            print(f"[Qlapa AI] Gagal parse JSON dari Gemini Vision. Raw response: {response_text!r}")
        else:
            confidence = data.get("confidence")
            if confidence is not None:
                try:
                    if int(confidence) <= 2:
                        print(
                            f"[Qlapa AI] Peringatan: confidence rendah ({confidence}/5) untuk "
                            f"kategori '{data.get('category')}' pada gambar {image_path}. "
                            "Sebaiknya pengguna mengecek ulang manual."
                        )
                except (TypeError, ValueError):
                    pass
        return data
    except Exception as exc:
        print(f"[Qlapa AI] Panggilan Gemini Vision gagal: {exc!r}")
        return {}


def _generate_ai_description_fallback(name: str, category: str, condition: str = "", notes: str = "") -> str:
    info = DOWNSTREAM_MAP.get(category, {
        "produk": ["produk turunan bernilai tambah"],
        "sektor": ["agro-industri"],
        "karakteristik": "berpotensi diolah lebih lanjut",
    })
    kondisi_text = CONDITION_HINTS.get(condition, "kondisi sesuai foto yang diunggah penjual")
    produk_terkait = ", ".join(random.sample(info["produk"], k=min(3, len(info["produk"]))))
    sektor_terkait = " dan ".join(info["sektor"][:2])

    desc = (
        f"{name} merupakan limbah kelapa jenis {category.lower()} dengan karakteristik {info['karakteristik']}. "
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
    condition: str = "",
    quality: str = "",
    notes: str = "",
) -> dict:
    prompt = (
        "Kamu adalah Qlapa AI. Berikan saran produk limbah kelapa dalam format JSON dengan kunci "
        "name dan description saja. "
        "Jangan ubah kategori, kondisi, kualitas, atau catatan penjual. "
        "Output hanya boleh berupa JSON valid tanpa teks lain.\n"
        f"Input:\nname: {name}\ncategory: {category}\ncondition: {condition}\nquality: {quality}\nnotes: {notes}\n"
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
        suggested_name = name or f"{category or 'Produk'} Kelapa {condition or 'Kering'}"
        suggested_category = category or "Tempurung"
        suggested_condition = condition or "Kering"
        suggested_quality = quality or "Kualitas baik, siap dikirim"
        suggested_notes = notes or ""
        return {
            "name": suggested_name,
            "category": suggested_category,
            "condition": suggested_condition,
            "quality": suggested_quality,
            "notes": suggested_notes,
            "description": _generate_ai_description_fallback(
                suggested_name, suggested_category, suggested_condition, suggested_notes
            ),
        }

    name = data.get("name") or name or f"{category or 'Produk'} Kelapa {condition or 'Kering'}"
    category = data.get("category") or category or "Tempurung"
    condition = data.get("condition") or condition or "Kering"
    quality = data.get("quality") or quality or "Kualitas baik, siap dikirim"
    notes = data.get("notes") or notes or ""
    description = data.get("description") or _generate_ai_description_fallback(name, category, condition, notes)

    return {
        "name": name,
        "category": category,
        "condition": condition,
        "quality": quality,
        "notes": notes,
        "description": description,
    }


def generate_ai_description(name: str, category: str, condition: str = "", notes: str = "") -> str:
    return ai_suggest_product_fields(name=name, category=category, condition=condition, quality="", notes=notes)["description"]


def get_recommendation(category: str, question: str = "") -> str:
    """Simulasi chatbot rekomendasi pemanfaatan untuk pembeli."""
    info = DOWNSTREAM_MAP.get(category)
    if not info:
        return (
            "Maaf, Qlapa AI belum memiliki data spesifik untuk kategori ini. "
            "Coba tanyakan tentang kategori Tempurung, Sabut, Ampas, Daun, atau Air Kelapa."
        )

    produk_list = "\n".join([f"  • {p}" for p in info["produk"]])
    reply = (
        f"Terima kasih atas pertanyaannya! Limbah {category.lower()} bisa dimanfaatkan menjadi beberapa "
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
    Jika Gemini gagal/sibuk, akan throw error agar tidak menghasilkan kategori yang keliru / data default."""

    ai_result = _ai_analyze_image(filepath)

    if not ai_result or ai_result.get("category") not in DOWNSTREAM_MAP:
        raise RuntimeError("AI sedang sibuk atau foto tidak jelas dikenali. Silakan coba lagi atau isi data secara manual.")

    category = ai_result.get("category")
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


def chat_with_ai(message: str, category: str = None) -> str:
    """Chatbot Qlapa AI untuk pembeli menggunakan Gemini LLM."""
    if not GEMINI_CLIENT:
        message_lower = message.lower()
        for cat in DOWNSTREAM_MAP:
            if cat.lower() in message_lower:
                return get_recommendation(cat, message)
        if category:
            return get_recommendation(category, message)
        return (
            "Halo! Saya Qlapa AI 🌱. Tanyakan apa saja tentang pemanfaatan limbah kelapa, "
            "misalnya: 'apa manfaat sabut kelapa?' atau 'bisa jadi apa ampas kelapa?'"
        )

    system_prompt = (
        "Kamu adalah Qlapa AI, asisten virtual ramah dari platform Qlapa "
        "(marketplace jual-beli limbah kelapa). Tugasmu membantu pembeli (B2B/UMKM/Industri) "
        "menemukan ide pemanfaatan limbah kelapa (Tempurung, Sabut, Ampas, Daun, Air Kelapa). "
        "Berikan jawaban yang solutif, inspiratif, dan relevan dengan industri/bisnis. "
        "Gunakan bahasa Indonesia yang profesional namun hangat. "
        "Jawab langsung pada intinya, tidak terlalu panjang (1-3 paragraf saja). "
        "PENTING: Jangan gunakan format markdown seperti bintang (**) untuk teks tebal. "
        "Tulis jawaban mengalir seperti teks biasa agar enak dibaca."
    )
    
    if category:
        system_prompt += f"\nKonteks: Pengguna saat ini mungkin sedang melihat produk limbah kategori '{category}'."

    prompt = f"{system_prompt}\n\nPertanyaan pengguna: {message}\n\nJawaban Qlapa AI:"

    try:
        response = _call_gemini(prompt, temperature=0.7)
        if response:
            return response
    except Exception as e:
        print(f"[Qlapa AI] Chat error (langsung ke fallback lokal): {e}")
        
    # Fallback lokal jika Gemini sibuk (503/429) atau tidak tersedia
    message_lower = message.lower()
    for cat in DOWNSTREAM_MAP:
        if cat.lower() in message_lower:
            return get_recommendation(cat, message)
            
    # Hanya berikan rekomendasi kategori jika pertanyaan mendeteksi kata kunci pemanfaatan
    keywords = ["rekomendasi", "manfaat", "olah", "buat", "produk", "bisnis", "ide", "limbah", "apa saja", "guna", "tanya"]
    if category and any(kw in message_lower for kw in keywords):
        return get_recommendation(category, message)
    
    return (
        "Maaf, saat ini Qlapa AI sedang mengalami kendala jaringan (kuota API habis). "
        "Silakan coba tanyakan lagi beberapa saat kemudian 🌱."
    )