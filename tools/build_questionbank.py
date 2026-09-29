"""Build questionbank.json and app/data/topicmap.json from the converted
real papers in library_src/*.zip.

questionbank.json  every real question: id, paper, series, year, marks,
                   topics, text, mark scheme, examiner comment (FORMAT.md 3)
topicmap.json      per spec topic: how often it appears, typical marks,
                   common mistakes (from mark-scheme notes and examiner reports)

    python3 tools/build_questionbank.py [--src library_src] [--qb questionbank.json] [--topicmap app/data/topicmap.json]
"""
from __future__ import annotations

import argparse
import io
import json
import statistics
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, now_iso, unwrap_markscheme  # noqa: E402

TOPICS = json.loads((ROOT / "app/data/topics.json").read_text())


def load_pack(path: Path):
    z = zipfile.ZipFile(io.BytesIO(path.read_bytes()))
    m = json.loads(z.read("manifest.json"))
    qs = json.loads(z.read("questions.json"))
    ms = unwrap_markscheme(z.read("markscheme.json"))
    extra = json.loads(z.read("extra.json")) if "extra.json" in z.namelist() else {}
    return m, qs, ms, extra


def build(src: Path):
    papers, questions = [], []
    for path in sorted(src.glob("*.zip")):
        m, qs, ms, extra = load_pack(path)
        if m.get("source") != "real" or m.get("type") != "paper":
            continue
        ref = m.get("paperRef", {})
        lib = ref.get("libraryId") or m["packId"]
        papers.append({"libraryId": lib, "series": ref.get("series"), "year": ref.get("year"), "paper": ref.get("paper"),
                       "code": ref.get("code"), "calculator": m["calculator"], "totalMarks": m["totalMarks"], "questions": len(qs)})
        for q in qs:
            info = extra.get("questions", {}).get(q["id"], {})
            entry = ms["questions"].get(q["id"], {})
            questions.append({
                "id": f"{lib}:{q['id']}",
                "libraryId": lib,
                "paper": ref.get("code"),
                "series": ref.get("series"),
                "year": ref.get("year"),
                "number": q["number"],
                "part": q["part"],
                "marks": q["marks"],
                "topics": q["topics"],
                "calculator": m["calculator"],
                "text": q.get("prompt", ""),
                "stem": q.get("stem", ""),
                "hasDiagram": bool(info.get("hasDiagram", False)),
                "answerType": q.get("answerType"),
                "sourceRef": q.get("sourceRef"),
                "markscheme": entry,
                "examinerComment": info.get("examinerComment", ""),
                "difficulty": info.get("difficulty"),
            })
    papers.sort(key=lambda p: (p["year"] or 0, p["series"] or "", p["paper"] or 0))
    return {"generated": now_iso(), "spec": "AQA GCSE Mathematics 8300 Higher", "papers": papers, "questions": questions}


def topicmap(qb: dict) -> dict:
    n_papers = len(qb["papers"]) or 1
    by_topic = defaultdict(list)
    for q in qb["questions"]:
        for i, t in enumerate(q["topics"]):
            by_topic[t].append((q, i == 0))
    out = []
    for t in TOPICS["topics"]:
        items = by_topic.get(t["code"], [])
        primary = [q for q, first in items if first]
        papers_with = {q["libraryId"] for q, _ in items}
        marks = [q["marks"] for q in primary] or [q["marks"] for q, _ in items]
        mistakes = []
        for q, _ in items:
            for e in q["markscheme"].get("commonErrors", []) or []:
                mistakes.append(e)
            if q.get("examinerComment"):
                mistakes.append(q["examinerComment"])
        # Keep the most informative (longest distinct) few.
        seen, common = set(), []
        for msg in sorted(mistakes, key=len, reverse=True):
            key = msg[:60].lower()
            if key not in seen:
                seen.add(key)
                common.append(msg)
            if len(common) >= 5:
                break
        out.append({
            "code": t["code"], "name": t["name"], "strand": t["strand"], "band": t["band"], "higherOnly": t["higherOnly"],
            "questionParts": len(items),
            "primaryParts": len(primary),
            "papersAppearing": len(papers_with),
            "frequency": round(len(papers_with) / n_papers, 3),
            "marksPerPaper": round(sum(q["marks"] for q in primary) / n_papers, 2),
            "typicalMarks": statistics.median(marks) if marks else None,
            "maxMarks": max(marks) if marks else None,
            "commonMistakes": common,
            "bankIds": [q["id"] for q, _ in items][:60],
        })
    out.sort(key=lambda r: (-r["marksPerPaper"], r["code"]))
    return {"generated": qb["generated"], "papers": n_papers,
            "note": "frequency = share of library papers where the topic appears; marksPerPaper = average marks per paper where it is the main topic.",
            "topics": out}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT / "library_src"))
    ap.add_argument("--qb", default=str(ROOT / "questionbank.json"))
    ap.add_argument("--topicmap", default=str(ROOT / "app/data/topicmap.json"))
    a = ap.parse_args()
    qb = build(Path(a.src))
    Path(a.qb).write_text(json.dumps(qb, ensure_ascii=False, indent=1))
    tm = topicmap(qb)
    Path(a.topicmap).write_text(json.dumps(tm, ensure_ascii=False, indent=1))
    print(f"questionbank: {len(qb['questions'])} questions from {len(qb['papers'])} papers -> {a.qb}")
    print(f"topicmap: {sum(1 for t in tm['topics'] if t['questionParts'])} topics seen -> {a.topicmap}")
