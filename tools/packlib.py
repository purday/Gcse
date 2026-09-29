"""Build and check pack zips exactly as FORMAT.md describes.

Used by the library builder, the sample-pack generator and the tests. The tutor
gets an equivalent (self-contained) helper inside TUTOR_INSTRUCTIONS.md.
"""
from __future__ import annotations

import base64
import io
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
ROOT = Path(__file__).resolve().parent.parent
TOPIC_CODES = {t["code"] for t in json.loads((ROOT / "app/data/topics.json").read_text())["topics"]}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def wrap_markscheme(ms: dict) -> bytes:
    data = base64.b64encode(json.dumps(ms, ensure_ascii=False).encode("utf-8")).decode("ascii")
    return json.dumps({"encoding": "base64", "data": data}).encode("utf-8")


def unwrap_markscheme(raw: bytes) -> dict:
    wrapper = json.loads(raw)
    assert wrapper.get("encoding") == "base64", "markscheme.json must be base64-wrapped"
    return json.loads(base64.b64decode(wrapper["data"]).decode("utf-8"))


def dumps(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")


def build_pack_bytes(manifest: dict, questions: list | None = None, markscheme: dict | None = None,
                     images: dict[str, bytes] | None = None, feedback: dict | None = None,
                     progress: dict | None = None, next_pack: bytes | None = None) -> bytes:
    """Return the bytes of a pack zip. next_pack is another pack's zip bytes to nest under next/."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", dumps(manifest))
        if questions is not None:
            z.writestr("questions.json", dumps(questions))
        if markscheme is not None:
            z.writestr("markscheme.json", wrap_markscheme(markscheme))
        for name, data in (images or {}).items():
            z.writestr(f"images/{name}", data)
        if feedback is not None:
            z.writestr("feedback.json", dumps(feedback))
        if progress is not None:
            z.writestr("progress.json", dumps(progress))
        if next_pack is not None:
            with zipfile.ZipFile(io.BytesIO(next_pack)) as inner:
                for info in inner.infolist():
                    if not info.is_dir():
                        z.writestr(f"next/{info.filename}", inner.read(info))
    return buf.getvalue()


def check_pack(data: bytes, *, expect_marks: int | None = None) -> tuple[list[str], list[str]]:
    """Validate a pack zip. Returns (errors, warnings), mirroring the player's import checks."""
    errors: list[str] = []
    warnings: list[str] = []
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        return ["not a zip"], []
    names = set(z.namelist())
    if "manifest.json" not in names:
        return ["manifest.json missing at zip root"], []
    m = json.loads(z.read("manifest.json"))
    if m.get("formatVersion") != 1:
        errors.append("formatVersion must be 1")
    if not isinstance(m.get("packId"), str) or not ID_RE.match(m["packId"]):
        errors.append("bad packId")
    if m.get("type") not in ("paper", "lesson", "feedback"):
        errors.append("bad type")
    if m.get("source") not in ("real", "generated", "mixed"):
        errors.append("bad source")
    for key in ("title", "created", "timeLimitMins", "totalMarks", "calculator"):
        if key not in m:
            errors.append(f"manifest.{key} missing")
    images = {n[len("images/"):] for n in names if n.startswith("images/") and not n.endswith("/")}
    if m.get("type") in ("paper", "lesson"):
        if "questions.json" not in names:
            errors.append("questions.json missing")
            return errors, warnings
        qs = json.loads(z.read("questions.json"))
        if not isinstance(qs, list) or not qs:
            errors.append("questions.json must be a non-empty list")
            return errors, warnings
        ids = set()
        total = 0
        for i, q in enumerate(qs):
            where = f"question {i + 1} ({q.get('id')})"
            for key in ("id", "number", "part", "marks", "topics", "prompt", "answerType"):
                if key not in q:
                    errors.append(f"{where}: {key} missing")
            if not ID_RE.match(str(q.get("id", ""))):
                errors.append(f"{where}: bad id")
            if q.get("id") in ids:
                errors.append(f"{where}: duplicate id")
            ids.add(q.get("id"))
            if not isinstance(q.get("marks"), int):
                errors.append(f"{where}: marks must be int")
            else:
                total += q["marks"]
            if q.get("answerType") not in ("short", "working"):
                errors.append(f"{where}: bad answerType")
            for t in q.get("topics", []):
                if t not in TOPIC_CODES:
                    warnings.append(f"{where}: unknown topic {t}")
            if not q.get("topics"):
                warnings.append(f"{where}: no topics")
            for img in (q.get("image"), q.get("stemImage"), (q.get("workedExample") or {}).get("image")):
                if img and img not in images:
                    warnings.append(f"{where}: image {img} missing")
            if m.get("source") == "real" and not q.get("sourceRef"):
                errors.append(f"{where}: real question without sourceRef")
        if total != m.get("totalMarks"):
            warnings.append(f"totalMarks {m.get('totalMarks')} != sum of marks {total}")
        if expect_marks is not None and total != expect_marks:
            errors.append(f"marks add up to {total}, expected {expect_marks}")
        if "markscheme.json" not in names:
            errors.append("markscheme.json missing")
        else:
            try:
                ms = unwrap_markscheme(z.read("markscheme.json"))
                for q in qs:
                    entry = ms.get("questions", {}).get(q["id"])
                    if not entry:
                        errors.append(f"markscheme missing {q['id']}")
                    elif entry.get("maxMarks") != q.get("marks"):
                        errors.append(f"markscheme {q['id']} maxMarks {entry.get('maxMarks')} != {q.get('marks')}")
            except Exception as e:  # noqa: BLE001
                errors.append(f"markscheme.json unreadable: {e}")
    if m.get("type") == "feedback":
        if "feedback.json" not in names:
            errors.append("feedback.json missing")
        else:
            fb = json.loads(z.read("feedback.json"))
            for key in ("forPackId", "markedAt", "score", "maxScore", "gradeEstimate", "summary", "wins", "fixes", "nextSession", "questions", "topics"):
                if key not in fb:
                    errors.append(f"feedback.{key} missing")
            if fb.get("questions") and sum(q.get("marksAwarded", 0) for q in fb["questions"]) != fb.get("score"):
                errors.append("feedback.score != sum of marksAwarded")
            if len(fb.get("wins", [])) != 3 or len(fb.get("fixes", [])) != 3:
                warnings.append("wins and fixes should have exactly 3 items each")
        if "next/manifest.json" in names:
            sub = io.BytesIO()
            with zipfile.ZipFile(sub, "w") as s:
                for n in names:
                    if n.startswith("next/") and not n.endswith("/"):
                        s.writestr(n[5:], z.read(n))
            e2, w2 = check_pack(sub.getvalue())
            errors += [f"next/: {e}" for e in e2]
            warnings += [f"next/: {w}" for w in w2]
    return errors, warnings
