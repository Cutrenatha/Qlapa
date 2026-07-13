import json
import mimetypes
import os
import urllib.error
import urllib.parse
import urllib.request
import uuid

from ai_engine import (
    ai_suggest_product_fields as local_ai_suggest_product_fields,
    analyze_product_image as local_analyze_product_image,
    generate_ai_description as local_generate_ai_description,
    get_recommendation as local_get_recommendation,
    chat_with_ai as local_chat_with_ai,
)


AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://127.0.0.1:8001").rstrip("/")
AI_SERVICE_TIMEOUT = float(os.environ.get("AI_SERVICE_TIMEOUT", "6"))


def _service_enabled():
    return os.environ.get("AI_SERVICE_ENABLED", "true").lower() not in {"0", "false", "no", "off"}


def _request_json(path, payload=None, method="POST", timeout=None):
    if not _service_enabled():
        raise RuntimeError("AI service disabled")

    body = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        f"{AI_SERVICE_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(req, timeout=timeout or AI_SERVICE_TIMEOUT) as res:
        return json.loads(res.read().decode("utf-8"))


def _request_get(path, params):
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return _request_json(f"{path}?{query}", method="GET")


def _request_image_analysis(image_path):
    if not _service_enabled():
        raise RuntimeError("AI service disabled")

    boundary = f"----QlapaAI{uuid.uuid4().hex}"
    mime_type = mimetypes.guess_type(image_path)[0] or "application/octet-stream"
    filename = os.path.basename(image_path)

    with open(image_path, "rb") as f:
        file_bytes = f.read()

    body = b"".join([
        f"--{boundary}\r\n".encode("utf-8"),
        f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode("utf-8"),
        f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"),
        file_bytes,
        f"\r\n--{boundary}--\r\n".encode("utf-8"),
    ])

    req = urllib.request.Request(
        f"{AI_SERVICE_URL}/analyze-image",
        data=body,
        headers={
            "Accept": "application/json",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=AI_SERVICE_TIMEOUT) as res:
        return json.loads(res.read().decode("utf-8"))


def _fallback_log(feature, exc):
    print(f"[Qlapa AI] {feature}: AI service gagal, fallback lokal dipakai ({exc})")


def ai_suggest_product_fields(name="", category="", condition="", quality="", notes=""):
    payload = {
        "name": name,
        "category": category,
        "condition": condition,
        "quality": quality,
        "notes": notes,
    }
    try:
        return _request_json("/suggest-product-fields", payload)
    except Exception as exc:
        _fallback_log("suggest-product-fields", exc)
        return local_ai_suggest_product_fields(
            name=name,
            category=category,
            condition=condition,
            quality=quality,
            notes=notes,
        )


def generate_ai_description(name, category, condition="", notes=""):
    payload = {
        "name": name,
        "category": category,
        "condition": condition,
        "notes": notes,
    }
    try:
        data = _request_json("/generate-description", payload)
        return data.get("description") or data.get("ai_description") or ""
    except Exception as exc:
        _fallback_log("generate-description", exc)
        return local_generate_ai_description(
            name=name,
            category=category,
            condition=condition,
            notes=notes,
        )


def analyze_product_image(filepath):
    try:
        return _request_image_analysis(filepath)
    except Exception as exc:
        _fallback_log("analyze-image", exc)
        return local_analyze_product_image(filepath)


def get_recommendation(question):
    try:
        data = _request_json(
            "/recommendation",
            {"message": question},
        )
        return data.get("recommendation") or ""
    except Exception as exc:
        _fallback_log("recommendation", exc)
        return local_get_recommendation(question)


def chat_with_ai(message):
    try:
        data = _request_json("/chat", {"message": message})
        return data.get("reply") or ""
    except Exception as exc:
        _fallback_log("chat", exc)
        return local_chat_with_ai(message)
