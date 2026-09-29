"""Test fixtures: a synthetic encrypted library (two 80-mark TEST papers with
cropped-image questions) and a feedback pack for one of them with a nested
next/ lesson. Nothing here is AQA content.

    python3 tests/fixtures.py OUT_DIR PASSCODE
"""
from __future__ import annotations

import io
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from packlib import build_pack_bytes  # noqa: E402
import build_library  # noqa: E402


def crop_png(label: str, w=1600, h=420) -> bytes:
    img = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 120, 90], outline=0, width=4)
    d.text((45, 40), label, fill=0)
    d.text((160, 40), f"TEST question {label}: this image stands in for a cropped paper region.", fill=0)
    d.line([160, 300, 1500, 300], fill=0, width=2)
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def test_paper(lib_id: str, year: int, month: str, paper: int, calculator: bool) -> bytes:
    marks = [2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 1]  # 24 parts
    assert sum(marks) == 80, sum(marks)
    questions, ms, images = [], {"packId": lib_id, "questions": {}}, {}
    for i, mk in enumerate(marks):
        num = str(i // 2 + 1)
        part = str(i % 2 + 1)
        qid = f"q{num}.{part}"
        img = f"{qid}.png"
        images[img] = crop_png(f"{num}.{part}")
        q = {"id": qid, "number": num, "part": part, "marks": mk, "topics": ["A18" if i % 3 else "N8"],
             "prompt": f"TEST prompt for {num}.{part}: solve $x^2 = {i + 4}$", "image": img, "answerType": "working" if mk > 2 else "short",
             "sourceRef": f"TEST {month} {year} P{paper} Q{num}.{part}"}
        if part == "1":
            q["stem"] = f"TEST stem for question {num}."
        questions.append(q)
        ms["questions"][qid] = {"maxMarks": mk, "answer": "TEST", "marks": [{"code": "B1", "text": "TEST"}] * mk}
    manifest = {"formatVersion": 1, "packId": lib_id, "type": "paper", "source": "real",
                "title": f"TEST {month} {year} Paper {paper}", "created": "2026-09-30T12:00:00Z", "timeLimitMins": 90,
                "totalMarks": 80, "calculator": calculator,
                "paperRef": {"libraryId": lib_id, "series": f"TEST {month} {year}", "year": year, "month": "06" if month == "June" else "11",
                             "paper": paper, "tier": "H", "code": f"8300/{paper}H"}}
    return build_pack_bytes(manifest, questions, ms, images)


def feedback_for(lib_id: str) -> bytes:
    samples = ROOT / "samples"
    import zipfile
    fbz = zipfile.ZipFile(samples / "sample-feedback.zip")
    next_buf = io.BytesIO()
    with zipfile.ZipFile(next_buf, "w") as nz:
        for n in fbz.namelist():
            if n.startswith("next/"):
                nz.writestr(n[5:], fbz.read(n))
    qs = []
    for i in range(24):
        num, part = str(i // 2 + 1), str(i % 2 + 1)
        mk = [2, 3, 4, 5][i % 4] if i < 23 else 1
        got = mk if (i % 3 and i != 1) else max(0, mk - 1)
        lost = [] if got == mk else [{"marks": mk - got, "type": "careless" if i % 2 else "knowledge", "reason": f"TEST reason {num}.{part}"}]
        qs.append({"questionId": f"q{num}.{part}", "marksAwarded": got, "maxMarks": mk, "awarded": ["B1"] * got + ["B0"] * (mk - got), "lost": lost, "topics": ["A18" if i % 3 else "N8"]})
    score = sum(q["marksAwarded"] for q in qs)
    fb = {"forPackId": lib_id, "markedAt": "2026-09-30T20:00:00+01:00", "score": score, "maxScore": 80,
          "gradeEstimate": {"grade": "7", "range": ["6", "7"], "basis": "TEST", "boundarySeries": "June 2026", "confidence": "medium"},
          "summary": "TEST summary", "wins": ["w1", "w2", "w3"], "fixes": ["f1", "f2", "f3"], "nextSession": "TEST next session",
          "questions": qs, "topics": [{"topic": "A18", "verdict": "secure"}, {"topic": "N8", "verdict": "weak"}]}
    manifest = {"formatVersion": 1, "packId": f"F-test-{lib_id}", "type": "feedback", "source": "real", "title": "TEST feedback",
                "created": "2026-09-30T20:00:00+01:00", "timeLimitMins": None, "totalMarks": 80, "calculator": False, "forPackId": lib_id}
    return build_pack_bytes(manifest, feedback=fb, next_pack=next_buf.getvalue())


def main(out: Path, passcode: str):
    src = out / "library_src"
    shutil.rmtree(src, ignore_errors=True)
    src.mkdir(parents=True)
    papers = [("test-2019-06-1h", 2019, "June", 1, False), ("test-2019-06-2h", 2019, "June", 2, True)]
    for p in papers:
        (src / f"{p[0]}.zip").write_bytes(test_paper(*p))
    lib = out / "site" / "library"
    shutil.rmtree(lib, ignore_errors=True)
    build_library.build(src, lib, passcode)
    (out / "feedback-for-paper.zip").write_bytes(feedback_for(papers[0][0]))
    img = Image.new("RGB", (3024, 4032), (250, 250, 245))
    d = ImageDraw.Draw(img)
    for y in range(200, 4000, 160):
        d.line([100, y, 2900, y], fill=(40, 60, 160), width=6)
    img.save(out / "working-photo.jpg", "JPEG", quality=92)
    print(json.dumps({"papers": [p[0] for p in papers]}))


if __name__ == "__main__":
    main(Path(sys.argv[1]), sys.argv[2])
