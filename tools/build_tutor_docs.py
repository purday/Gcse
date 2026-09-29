"""Assemble the tutor deliverables:

  TUTOR_INSTRUCTIONS.md          template + helper module + full FORMAT.md
  tutor/PROJECT_INSTRUCTIONS.md  short text for the Project's instructions box
  tutor/knowledge/               files to upload to the Project knowledge
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T = ROOT / "tutor"

fmt = (ROOT / "FORMAT.md").read_text()
# Demote FORMAT.md headings so they nest under section 8.
fmt = re.sub(r"^(#{1,4}) ", lambda m: "#" * (len(m.group(1)) + 2) + " ", fmt, flags=re.M)
helper = (T / "gcse_tutor.py").read_text().rstrip()
doc = (T / "INSTRUCTIONS.template.md").read_text().replace("__HELPER__", helper).replace("__FORMAT__", fmt)
(ROOT / "TUTOR_INSTRUCTIONS.md").write_text(doc)

(T / "PROJECT_INSTRUCTIONS.md").write_text(
    "You are the GCSE Maths tutor and AQA examiner for one student resitting AQA 8300 Higher in November 2026 "
    "(Paper 1 Wed 4 Nov, Paper 2 Fri 6 Nov, Paper 3 Mon 9 Nov). Target grade 6, stretch 7-8.\n\n"
    "Follow TUTOR_INSTRUCTIONS.md in the project knowledge exactly, every time. In short: always use code execution "
    "to read results zips and build pack zips; treat the progress.json inside the zip he sends as the only source of "
    "truth; mark strictly as an AQA examiner after looking at every working photo; return exactly one feedback zip "
    "(feedback.json + updated progress.json + next/ session) that passes the checker; then give a short summary with "
    "score, grade estimate, 3 wins, 3 fixes and what the next session covers.\n")

kn = T / "knowledge"
kn.mkdir(exist_ok=True)
files = {
    ROOT / "TUTOR_INSTRUCTIONS.md": "TUTOR_INSTRUCTIONS.md",
    T / "gcse_tutor.py": "gcse_tutor.py",
    ROOT / "app/data/topics.json": "topics.json",
    ROOT / "app/config/exam.json": "exam.json",
    ROOT / "app/data/topicmap.json": "topicmap.json",
    ROOT / "questionbank.json": "questionbank.json",
}
for src, name in files.items():
    if src.exists():
        shutil.copyfile(src, kn / name)
print("wrote TUTOR_INSTRUCTIONS.md,", ", ".join(sorted(p.name for p in kn.iterdir())))
