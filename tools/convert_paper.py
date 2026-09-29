"""Convert one real AQA 8300 Higher paper into a library pack.

Input: the question paper PDF, its mark scheme PDF and (optionally) the
examiner report PDF. Output: library_src/<libraryId>.zip (a normal paper pack,
FORMAT.md) plus work/review/<libraryId>.json describing what was found.

How it works:
  * Question labels are the AQA number boxes in the left margin ("0 1",
    "1 4 . 2"). Each label starts a region that runs to the next label,
    across pages when needed, skipping blank pages.
  * Each region is cropped from the page at 200 dpi (long blank answer space
    squeezed out) and stored as images/<id>.png.
  * Text is extracted with superscripts/subscripts detected from font size
    and baseline, "[n marks]" is read for the mark tariff, and a label with
    no marks becomes the shared stem of the parts that follow it.
  * The mark scheme tables (Question | Answer | Mark | Comments) are read with
    pdfplumber into structured markscheme.json entries.
  * The examiner report is split into per-question comments.
  * Topics come from tools/tagger.py, overridden by data/tag_overrides.json.

    python3 tools/convert_paper.py --qp QP.PDF --ms MS.PDF [--er ER.PDF] --year 2019 --month 06 --paper 1
    python3 tools/convert_paper.py --all        convert every set listed in papers/index.json
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pdfplumber
import pymupdf as fitz
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, build_pack_bytes, check_pack, now_iso  # noqa: E402
import tagger  # noqa: E402

LEFT = 95                      # pt; AQA question-number boxes sit left of this
DPI = 200
LABEL_RE = re.compile(r"^(\d{2})(?:\.(\d{1,2}))?$")
MARKS_RE = re.compile(r"\[\s*(\d+)\s*marks?\s*\]", re.I)
NOISE_RE = re.compile(r"^(Do not write|outside the|box|Turn over|Answer|\*\d+\*|IB/\S+|\S*/8300/\S*|►|Question \d+ continues.*)$", re.I)
DOTS_RE = re.compile(r"^[\s._…·\-–—]{4,}$")
BLANK_PAGE_RE = re.compile(r"There are no questions printed on this page|Turn over for the next question|DO NOT WRITE ON THIS PAGE|Additional page, if required|Question number", re.I)
END_RE = re.compile(r"END OF QUESTIONS", re.I)
CODE_RE = re.compile(r"\b(SC\d|[MABPCQ]\d(?:\s?dep|\s?ft)?)\b")
SUP = str.maketrans("0123456789-+n()", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ⁽⁾")
SUB = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")
MONTH_NAMES = {"06": "June", "11": "November"}


@dataclass
class Label:
    page: int
    y: float
    number: int
    part: str | None

    @property
    def qid(self) -> str:
        return f"q{self.number}" + (f".{self.part}" if self.part else "")


@dataclass
class Region:
    label: Label
    segments: list = field(default_factory=list)   # (page, y0, y1)
    text: str = ""
    marks: int = 0
    has_diagram: bool = False
    image: bytes | None = None


# ------------------------------------------------------------------ question paper

def page_bounds(page) -> tuple[float, float]:
    h = page.rect.height
    top, bottom = 40.0, h - 40.0
    for x0, y0, x1, y1, t, *_ in page.get_text("words"):
        if y1 < h * 0.12 and re.search(r"Do not write|outside|^box$", t, re.I):
            top = max(top, y1 + 2)
        if y0 > h * 0.86 and re.search(r"Turn over|^\*\d+\*$|^IB/|/8300|►", t, re.I):
            bottom = min(bottom, y0 - 3)
    return top, bottom


def is_blank(page) -> bool:
    text = page.get_text("text")
    return bool(BLANK_PAGE_RE.search(text)) and not MARKS_RE.search(text)


def find_labels(doc) -> list[Label]:
    labels = []
    for pno in range(1, len(doc)):
        page = doc[pno]
        top, bottom = page_bounds(page)
        lines: dict[float, list] = {}
        for w in page.get_text("words"):
            if w[2] > LEFT or not (top - 2 <= w[1] <= bottom):
                continue
            yc = (w[1] + w[3]) / 2
            key = next((k for k in lines if abs(k - yc) < 4), yc)
            lines.setdefault(key, []).append(w)
        for ws in lines.values():
            ws.sort(key=lambda w: w[0])
            m = LABEL_RE.match("".join(w[4] for w in ws).replace(" ", ""))
            if m:
                labels.append(Label(pno, min(w[1] for w in ws), int(m.group(1)), m.group(2)))
    labels.sort(key=lambda l: (l.page, l.y))
    # Keep labels in non-decreasing (number, part) order; drop stray matches.
    clean, last = [], (0, -1)
    for lab in labels:
        key = (lab.number, int(lab.part) if lab.part else 0)
        if key > last or (key == last and lab.part is None):
            clean.append(lab)
            last = key
    return clean


def find_end(doc) -> tuple[int, float]:
    for pno in range(len(doc) - 1, 0, -1):
        for x0, y0, x1, y1, t, *_ in doc[pno].get_text("blocks"):
            if END_RE.search(t):
                return pno, y0
    last = len(doc) - 1
    return last, page_bounds(doc[last])[1]


def build_regions(doc, labels: list[Label]) -> list[Region]:
    bounds = [page_bounds(p) for p in doc]
    end_page, end_y = find_end(doc)
    regions = []
    for i, lab in enumerate(labels):
        nxt_page, nxt_y = (labels[i + 1].page, labels[i + 1].y) if i + 1 < len(labels) else (end_page, end_y)
        segs, p, y0 = [], lab.page, lab.y - 5
        while True:
            top, bottom = bounds[p]
            if p == nxt_page:
                segs.append((p, y0, nxt_y - 5))
                break
            segs.append((p, y0, bottom))
            p += 1
            while p < nxt_page and is_blank(doc[p]):
                p += 1
            if p > nxt_page:
                break
            y0 = bounds[p][0]
        regions.append(Region(lab, [s for s in segs if s[2] - s[1] > 6]))
    return regions


def _line_text(line) -> str:
    spans = [s for s in line["spans"] if s["text"].strip()]
    if not spans:
        return ""
    base = max(s["size"] for s in spans)
    base_y = max(s["origin"][1] for s in spans if s["size"] >= base * 0.95)
    out = ""
    for s in sorted(spans, key=lambda s: s["bbox"][0]):
        t = s["text"]
        small = s["size"] < base * 0.85
        if (s["flags"] & 1) or (small and s["origin"][1] < base_y - 1.5):
            core = t.strip()
            t = core.translate(SUP) if all(c in "0123456789-+n()" for c in core) else f"^({core})"
        elif small and s["origin"][1] > base_y + 1:
            core = t.strip()
            t = core.translate(SUB) if core.isdigit() else f"_({core})"
        out += t
    return re.sub(r"\s+", " ", out).strip()


def region_text(doc, region: Region) -> str:
    rows = []
    for p, y0, y1 in region.segments:
        page = doc[p]
        clip = fitz.Rect(LEFT, y0, page.rect.width - 40, y1)
        d = page.get_text("dict", clip=clip)
        for b in d["blocks"]:
            if b["type"] != 0:
                continue
            for line in b["lines"]:
                t = _line_text(line)
                if t:
                    rows.append((p, round(line["bbox"][1]), line["bbox"][0], t))
    rows.sort()
    merged, last_key = [], None
    for p, y, x, t in rows:
        key = (p, y)
        if last_key and key[0] == last_key[0] and abs(key[1] - last_key[1]) <= 2:
            merged[-1] += "  " + t
        else:
            merged.append(t)
        last_key = key
    lines = []
    for t in merged:
        t = MARKS_RE.sub("", t).strip()
        if not t or NOISE_RE.match(t) or DOTS_RE.match(t):
            continue
        t = re.sub(r"\s*Answer\s*[._…]{3,}.*$", "", t)
        t = re.sub(r"[._…]{5,}", " ", t).strip()
        if t:
            lines.append(t)
    return "\n".join(lines)


def region_marks(doc, region: Region) -> int:
    total = 0
    for p, y0, y1 in region.segments:
        page = doc[p]
        text = page.get_text("text", clip=fitz.Rect(0, y0, page.rect.width, y1))
        total += sum(int(m) for m in MARKS_RE.findall(text))
    return total


def region_has_diagram(doc, region: Region) -> bool:
    count = 0
    for p, y0, y1 in region.segments:
        page = doc[p]
        clip = fitz.Rect(LEFT, y0, page.rect.width - 45, y1)
        for d in page.get_drawings():
            r = d["rect"]
            if not r.intersects(clip):
                continue
            if r.height < 1.5 and r.width > 100:  # answer lines
                continue
            count += 1
        for img in page.get_images(full=True):
            for r in page.get_image_rects(img[0]):
                if r.intersects(clip):
                    count += 5
    return count >= 3


def squeeze(img: Image.Image, max_gap_px: int = 36) -> Image.Image:
    """Collapse long runs of blank rows (answer space) to max_gap_px, and trim edges."""
    a = np.asarray(img.convert("L"))
    ink = (a < 200).sum(axis=1) > 2
    keep, run = [], 0
    for i, has in enumerate(ink):
        run = 0 if has else run + 1
        if has or run <= max_gap_px:
            keep.append(i)
    if not keep:
        return img
    rows = np.array(keep)
    cols = np.where((a < 200).sum(axis=0) > 1)[0]
    x0, x1 = (max(0, cols.min() - 12), min(a.shape[1], cols.max() + 12)) if len(cols) else (0, a.shape[1])
    out = a[rows][:, x0:x1]
    # trim leading/trailing blank rows
    rink = (out < 200).sum(axis=1) > 2
    idx = np.where(rink)[0]
    if len(idx):
        out = out[max(0, idx[0] - 10): idx[-1] + 12]
    return Image.fromarray(out)


def region_image(doc, region: Region) -> bytes:
    parts = []
    zoom = DPI / 72
    for p, y0, y1 in region.segments:
        page = doc[p]
        clip = fitz.Rect(28, y0, page.rect.width - 50, y1)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, colorspace=fitz.csGRAY)
        parts.append(Image.frombytes("L", (pix.width, pix.height), pix.samples))
    width = max(p.width for p in parts)
    gap = 16
    canvas = Image.new("L", (width, sum(p.height for p in parts) + gap * (len(parts) - 1)), 255)
    y = 0
    for p in parts:
        canvas.paste(p, (0, y))
        y += p.height + gap
    img = squeeze(canvas)
    img = img.quantize(colors=16) if img.mode == "L" else img
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


# ------------------------------------------------------------------ mark scheme

def _codes(cell: str) -> list[str]:
    return [re.sub(r"\s+", "", c) for c in CODE_RE.findall(cell or "")]


def parse_markscheme(path: Path) -> dict[str, dict]:
    """Return {qid: {"rows": [(answer, mark, comments)], "guidance": [...]}} from the MS tables."""
    out: dict[str, dict] = {}
    current = None
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for row in table:
                    cells = [(c or "").strip() for c in row]
                    if not any(cells):
                        continue
                    joined = " ".join(cells)
                    if re.search(r"\bQ(uestion)?\b.*\bAnswer\b.*\bMark", joined):
                        continue
                    m = re.match(r"^(\d{1,2})(?:\s*\.\s*(\d{1,2}))?$", cells[0])
                    if m:
                        current = f"q{int(m.group(1))}" + (f".{m.group(2)}" if m.group(2) else "")
                    if not current:
                        continue
                    entry = out.setdefault(current, {"rows": [], "guidance": []})
                    body = [c for c in cells[1:]]
                    answer = body[0] if body else ""
                    mark = body[1] if len(body) > 1 else ""
                    comments = " ".join(body[2:]) if len(body) > 2 else ""
                    if "Additional Guidance" in joined or (not _codes(mark) and not m and answer):
                        entry["guidance"].append(re.sub(r"\s+", " ", " ".join(c for c in body if c)))
                    else:
                        entry["rows"].append((answer, mark, comments))
    return out


def ms_entry(raw: dict | None, marks: int) -> dict:
    if not raw:
        return {"maxMarks": marks, "answer": "See the AQA mark scheme", "marks": [], "comments": "Mark scheme entry not found by the converter; check the PDF."}
    points, answers, comments = [], [], []
    for answer, mark, comment in raw["rows"]:
        codes = _codes(mark)
        ans_lines = [l.strip() for l in answer.split("\n") if l.strip()]
        if codes and len(codes) == len(ans_lines):
            points += [{"code": c, "text": a} for c, a in zip(codes, ans_lines)]
        elif codes:
            points += [{"code": c, "text": " ".join(ans_lines)} for c in codes]
        if ans_lines:
            answers.append(ans_lines[-1])
        if comment:
            comments.append(re.sub(r"\s+", " ", comment))
    final = next((p["text"] for p in reversed(points) if p["code"][0] in "AB"), answers[-1] if answers else "")
    return {"maxMarks": marks, "answer": final, "marks": points,
            "comments": " ".join(comments + raw["guidance"])[:1500]}


# ------------------------------------------------------------------ examiner report

def parse_examiner_report(path: Path | None) -> dict[str, str]:
    if not path:
        return {}
    doc = fitz.open(str(path))
    text = "\n".join(p.get_text("text") for p in doc)
    parts = re.split(r"\n\s*Question\s+(\d{1,2})(?:\s*\.\s*(\d{1,2}))?[^\n]*\n", text)
    out = {}
    for i in range(1, len(parts) - 2, 3):
        num, part, body = parts[i], parts[i + 1], parts[i + 2]
        key = f"q{int(num)}" + (f".{part}" if part else "")
        out[key] = re.sub(r"\s+", " ", body).strip()[:700]
    return out


# ------------------------------------------------------------------ assemble

def convert(qp: Path, ms: Path, er: Path | None, year: int, month: str, paper: int) -> tuple[bytes, dict]:
    lib_id = f"aqa-{year}-{month}-{paper}h"
    series = f"{MONTH_NAMES[month]} {year}"
    calculator = paper != 1
    doc = fitz.open(str(qp))
    labels = find_labels(doc)
    regions = build_regions(doc, labels)
    for r in regions:
        r.text = region_text(doc, r)
        r.marks = region_marks(doc, r)
        r.has_diagram = region_has_diagram(doc, r)
        r.image = region_image(doc, r)
    ms_raw = parse_markscheme(ms)
    er_raw = parse_examiner_report(er)
    overrides = tagger.overrides()
    max_number = max((r.label.number for r in regions), default=1)

    questions, markscheme, images, extra = [], {"packId": lib_id, "source": f"AQA {series} 8300/{paper}H mark scheme", "questions": {}}, {}, {"questions": {}}
    warnings = []
    stems: dict[int, Region] = {}
    for r in regions:
        lab = r.label
        has_parts = any(o.label.number == lab.number and o.label.part for o in regions)
        if lab.part is None and has_parts and r.marks == 0:
            stems[lab.number] = r
            images[f"q{lab.number}-stem.png"] = r.image
            continue
        if r.marks == 0:
            warnings.append(f"{lab.qid}: no [marks] found")
        qid = lab.qid
        images[f"{qid}.png"] = r.image
        stem = stems.get(lab.number)
        key = f"{lib_id}:{qid}"
        topics = overrides.get(key) or tagger.tag(((stem.text + "\n") if stem else "") + r.text)
        q = {"id": qid, "number": str(lab.number), "part": lab.part, "marks": r.marks, "topics": topics,
             "prompt": md_escape(r.text), "image": f"{qid}.png",
             "answerType": "short" if r.marks <= 1 else "working",
             "sourceRef": f"AQA {series} P{paper} Q{lab.number}{'.' + lab.part if lab.part else ''}"}
        if stem:
            q["stem"] = md_escape(stem.text)
            q["stemImage"] = f"q{lab.number}-stem.png"
        questions.append(q)
        raw = ms_raw.get(qid) or (ms_raw.get(f"q{lab.number}") if not lab.part else None)
        if not raw:
            warnings.append(f"{qid}: not found in mark scheme")
        markscheme["questions"][qid] = ms_entry(raw, r.marks)
        comment = er_raw.get(qid) or er_raw.get(f"q{lab.number}", "")
        if comment:
            markscheme["questions"][qid]["commonErrors"] = [comment[:300]]
        extra["questions"][qid] = {"hasDiagram": r.has_diagram or bool(stem and stem.has_diagram), "examinerComment": comment,
                                   "difficulty": round(lab.number / max_number, 2), "pages": [s[0] + 1 for s in r.segments],
                                   "topicsAuto": key not in overrides}
    total = sum(q["marks"] for q in questions)
    if total != 80:
        warnings.append(f"marks add up to {total}, expected 80")
    manifest = {"formatVersion": 1, "packId": lib_id, "type": "paper", "source": "real",
                "title": f"AQA {series} Paper {paper} ({'calculator' if calculator else 'non-calculator'})",
                "created": now_iso(), "timeLimitMins": 90, "totalMarks": 80, "calculator": calculator,
                "paperRef": {"libraryId": lib_id, "series": series, "year": year, "month": month, "paper": paper, "tier": "H", "code": f"8300/{paper}H"},
                "intro": "Real AQA paper. 1 hour 30 minutes. Show your working and photograph it; answers go in the box under each question."}
    data = build_pack_bytes(manifest, questions, markscheme, images)
    # extra.json travels with the unencrypted source pack only (used by build_questionbank.py)
    buf = io.BytesIO(data)
    import zipfile
    with zipfile.ZipFile(buf, "a", zipfile.ZIP_DEFLATED) as z:
        z.writestr("extra.json", json.dumps(extra, ensure_ascii=False, indent=1))
    errors, pack_warnings = check_pack(buf.getvalue(), expect_marks=80)
    report = {"libraryId": lib_id, "labels": len(labels), "questions": len(questions), "stems": len(stems), "totalMarks": total,
              "errors": errors, "warnings": warnings + pack_warnings,
              "items": [{"id": q["id"], "marks": q["marks"], "topics": q["topics"], "pages": extra["questions"][q["id"]]["pages"],
                         "diagram": extra["questions"][q["id"]]["hasDiagram"], "text": q["prompt"][:160]} for q in questions]}
    return buf.getvalue(), report


def md_escape(text: str) -> str:
    """Plain PDF text -> safe Markdown (no accidental emphasis, headings or maths)."""
    text = text.replace("\\", "\\\\").replace("$", "\\$")
    text = re.sub(r"([*_`#])", r"\\\1", text)
    return text.replace("\n", "  \n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--qp"), ap.add_argument("--ms"), ap.add_argument("--er")
    ap.add_argument("--year", type=int), ap.add_argument("--month"), ap.add_argument("--paper", type=int)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--out", default=str(ROOT / "library_src"))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    review = ROOT / "work" / "review"
    review.mkdir(parents=True, exist_ok=True)
    jobs = []
    if a.all:
        for s in json.loads((ROOT / "papers" / "index.json").read_text()):
            if "QP" in s and "MS" in s:
                jobs.append((ROOT / s["QP"], ROOT / s["MS"], ROOT / s["ER"] if "ER" in s else None, s["year"], s["month"], s["paper"]))
    else:
        jobs.append((Path(a.qp), Path(a.ms), Path(a.er) if a.er else None, a.year, a.month, a.paper))
    ok = 0
    for qp, ms, er, year, month, paper in jobs:
        try:
            data, report = convert(qp, ms, er, year, month, paper)
        except Exception as e:  # noqa: BLE001
            print(f"FAILED {qp.name}: {e}")
            continue
        (review / f"{report['libraryId']}.json").write_text(json.dumps(report, ensure_ascii=False, indent=1))
        status = "OK" if not report["errors"] and report["totalMarks"] == 80 else "CHECK"
        if not report["errors"]:
            (out / f"{report['libraryId']}.zip").write_bytes(data)
            ok += 1
        print(f"{status} {report['libraryId']}: {report['questions']} parts, {report['totalMarks']} marks, {len(report['warnings'])} warnings, {len(report['errors'])} errors")
    print(f"{ok}/{len(jobs)} papers written to {out}")


if __name__ == "__main__":
    main()
