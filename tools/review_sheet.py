"""Contact sheet for checking a converted paper by eye: every question's crop,
extracted text, marks, topics and mark-scheme entry on one HTML page.

    python3 tools/review_sheet.py library_src/aqa-2019-06-1h.zip   -> work/review/aqa-2019-06-1h.html
"""
import base64
import html
import io
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packlib import ROOT, unwrap_markscheme  # noqa: E402


def sheet(path: Path) -> Path:
    z = zipfile.ZipFile(io.BytesIO(path.read_bytes()))
    m = json.loads(z.read("manifest.json"))
    qs = json.loads(z.read("questions.json"))
    ms = unwrap_markscheme(z.read("markscheme.json"))["questions"]
    extra = json.loads(z.read("extra.json")).get("questions", {}) if "extra.json" in z.namelist() else {}
    img = lambda n: f'<img src="data:image/png;base64,{base64.b64encode(z.read("images/" + n)).decode()}">' if n and f"images/{n}" in z.namelist() else ""
    rows = []
    for q in qs:
        e = ms.get(q["id"], {})
        marks = "".join(f"<li><b>{html.escape(p['code'])}</b> {html.escape(p['text'])}</li>" for p in e.get("marks", []))
        rows.append(f"""<section><h2>{q['id']} · {q['marks']} marks · {', '.join(q['topics'])} {'· diagram' if extra.get(q['id'], {}).get('hasDiagram') else ''}</h2>
<div class="grid"><div>{img(q.get('stemImage'))}{img(q.get('image'))}</div>
<div><pre>{html.escape(q.get('stem', ''))}\n{html.escape(q['prompt'])}</pre><p><b>Answer:</b> {html.escape(e.get('answer', ''))}</p><ul>{marks}</ul>
<p class="c">{html.escape(e.get('comments', '')[:400])}</p><p class="c">ER: {html.escape(extra.get(q['id'], {}).get('examinerComment', '')[:300])}</p></div></div></section>""")
    total = sum(q["marks"] for q in qs)
    doc = f"""<!doctype html><meta charset="utf-8"><title>{html.escape(m['title'])}</title>
<style>body{{font:14px system-ui;margin:16px;background:#f4f5f7}}section{{background:#fff;border:1px solid #ccd;border-radius:8px;padding:10px;margin:10px 0}}
.grid{{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:12px}}img{{max-width:100%;border:1px solid #ddd;display:block;margin-bottom:6px}}
pre{{white-space:pre-wrap;font-size:13px;background:#f7f7f9;padding:6px}}.c{{color:#555;font-size:12px}}h2{{font-size:15px;margin:0 0 8px}}</style>
<h1>{html.escape(m['title'])} · {len(qs)} parts · {total} marks</h1>{''.join(rows)}"""
    out = ROOT / "work" / "review" / f"{m['packId']}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)
    return out


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(sheet(Path(p)))
