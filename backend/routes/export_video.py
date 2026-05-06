from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
import tempfile
import os
import shutil

from services.ffmpeg_service import burn_captions

router = APIRouter()


class Caption(BaseModel):
    id: str
    word: str
    start: float
    end: float


class StyleOptions(BaseModel):
    fontsize: int = 28
    color: str = "white"
    bg_color: str = "black"
    bg_opacity: float = 0.6
    shadow: int = 2
    position: str = "bottom-center"
    font: str | None = None


class ExportRequest(BaseModel):
    video_url: str
    captions: list[Caption]
    style: StyleOptions


def _cleanup_dir(path: str) -> None:
    shutil.rmtree(path, ignore_errors=True)


@router.post("/export")
async def export(req: ExportRequest, background_tasks: BackgroundTasks):
    tmpdir = tempfile.mkdtemp(prefix="caption_export_")
    try:
        video_path = os.path.join(tmpdir, "input.mp4")

        try:
            async with httpx.AsyncClient(timeout=180) as client:
                r = await client.get(req.video_url)
                if r.status_code != 200:
                    raise HTTPException(
                        status_code=400, detail="Could not download video"
                    )
                with open(video_path, "wb") as f:
                    f.write(r.content)
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Network error while downloading video: {e}",
            )

        captions_dicts = [c.dict() for c in req.captions]
        style_dict = req.style.dict()

        output_path = burn_captions(
            video_path, captions_dicts, style_dict, tmpdir
        )

        background_tasks.add_task(_cleanup_dir, tmpdir)

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="captioned_video.mp4",
        )
    except HTTPException:
        _cleanup_dir(tmpdir)
        raise
    except Exception as e:
        _cleanup_dir(tmpdir)
        raise HTTPException(
            status_code=500, detail=f"Export pipeline failed: {e}"
        )
