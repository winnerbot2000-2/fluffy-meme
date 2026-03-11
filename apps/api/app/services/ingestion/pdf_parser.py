from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import fitz

from app.models.schemas import SectionBlock
from app.services.ingestion.text_cleaning import clean_text


@dataclass
class ParsedDocument:
    title: str
    sections: list[SectionBlock]


def extract_sections(file_path: Path) -> ParsedDocument:
    document = fitz.open(file_path)
    sections: list[SectionBlock] = []
    current_heading = "Introduction"
    current_text: list[str] = []
    current_page = 1

    for page_index in range(document.page_count):
        page = document.load_page(page_index)
        blocks = page.get_text("dict").get("blocks", [])

        for block in blocks:
            if "lines" not in block:
                continue

            line_text = " ".join(
                span.get("text", "").strip()
                for line in block["lines"]
                for span in line.get("spans", [])
                if span.get("text", "").strip()
            ).strip()
            line_text = clean_text(line_text)
            if not line_text:
                continue

            span_sizes = [
                span.get("size", 0.0)
                for line in block["lines"]
                for span in line.get("spans", [])
                if span.get("text", "").strip()
            ]
            max_size = max(span_sizes) if span_sizes else 0
            is_heading = max_size >= 13 or (line_text.isupper() and len(line_text) < 80)

            if is_heading and current_text:
                sections.append(
                    SectionBlock(heading=clean_text(current_heading), page=current_page, text=clean_text("\n".join(current_text).strip()))
                )
                current_heading = line_text
                current_page = page_index + 1
                current_text = []
            elif is_heading:
                current_heading = line_text
                current_page = page_index + 1
            else:
                current_text.append(line_text)

    if current_text:
        sections.append(SectionBlock(heading=clean_text(current_heading), page=current_page, text=clean_text("\n".join(current_text).strip())))

    return ParsedDocument(title=document.metadata.get("title") or file_path.stem, sections=sections)
