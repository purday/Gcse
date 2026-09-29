"""Plays the tutor against a real results zip from the player, using only
tutor/gcse_tutor.py (exactly what the Claude Project tutor will use).

    python3 tests/tutor_roundtrip.py RESULTS_ZIP OUT_ZIP
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tutor"))
import gcse_tutor as T  # noqa: E402

res_path, out_path = sys.argv[1], sys.argv[2]
R = T.load_results(res_path, extract_to=str(Path(out_path).parent / "tutor-photos"))
qb = R["reference"]["questionbank"]
exam = R["reference"]["exam"]
codes = {t["code"] for t in R["reference"]["topics"]["topics"]}
assert R["photo_files"]["q1.2"], "photo extracted for viewing"

# "Mark": typed answer on q1.1 earns its marks, everything else scores 0 (it was skipped).
qs = []
for a in R["results"]["answers"]:
    q = R["questions_by_id"][a["questionId"]]
    got = q["marks"] if a["questionId"] == "q1.1" else 0
    lost = [] if got else [{"marks": q["marks"], "type": "knowledge", "reason": "No answer or working shown, so no marks can be given."}]
    qs.append({"questionId": q["id"], "marksAwarded": got, "maxMarks": q["marks"], "awarded": ["B1"] * got + ["B0"] * (q["marks"] - got),
               "lost": lost, "topics": q["topics"]})
score = sum(q["marksAwarded"] for q in qs)
g = T.paper_grade(score, exam)
fb = {
    "forPackId": R["manifest"]["packId"], "forAttemptId": R["results"]["attemptId"], "markedAt": T.now_iso(),
    "score": score, "maxScore": 80,
    "gradeEstimate": {"grade": g["grade"], "range": g["range"], "basis": f"{score}/80 x3 = {score*3}/240", "boundarySeries": g["boundarySeries"], "confidence": "low"},
    "summary": "Roundtrip test marking.", "wins": ["a", "b", "c"], "fixes": ["d", "e", "f"], "nextSession": "Surds lesson with real questions.",
    "questions": qs, "topics": [{"topic": "A18", "verdict": "weak", "note": "roundtrip"}],
}
prog = T.apply_marking(R["progress"], fb, R["manifest"], R["results"])
assert prog["topics"]["A18"]["status"] in ("red", "amber") and prog["updatedBy"] == "tutor"
assert prog["realPapersUsed"][0]["score"] == score

# Next lesson: 2 real bank questions (libraryRef) + 1 generated question with an SVG, verified with SymPy.
bank = T.pick_bank_questions(qb, prog, ["N8", "A18"], max_marks=7, avoid_reserved=False)
assert bank and all(b["libraryId"] != R["manifest"]["packId"] for b in bank), "never reuse the paper he just sat"
questions, ms = [], {"packId": "L-roundtrip", "questions": {}}
for i, b in enumerate(bank, 1):
    q, m = T.bank_to_question(b, f"r{i}", str(i))
    questions.append(q)
    ms["questions"][q["id"]] = m
import sympy as sp  # noqa: E402
assert sp.nsimplify(sp.sqrt(50)) == 5 * sp.sqrt(2)
questions.append({"id": "g1", "number": str(len(questions) + 1), "part": None, "marks": 2, "topics": ["N8"],
                  "prompt": "Simplify $\\sqrt{50}$", "answerType": "short", "image": "square.svg",
                  "workedExample": {"title": "Simplifying surds", "body": "$\\sqrt{12} = \\sqrt{4}\\sqrt{3} = 2\\sqrt{3}$"}})
ms["questions"]["g1"] = {"maxMarks": 2, "answer": "5√2", "marks": [{"code": "M1", "text": "√25 × √2"}, {"code": "A1", "text": "5√2"}]}
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff"/><rect x="20" y="20" width="80" height="80" fill="none" stroke="#000" stroke-width="2"/><text x="45" y="115" font-size="12">√50 cm</text></svg>'
lesson_manifest = {"formatVersion": 1, "packId": "L-roundtrip", "type": "lesson", "source": "mixed", "title": "Roundtrip: surds",
                   "created": T.now_iso(), "timeLimitMins": None, "totalMarks": sum(q["marks"] for q in questions), "calculator": False}
T.record_bank_use(prog, [b["id"] for b in bank], "L-roundtrip")
nxt = T.build_pack(lesson_manifest, questions, ms, images={"square.svg": svg})
T.assert_ok(nxt, codes)

# A full real paper built from the bank also validates.
other = T.next_unused_paper(qb, prog)
assert other and other["libraryId"] != R["manifest"]["packId"]
T.assert_ok(T.real_paper_pack(qb, other["libraryId"]), codes)

out = T.build_pack(T.feedback_manifest(R, fb), feedback=fb, progress=prog, next_pack=nxt)
T.assert_ok(out, codes)
Path(out_path).write_bytes(out)
print(json.dumps({"score": score, "grade": g, "bank": [b["id"] for b in bank]}))
