import google.generativeai as genai
import os
import base64
import json
import re
from fastapi import HTTPException

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


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

    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """Transcribe this audio exactly.
Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
Format: [{"word": "hello", "start": 0.0, "end": 0.5}, ...]
Every word must have start and end time in seconds as floats.
If you cannot determine exact timestamps, distribute them evenly across the audio duration."""

    try:
        response = model.generate_content([
            {"mime_type": "audio/mp3", "data": audio_data},
            prompt,
        ])
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Gemini API request failed: {e}"
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
