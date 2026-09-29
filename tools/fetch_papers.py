"""Download AQA 8300 Higher question papers, mark schemes and examiner reports.

Tries AQA's filestore URL patterns for every series since 2017 and saves what
exists to papers/<year>-<mm>/. Needs network access to filestore.aqa.org.uk
and www.aqa.org.uk (and cdn.sanity.io, where the new AQA site keeps files).

If the network is blocked, download the PDFs yourself from
https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources
and drop them into papers/ with their original AQA file names, e.g.
AQA-83001H-QP-JUN19.PDF, AQA-83001H-W-MS-JUN19.PDF, AQA-83001H-WRE-JUN19.PDF.
Then run: python3 tools/fetch_papers.py --scan

    python3 tools/fetch_papers.py            download everything that exists
    python3 tools/fetch_papers.py --scan     just index what is already in papers/
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAPERS = ROOT / "papers"
MONTHS = {"june": ("06", "JUN"), "november": ("11", "NOV")}
SERIES = [(2017, "june"), (2017, "november"), (2018, "june"), (2018, "november"), (2019, "june"), (2019, "november"),
          (2020, "november"), (2021, "november"), (2022, "june"), (2022, "november"), (2023, "june"), (2023, "november"),
          (2024, "june"), (2024, "november"), (2025, "june"), (2025, "november"), (2026, "june")]
KINDS = {"QP": ["QP"], "MS": ["W-MS", "MS"], "ER": ["WRE", "ER"]}
BASES = ["https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/{y}/{month}/"]
NAME_RE = re.compile(r"AQA-8300(\d)H-(QP|W-MS|MS|WRE|ER)-(JUN|NOV)(\d\d)\.PDF", re.I)


def url_candidates(y: int, month: str, paper: int, kind: str):
    mm, mon = MONTHS[month]
    for base in BASES:
        for k in KINDS[kind]:
            yield base.format(y=y, month=month) + f"AQA-8300{paper}H-{k}-{mon}{str(y)[2:]}.PDF"


def fetch(url: str) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (personal study download)"})
    try:
        with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context()) as r:
            data = r.read()
            return data if data[:4] == b"%PDF" else None
    except Exception:  # noqa: BLE001
        return None


def have(d: Path, paper: int, kind: str, mon: str, y: int) -> bool:
    if not d.exists():
        return False
    for f in d.iterdir():
        m = NAME_RE.search(f.name.upper())
        if m and int(m.group(1)) == paper and m.group(3) == mon and int(m.group(4)) == y % 100:
            k = {"W-MS": "MS", "WRE": "ER"}.get(m.group(2), m.group(2))
            if k == kind:
                return True
    return False


def scan() -> list[dict]:
    """Group PDFs in papers/ into series sets."""
    sets = {}
    for pdf in PAPERS.rglob("*"):
        m = NAME_RE.search(pdf.name.upper())
        if not m or not pdf.is_file():
            continue
        paper, kind, mon, yy = int(m.group(1)), m.group(2).upper(), m.group(3).upper(), int(m.group(4))
        kind = {"W-MS": "MS", "WRE": "ER"}.get(kind, kind)
        year = 2000 + yy
        key = (year, mon, paper)
        sets.setdefault(key, {"year": year, "month": "06" if mon == "JUN" else "11", "series": f"{'June' if mon == 'JUN' else 'November'} {year}", "paper": paper})[kind] = str(pdf.relative_to(ROOT))
    out = sorted(sets.values(), key=lambda s: (s["year"], s["month"], s["paper"]))
    (PAPERS / "index.json").write_text(json.dumps(out, indent=1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan", action="store_true")
    a = ap.parse_args()
    PAPERS.mkdir(exist_ok=True)
    if not a.scan:
        got = 0
        for y, month in SERIES:
            mm, mon = MONTHS[month]
            for paper in (1, 2, 3):
                for kind in ("QP", "MS", "ER"):
                    dest_dir = PAPERS / f"{y}-{mm}"
                    if have(dest_dir, paper, kind, mon, y):
                        continue
                    for url in url_candidates(y, month, paper, kind):
                        data = fetch(url)
                        if data:
                            dest_dir.mkdir(parents=True, exist_ok=True)
                            (dest_dir / url.rsplit("/", 1)[1]).write_bytes(data)
                            got += 1
                            print(f"got {url}")
                            break
                    else:
                        print(f"missing {y} {month} P{paper} {kind}", file=sys.stderr)
        print(f"downloaded {got} files")
    sets = scan()
    full = [s for s in sets if "QP" in s and "MS" in s]
    print(f"{len(sets)} paper sets indexed, {len(full)} with question paper + mark scheme -> papers/index.json")


if __name__ == "__main__":
    main()
