"""Group word-level captions into segments or sliding windows for FFmpeg burn-in."""

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
        segments.append({"word": text, "start": start, "end": end})
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


def build_sliding_lines(
    words: list[dict],
    window_size: int = 3,
) -> list[dict]:
    """One overlay per word index; text is sliding window around that word."""
    if not words:
        return []

    n = len(words)
    ws = max(1, min(7, int(window_size or 3)))
    sorted_w = sorted(words, key=lambda x: float(x["start"]))
    # Map original indices by position in sorted order - assume ids preserve order
    # Use sorted list indices 0..n-1
    lines: list[dict] = []
    for i in range(n):
        left = max(0, i - (ws - 1) // 2)
        right = min(n - 1, left + ws - 1)
        left = max(0, right - ws + 1)
        chunk = sorted_w[left : right + 1]
        text = " ".join(str(w["word"]) for w in chunk).strip()
        anchor = sorted_w[i]
        lines.append({
            "word": text,
            "start": float(anchor["start"]),
            "end": float(anchor["end"]),
        })
    return lines


def expand_captions_for_style(
    captions: list[dict],
    style: dict,
) -> list[dict]:
    """Apply offset + caption_mode to raw word list for drawtext."""
    offset = float(style.get("timing_offset") or 0)
    adjusted = apply_timing_offset(captions, offset)

    mode = str(style.get("caption_mode") or "sentences").lower()
    if mode == "sliding":
        ws = int(style.get("sliding_window") or 3)
        return build_sliding_lines(adjusted, window_size=ws)

    max_words = int(style.get("max_words_per_line") or 6)
    max_dur = float(style.get("max_segment_duration") or 3)
    return group_into_segments(
        adjusted,
        max_words=max_words,
        max_duration=max_dur,
    )
