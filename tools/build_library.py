"""Encrypt the Past Paper Library for the player.

Reads unencrypted paper packs from library_src/*.zip, checks each one, and
writes app/library/<libraryId>.<hash>.bin (AES-256-GCM, key from the passcode
via PBKDF2-SHA-256) plus app/library/index.json.

The passcode comes from the GCSE_PASSCODE environment variable or a
.passcode file at the repo root (git-ignored). Changing the passcode means
re-running this script and telling him the new one.

    GCSE_PASSCODE='...' python3 tools/build_library.py [--src DIR] [--out DIR]
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import zipfile
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, check_pack, now_iso  # noqa: E402

ITERATIONS = 310_000
MONTHS = {"01": "January", "03": "March", "06": "June", "11": "November", "05": "May", "10": "October", "02": "February", "09": "September", "04": "April", "07": "July", "08": "August", "12": "December"}


def normalise(passcode: str) -> str:
    return "-".join(passcode.strip().lower().split())


def derive(passcode: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", normalise(passcode).encode("utf-8"), salt, ITERATIONS, 32)


def encrypt(key: bytes, data: bytes) -> bytes:
    # Deterministic IV (HMAC of the plaintext): identical input gives identical
    # output, so unchanged papers keep their file name and cached copies.
    iv = hmac.new(key, data, hashlib.sha256).digest()[:12]
    return iv + AESGCM(key).encrypt(iv, data, None)


def decrypt(key: bytes, blob: bytes) -> bytes:
    return AESGCM(key).decrypt(blob[:12], blob[12:], None)


def get_passcode() -> str:
    pc = os.environ.get("GCSE_PASSCODE")
    if not pc and (ROOT / ".passcode").exists():
        pc = (ROOT / ".passcode").read_text().strip()
    if not pc:
        sys.exit("Set GCSE_PASSCODE or create .passcode")
    return pc


def build(src: Path, out: Path, passcode: str, qb_path: Path | None = None) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    old = out / "index.json"
    salt = None
    if old.exists():
        prev = json.loads(old.read_text())
        s = base64.b64decode(prev["crypto"]["salt"])
        try:
            decrypt(derive(passcode, s), base64.b64decode(prev["crypto"]["check"]))
            salt = s  # same passcode: keep the salt so file names stay stable
        except Exception:  # noqa: BLE001
            salt = None
    salt = salt or os.urandom(16)
    key = derive(passcode, salt)

    papers = []
    problems = []
    keep = set()
    for path in sorted(src.glob("*.zip")):
        data = path.read_bytes()
        try:
            z = zipfile.ZipFile(io.BytesIO(data))
            m = json.loads(z.read("manifest.json"))
            qs = json.loads(z.read("questions.json"))
            errors, warnings = check_pack(data, expect_marks=80 if m.get("type") == "paper" else None)
        except Exception as e:  # noqa: BLE001
            problems.append((path.name, [f"unreadable pack: {e}"]))
            continue
        if errors:
            problems.append((path.name, errors))
            continue
        ref = m.get("paperRef", {})
        lib_id = ref.get("libraryId") or m["packId"]
        digest = hashlib.sha256(data).hexdigest()[:10]
        fname = f"{lib_id}.{digest}.bin"
        (out / fname).write_bytes(encrypt(key, data))
        keep.add(fname)
        papers.append({
            "libraryId": lib_id,
            "title": m["title"],
            "series": ref.get("series"),
            "year": ref.get("year"),
            "month": ref.get("month"),
            "paper": ref.get("paper"),
            "tier": ref.get("tier", "H"),
            "code": ref.get("code"),
            "calculator": m["calculator"],
            "totalMarks": m["totalMarks"],
            "questions": len(qs),
            "file": fname,
            "warnings": len(warnings),
        })
    qb_file = None
    qb_path = qb_path or ROOT / "questionbank.json"
    if qb_path.exists():
        qb = qb_path.read_bytes()
        # Name from the content without the 'generated' timestamp, so an unchanged bank keeps its name.
        stable = json.dumps({k: v for k, v in json.loads(qb).items() if k != "generated"}, sort_keys=True).encode()
        qb_file = f"questionbank.{hashlib.sha256(stable).hexdigest()[:10]}.bin"
        (out / qb_file).write_bytes(encrypt(key, qb))
        keep.add(qb_file)
    for f in out.glob("*.bin"):
        if f.name not in keep:
            f.unlink()
    papers.sort(key=lambda p: (p.get("year") or 0, p.get("month") or "", p.get("paper") or 0))
    index = {
        "generated": now_iso(),
        "crypto": {
            "kdf": "PBKDF2",
            "hash": "SHA-256",
            "iterations": ITERATIONS,
            "salt": base64.b64encode(salt).decode(),
            "check": base64.b64encode(encrypt(key, b"gcse-ok")).decode(),
        },
        "papers": papers,
        "questionbank": qb_file,
    }
    (out / "index.json").write_text(json.dumps(index, indent=1))
    for name, errs in problems:
        print(f"SKIPPED {name}: {'; '.join(errs[:5])}", file=sys.stderr)
    print(f"library: {len(papers)} papers written to {out}")
    return index


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT / "library_src"))
    ap.add_argument("--out", default=str(ROOT / "app" / "library"))
    a = ap.parse_args()
    Path(a.src).mkdir(exist_ok=True)
    build(Path(a.src), Path(a.out), get_passcode())
