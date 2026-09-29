"""Decrypt every paper in app/library and check it: valid pack, 80 marks,
a crop image and a mark-scheme entry for every question.

    python3 tools/validate_library.py        (passcode from GCSE_PASSCODE or .passcode)
"""
import base64
import io
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, check_pack, unwrap_markscheme  # noqa: E402
from build_library import decrypt, derive, get_passcode  # noqa: E402

lib = ROOT / "app" / "library"
idx = json.loads((lib / "index.json").read_text())
key = derive(get_passcode(), base64.b64decode(idx["crypto"]["salt"]))
assert decrypt(key, base64.b64decode(idx["crypto"]["check"])) == b"gcse-ok", "passcode does not match the library"
bad = 0
for p in idx["papers"]:
    data = decrypt(key, (lib / p["file"]).read_bytes())
    errors, warnings = check_pack(data, expect_marks=80)
    z = zipfile.ZipFile(io.BytesIO(data))
    qs = json.loads(z.read("questions.json"))
    ms = unwrap_markscheme(z.read("markscheme.json"))["questions"]
    for q in qs:
        if not q.get("image") or f"images/{q['image']}" not in z.namelist():
            errors.append(f"{q['id']}: no crop image")
        if not ms.get(q["id"], {}).get("marks"):
            warnings.append(f"{q['id']}: mark scheme has no mark points")
    total = sum(q["marks"] for q in qs)
    status = "OK " if not errors and total == 80 else "BAD"
    bad += status == "BAD"
    print(f"{status} {p['libraryId']}: {len(qs)} parts, {total} marks{'; ' + '; '.join(errors[:3]) if errors else ''}{f' ({len(warnings)} warnings)' if warnings else ''}")
if idx.get("questionbank"):
    qb = json.loads(decrypt(key, (lib / idx["questionbank"]).read_bytes()))
    print(f"question bank: {len(qb['questions'])} questions from {len(qb['papers'])} papers")
print(f"{len(idx['papers']) - bad}/{len(idx['papers'])} papers valid")
sys.exit(1 if bad else 0)
