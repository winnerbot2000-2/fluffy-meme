from __future__ import annotations

import re

GRAPH_PATTERNS = {
    "supply-demand": re.compile(r"supply|demand|equilibrium", re.IGNORECASE),
    "tax-wedge": re.compile(r"tax|subsidy|wedge|deadweight loss", re.IGNORECASE),
    "ppc": re.compile(r"ppc|production possibilities", re.IGNORECASE),
    "cost-curves": re.compile(r"marginal cost|average total cost|atc|avc|afc", re.IGNORECASE),
    "monopoly": re.compile(r"monopoly|marginal revenue|price discrimination", re.IGNORECASE),
}


def detect_graph_mentions(text: str) -> list[str]:
    return [name for name, pattern in GRAPH_PATTERNS.items() if pattern.search(text)]
