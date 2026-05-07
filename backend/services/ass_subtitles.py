"""Build ASS subtitle files for FFmpeg burn-in (RTL-friendly, scaled to video)."""

from __future__ import annotations

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


def _animation_prefix(mode: str) -> str:
    m = str(mode or "none").lower()
    mapping = {
        "fade": r"{\fad(180,140)}",
        "pop": r"{\fscx70\fscy70\t(0,200,\fscx100\fscy100)}",
        "bounce": r"{\fscx60\fscy60\t(0,180,\fscx112\fscy112)\t(180,300,\fscx100\fscy100)}",
    }
    return mapping.get(m, "")


def _pos_prefix(style: dict, prx: int, pry: int) -> str:
    x = style.get("position_x_pct")
    y = style.get("position_y_pct")
    if x is None or y is None:
        return ""
    xp = max(0.0, min(100.0, float(x)))
    yp = max(0.0, min(100.0, float(y)))
    xi = int(round(xp / 100.0 * prx))
    yi = int(round(yp / 100.0 * pry))
    return rf"{{\an5\pos({xi},{yi})}}"


def _snapshots_word(
    words: list[dict],
    seg_start: float,
    seg_end: float,
    min_gap: float,
) -> list[tuple[float, float, str]]:
    out: list[tuple[float, float, str]] = []
    cum: list[str] = []
    n = len(words)
    for i, w in enumerate(words):
        raw = str(w.get("word", "")).strip()
        if raw:
            cum.append(raw)
        t_in = max(float(seg_start), float(w.get("start", seg_start)))
        if i + 1 < n:
            t_next = float(words[i + 1].get("start", seg_end))
            t_out = max(t_in + min_gap, min(t_next, seg_end))
        else:
            t_out = max(t_in + min_gap, float(seg_end))
        t_out = min(float(seg_end), max(t_out, t_in + min_gap))
        text = " ".join(cum).strip()
        out.append((t_in, t_out, text))
    return out


def _snapshots_typewriter(
    words: list[dict],
    seg_start: float,
    seg_end: float,
    min_gap: float,
) -> list[tuple[float, float, str]]:
    steps: list[tuple[float, str]] = []
    completed: list[str] = []

    for w in words:
        raw = str(w.get("word", ""))
        st = float(w.get("start", seg_start))
        en = float(w.get("end", st))
        dur = max(0.06, en - st)
        spread = dur * 0.7
        chars = list(raw)
        nc = len(chars)
        if nc == 0:
            continue
        base = " ".join(completed).strip()
        for i, _ch in enumerate(chars):
            if nc == 1:
                t_char = st
            else:
                t_char = st + (i / (nc - 1)) * spread
            t_char = max(float(seg_start), t_char)
            fragment = "".join(chars[: i + 1])
            if base:
                display = f"{base} {fragment}".strip()
            else:
                display = fragment
            steps.append((t_char, display))
        if raw.strip():
            completed.append(raw.strip())

    if not steps:
        return []

    out: list[tuple[float, float, str]] = []
    for i, (t_in, txt) in enumerate(steps):
        t_next = steps[i + 1][0] if i + 1 < len(steps) else float(seg_end)
        t_out = max(t_in + min_gap, min(float(t_next), float(seg_end)))
        t_out = min(float(seg_end), t_out)
        if t_out <= t_in:
            t_out = min(float(seg_end), t_in + min_gap)
        out.append((t_in, t_out, txt))
    return out


