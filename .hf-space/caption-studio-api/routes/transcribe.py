from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import tempfile
import os

from services.gemini_service import transcribe_audio
from services.ffmpeg_service import extract_audio

router = APIRouter()


class TranscribeRequest(BaseModel):
    video_url: str


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

            audio_path = extract_audio(video_path, tmpdir)
            words = await transcribe_audio(audio_path)

        return {"words": words}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Transcription pipeline failed: {e}"
        )
