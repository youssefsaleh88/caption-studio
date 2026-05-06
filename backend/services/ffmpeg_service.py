import ffmpeg
import os
import uuid
from fastapi import HTTPException

from services.caption_grouping import expand_captions_for_style
from services.ass_subtitles import write_ass_for_burn_in


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
    write_ass_for_burn_in(
        ass_path,
        draw_caps,
        style,
        play_res_x=width,
        play_res_y=height,
    )

    ass_esc = (
        ass_path.replace("\\", "/")
        .replace(":", r"\:")
        .replace("'", r"\'")
    )
    vf = f"subtitles='{ass_esc}'"

    try:
        (
            ffmpeg.input(video_path)
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
