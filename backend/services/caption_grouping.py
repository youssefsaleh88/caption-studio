"""Group word-level captions into segments or chunks for FFmpeg burn-in."""

from __future__ import annotations

import re


_GAP_DEFAULT = 0.35


def _ends_sentence(text: str) -> bool:
    return bool(re.search(r"[.!?؟。]\s*$", str(text).strip()))


def apply_timing_offset(captions: list[dict], offset_sec: float) -> list[dict]:
    o = float(offset_sec or 0)
    out: list[dict] = []
    for c in captions:
        s = max(0.0, float(c["start"]) + o)
        e = max(s, float(c["end"]) + o)
        item = dict(c)
        item["start"] = s
        item["end"] = e
        out.append(item)
    return out


def apply_min_display_time(items: list[dict], min_sec: float) -> list[dict]:
    """Extend each item's end by min_sec, capped at the next segment start."""
    min_sec = max(0.0, float(min_sec or 0))
    if not items or min_sec <= 0:
        return list(items)

    sorted_items = sorted(items, key=lambda x: float(x["start"]))
    out: list[dict] = []
    for i, item in enumerate(sorted_items):
        row = dict(item)
        s = float(row["start"])
        e = float(row["end"])
        next_start = (
            float(sorted_items[i + 1]["start"])
            if i + 1 < len(sorted_items)
            else float("inf")
        )
        desired_end = max(e, s + min_sec)
        row["end"] = min(desired_end, next_start)
        row["end"] = max(s, float(row["end"]))
        out.append(row)
    return out


def group_into_segments(
    words: list[dict],
    *,
    max_words: int = 6,
    max_duration: float = 3.0,
    gap_threshold: float = _GAP_DEFAULT,
) -> list[dict]:
    """Returns [{"word": line_text, "start": float, "end": float}, ...]."""
    if not words:
        return []

    sorted_w = sorted(words, key=lambda x: float(x["start"]))
    max_words = max(1, int(max_words))
    max_duration = max(0.5, float(max_duration))
    gap_threshold = float(gap_threshold) if gap_threshold else _GAP_DEFAULT

    segments: list[dict] = []
    bucket: list[dict] = []
    bucket_start: float | None = None

    def flush() -> None:
        nonlocal bucket, bucket_start
        if not bucket:
            return
        start = bucket_start if bucket_start is not None else float(bucket[0]["start"])
        end = float(bucket[-1]["end"])
        text = " ".join(str(w["word"]) for w in bucket).strip()
        words_payload = [
            {
                "word": str(w["word"]),
                "start": float(w["start"]),
                "end": float(w["end"]),
            }
            for w in bucket
        ]
        segments.append(
            {"word": text, "start": start, "end": end, "words": words_payload}
        )
        bucket = []
        bucket_start = None

    for i, w in enumerate(sorted_w):
        if not bucket:
            bucket.append(w)
            bucket_start = float(w["start"])
            continue

        prev = sorted_w[i - 1]
        gap = float(w["start"]) - float(prev["end"])
        dur_if_add = float(w["end"]) - (bucket_start or float(bucket[0]["start"]))

        break_gap = gap > gap_threshold
        break_dur = dur_if_add > max_duration
        break_words = len(bucket) >= max_words
        break_punct = _ends_sentence(str(prev.get("word", "")))

        if break_gap or break_dur or break_words or break_punct:
            flush()
            bucket.append(w)
            bucket_start = float(w["start"])
        else:
            bucket.append(w)

    flush()
    return segments


def build_chunked_lines(
    words: list[dict],
    window_size: int = 3,
) -> list[dict]:
    """Non-overlapping chunks of `window_size` words each."""
    if not words:
        return []

    ws = max(1, min(7, int(window_size or 3)))
    sorted_w = sorted(words, key=lambda x: float(x["start"]))
    lines: list[dict] = []
    for i in range(0, len(sorted_w), ws):
        slice_ = sorted_w[i : i + ws]
        text = " ".join(str(w["word"]) for w in slice_).strip()
        start = float(slice_[0]["start"])
        end = float(slice_[-1]["end"])
        words_payload = [
            {
                "word": str(w["word"]),
                "start": float(w["start"]),
                "end": float(w["end"]),
            }
            for w in slice_
        ]
        lines.append(
            {
                "word": text,
                "start": start,
                "end": end,
                "words": words_payload,
            }
        )
    return lines


def expand_captions_for_style(
    captions: list[dict],
    style: dict,
) -> list[dict]:
    """Apply offset + caption_mode + min display time for drawtext."""
    offset = float(style.get("timing_offset") or 0)
    adjusted = apply_timing_offset(captions, offset)

    min_hold = float(style.get("min_display_time") or 0.7)

    mode = str(style.get("caption_mode") or "sentences").lower()

    # Pre-grouped sentences from the client: keep each caption intact and
    # preserve per-word timing so karaoke / word animations work correctly.
    if mode == "presplit":
        lines: list[dict] = []
        for c in adjusted:
            words_inner = c.get("words") or []
            normalized_words = [
                {
                    "word": str(w.get("word", "")),
                    "start": float(w.get("start", c["start"])),
                    "end": float(w.get("end", c["end"])),
                }
                for w in words_inner
                if isinstance(w, dict)
            ]
            lines.append(
                {
                    "word": str(c.get("word") or c.get("text") or ""),
                    "start": float(c["start"]),
                    "end": float(c["end"]),
                    "words": normalized_words,
                }
            )
        return apply_min_display_time(lines, min_hold)

    if mode == "sliding":
        ws = int(style.get("sliding_window") or 3)
        lines = build_chunked_lines(adjusted, window_size=ws)
        return apply_min_display_time(lines, min_hold)

    max_words = int(style.get("max_words_per_line") or 6)
    max_dur = float(style.get("max_segment_duration") or 3)
    lines = group_into_segments(
        adjusted,
        max_words=max_words,
        max_duration=max_dur,
    )
    return apply_min_display_time(lines, min_hold)
