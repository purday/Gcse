"""Build the sample packs in samples/ (used by the tests and as worked
references for the tutor):

  samples/sample-lesson.zip     generated lesson, worked example, SVG diagram
  samples/sample-feedback.zip   feedback for that lesson + progress.json + next/ lesson
  samples/sample-timed.zip      2-minute timed "paper" for testing auto-submit

Every answer is checked with SymPy before the pack is written.
"""
from __future__ import annotations

import sys
from pathlib import Path

import sympy as sp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, build_pack_bytes, check_pack  # noqa: E402

OUT = ROOT / "samples"
CREATED = "2026-09-30T17:00:00+01:00"
x = sp.symbols("x")


def verify():
    assert set(sp.solve(x**2 - 5 * x - 14, x)) == {7, -2}
    assert set(sp.solve(3 * x**2 + 7 * x - 6, x)) == {sp.Rational(2, 3), -3}
    roots = sorted(float(r) for r in sp.solve(2 * x**2 - 3 * x - 4, x))
    assert [round(r, 2) for r in roots] == [-0.85, 2.35], roots
    ac = sp.sqrt(7**2 + 8**2 - 2 * 7 * 8 * sp.cos(sp.rad(78)))
    assert round(float(ac), 2) == 9.47, float(ac)
    area = sp.Rational(1, 2) * 7 * 8 * sp.sin(sp.rad(78))
    assert round(float(area), 1) == 27.4, float(area)
    # next lesson: completing the square
    a, b = sp.symbols("a b")
    assert sp.expand((x - 3) ** 2 - 4) == x**2 - 6 * x + 5
    assert sp.expand(2 * (x + 1) ** 2 + 3) == 2 * x**2 + 4 * x + 5
    assert set(sp.solve(x**2 + 4 * x - 1, x)) == {-2 + sp.sqrt(5), -2 - sp.sqrt(5)}


TRIANGLE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" width="360" height="230">
  <rect width="360" height="230" fill="#ffffff"/>
  <polygon points="40,190 300,190 120,40" fill="none" stroke="#000" stroke-width="2"/>
  <path d="M 74,190 A 34,34 0 0 0 57.5,160.8" fill="none" stroke="#000" stroke-width="1.5"/>
  <text x="80" y="178" font-family="Arial, sans-serif" font-size="15">78°</text>
  <text x="24" y="206" font-family="Arial, sans-serif" font-size="17" font-style="italic">B</text>
  <text x="304" y="206" font-family="Arial, sans-serif" font-size="17" font-style="italic">C</text>
  <text x="114" y="32" font-family="Arial, sans-serif" font-size="17" font-style="italic">A</text>
  <text x="56" y="110" font-family="Arial, sans-serif" font-size="15">7 cm</text>
  <text x="156" y="212" font-family="Arial, sans-serif" font-size="15">8 cm</text>
  <text x="230" y="222" font-family="Arial, sans-serif" font-size="12" fill="#444">Not drawn accurately</text>