def _karaoke_ass_body(words: list[dict]) -> str:
    parts: list[str] = []
    for w in words:
        raw = str(w.get("word", "")).strip()
        if not raw:
            continue
        st = float(w.get("start", 0))
        en = float(w.get("end", 0))
        dur_cs = max(1, int(round(max(0.0, en - st) * 100)))
        escaped = _escape_ass_text(raw)
        parts.append(rf"{{\k{dur_cs}}}{escaped}")
    return " ".join(parts)


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
    font_file: str | None = None,
) -> None:
    """
    lines: [{"word": text, "start": float, "end": float}, ...]
    style: font_size_pct, fontsize (fallback), fontFamily, color, bg_*, position, shadow
    font_file: optional path (burn-in uses fontsdir in FFmpeg; reserved for future).
    """
    prx = max(1, int(play_res_x))
    pry = max(1, int(play_res_y))

    font_size_px = _resolve_font_size_px(style, pry)

    raw_font = str(style.get("fontFamily") or style.get("font") or "Noto Sans Arabic")
    font_name = raw_font.strip() or "Noto Sans Arabic"
    if "Cairo" in font_name:
        font_name = "Cairo"
    elif "Tajawal" in font_name:
        font_name = "Tajawal"
    elif "Poppins" in font_name:
        font_name = "Liberation Sans"
    elif "Bebas" in font_name:
        font_name = "Liberation Sans"
    elif "Space Mono" in font_name or "SpaceMono" in font_name.replace(" ", ""):
        font_name = "Liberation Sans"
    elif "DM Sans" in font_name or "DMSans" in font_name.replace(" ", ""):
        font_name = "Liberation Sans"
    elif "Noto" in font_name or "Arabic" in font_name:
        font_name = "Noto Sans Arabic"

    anim_mode = str(style.get("caption_animation") or "none").lower()

    if anim_mode == "karaoke":
        primary = _hex_to_ass_bgr(str(style.get("karaoke_color") or "#8B80FF"), 0.0)
        secondary = _hex_to_ass_bgr(str(style.get("color") or "#FFFFFF"), 0.0)
    else:
        primary = _hex_to_ass_bgr(str(style.get("color") or "#FFFFFF"), 0.0)
        secondary = "&H000000FF"

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
Style: Default,{font_name},{font_size_px},{primary},{secondary},{outline_col},{back_col},-1,0,0,0,100,100,0,0,{border_style},{effective_outline},{shadow_w},{alignment},{margin_lr},{margin_lr},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    min_gap = 0.05
    pos_pre = _pos_prefix(style, prx, pry)

    events: list[str] = []
    for cap in sorted(lines, key=lambda x: float(x["start"])):
        seg_start = float(cap["start"])
        seg_end = float(cap["end"])
        words_inner = cap.get("words")
        if not isinstance(words_inner, list):
            words_inner = []

        if anim_mode == "karaoke" and len(words_inner) > 0:
            body = _karaoke_ass_body(words_inner)
            if not body.strip():
                body = _escape_ass_text(str(cap["word"]))
            text = pos_pre + body
            start = _format_ass_time(seg_start)
            end = _format_ass_time(seg_end)
            if end <= start:
                end = _format_ass_time(seg_start + min_gap)
            events.append(
                f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
            )
            continue

        if anim_mode == "word" and len(words_inner) > 0:
            for t_in, t_out, plain in _snapshots_word(
                words_inner, seg_start, seg_end, min_gap
            ):
                if not str(plain).strip():
                    continue
                st = _format_ass_time(t_in)
                en = _format_ass_time(t_out)
                if en <= st:
                    en = _format_ass_time(t_in + min_gap)
                body = pos_pre + _escape_ass_text(plain)
                events.append(
                    f"Dialogue: 0,{st},{en},Default,,0,0,0,,{body}"
                )
            continue

        if anim_mode == "typewriter" and len(words_inner) > 0:
            for t_in, t_out, plain in _snapshots_typewriter(
                words_inner, seg_start, seg_end, min_gap
            ):
                st = _format_ass_time(t_in)
                en = _format_ass_time(t_out)
                if en <= st:
                    en = _format_ass_time(t_in + min_gap)
                body = pos_pre + _escape_ass_text(plain)
                events.append(
                    f"Dialogue: 0,{st},{en},Default,,0,0,0,,{body}"
                )
            continue

        base = _escape_ass_text(str(cap["word"]))
        prefix = _animation_prefix(anim_mode)
        text = pos_pre + prefix + base
        start = _format_ass_time(seg_start)
        end = _format_ass_time(seg_end)
        if end <= start:
            end = _format_ass_time(seg_start + min_gap)
        events.append(
            f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
        )

    Path(out_path).write_text(header + "\n".join(events) + "\n", encoding="utf-8")
