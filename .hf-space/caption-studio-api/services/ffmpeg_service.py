import ffmpeg
import os
import uuid
from fastapi import HTTPException

FONT_PATH = "/usr/share/fonts/NotoSansArabic.ttf"
FALLBACK_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def extract_audio(video_path: str, output_dir: str) -> str:
    """Extract audio from video as MP3 (16kHz, mono)."""
    audio_path = os.path.join(output_dir, f"{uuid.uuid4()}.mp3")
    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec="mp3", ab="128k", ac=1, ar="16000")
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg audio extraction failed: {e.stderr.decode(errors='ignore')}",
        )
    return audio_path


def burn_captions(
    video_path: str,
    captions: list[dict],
    style: dict,
    output_dir: str,
) -> str:
    """
    Burn captions into video using FFmpeg drawtext filter (one per word).

    captions: [{id, word, start, end}]
    style:    {fontsize, color, bg_color, bg_opacity, shadow, position, font?}
    """
    output_path = os.path.join(output_dir, f"output_{uuid.uuid4()}.mp4")

    font_path = FONT_PATH if os.path.exists(FONT_PATH) else FALLBACK_FONT

    pos_map = {
        "bottom-center": ("(w-text_w)/2", "h-th-40"),
        "bottom-left":   ("40",            "h-th-40"),
        "bottom-right":  ("w-tw-40",       "h-th-40"),
        "top-center":    ("(w-text_w)/2", "40"),
        "top-left":      ("40",            "40"),
        "top-right":     ("w-tw-40",       "40"),
        "center":        ("(w-text_w)/2", "(h-text_h)/2"),
        "middle-left":   ("40",            "(h-text_h)/2"),
        "middle-right":  ("w-tw-40",       "(h-text_h)/2"),
    }
    x, y = pos_map.get(
        style.get("position", "bottom-center"),
        ("(w-text_w)/2", "h-th-40"),
    )

    fontsize   = int(style.get("fontsize", 28))
    color      = str(style.get("color", "white")).replace("#", "")
    shadow     = int(style.get("shadow", 2))
    bg_color   = str(style.get("bg_color", "black")).replace("#", "")
    bg_opacity = float(style.get("bg_opacity", 0.6))

    if not captions:
        raise HTTPException(status_code=400, detail="No captions provided")

    filters = []
    for cap in captions:
        word = (
            str(cap["word"])
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace(":", "\\:")
            .replace(",", "\\,")
        )
        start = float(cap["start"])
        end = float(cap["end"])

        drawtext = (
            f"drawtext=fontfile='{font_path}'"
            f":text='{word}'"
            f":fontsize={fontsize}"
            f":fontcolor={color}"
            f":x={x}:y={y}"
            f":shadowcolor=black:shadowx={shadow}:shadowy={shadow}"
            f":box=1:boxcolor={bg_color}@{bg_opacity}:boxborderw=8"
            f":enable='between(t,{start},{end})'"
        )
        filters.append(drawtext)

    vf = ",".join(filters)

    try:
        (
            ffmpeg
            .input(video_path)
            .output(
                output_path,
                vf=vf,
                acodec="copy",
                vcodec="libx264",
                crf=23,
                preset="veryfast",
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg burn-in failed: {e.stderr.decode(errors='ignore')}",
        )

    return output_path
