from __future__ import annotations

import re

FORMULA_PATTERNS = {
    "midpoint-elasticity": re.compile(r"midpoint|elasticity", re.IGNORECASE),
    "tax-revenue": re.compile(r"tax revenue|per-unit tax", re.IGNORECASE),
    "deadweight-loss": re.compile(r"deadweight loss|dwl", re.IGNORECASE),
    "profit": re.compile(r"profit|atc|average total cost", re.IGNORECASE),
}


def detect_formula_mentions(text: str) -> list[str]:
    return [name for name, pattern in FORMULA_PATTERNS.items() if pattern.search(text)]
