from __future__ import annotations

import re

CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
DOT_LEADER_RE = re.compile(r"\.{4,}")
SPACE_RE = re.compile(r"[ \t]{2,}")
LONG_DIGIT_RE = re.compile(r"\b\d{7,}\b")
ZERO_RUN_RE = re.compile(r"0{6,}")


def clean_text(text: str) -> str:
    if not text:
        return ""

    normalized = (
        text.replace("\u2003", " ")
        .replace("\u2002", " ")
        .replace("\u00a0", " ")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )
    normalized = CONTROL_CHAR_RE.sub("", normalized)

    cleaned_lines: list[str] = []
    for raw_line in normalized.split("\n"):
        line = DOT_LEADER_RE.sub(" ", raw_line).strip()
        line = ZERO_RUN_RE.sub("0000", line)
        line = LONG_DIGIT_RE.sub("[trimmed-number]", line)
        line = SPACE_RE.sub(" ", line)
        if line:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


def compact_excerpt(text: str, max_chars: int = 240) -> str:
    cleaned = clean_text(text).replace("\n", " ")
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 1].rstrip() + "…"


def tokenize_highlight(text: str) -> list[str]:
    cleaned = clean_text(text).lower()
    return [token for token in re.findall(r"[a-z0-9']+", cleaned) if len(token) >= 4]
