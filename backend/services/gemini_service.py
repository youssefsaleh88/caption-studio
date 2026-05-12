"""Transcribe audio with Gemini 2.5 Pro into word-level timestamps."""

import google.generativeai as genai
import logging
import os
import base64
import json
import re
from pathlib import Path
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def _collect_gemini_models() -> list[str]:
    csv_models = os.getenv("GEMINI_MODELS", "").strip()
    if csv_models:
        return [m.strip() for m in csv_models.split(",") if m.strip()]
    return ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.5-flash"]


def _collect_gemini_keys() -> list[str]:
    """Collect all configured API keys (primary + fallbacks for rate-limit resilience)."""
    keys: list[str] = []

    primary = os.getenv("GEMINI_API_KEY", "").strip()
    if primary:
        keys.append(primary)

    csv_keys = os.getenv("GEMINI_API_KEYS", "").strip()
    if csv_keys:
        keys.extend([k.strip() for k in csv_keys.split(",") if k.strip()])

    idx = 1
    while True:
        value = os.getenv(f"GEMINI_API_KEY_{idx}", "").strip()
        if not value:
            break
        keys.append(value)
        idx += 1

    return list(dict.fromkeys(keys))


def _coerce_float(val: object, default: float | None = None) -> float | None:
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _extract_word_entry(raw: object, prev_end: float) -> dict | None:
    """Normalize one Gemini element to {word, start, end}. Returns None if unrecoverable."""
    if not isinstance(raw, dict):
        return None

    word_text: str | None = None
    for key in ("word", "text", "token", "w"):
        if key in raw and raw[key] is not None:
            word_text = str(raw[key]).strip()
            break
    if not word_text:
        return None

    start = _coerce_float(raw.get("start"))
    if start is None:
        start = _coerce_float(raw.get("s"))
    if start is None:
        start = max(0.0, float(prev_end))

    end = _coerce_float(raw.get("end"))
    if end is None:
        end = _coerce_float(raw.get("e"))
    if end is None:
        end = float(start) + 0.2

    if end < float(start) + 0.02:
        end = float(start) + 0.02

    return {
        "word": word_text,
        "start": float(start),
        "end": float(end),
    }


def _audio_mime(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext == ".wav":
        return "audio/wav"
    if ext == ".mp3":
        return "audio/mp3"
    return "audio/wav"


def _parse_words_payload(raw_text: str) -> list[dict]:
    """Pull the JSON payload out of Gemini's response (handles ```json fences and stray prose)."""
    text = (raw_text or "").strip()
    text = re.sub(r"```json|```", "", text).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
        if not match:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini returned invalid JSON: {text[:200]}",
            )
        parsed = json.loads(match.group(0))

    if isinstance(parsed, dict) and "words" in parsed:
        parsed = parsed["words"]

    if not isinstance(parsed, list):
        raise HTTPException(
            status_code=500,
            detail="Gemini response is not a list of words.",
        )

    return parsed


async def transcribe_audio(
    audio_path: str,
    language_hint: str = "auto",
) -> list[dict]:
    """Send audio to Gemini 2.5 Pro and return [{id, word, start, end}, ...]."""
    try:
        with open(audio_path, "rb") as f:
            audio_data = base64.b64encode(f.read()).decode("utf-8")
    except OSError as e:
        raise HTTPException(
            status_code=500, detail=f"Could not read audio file: {e}"
        )

    mime = _audio_mime(audio_path)

    prompt = """أنت نظام متخصص في تفريغ الصوت بدقة عالية.

المطلوب:
- فرّغ هذا الصوت كلمة بكلمة بالضبط كما نُطقت.
- لا تُترجم ولا تُعيد الصياغة ولا تُصلح القواعد.
- ادعم اللغة العربية الفصحى، العامية المصرية، والإنجليزية.
- احتفظ بكلمات التردد ("يعني"، "طب"، "اه") كما هي.
- أعطِ لكل كلمة وقت البداية (start) ووقت النهاية (end) بالثواني (أرقام عشرية).
- كن دقيقًا قدر الإمكان في التوقيت، خصوصًا عند بداية كل كلمة.
- إذا نُطقت كلمتان متتاليتان بدون فاصل: end[i] يساوي تقريبًا start[i+1].
- end > start بفارق 0.02 ثانية على الأقل.

أرجع JSON فقط بهذا الشكل، بدون أي نص إضافي وبدون ```:
{
  "words": [
    {"word": "مرحباً", "start": 0.00, "end": 0.45},
    {"word": "بالجميع", "start": 0.46, "end": 1.10}
  ]
}"""

    keys = _collect_gemini_keys()
    if not keys:
        raise HTTPException(
            status_code=500,
            detail=(
                "No Gemini API key configured. Set GEMINI_API_KEY or one of "
                "GEMINI_API_KEYS / GEMINI_API_KEY_1..N."
            ),
        )

    models = _collect_gemini_models()

    response = None
    last_error: Exception | None = None
    for key in keys:
        for model_name in models:
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(model_name)
                response = await model.generate_content_async([
                    {"mime_type": mime, "data": audio_data},
                    prompt,
                ])
                break
            except Exception as e:
                last_error = e
                logger.warning("Gemini call failed for key/model (model=%s): %s", model_name, e)
                continue
        if response is not None:
            break

    if response is None:
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini API request failed for all configured keys and models: "
                f"{last_error}"
            ),
        )

    words_raw = _parse_words_payload(response.text or "")

    if not words_raw:
        raise HTTPException(
            status_code=500, detail="Gemini returned an empty transcription."
        )

    result: list[dict] = []
    prev_end = 0.0
    skipped = 0
    for i, w in enumerate(words_raw):
        entry = _extract_word_entry(w, prev_end)
        if entry is None:
            skipped += 1
            logger.warning(
                "Skipping malformed Gemini word entry at index %s: %r", i, w
            )
            continue
        prev_end = entry["end"]
        result.append(entry)

    if not result:
        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini returned no parseable word entries. "
                f"Skipped {skipped} malformed rows."
            ),
        )

    if skipped:
        logger.warning(
            "Gemini transcription: skipped %s malformed entries out of %s",
            skipped,
            len(words_raw),
        )

    for i, w in enumerate(result):
        w["id"] = str(i)

    return result
