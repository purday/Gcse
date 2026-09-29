"""gcse_tutor.py: helpers for the GCSE Maths tutor (runs in Claude's code sandbox).

Standard library only. Implements FORMAT.md exactly: read a results zip,
update progress.json, build and check pack zips, pick real questions.

Typical marking session:

    import gcse_tutor as T
    R = T.load_results("/mnt/user-data/uploads/results_X_2026-10-03.zip")
    # ... look at R["questions"], R["results"]["answers"], R["markscheme"], R["photo_files"] ...
    fb = {...}                                  # feedback.json you write (FORMAT.md 1.5)
    prog = T.apply_marking(R["progress"], fb, R["manifest"], R["results"])
    nxt = T.build_pack(manifest=..., questions=..., markscheme=..., images=...)
    out = T.build_pack(manifest=T.feedback_manifest(R, fb), feedback=fb, progress=prog, next_pack=nxt)
    T.assert_ok(out)
    T.save(out, f"feedback_{R['manifest']['packId']}.zip")
"""
from __future__ import annotations

import base64
import io
import json
import os
import re
import zipfile
from datetime import date, datetime, timedelta, timezone

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
SR_DAYS = [1, 3, 7]
GRADES = ["U", "3", "4", "5", "6", "7", "8", "9"]
OUT_DIRS = ["/mnt/user-data/outputs", "/mnt/data", "."]


# ---------------------------------------------------------------- time

def _london_offset(dt_utc: datetime) -> timedelta:
    """UK clocks: BST (UTC+1) from last Sunday of March 01:00 UTC to last Sunday of October 01:00 UTC."""
    y = dt_utc.year

    def last_sunday(month):
        d = date(y, month, 31)
        return d - timedelta(days=(d.weekday() + 1) % 7)

    start = datetime.combine(last_sunday(3), datetime.min.time(), timezone.utc) + timedelta(hours=1)
    end = datetime.combine(last_sunday(10), datetime.min.time(), timezone.utc) + timedelta(hours=1)
    return timedelta(hours=1) if start <= dt_utc < end else timedelta(0)


def now_iso() -> str:
    u = datetime.now(timezone.utc).replace(microsecond=0)
    off = _london_offset(u)
    return (u + off).replace(tzinfo=timezone(off)).isoformat()


def today() -> str:
    return now_iso()[:10]


def add_days(d: str, n: int) -> str:
    return (date.fromisoformat(d) + timedelta(days=n)).isoformat()


# ---------------------------------------------------------------- zips

def wrap_markscheme(ms: dict) -> bytes:
    data = base64.b64encode(json.dumps(ms, ensure_ascii=False).encode("utf-8")).decode("ascii")
    return json.dumps({"encoding": "base64", "data": data}).encode("utf-8")


def unwrap_markscheme(raw: bytes) -> dict:
    w = json.loads(raw)
    return json.loads(base64.b64decode(w["data"]).decode("utf-8"))


