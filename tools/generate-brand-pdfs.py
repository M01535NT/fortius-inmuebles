"""Regenerate the existing public example documents with the Fortius identity.
Requires reportlab and pypdf. El checklist se genera desde su fuente vigente.
"""
from pathlib import Path
import json
import re
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
from pdf_letterhead import draw_letterhead
import runpy

ROOT = Path(__file__).resolve().parents[1]
for name, filename in [('Archivo', 'Archivo-Regular.ttf'), ('Archivo-SemiBold', 'Archivo-SemiBold.ttf'), ('Plex', 'IBMPlexMono-Medium.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / 'public/fonts' / filename)))
public = ROOT / 'public/descargas'
sources = json.loads((ROOT / 'tools/brand-document-content.json').read_text(encoding='utf-8'))
for name, lines in sources.items():
    if name == 'checklist-venta-fortius.pdf':
        continue  # La fuente JSON histórica no debe sustituir las diez preguntas vigentes.
    target = public / name
    c = canvas.Canvas(str(target), pagesize=(612, 792), invariant=1)
    c.setTitle('Fortius Inmuebles - ' + lines[0].split(' - ', 1)[1])
    c.setAuthor('Fortius Inmuebles')
    draw_letterhead(c, 'Ficha técnica')
    y = 648
    expected = []
    for index, original in enumerate(lines):
        line = original.removeprefix('Fortius Inmuebles - ')
        line = line.replace('Documento de ejemplo con marca provisional.', 'Documento de ejemplo.')
        expected.append(line)
        c.setFillColor(HexColor('#061F3F' if index < 2 else '#526176'))
        c.setFont('Archivo-SemiBold' if index == 0 else ('Plex' if index == 1 else 'Archivo'), 13 if index == 0 else 10)
        if index == 2:
            y -= 12
        columns = re.split(r'\s{2,}', line, maxsplit=1)
        if name == 'ficha-tecnica-demo.pdf' and len(columns) == 2:
            c.drawString(48, y, columns[0])
            c.drawString(228, y, columns[1])
        else:
            c.drawString(48, y, line)
        y -= 24 if index < 2 else 18
    assert y > 128, (name, y)
    c.save()
    extracted = '\n'.join(p.extract_text() for p in PdfReader(target).pages)
    normalize = lambda s: ' '.join(s.split())
    assert all(normalize(line) in normalize(extracted) for line in expected), 'Text preservation failed'
    print(f'{target.name}: all {len(expected)} original source lines preserved')
runpy.run_path(str(ROOT / 'tools/generate-seller-checklist.py'), run_name='__main__')
