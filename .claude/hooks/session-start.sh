#!/bin/bash
# Installs what `npm test` and the Past Paper Library pipeline need in
# Claude Code on the web sessions. Idempotent; skips work already done.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Node: vendored libs source + Playwright (Chromium is pre-installed at /opt/pw-browsers).
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
npm install --no-audit --no-fund

# Python: PDF conversion, SymPy checks, AES for the encrypted library.
if ! python3 -c "import pymupdf, pdfplumber, reportlab, sympy, PIL, numpy; from cryptography.hazmat.primitives.ciphers.aead import AESGCM" 2>/dev/null; then
  # --ignore-installed: the image's Debian cryptography package cannot be upgraded in place.
  pip install -q --ignore-installed -r requirements.txt cffi
fi
