"""First-pass spec topic tagging from question text (reviewed by hand after).

Scores each topic by its keywords (longer, more specific keywords count more)
and returns the best one to three codes. Manual corrections live in
data/tag_overrides.json as {"<libraryId>:<questionId>": ["A18", "A4"]}.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_TOPICS = json.loads((ROOT / "app/data/topics.json").read_text())["topics"]
OVERRIDES_PATH = ROOT / "data" / "tag_overrides.json"

# Extra patterns that keyword lists cannot express.
PATTERNS = [
    (r"\bx\^\{?2\}?|\bx²", "A18", 1.0),
    (r"\\sqrt|√", "N8", 1.0),
    (r"\bsin\b|\bcos\b|\btan\b", "G20", 1.5),
    (r"\d+\s*°", "G3", 0.5),
    (r"\bprobability\b", "P4", 1.0),
    (r"\bf\s*\(\s*x\s*\)", "A7", 1.0),
    (r"\bn\s*th term|\bnth term", "A25", 2.0),
    (r"× ?10\^|x 10\^", "N9", 2.0),
    (r"\bmean\b|\bmedian\b|\bmode\b", "S4", 1.0),
    (r"cm\^?\{?3\}?|cm³|volume", "G16", 0.8),
]


def score(text: str) -> list[tuple[float, str]]:
    t = text.lower()
    scores: dict[str, float] = {}
    for topic in _TOPICS:
        s = 0.0
        for kw in topic["keywords"]:
            k = kw.lower()
            if not k:
                continue
            # Whole-word match for plain words ("tan" must not match "standard").
            hit = re.search(rf"(?<![a-z]){re.escape(k)}(?![a-z])", t) if re.match(r"^[a-z ]+$", k) else (k in t)
            if hit:
                s += 1.0 + len(k) / 12
        if s:
            scores[topic["code"]] = s
    for pat, code, w in PATTERNS:
        if re.search(pat, text, re.I):
            scores[code] = scores.get(code, 0) + w
    return sorted(((v, k) for k, v in scores.items()), reverse=True)


def tag(text: str, max_topics: int = 3) -> list[str]:
    ranked = score(text)
    if not ranked:
        return ["A1"]
    best = ranked[0][0]
    return [c for v, c in ranked[:max_topics] if v >= best * 0.5]


def overrides() -> dict:
    return json.loads(OVERRIDES_PATH.read_text()) if OVERRIDES_PATH.exists() else {}