</svg>
"""


def lesson():
    manifest = {
        "formatVersion": 1,
        "packId": "L-sample-quadratics",
        "type": "lesson",
        "source": "generated",
        "title": "Quadratics and non-right-angled triangles",
        "created": CREATED,
        "timeLimitMins": None,
        "totalMarks": 13,
        "calculator": True,
        "intro": "Sample lesson. Read each worked example, then try the questions. Type your final answer and **photograph your working** when method marks are available.",
        "focusTopics": ["A18", "G22", "G23"],
    }
    questions = [
        {
            "id": "q1", "number": "1", "part": None, "marks": 2, "topics": ["A18"],
            "prompt": "Solve $x^2 - 5x - 14 = 0$",
            "answerType": "short",
            "workedExample": {
                "title": "Solving by factorising",
                "body": "Solve $x^2 + x - 12 = 0$.\n\nFind two numbers that **multiply** to $-12$ and **add** to $1$: they are $4$ and $-3$.\n\n$$(x + 4)(x - 3) = 0$$\n\nSo $x + 4 = 0$ or $x - 3 = 0$, giving $x = -4$ or $x = 3$.",
            },
        },
        {
            "id": "q2", "number": "2", "part": None, "marks": 3, "topics": ["A18", "A4"],
            "prompt": "Solve $3x^2 + 7x - 6 = 0$\n\nShow your working.",
            "answerType": "working",
        },
        {
            "id": "q3", "number": "3", "part": None, "marks": 3, "topics": ["A18"],
            "prompt": "Solve $2x^2 - 3x - 4 = 0$\n\nGive your answers to 2 decimal places.",
            "answerType": "working",
            "hint": "It does not factorise. Use $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ with $a = 2$, $b = -3$, $c = -4$.",
        },
        {
            "id": "q4.1", "number": "4", "part": "1", "marks": 3, "topics": ["G22"],
            "stem": "The diagram shows triangle $ABC$.",
            "stemImage": "triangle-abc.svg",
            "prompt": "Work out the length $AC$.\n\nGive your answer to 3 significant figures.",
            "answerType": "working",
            "workedExample": {
                "title": "Cosine rule for a missing side",
                "body": "When you know two sides and the angle **between** them, use $a^2 = b^2 + c^2 - 2bc\\cos A$.\n\nFor sides $5$ and $6$ with $40°$ between them:\n\n$a^2 = 25 + 36 - 60\\cos 40° = 15.036...$, so $a = 3.88$ (3 s.f.)",
            },
        },
        {
            "id": "q4.2", "number": "4", "part": "2", "marks": 2, "topics": ["G23"],
            "stem": "The diagram shows triangle $ABC$.",
            "stemImage": "triangle-abc.svg",
            "prompt": "Work out the area of triangle $ABC$.\n\nGive your answer to 1 decimal place.",
            "answerType": "working",
        },
    ]
    markscheme = {
        "packId": manifest["packId"],
        "source": "Generated sample; answers verified with SymPy",
        "questions": {
            "q1": {"maxMarks": 2, "answer": "x = 7 and x = -2", "marks": [{"code": "M1", "text": "(x - 7)(x + 2) oe"}, {"code": "A1", "text": "7 and -2"}], "comments": "SC1 for one correct solution with no working"},
            "q2": {"maxMarks": 3, "answer": "x = 2/3 and x = -3", "marks": [{"code": "M1", "text": "(3x ± 2)(x ± 3) or correct substitution into the formula"}, {"code": "M1", "text": "(3x - 2)(x + 3)"}, {"code": "A1", "text": "2/3 and -3 (accept 0.67)"}]},
            "q3": {"maxMarks": 3, "answer": "x = 2.35 and x = -0.85", "marks": [{"code": "M1", "text": "Correct substitution into the quadratic formula, allow one sign error"}, {"code": "M1", "text": "(3 ± √41) / 4"}, {"code": "A1", "text": "2.35 and -0.85 (both)"}]},
            "q4.1": {"maxMarks": 3, "answer": "9.47 (cm)", "marks": [{"code": "M1", "text": "7^2 + 8^2 - 2 × 7 × 8 × cos 78"}, {"code": "M1dep", "text": "89.7... or √ of their value"}, {"code": "A1", "text": "9.47 (accept 9.46 to 9.48)"}], "commonErrors": ["Using the sine rule with no opposite pair", "Calculator in radians"]},
            "q4.2": {"maxMarks": 2, "answer": "27.4 (cm²)", "marks": [{"code": "M1", "text": "0.5 × 7 × 8 × sin 78"}, {"code": "A1", "text": "27.4 (accept 27.3 to 27.4)"}]},
        },
    }
    assert sum(q["marks"] for q in questions) == manifest["totalMarks"]
    return build_pack_bytes(manifest, questions, markscheme, images={"triangle-abc.svg": TRIANGLE_SVG.encode()})


def next_lesson():
    manifest = {
        "formatVersion": 1,
        "packId": "L-sample-completing-square",
        "type": "lesson",
        "source": "generated",
        "title": "Completing the square",
        "created": "2026-09-30T20:05:00+01:00",
        "timeLimitMins": None,
        "totalMarks": 7,
        "calculator": False,
        "intro": "Next lesson from your tutor: completing the square, which fixes the sign errors from last time.",
        "focusTopics": ["A11", "A18"],
    }
    questions = [
        {"id": "q1", "number": "1", "part": None, "marks": 2, "topics": ["A11"], "prompt": "Write $x^2 - 6x + 5$ in the form $(x + a)^2 + b$", "answerType": "short",
         "workedExample": {"title": "Completing the square", "body": "$x^2 + 8x + 3$: halve the $8$ to get $4$.\n\n$(x + 4)^2 = x^2 + 8x + 16$, so subtract $16$ and add $3$:\n\n$$x^2 + 8x + 3 = (x + 4)^2 - 13$$"}},
        {"id": "q2", "number": "2", "part": None, "marks": 2, "topics": ["A11"], "prompt": "Write $2x^2 + 4x + 5$ in the form $a(x + b)^2 + c$", "answerType": "working"},
        {"id": "q3", "number": "3", "part": None, "marks": 3, "topics": ["A18", "N8"], "prompt": "By completing the square, solve $x^2 + 4x - 1 = 0$\n\nGive your answers in surd form.", "answerType": "working"},
    ]
    markscheme = {
        "packId": manifest["packId"],
        "questions": {
            "q1": {"maxMarks": 2, "answer": "(x - 3)^2 - 4", "marks": [{"code": "B1", "text": "(x - 3)^2"}, {"code": "B1", "text": "- 4"}]},
            "q2": {"maxMarks": 2, "answer": "2(x + 1)^2 + 3", "marks": [{"code": "M1", "text": "2(x^2 + 2x) + 5 or 2(x + 1)^2 seen"}, {"code": "A1", "text": "2(x + 1)^2 + 3"}]},
            "q3": {"maxMarks": 3, "answer": "x = -2 ± √5", "marks": [{"code": "M1", "text": "(x + 2)^2 - 5 = 0"}, {"code": "M1", "text": "x + 2 = ±√5"}, {"code": "A1", "text": "-2 + √5 and -2 - √5"}]},
        },
    }
    return build_pack_bytes(manifest, questions, markscheme)


def feedback(next_bytes):
    manifest = {
        "formatVersion": 1,
        "packId": "F-sample-quadratics",
        "type": "feedback",
        "source": "generated",
        "title": "Feedback: Quadratics and non-right-angled triangles",
        "created": "2026-09-30T20:05:00+01:00",
        "timeLimitMins": None,
        "totalMarks": 13,
        "calculator": True,
        "forPackId": "L-sample-quadratics",
    }
    fb = {
        "forPackId": "L-sample-quadratics",
        "markedAt": "2026-09-30T20:05:00+01:00",
        "score": 8,
        "maxScore": 13,
        "gradeEstimate": {"grade": "6", "range": ["5", "6"], "basis": "Lesson questions at grade 5-7 level; 62% overall. No full paper yet, so confidence is low.", "boundarySeries": "June 2026", "confidence": "low"},
        "summary": "Factorising is **solid**. The formula and the cosine rule are where marks slipped, mostly through signs and rounding rather than not knowing the method.",
        "wins": ["Factorised $x^2 - 5x - 14$ cleanly", "Chose the cosine rule for the missing side", "Showed working on every method question"],
        "fixes": ["Put $b = -3$ into the formula as $-(-3)$, not $-3$", "Round only at the very end", "Check your calculator is in degrees before any trig"],
        "nextSession": "Completing the square (A11), which gives you a second way to solve quadratics and makes the sign of $b$ easier to handle.",
        "questions": [
            {"questionId": "q1", "marksAwarded": 2, "maxMarks": 2, "awarded": ["M1", "A1"], "lost": [], "comment": "Perfect.", "topics": ["A18"]},
            {"questionId": "q2", "marksAwarded": 3, "maxMarks": 3, "awarded": ["M1", "M1", "A1"], "lost": [], "topics": ["A18", "A4"]},
            {"questionId": "q3", "marksAwarded": 1, "maxMarks": 3, "awarded": ["M1", "M0", "A0"], "lost": [{"marks": 2, "type": "careless", "reason": "Substituted $b = -3$ as $-3$ in $-b$, giving $\\frac{-3 \\pm \\sqrt{41}}{4}$."}], "comment": "Right formula, one sign slip.", "modelAnswer": "$x = \\dfrac{3 \\pm \\sqrt{41}}{4}$ so $x = 2.35$ or $x = -0.85$", "topics": ["A18"]},
            {"questionId": "q4.1", "marksAwarded": 2, "maxMarks": 3, "awarded": ["M1", "M1dep", "A0"], "lost": [{"marks": 1, "type": "careless", "reason": "Rounded $\\cos 78°$ to $0.2$ early, so the answer came out as $9.52$."}], "topics": ["G22"]},
            {"questionId": "q4.2", "marksAwarded": 0, "maxMarks": 2, "awarded": ["M0", "A0"], "lost": [{"marks": 2, "type": "knowledge", "reason": "Used $\\frac{1}{2} \\times$ base $\\times$ height with $7$ as the height. $7$ cm is not perpendicular to $BC$."}], "modelAnswer": "$\\frac{1}{2} \\times 7 \\times 8 \\times \\sin 78° = 27.4$ cm²", "topics": ["G23"]},
        ],
        "topics": [
            {"topic": "A18", "verdict": "developing", "note": "Factorising secure; formula sign slips."},
            {"topic": "A4", "verdict": "secure", "note": ""},
            {"topic": "G22", "verdict": "developing", "note": "Method right, premature rounding."},
            {"topic": "G23", "verdict": "weak", "note": "Did not know ½ab sin C."},
        ],
    }
    progress = {
        "schemaVersion": 1,
        "updatedAt": "2026-09-30T20:05:00+01:00",
        "updatedBy": "tutor",
        "student": {"target": 6, "stretch": 8, "examSeries": "November 2026"},
        "topics": {
            "A18": {"status": "amber", "secure": False, "correctDates": ["2026-09-30"], "attempts": 3, "marksAwarded": 6, "marksAvailable": 8, "lastPracticed": "2026-09-30", "srStage": 0, "nextDue": "2026-10-01", "note": "Sign slips with the formula"},
            "A4": {"status": "amber", "secure": False, "correctDates": ["2026-09-30"], "attempts": 1, "marksAwarded": 3, "marksAvailable": 3, "lastPracticed": "2026-09-30", "srStage": 0, "nextDue": "2026-10-01"},
            "G22": {"status": "amber", "secure": False, "correctDates": [], "attempts": 1, "marksAwarded": 2, "marksAvailable": 3, "lastPracticed": "2026-09-30", "srStage": 0, "nextDue": "2026-10-01", "note": "Premature rounding"},
            "G23": {"status": "red", "secure": False, "correctDates": [], "attempts": 1, "marksAwarded": 0, "marksAvailable": 2, "lastPracticed": "2026-09-30", "srStage": 0, "nextDue": "2026-10-01", "note": "Did not know ½ab sin C"},
        },
        "scores": [{"id": "L-sample-quadratics#1", "packId": "L-sample-quadratics", "attemptId": None, "date": "2026-09-30", "type": "lesson", "source": "generated", "title": "Quadratics and non-right-angled triangles", "score": 8, "maxScore": 13, "libraryId": None, "grade": "6"}],
        "gradeEstimates": [{"id": "ge-2026-09-30", "date": "2026-09-30", "grade": "6", "range": ["5", "6"], "basis": "First lesson only", "boundarySeries": "June 2026", "confidence": "low"}],
        "mistakes": [
            {"id": "m-L-sample-quadratics-q3-1", "date": "2026-09-30", "packId": "L-sample-quadratics", "questionId": "q3", "topic": "A18", "type": "careless", "note": "b = -3 substituted as -3 in -b", "resolved": False, "reviewedDates": []},
            {"id": "m-L-sample-quadratics-q4.1-1", "date": "2026-09-30", "packId": "L-sample-quadratics", "questionId": "q4.1", "topic": "G22", "type": "careless", "note": "Rounded cos 78° too early", "resolved": False, "reviewedDates": []},
            {"id": "m-L-sample-quadratics-q4.2-1", "date": "2026-09-30", "packId": "L-sample-quadratics", "questionId": "q4.2", "topic": "G23", "type": "knowledge", "note": "Used base × height with a slant side", "resolved": False, "reviewedDates": []},
        ],
        "realPapersUsed": [],
        "plan": {"phase": "secure-6", "note": "First full real paper after two more lessons."},
        "sessions": [],
        "attempts": [],
        "notes": "Sample progress written by make_samples.py.",
    }
    return build_pack_bytes(manifest, feedback=fb, progress=progress, next_pack=next_bytes)


def timed():
    manifest = {
        "formatVersion": 1, "packId": "P-sample-timed", "type": "paper", "source": "generated",
        "title": "Two-minute timer test", "created": CREATED, "timeLimitMins": 2, "totalMarks": 2, "calculator": False,
    }
    questions = [
        {"id": "q1", "number": "1", "part": None, "marks": 1, "topics": ["N2"], "prompt": "Work out $\\frac{3}{4} + \\frac{2}{3}$", "answerType": "short"},
        {"id": "q2", "number": "2", "part": None, "marks": 1, "topics": ["N9"], "prompt": "Write $0.00042$ in standard form.", "answerType": "short"},
    ]
    assert sp.Rational(3, 4) + sp.Rational(2, 3) == sp.Rational(17, 12)
    ms = {"packId": manifest["packId"], "questions": {
        "q1": {"maxMarks": 1, "answer": "17/12 or 1 5/12", "marks": [{"code": "B1", "text": "17/12 oe"}]},
        "q2": {"maxMarks": 1, "answer": "4.2 × 10^-4", "marks": [{"code": "B1", "text": "4.2 × 10^-4"}]},
    }}
    return build_pack_bytes(manifest, questions, ms)


def main():
    verify()
    OUT.mkdir(exist_ok=True)
    nxt = next_lesson()
    packs = {"sample-lesson.zip": lesson(), "sample-feedback.zip": feedback(nxt), "sample-timed.zip": timed()}
    for name, data in packs.items():
        errors, warnings = check_pack(data)
        assert not errors, (name, errors)
        (OUT / name).write_bytes(data)
        print(f"{name}: ok ({len(data)} bytes){' warnings: ' + '; '.join(warnings) if warnings else ''}")


if __name__ == "__main__":
    main()