def _dumps(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")


def load_results(path: str, extract_to: str = "/tmp/results") -> dict:
    """Open a results zip. Photos are extracted so you can open and LOOK at each one."""
    z = zipfile.ZipFile(path)
    names = z.namelist()
    prefix = ""
    if "manifest.json" not in names:
        tops = [n for n in names if n.endswith("/manifest.json") and n.count("/") == 1]
        prefix = tops[0].rsplit("/", 1)[0] + "/" if tops else ""

    def rd(n, default=None):
        n = prefix + n
        return z.read(n) if n in names else default

    out = {
        "manifest": json.loads(rd("manifest.json")),
        "questions": json.loads(rd("questions.json", b"[]")),
        "results": json.loads(rd("results.json")),
        "progress": json.loads(rd("progress.json", b"{}")),
        "markscheme": unwrap_markscheme(rd("markscheme.json")) if rd("markscheme.json") else {"questions": {}},
        "reference": {},
        "photo_files": {},
    }
    for ref in ("questionbank.json", "topics.json", "topicmap.json", "exam.json"):
        raw = rd(f"reference/{ref}")
        if raw:
            obj = json.loads(raw)
            if isinstance(obj, dict) and obj.get("encoding") == "base64":  # the bank is wrapped like mark schemes
                obj = json.loads(base64.b64decode(obj["data"]).decode("utf-8"))
            out["reference"][ref[:-5]] = obj
    os.makedirs(extract_to, exist_ok=True)
    for a in out["results"]["answers"]:
        files = []
        for p in a.get("photos", []):
            raw = rd(p)
            if raw:
                dest = os.path.join(extract_to, os.path.basename(p))
                with open(dest, "wb") as f:
                    f.write(raw)
                files.append(dest)
        out["photo_files"][a["questionId"]] = files
    out["questions_by_id"] = {q["id"]: q for q in out["questions"]}
    return out


def build_pack(manifest: dict, questions: list | None = None, markscheme: dict | None = None,
               images: dict | None = None, feedback: dict | None = None, progress: dict | None = None,
               next_pack: bytes | None = None) -> bytes:
    """Return pack zip bytes. images = {"name.svg": bytes-or-str}. next_pack = another pack's bytes."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", _dumps(manifest))
        if questions is not None:
            z.writestr("questions.json", _dumps(questions))
        if markscheme is not None:
            z.writestr("markscheme.json", wrap_markscheme(markscheme))
        for name, data in (images or {}).items():
            z.writestr(f"images/{name}", data.encode("utf-8") if isinstance(data, str) else data)
        if feedback is not None:
            z.writestr("feedback.json", _dumps(feedback))
        if progress is not None:
            z.writestr("progress.json", _dumps(progress))
        if next_pack is not None:
            with zipfile.ZipFile(io.BytesIO(next_pack)) as inner:
                for info in inner.infolist():
                    if not info.is_dir():
                        z.writestr(f"next/{info.filename}", inner.read(info))
    return buf.getvalue()


def check_pack(data: bytes, topic_codes: set | None = None) -> tuple[list, list]:
    """Mirror of the player's import checks (stricter). Returns (errors, warnings); never raises."""
    try:
        return _check_pack(data, topic_codes)
    except Exception as e:  # noqa: BLE001
        return [f"pack could not be checked: {type(e).__name__}: {e}"], []


def _check_pack(data: bytes, topic_codes: set | None = None) -> tuple[list, list]:
    errors, warnings = [], []
    z = zipfile.ZipFile(io.BytesIO(data))
    names = set(z.namelist())
    if "manifest.json" not in names:
        return ["manifest.json missing at zip root"], []
    m = json.loads(z.read("manifest.json"))
    if m.get("formatVersion") != 1:
        errors.append("formatVersion must be 1")
    if not ID_RE.match(str(m.get("packId", ""))):
        errors.append("bad packId")
    if m.get("type") not in ("paper", "lesson", "feedback"):
        errors.append("bad type")
    if m.get("source") not in ("real", "generated", "mixed"):
        errors.append("bad source")
    for k in ("title", "created", "timeLimitMins", "totalMarks", "calculator"):
        if k not in m:
            errors.append(f"manifest.{k} missing")
    images = {n[7:] for n in names if n.startswith("images/") and not n.endswith("/")}
    if m.get("type") in ("paper", "lesson"):
        qs = json.loads(z.read("questions.json")) if "questions.json" in names else None
        if not qs:
            return errors + ["questions.json missing or empty"], warnings
        ids, total = set(), 0
        for q in qs:
            w = f"question {q.get('id')}"
            for k in ("id", "number", "part", "marks", "topics", "prompt", "answerType"):
                if k not in q:
                    errors.append(f"{w}: {k} missing")
            if not ID_RE.match(str(q.get("id", ""))) or q.get("id") in ids:
                errors.append(f"{w}: id invalid or duplicated")
            ids.add(q.get("id"))
            total += q.get("marks", 0) if isinstance(q.get("marks"), int) else 0
            if q.get("answerType") not in ("short", "working"):
                errors.append(f"{w}: answerType must be short or working")
            if topic_codes:
                for t in q.get("topics", []):
                    if t not in topic_codes:
                        warnings.append(f"{w}: unknown topic {t}")
            for img in (q.get("image"), q.get("stemImage"), (q.get("workedExample") or {}).get("image")):
                if img and img not in images:
                    errors.append(f"{w}: image {img} not in images/")
            if q.get("libraryRef") and not q.get("sourceRef"):
                errors.append(f"{w}: libraryRef without sourceRef")
        if total != m.get("totalMarks"):
            errors.append(f"totalMarks {m.get('totalMarks')} but questions add to {total}")
        if "markscheme.json" not in names:
            errors.append("markscheme.json missing")
        else:
            try:
                ms = unwrap_markscheme(z.read("markscheme.json"))
            except Exception:  # noqa: BLE001
                ms = None
                errors.append('markscheme.json must be {"encoding": "base64", "data": <base64 of the JSON>}')
            for q in (qs if ms else []):
                e = ms.get("questions", {}).get(q.get("id"))
                if not e:
                    errors.append(f"markscheme has no entry for {q.get('id')}")
                elif e.get("maxMarks") != q.get("marks"):
                    errors.append(f"markscheme {q.get('id')} maxMarks != marks")
    if m.get("type") == "feedback":
        if "feedback.json" not in names:
            errors.append("feedback.json missing")
        else:
            fb = json.loads(z.read("feedback.json"))
            for k in ("forPackId", "markedAt", "score", "maxScore", "gradeEstimate", "summary", "wins", "fixes", "nextSession", "questions", "topics"):
                if k not in fb:
                    errors.append(f"feedback.{k} missing")
            if fb.get("forPackId") != m.get("forPackId"):
                errors.append("feedback.forPackId must equal manifest.forPackId")
            if sum(q.get("marksAwarded", 0) for q in fb.get("questions", [])) != fb.get("score"):
                errors.append("score must equal the sum of marksAwarded")
            if sum(q.get("maxMarks", 0) for q in fb.get("questions", [])) != fb.get("maxScore"):
                errors.append("maxScore must equal the sum of maxMarks")
            for q in fb.get("questions", []):
                for l in q.get("lost", []):
                    if l.get("type") not in ("knowledge", "careless"):
                        errors.append(f"{q.get('questionId')}: lost.type must be knowledge or careless")
            if len(fb.get("wins", [])) != 3 or len(fb.get("fixes", [])) != 3:
                errors.append("wins and fixes need exactly 3 items each")
        if "progress.json" in names:
            p = json.loads(z.read("progress.json"))
            if not p.get("updatedAt"):
                errors.append("progress.json needs updatedAt")
        if "next/manifest.json" in names:
            sub = io.BytesIO()
            with zipfile.ZipFile(sub, "w") as s:
                for n in names:
                    if n.startswith("next/") and not n.endswith("/"):
                        s.writestr(n[5:], z.read(n))
            e2, w2 = _check_pack(sub.getvalue(), topic_codes)
            errors += [f"next/: {e}" for e in e2]
            warnings += [f"next/: {w}" for w in w2]
    return errors, warnings


def assert_ok(data: bytes, topic_codes: set | None = None):
    errors, warnings = check_pack(data, topic_codes)
    for w in warnings:
        print("warning:", w)
    if errors:
        raise ValueError("Pack is invalid:\n  " + "\n  ".join(errors))
    print("pack OK")


def save(data: bytes, name: str) -> str:
    for d in OUT_DIRS:
        try:
            os.makedirs(d, exist_ok=True)
            path = os.path.join(d, name)
            with open(path, "wb") as f:
                f.write(data)
            return path
        except OSError:
            continue
    raise OSError("nowhere to save")


def feedback_manifest(R: dict, fb: dict) -> dict:
    m = R["manifest"]
    return {
        "formatVersion": 1,
        "packId": f"F-{today()}-{m['packId']}"[:80],
        "type": "feedback",
        "source": m["source"],
        "title": f"Feedback: {m['title']}"[:120],
        "created": now_iso(),
        "timeLimitMins": None,
        "totalMarks": fb["maxScore"],
        "calculator": m["calculator"],
        "forPackId": m["packId"],
        "forAttemptId": R["results"].get("attemptId"),
    }


# ---------------------------------------------------------------- progress

def _upsert(lst: list, item: dict):
    for i, x in enumerate(lst):
        if x.get("id") == item["id"]:
            lst[i] = {**x, **item}
            return
    lst.append(item)


def recompute_topics(progress: dict) -> dict:
    """Derive topic mastery + spaced repetition from markLog and verdicts (FORMAT.md 4.3).

    One practice per topic per day: the day counts as correct when at least one
    question on the topic got full marks and the day's marks on it are >= 2/3.
    Correct day -> next review 1, 3, then 7 days later; any other day -> 1 day.
    Secure (green) = correct on 3 different days. Same rule as the player.
    """
    topics = progress.setdefault("topics", {})
    by_topic: dict = {}
    for e in progress.get("markLog", []):
        for code in e.get("topics", []):
            by_topic.setdefault(code, {}).setdefault(e["date"], []).append(e)
    latest: dict = {}
    for v in progress.get("verdicts", []):
        cur = latest.get(v["topic"])
        if not cur or (v["date"], v["id"]) > (cur["date"], cur["id"]):
            latest[v["topic"]] = v
    for code, days in by_topic.items():
        t = {"note": (topics.get(code) or {}).get("note", ""), "attempts": 0, "marksAwarded": 0, "marksAvailable": 0, "correctDates": []}
        stage = -1
        for day in sorted(days):
            es = days[day]
            got = sum(e.get("awarded", 0) for e in es)
            mx = sum(e.get("max", 0) for e in es)
            correct = any(e.get("max", 0) > 0 and e.get("awarded", 0) >= e["max"] for e in es) and got * 3 >= mx * 2
            t["attempts"] += len(es)
            t["marksAwarded"] += got
            t["marksAvailable"] += mx
            if correct:
                t["correctDates"].append(day)
                stage = min(stage + 1, len(SR_DAYS) - 1)
            else:
                stage = 0
            t["lastPracticed"] = day
        t["srStage"] = max(stage, 0)
        t["nextDue"] = add_days(t["lastPracticed"], SR_DAYS[t["srStage"]])
        t["secure"] = len(t["correctDates"]) >= 3
        rate = t["marksAwarded"] / t["marksAvailable"] if t["marksAvailable"] else 0
        v = latest.get(code)
        weak = bool(v and v.get("verdict") == "weak" and v["date"] >= t["lastPracticed"])
        t["status"] = "green" if t["secure"] else ("red" if weak or (rate < 0.5 and not t["correctDates"]) else "amber")
        topics[code] = t
    return progress


def grade_for_total(total240: float, exam: dict) -> dict:
    """Grade for a /240 total against each boundary series, plus the default series' grade and the range."""
    by = {}
    for s in exam["gradeBoundaries"]["series"]:
        g = "U"
        for grade in ["9", "8", "7", "6", "5", "4", "3"]:
            if total240 >= s["grades"][grade]:
                g = grade
                break
        by[s["series"]] = g
    order = sorted(by.values(), key=GRADES.index)
    default = exam["gradeBoundaries"]["default"]
    return {"grade": by.get(default, order[-1]), "range": [order[0], order[-1]], "bySeries": by, "boundarySeries": default}


def paper_grade(score80: int, exam: dict) -> dict:
    """One paper out of 80, scaled x3 to the /240 boundaries."""
    return grade_for_total(score80 * 3, exam)


def apply_marking(progress: dict, fb: dict, manifest: dict, results: dict | None = None) -> dict:
    """Update progress.json from your feedback.json. Returns the updated copy (updatedBy tutor)."""
    p = json.loads(json.dumps(progress or {}))
    for k in ("scores", "gradeEstimates", "mistakes", "realPapersUsed", "sessions", "attempts", "bankQuestionsUsed", "markLog", "verdicts"):
        p.setdefault(k, [])
    p.setdefault("topics", {})
    p.setdefault("schemaVersion", 1)
    day = fb["markedAt"][:10]
    attempt_no = (results or {}).get("attemptNo", 1)
    lib = (manifest.get("paperRef") or {}).get("libraryId")
    _upsert(p["scores"], {"id": f"{fb['forPackId']}#{attempt_no}", "packId": fb["forPackId"], "attemptId": (results or {}).get("attemptId"),
                          "date": day, "type": manifest["type"], "source": manifest["source"], "title": manifest["title"],
                          "score": fb["score"], "maxScore": fb["maxScore"], "libraryId": lib, "grade": fb["gradeEstimate"]["grade"]})
    _upsert(p["gradeEstimates"], {"id": f"ge-{fb['forPackId']}-{attempt_no}", "date": day, **fb["gradeEstimate"]})
    if lib:
        _upsert(p["realPapersUsed"], {"id": lib, "libraryId": lib, "packId": fb["forPackId"], "date": day, "score": fb["score"]})
    for q in fb["questions"]:
        for i, l in enumerate(q.get("lost", []), 1):
            _upsert(p["mistakes"], {"id": f"m-{fb['forPackId']}-{q['questionId']}-{i}", "date": day, "packId": fb["forPackId"],
                                    "questionId": q["questionId"], "topic": (q.get("topics") or [None])[0], "type": l["type"],
                                    "note": l["reason"], "resolved": False, "reviewedDates": []})
        _upsert(p["markLog"], {"id": f"{fb['forPackId']}#{attempt_no}:{q['questionId']}", "date": day, "packId": fb["forPackId"],
                               "questionId": q["questionId"], "topics": q.get("topics", []), "awarded": q["marksAwarded"], "max": q["maxMarks"]})
    for t in fb.get("topics", []):
        _upsert(p["verdicts"], {"id": f"{fb['forPackId']}#{attempt_no}:{t['topic']}", "date": day, "topic": t["topic"], "verdict": t.get("verdict")})
        if t.get("note"):
            p["topics"].setdefault(t["topic"], {})["note"] = t["note"]
    recompute_topics(p)
    p["updatedAt"] = now_iso()
    p["updatedBy"] = "tutor"
    return p


def load_questionbank(path: str) -> dict:
    """Read questionbank.json (plain or base64-wrapped) from the Project knowledge or a file."""
    obj = json.load(open(path, encoding="utf-8"))
    return json.loads(base64.b64decode(obj["data"]).decode("utf-8")) if obj.get("encoding") == "base64" else obj


def resolve_mistakes(progress: dict, topic: str, day: str | None = None):
    """Call when he gets a topic fully right again: marks its open mistakes as fixed."""
    for m in progress.get("mistakes", []):
        if m.get("topic") == topic and not m.get("resolved"):
            m.setdefault("reviewedDates", []).append(day or today())
            m["resolved"] = True


def due_topics(progress: dict, day: str | None = None) -> list:
    day = day or today()
    return sorted([(c, t) for c, t in progress.get("topics", {}).items() if t.get("nextDue") and t["nextDue"] <= day], key=lambda x: x[1]["nextDue"])


def days_to_exam(exam: dict, day: str | None = None) -> dict:
    day = day or today()
    return {f"P{p['paper']}": (date.fromisoformat(p["date"]) - date.fromisoformat(day)).days for p in exam["exam"]["papers"]}


# ---------------------------------------------------------------- real questions

def reserved_papers(qb: dict, n_series: int = 4) -> set:
    """Library IDs of the most recent n series: keep these for full timed sittings."""
    series = []
    for p in sorted(qb["papers"], key=lambda p: (p["year"] or 0, p["series"] or ""), reverse=True):
        if p["series"] not in series:
            series.append(p["series"])
    keep = set(series[:n_series])
    return {p["libraryId"] for p in qb["papers"] if p["series"] in keep}


def next_unused_paper(qb: dict, progress: dict, calculator: bool | None = None, newest_last: bool = True) -> dict | None:
    """Oldest unused paper first, so the newest papers are left for the final two weeks."""
    used = {r["id"] for r in progress.get("realPapersUsed", [])}
    papers = [p for p in qb["papers"] if p["libraryId"] not in used and (calculator is None or p["calculator"] == calculator)]
    papers.sort(key=lambda p: (p["year"] or 0, p["series"] or "", p["paper"] or 0), reverse=not newest_last)
    return papers[0] if papers else None


def pick_bank_questions(qb: dict, progress: dict, topics: list, max_marks: int = 12, calculator: bool | None = None,
                        avoid_reserved: bool = True) -> list:
    """Real questions on the given topics, easiest first, skipping ones already used in lessons,
    papers he has sat (he has seen them) and papers reserved for full sittings."""
    used_q = {u["id"] for u in progress.get("bankQuestionsUsed", [])}
    sat = {r["id"] for r in progress.get("realPapersUsed", [])}
    reserved = reserved_papers(qb) - sat if avoid_reserved else set()
    picked, marks = [], 0
    cands = [q for q in qb["questions"] if q["topics"] and q["topics"][0] in topics and q["id"] not in used_q
             and q["libraryId"] not in reserved and q["libraryId"] not in sat and (calculator is None or q["calculator"] == calculator or not q["calculator"])]
    cands.sort(key=lambda q: (int(q.get("number", 0) or 0), q["marks"]))  # later question number ~ harder on AQA papers
    for q in cands:
        if marks + q["marks"] > max_marks:
            continue
        picked.append(q)
        marks += q["marks"]
    return picked


def bank_to_question(bq: dict, new_id: str, number: str, part: str | None = None) -> tuple[dict, dict]:
    """Turn a question-bank entry into (question, markscheme entry) for a lesson pack, with libraryRef."""
    q = {"id": new_id, "number": number, "part": part, "marks": bq["marks"], "topics": bq["topics"],
         "prompt": bq["text"] or "Answer the question shown in the image.", "answerType": bq.get("answerType") or "working",
         "sourceRef": bq["sourceRef"], "libraryRef": bq["id"]}
    if bq.get("stem"):
        q["stem"] = bq["stem"]
    ms = dict(bq["markscheme"])
    ms["maxMarks"] = bq["marks"]
    return q, ms


def record_bank_use(progress: dict, bank_ids: list, pack_id: str):
    for bid in bank_ids:
        _upsert(progress.setdefault("bankQuestionsUsed", []), {"id": bid, "packId": pack_id, "date": today()})


def real_paper_pack(qb: dict, library_id: str) -> bytes:
    """A full real paper as a pack (images come from the player's built-in library via libraryRef)."""
    paper = next(p for p in qb["papers"] if p["libraryId"] == library_id)
    qs = [q for q in qb["questions"] if q["libraryId"] == library_id]
    questions, ms = [], {"packId": f"P-{today()}-{library_id}", "source": f"AQA {paper['series']} {paper['code']} mark scheme", "questions": {}}
    for bq in qs:
        qid = bq["id"].split(":", 1)[1]
        q, m = bank_to_question(bq, qid, bq["number"], bq["part"])
        questions.append(q)
        ms["questions"][qid] = m
    manifest = {"formatVersion": 1, "packId": ms["packId"], "type": "paper", "source": "real",
                "title": f"AQA {paper['series']} Paper {paper['paper']} ({'calculator' if paper['calculator'] else 'non-calculator'})",
                "created": now_iso(), "timeLimitMins": 90, "totalMarks": sum(q["marks"] for q in questions), "calculator": paper["calculator"],
                "paperRef": {"libraryId": library_id, "series": paper["series"], "paper": paper["paper"], "tier": "H", "code": paper["code"]},
                "intro": "Full real AQA paper under exam conditions: 1 hour 30 minutes, the clock stops only if you pause. Show all working and photograph it."}
    return build_pack(manifest, questions, ms)


# ---------------------------------------------------------------- planning

def per_paper_targets(exam: dict) -> dict:
    """Marks out of 80 per paper needed for grades 6, 7, 8 in each boundary series (boundary / 3, rounded up)."""
    out = {}
    for s in exam["gradeBoundaries"]["series"]:
        out[s["series"]] = {g: -(-s["grades"][g] // 3) for g in ("6", "7", "8")}
    return out


def phase(exam: dict, day: str | None = None) -> str:
    """secure-6 until 3 weeks before Paper 1, push-7-8 for the next week, final-papers in the last 14 days, exam-week once Paper 1 is done."""
    d = days_to_exam(exam, day)["P1"]
    if d < 0:
        return "exam-week"
    if d <= 14:
        return "final-papers"
    if d <= 21:
        return "push-7-8"
    return "secure-6"


def priority_topics(progress: dict, topicmap: dict | None, bands=("4-5", "6"), n: int = 4, day: str | None = None) -> list:
    """Weakest high-value topics first. Weight = marks per paper x need (red 3, unseen 1.5, amber 2, green 0)."""
    day = day or today()
    tm = {t["code"]: t for t in (topicmap or {}).get("topics", [])}
    topics = progress.get("topics", {})
    scored = []
    for code, info in tm.items():
        if info.get("band") not in bands:
            continue
        st = topics.get(code, {})
        need = {"red": 3, "amber": 2, "green": 0}.get(st.get("status"), 1.5)
        if need == 0:
            continue
        value = info.get("marksPerPaper") or 0.5
        scored.append((value * need, code))
    scored.sort(reverse=True)
    return [c for _, c in scored[:n]]
