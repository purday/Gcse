"""Converter test on a synthetic AQA-layout paper (tests/make_fake_aqa.py)."""
import io
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from packlib import check_pack, unwrap_markscheme  # noqa: E402
import convert_paper  # noqa: E402
import build_questionbank  # noqa: E402

with tempfile.TemporaryDirectory() as d:
    d = Path(d)
    subprocess.run([sys.executable, str(ROOT / "tests/make_fake_aqa.py"), str(d)], check=True, capture_output=True)
    data, report = convert_paper.convert(d / "AQA-83001H-QP-JUN19.PDF", d / "AQA-83001H-W-MS-JUN19.PDF", d / "AQA-83001H-WRE-JUN19.PDF", 2019, "06", 1)
    errors, _ = check_pack(data, expect_marks=80)
    checks = {
        "pack valid, 80 marks": not errors and report["totalMarks"] == 80,
        "25 parts + 1 shared stem": report["questions"] == 25 and report["stems"] == 1,
        "superscript read as x²": any("x²" in i["text"] for i in report["items"]),
        "question over two pages stitched": any(i["id"] == "q6" and i["pages"] == [3, 4] for i in report["items"]),
    }
    z = zipfile.ZipFile(io.BytesIO(data))
    qs = {q["id"]: q for q in json.loads(z.read("questions.json"))}
    ms = unwrap_markscheme(z.read("markscheme.json"))["questions"]
    checks["parts share the stem image"] = qs["q2.1"].get("stemImage") == qs["q2.2"].get("stemImage") == "q2-stem.png"
    checks["every part has a crop image"] = all(f"images/{q['image']}" in z.namelist() for q in qs.values())
    checks["mark scheme codes parsed"] = [p["code"] for p in ms["q2.1"]["marks"]] == ["M1", "M1dep", "A1"] and ms["q4"]["marks"][0]["code"] == "B1"
    checks["examiner comment attached"] = "numerators" in json.loads(z.read("extra.json"))["questions"]["q1"]["examinerComment"]
    checks["auto-tags sensible"] = qs["q3"]["topics"][0] == "A18" and qs["q4"]["topics"][0] == "N9" and qs["q6"]["topics"][0] == "A6"
    src = d / "src"
    src.mkdir()
    (src / "aqa-2019-06-1h.zip").write_bytes(data)
    qb = build_questionbank.build(src)
    tm = build_questionbank.topicmap(qb)
    checks["question bank built"] = len(qb["questions"]) == 25 and qb["questions"][0]["id"] == "aqa-2019-06-1h:q1"
    checks["topic map built"] = next(t for t in tm["topics"] if t["code"] == "A18")["questionParts"] >= 1

failed = [k for k, v in checks.items() if not v]
for k, v in checks.items():
    print(f"  {'✓' if v else '✗'} {k}")
sys.exit(1 if failed else 0)
