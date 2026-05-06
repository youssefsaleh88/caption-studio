"""Build ASS subtitle files for FFmpeg burn-in (RTL-friendly, scaled to video)."""

from __future__ import annotations

import re
from pathlib import Path


def _hex_to_ass_bgr(color: str, alpha: float = 0.0) -> str:
    """
    #RRGGBB or name -> &HAABBGGRR (ASS BGR with alpha 00=opaque in first byte for some).
    Alpha: 0=opaque, 1=transparent (inverted from typical — ASS uses &HAARRGGBB).
    """
    c = (color or "white").strip()
    if not c.startswith("#"):
        # named colors minimal map
        named = {
            "white": "#FFFFFF",
            "black": "#000000",
        }
        c = named.get(c.lower(), "#FFFFFF")
    h = c.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    if len(h) != 6:
        h = "FFFFFF"
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    aa = int(max(0.0, min(1.0, alpha)) * 255)
    return f"&H{aa:02X}{b:02X}{g:02X}{r:02X}"


def _position_to_alignment(position: str) -> int:
    m = {
        "bottom-left": 1,
        "bottom-center": 2,
        "bottom-right": 3,
        "middle-left": 4,
        "center": 5,
        "middle-right": 6,
        "top-left": 7,
        "top-center": 8,
        "top-right": 9,
    }
    return m.get(str(position or "bottom-center"), 2)


def _escape_ass_text(text: str) -> str:
    t = str(text).replace("\r\n", "\n").replace("\r", "\n")
    t = t.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
    return t.replace("\n", "\\N")


def _format_ass_time(seconds: float) -> str:
    s = max(0.0, float(seconds))
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s - h * 3600 - m * 60
    whole = int(sec)
    cs = int(round((sec - whole) * 100))
    if cs >= 100:
        whole += 1
        cs = 0
    return f"{h}:{m:02d}:{whole:02d}.{cs:02d}"


def _resolve_font_size_px(style: dict, play_res_y: int) -> int:
    pct = style.get("font_size_pct")
    if pct is not None:
        return max(8, round(float(pct) / 100.0 * play_res_y))
    fs = style.get("fontsize")
    if fs is not None:
        return max(8, int(fs))
    return max(8, round(0.055 * play_res_y))


def write_ass_for_burn_in(
    out_path: str | Path,
    lines: list[dict],
    style: dict,
    *,
    play_res_x: int,
    play_res_y: int,
    font_file: str,
) -> None:
    """
    lines: [{"word": text, "start": float, "end": float}, ...]
    style: font_size_pct, fontsize (fallback), fontFamily, color, bg_*, position, shadow
    """
    prx = max(1, int(play_res_x))
    pry = max(1, int(play_res_y))

    font_size_px = _resolve_font_size_px(style, pry)

    font_name = str(
        style.get("fontFamily") or style.get("font") or "Noto Sans Arabic"
    )
    if "Cairo" in font_name:
        font_name = "Cairo"
    elif "Tajawal" in font_name:
        font_name = "Tajawal"
    elif "Noto" in font_name or "Arabic" in font_name:
        font_name = "Noto Sans Arabic"

    primary = _hex_to_ass_bgr(str(style.get("color") or "#FFFFFF"), 0.0)
    outline_col = _hex_to_ass_bgr("#000000", 0.0)

    bg_enabled = style.get("bg_enabled", True)
    bg_alpha = 1.0 - float(style.get("bg_opacity", 0.6))
    back_col = _hex_to_ass_bgr(str(style.get("bg_color") or "#000000"), bg_alpha)

    outline_w = max(2, round(font_size_px * 0.08))
    shadow_w = max(1, round(outline_w * 0.5))

    outline_ui = bool(style.get("outline_enabled"))
    if bg_enabled:
        border_style = 3
        effective_outline = max(2, int(style.get("shadow", 2)))
    else:
        border_style = 1
        effective_outline = outline_w if outline_ui else max(2, outline_w // 2)

    alignment = _position_to_alignment(str(style.get("position") or "bottom-center"))

    margin_v = round(pry * 0.05)
    margin_lr = round(prx * 0.05)

    header = f"""[Script Info]
Title: AI Caption Studio
ScriptType: v4.00+
PlayResX: {prx}
PlayResY: {pry}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size_px},{primary},&H000000FF,{outline_col},{back_col},-1,0,0,0,100,100,0,0,{border_style},{effective_outline},{shadow_w},{alignment},{margin_lr},{margin_lr},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: list[str] = []
    for cap in sorted(lines, key=lambda x: float(x["start"])):
        text = _escape_ass_text(str(cap["word"]))
        start = _format_ass_time(float(cap["start"]))
        end = _format_ass_time(float(cap["end"]))
        if end <= start:
            end = _format_ass_time(float(cap["start"]) + 0.05)
        events.append(
            f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
        )

    Path(out_path).write_text(header + "\n".join(events) + "\n", encoding="utf-8")
