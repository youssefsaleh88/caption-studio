import google.generativeai as genai
import os
import base64
import json
import re
from fastapi import HTTPException


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

    # Keep insertion order while deduplicating.
    return list(dict.fromkeys(keys))


def _collect_gemini_models() -> list[str]:
    default_models = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
    ]
    configured = os.getenv("GEMINI_MODELS", "").strip()
    if not configured:
        return default_models
    models = [m.strip() for m in configured.split(",") if m.strip()]
    return models or default_models


async def transcribe_audio(audio_path: str) -> list[dict]:
    """
    Send audio to Gemini 1.5 Flash and return word-level timestamps.

    Returns list of: {id, word, start, end}
    """
    try:
        with open(audio_path, "rb") as f:
            audio_data = base64.b64encode(f.read()).decode("utf-8")
    except OSError as e:
        raise HTTPException(
            status_code=500, detail=f"Could not read audio file: {e}"
        )

    prompt = """Transcribe this audio exactly.
Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
Format: [{"word": "hello", "start": 0.0, "end": 0.5}, ...]
Every word must have start and end time in seconds as floats.
If you cannot determine exact timestamps, distribute them evenly across the audio duration."""

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
                    {"mime_type": "audio/mp3", "data": audio_data},
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
    for i, w in enumerate(words):
        try:
            result.append({
                "id": str(i),
                "word": str(w["word"]),
                "start": float(w["start"]),
                "end": float(w["end"]),
            })
        except (KeyError, TypeError, ValueError) as e:
            raise HTTPException(
                status_code=500,
                detail=f"Malformed word entry from Gemini at index {i}: {e}",
            )

    return result
