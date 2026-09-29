"""Build a synthetic paper in the AQA 8300 layout (not AQA content) to test
tools/convert_paper.py: margin number boxes, [n marks], answer lines,
header/footer furniture, a blank page, a stem shared by parts, a question that
runs over a page, a diagram, a mark-scheme table and an examiner report.

    python3 tests/make_fake_aqa.py OUT_DIR
"""
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

W, H = A4
# (number, part, text lines, marks, extra) ; part None + marks 0 = stem
QUESTIONS = [
    (1, None, ["Work out 3/4 + 2/3", "Give your answer as a mixed number."], 2, None),
    (2, None, ["The diagram shows a right-angled triangle."], 0, "triangle"),
    (2, "1", ["Work out the length of the hypotenuse."], 3, None),
    (2, "2", ["Work out the size of angle x.", "Give your answer to 1 decimal place."], 3, None),
    (3, None, ["Solve x^2 - 5x - 14 = 0"], 3, None),
    (4, None, ["Write 0.00042 in standard form."], 1, None),
    (5, "1", ["Expand and simplify (x + 3)(x - 7)"], 2, None),
    (5, "2", ["Factorise fully 6x^2 - 9x"], 2, None),
    (6, None, ["Show that the sum of any three consecutive integers is a multiple of 3."], 3, "long"),
    (7, None, ["Simplify fully sqrt(50) + sqrt(18)"], 2, None),
]
FILL = [(n, None, [f"Question {n} placeholder text about ratio and percentages."], m, None) for n, m in
        zip(range(8, 24), [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 2, 2])]
QUESTIONS += FILL


def total():
    return sum(q[3] for q in QUESTIONS)


def label_boxes(c, y, number, part):
    digits = f"{number:02d}"
    x = 36
    c.setFont("Helvetica-Bold", 11)
    for d in digits:
        c.rect(x, y - 3, 14, 16)
        c.drawString(x + 4, y + 1, d)
        x += 16
    if part:
        c.drawString(x + 2, y + 1, ".")
        x += 8
        c.rect(x, y - 3, 14, 16)
        c.drawString(x + 4, y + 1, part)


def furniture(c, pno):
    c.setFont("Helvetica", 7)
    c.drawRightString(W - 12, H - 30, "Do not write")
    c.drawRightString(W - 12, H - 38, "outside the")
    c.drawRightString(W - 12, H - 46, "box")
    c.line(W - 45, 40, W - 45, H - 55)
    c.setFont("Helvetica", 8)
    c.drawString(36, 22, "IB/M/Jun19/8300/1H")
    c.drawCentredString(W / 2, 22, f"*{pno:02d}*")
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(W - 50, 22, "Turn over ►")


def text_line(c, x, y, s):
    """Draw text; '^2' becomes a real superscript (smaller, raised)."""
    c.setFont("Helvetica", 11)
    parts = s.split("^")
    c.drawString(x, y, parts[0])
    x += c.stringWidth(parts[0], "Helvetica", 11)
    for p in parts[1:]:
        c.setFont("Helvetica", 7)
        c.drawString(x, y + 4, p[0])
        x += c.stringWidth(p[0], "Helvetica", 7)
        c.setFont("Helvetica", 11)
        c.drawString(x, y, p[1:])
        x += c.stringWidth(p[1:], "Helvetica", 11)


def make_qp(path):
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(60, H - 120, "FAKE GCSE MATHEMATICS")
    c.drawString(60, H - 150, "Higher Tier Paper 1 Non-Calculator")
    c.showPage()
    pno = 2
    y = H - 80
    furniture(c, pno)
    blank_done = False
    for number, part, lines, marks, extra in QUESTIONS:
        need = 60 + 16 * len(lines) + (150 if extra == "triangle" else 0) + (60 if marks else 0)
        if y - need < 70:
            c.showPage()
            pno += 1
            if not blank_done and pno == 4:
                furniture(c, pno)
                c.setFont("Helvetica-Bold", 12)
                c.drawCentredString(W / 2, H / 2, "Turn over for the next question")
                c.showPage()
                pno += 1
                blank_done = True
            furniture(c, pno)
            y = H - 80
        label_boxes(c, y, number, part)
        ty = y + 1
        for line in lines:
            text_line(c, 100, ty, line)
            ty -= 18
        if extra == "triangle":
            c.line(140, ty - 120, 340, ty - 120)
            c.line(140, ty - 120, 140, ty - 10)
            c.line(140, ty - 10, 340, ty - 120)
            c.drawString(110, ty - 70, "6 cm")
            c.drawString(230, ty - 138, "8 cm")
            ty -= 150
        if extra == "long":
            for _ in range(3):
                ty -= 18
            # force this question to continue on the next page
            c.setFont("Helvetica", 9)
            c.drawString(100, ty, "Question 6 continues on the next page")
            c.showPage()
            pno += 1
            furniture(c, pno)
            ty = H - 90
            text_line(c, 100, ty, "Use n for the first integer.")
            ty -= 40
        if marks:
            c.setFont("Helvetica-Bold", 10)
            c.drawRightString(W - 55, ty - 6, f"[{marks} mark{'s' if marks > 1 else ''}]")
            c.setFont("Helvetica", 11)
            c.drawString(250, ty - 30, "Answer")
            c.setDash(1, 2)
            c.line(300, ty - 32, 500, ty - 32)
            c.setDash()
            ty -= 60
        y = ty - 30
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W / 2, y - 20, "END OF QUESTIONS")
    c.showPage()
    c.save()


def make_ms(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4)
    rows = [["Q", "Answer", "Mark", "Comments"]]
    for number, part, lines, marks, extra in QUESTIONS:
        if not marks:
            continue
        q = f"{number}" + (f".{part}" if part else "")
        if marks == 1:
            rows.append([q, "4.2 × 10^-4", "B1", ""])
        else:
            rows.append([q, "Correct method for " + q, "M1", "oe"])
            for i in range(marks - 2):
                rows.append(["", f"Further step {i + 1}", "M1dep", ""])
            rows.append(["", f"Final answer {q}", "A1", "ft their value"])
            rows.append(["", "Additional Guidance: accept equivalent forms", "", ""])
    t = Table(rows, colWidths=[40, 250, 50, 140], repeatRows=1)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.black), ("FONTSIZE", (0, 0), (-1, -1), 9)]))
    doc.build([t])


def make_er(path):
    doc = SimpleDocTemplate(str(path), pagesize=A4)
    st = getSampleStyleSheet()
    story = [Paragraph("Report on the examination", st["Title"])]
    for n, note in [(1, "Many students added numerators and denominators."), (3, "Common error: sign slips when solving."),
                    (6, "Few students used algebra; many only checked examples.")]:
        story += [Paragraph(f"Question {n}", st["Heading2"]), Paragraph(note, st["Normal"]), Spacer(1, 8)]
    doc.build(story)


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    assert total() == 80, total()
    make_qp(out / "AQA-83001H-QP-JUN19.PDF")
    make_ms(out / "AQA-83001H-W-MS-JUN19.PDF")
    make_er(out / "AQA-83001H-WRE-JUN19.PDF")
    print("fake paper written", out)
