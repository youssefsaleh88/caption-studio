import google.generativeai as genai
import logging
import os
import base64
import json
import re
from pathlib import Path
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def _collect_gemini_keys() -> list[str]:
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


def _collect_gemini_models() -> list[str]:
    default_models = [
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash-lite",
    ]
    configured = os.getenv("GEMINI_MODELS", "").strip()
    if not configured:
        return default_models
    models = [m.strip() for m in configured.split(",") if m.strip()]
    return models or default_models


def _language_hint_line(language_hint: str) -> str:
    h = (language_hint or "auto").strip().lower()
    if h in ("ar", "arabic", "عربي"):
        return (
            "Language hint: The spoken language is Arabic "
            "(MSA or dialect). Transcribe in Arabic script."
        )
    if h in ("en", "english", "إنجليزي"):
        return "Language hint: The spoken language is English."
    return (
        "Language hint: Auto-detect the spoken language from the audio "
        "and transcribe using the correct script."
    )


def _rebalance_word_timings(
    words: list[dict],
    *,
    min_gap: float = 0.05,
    max_extend: float = 2.0,
) -> list[dict]:
    """Extend each word end toward the next word start (minus gap), capped."""
    if not words:
        return []

    sorted_words = sorted(words, key=lambda w: float(w["start"]))
    out: list[dict] = []
    for i, w in enumerate(sorted_words):
        cur = dict(w)
        s = float(cur["start"])
        e = float(cur["end"])
        if i < len(sorted_words) - 1:
            nxt_start = float(sorted_words[i + 1]["start"])
            room = max(0.02, nxt_start - s - min_gap)
            target = max(e, min(nxt_start - min_gap, s + min(room, max_extend)))
            cur["end"] = max(s + 0.02, min(target, nxt_start - min_gap))
        else:
            cur["end"] = max(e, s + min_gap)
        out.append(cur)
    return out


def _coerce_float(val: object, default: float | None = None) -> float | None:
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _extract_word_entry(raw: object, prev_end: float) -> dict | None:
    """
    Normalize one Gemini array element to {word, start, end}.
    Returns None if the row cannot be recovered.
    """
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
        start = _coerce_float(raw.get("begin"))

    end = _coerce_float(raw.get("end"))
    if end is None:
        end = _coerce_float(raw.get("e"))
    if end is None:
        end = _coerce_float(raw.get("stop"))

    if start is None:
        start = max(0.0, float(prev_end))

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
    if ext in (".mp3",):
        return "audio/mp3"
    return "audio/wav"


async def transcribe_audio(
    audio_path: str,
    language_hint: str = "auto",
) -> list[dict]:
    """
    Send audio to Gemini and return word-level timestamps.

    Returns list of: {id, word, start, end}
    """
    try:
        with open(audio_path, "rb") as f:
            audio_data = base64.b64encode(f.read()).decode("utf-8")
    except OSError as e:
        raise HTTPException(
            status_code=500, detail=f"Could not read audio file: {e}"
        )

    mime = _audio_mime(audio_path)

    lang_line = _language_hint_line(language_hint)

    prompt = f"""You are a professional speech-to-text engine. Transcribe this audio VERBATIM.

Rules:
- Preserve the spoken language exactly (do NOT translate).
- Preserve dialect words and filler sounds ("um", "ah", "يعني", "طب") AS-IS.
- Do NOT paraphrase; do NOT "clean up" grammar unless fixing obvious ASR mistakes.
- Output ONE JSON ARRAY ONLY — no markdown, no code fences, no commentary.

Each element MUST be: {{"word": "<token>", "start": <seconds>, "end": <seconds>}}

Timing rules:
- Timestamps are in seconds as floats (two decimals minimum).
- start = exact moment the word/token begins.
- end = exact moment the word/token ends.
- If two words are spoken back-to-back with no pause: end[i] should equal start[i+1]
  (or differ by at most 0.02s due to rounding).
- Every word must have end > start by at least 0.02s unless impossible.

{lang_line}

Return ONLY the JSON array."""

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
    last_error = None
    for key in keys:
        for model_name in models:
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([
                    {"mime_type": mime, "data": audio_data},
                    prompt,
                ])
                break
            except Exception as e:
                last_error = e
                continue
        if response is not None:
            break

    if response is None:
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini API request failed for all configured keys/models: "
                f"{last_error}"
            ),
        )

    text = (response.text or "").strip()
    text = re.sub(r"```json|```", "", text).strip()

    try:
        words = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini returned invalid JSON: {text[:200]}",
        )

    if not isinstance(words, list) or not words:
        raise HTTPException(
            status_code=500, detail="Gemini returned an empty transcription."
        )

    result: list[dict] = []
    prev_end = 0.0
    skipped = 0
    for i, w in enumerate(words):
        entry = _extract_word_entry(w, prev_end)
        if entry is None:
            skipped += 1
            logger.warning(
                "Skipping malformed Gemini word entry at index %s: %r",
                i,
                w,
            )
            continue
        prev_end = entry["end"]
        result.append(entry)

    if not result:
        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini returned no parseable word entries. "
                f"Skipped {skipped} malformed rows. Preview: {text[:200]}"
            ),
        )

    if skipped:
        logger.warning(
            "Gemini transcription: skipped %s malformed entries out of %s",
            skipped,
            len(words),
        )

    result = _rebalance_word_timings(result)
    for i, w in enumerate(result):
        w["id"] = str(i)

    return result
