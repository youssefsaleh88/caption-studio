import ffmpeg
import os
import uuid
from fastapi import HTTPException

from services.caption_grouping import expand_captions_for_style
from services.ass_subtitles import write_ass_for_burn_in


def _escape_ffmpeg_filter_path(path: str) -> str:
    return path.replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def resolve_burn_in_font_file(style: dict) -> str | None:
    """
    Prefer bundled/env font path so libass can load Arabic glyphs in Docker/Linux.
    Latin UI fonts (Poppins, etc.) map to Liberation Sans in ASS — use its TTF here.
    """
    env_font = os.environ.get("CAPTION_FONT_FILE")
    fam = str(style.get("fontFamily") or style.get("font") or "").lower()
    liberation = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    arabic_paths = [
        "/usr/share/fonts/NotoSansArabic.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansArabic-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansArabic[wdth,wght].ttf",
    ]
    latinish = (
        "poppins",
        "bebas",
        "space mono",
        "spacemono",
        "dm sans",
        "dmsans",
    )
    is_ar_stack = any(
        x in fam for x in ("cairo", "tajawal", "noto", "arabic")
    )
    is_latin_ui = any(x in fam for x in latinish) and not is_ar_stack

    candidates: list[str | None] = [env_font]
    if is_latin_ui:
        candidates.append(liberation)
    if is_ar_stack or not is_latin_ui:
        candidates.extend(arabic_paths)
    candidates.extend(
        [
            liberation,
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    )
    for p in candidates:
        if p and os.path.isfile(p):
            return p
    return None


def extract_audio(video_path: str, output_dir: str) -> str:
    """Extract cleaned mono WAV (24kHz) for ASR."""
    audio_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")
    try:
        inp = ffmpeg.input(video_path)
        audio = (
            inp.audio.filter("highpass", f=80)
            .filter("lowpass", f=12000)
            .filter("dynaudnorm")
        )
        (
            ffmpeg.output(
                audio,
                audio_path,
                acodec="pcm_s16le",
                ac=1,
                ar="24000",
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg audio extraction failed: {e.stderr.decode(errors='ignore')}",
        )
    return audio_path


def _probe_video_size(video_path: str) -> tuple[int, int]:
    try:
        p = ffmpeg.probe(video_path)
    except ffmpeg.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg probe failed: {e}",
        )
    for s in p.get("streams") or []:
        if s.get("codec_type") == "video":
            w = int(s.get("width") or 0)
            h = int(s.get("height") or 0)
            if w > 0 and h > 0:
                return w, h
    raise HTTPException(status_code=400, detail="Could not read video dimensions")


def burn_captions(
    video_path: str,
    captions: list[dict],
    style: dict,
    output_dir: str,
) -> str:
    """
    Burn captions using ASS subtitles (libass) for readable Arabic + scaling.

    captions: [{id, word, start, end}]
    style: font_size_pct, colors, position, etc.
    """
    output_path = os.path.join(output_dir, f"output_{uuid.uuid4()}.mp4")

    if not captions:
        raise HTTPException(status_code=400, detail="No captions provided")

    draw_caps = expand_captions_for_style(captions, style)
    if not draw_caps:
        raise HTTPException(status_code=400, detail="No captions provided")

    width, height = _probe_video_size(video_path)

    ass_path = os.path.join(output_dir, f"captions_{uuid.uuid4()}.ass")
    font_path = resolve_burn_in_font_file(style)
    write_ass_for_burn_in(
        ass_path,
        draw_caps,
        style,
        play_res_x=width,
        play_res_y=height,
        font_file=font_path,
    )

    ass_esc = _escape_ffmpeg_filter_path(ass_path)
    if font_path:
        font_dir = os.path.dirname(os.path.abspath(font_path))
        dir_esc = _escape_ffmpeg_filter_path(font_dir)
        vf = f"subtitles='{ass_esc}':fontsdir='{dir_esc}'"
    else:
        vf = f"subtitles='{ass_esc}'"

    try:
        (
            ffmpeg.input(video_path)
            .output(
                output_path,
                vf=vf,
                acodec="aac",  # Re-encode audio to fix VFR sync drift
                audio_bitrate="128k",
                vcodec="libx264",
                crf=23,
                preset="veryfast",
                fps_mode="cfr", # Force Constant Frame Rate
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
