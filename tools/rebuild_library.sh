#!/usr/bin/env bash
# Full Past Paper Library rebuild: download -> convert -> review sheets ->
# question bank + topic map -> encrypt -> validate -> tutor docs -> service worker.
# Needs network access to AQA (or PDFs already in papers/) and .passcode.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/fetch_papers.py "${@}"
python3 tools/convert_paper.py --all
python3 tools/review_sheet.py library_src/*.zip >/dev/null
python3 tools/build_questionbank.py
python3 tools/build_library.py
python3 tools/validate_library.py
python3 tools/build_tutor_docs.py
node tools/build.mjs
echo "Library rebuilt. Review work/review/*.html, then run: npm test -- --library"
