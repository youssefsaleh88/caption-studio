from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import httpx
import tempfile
import os
import ffmpeg

from services.gemini_service import transcribe_audio
from services.ffmpeg_service import extract_audio

router = APIRouter()


class TranscribeRequest(BaseModel):
    video_url: str
    language_hint: str = "auto"


def _probe_media_duration(video_path: str) -> float:
    """Return media duration in seconds, or 0 if unavailable."""
    try:
        probe = ffmpeg.probe(video_path)
        duration = float((probe.get("format") or {}).get("duration") or 0.0)
        return max(0.0, duration)
    except Exception:
        return 0.0


def _normalize_word_timeline_to_media(
    words: list[dict],
    media_duration: float,
    *,
    keep_tail_silence: float = 1.2,
) -> list[dict]:
    """
    Stretch/compress timeline if ASR timings are clearly off vs media duration.
    Currently unused: raw Gemini timings are returned as-is.
    """
    if not words or media_duration <= 0:
        return words

    sorted_words = sorted(words, key=lambda w: float(w["start"]))
    last_end = max(float(w["end"]) for w in sorted_words)
    if last_end <= 0:
        return words

    target_end = max(0.1, media_duration - keep_tail_silence)
    scale = target_end / last_end

    if 0.92 <= scale <= 1.08:
        return words

    normalized: list[dict] = []
    for w in sorted_words:
        row = dict(w)
        s = max(0.0, float(row["start"]) * scale)
        e = max(s + 0.02, float(row["end"]) * scale)
        row["start"] = s
        row["end"] = min(e, media_duration)
        normalized.append(row)

    for i in range(len(normalized) - 1):
        cur = normalized[i]
        nxt = normalized[i + 1]
        if cur["end"] >= nxt["start"]:
            cur["end"] = max(cur["start"] + 0.02, nxt["start"] - 0.01)

    return normalized


@router.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            video_path = os.path.join(tmpdir, "input.mp4")

            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    r = await client.get(req.video_url)
                    if r.status_code != 200:
                        raise HTTPException(
                            status_code=400,
                            detail="Could not download video from storage URL",
                        )
                    with open(video_path, "wb") as f:
                        f.write(r.content)
            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Network error while downloading video: {e}",
                )

            audio_path = await run_in_threadpool(extract_audio, video_path, tmpdir)
            words = await transcribe_audio(
                audio_path,
                language_hint=req.language_hint or "auto",
            )

        return {"words": words}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Transcription pipeline failed: {e}"
        )
