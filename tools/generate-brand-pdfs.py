"""Regenerate the existing public example documents with the Fortius identity.
Run node tools/generate-fortius-brand.mjs first. Requires reportlab and pypdf.
"""
from pathlib import Path
import json
import re
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
for name, filename in [('Archivo', 'Archivo-Regular.ttf'), ('Archivo-SemiBold', 'Archivo-SemiBold.ttf'), ('Plex', 'IBMPlexMono-Medium.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / 'public/fonts' / filename)))
public = ROOT / 'public/descargas'
sources = json.loads((ROOT / 'tools/brand-document-content.json').read_text(encoding='utf-8'))
image = ImageReader(str(ROOT / 'public/brand/fortius-logo.png'))
w, h = image.getSize()
for name, lines in sources.items():
    target = public / name
    c = canvas.Canvas(str(target), pagesize=(612, 792), invariant=1)
    c.setTitle('Fortius Inmuebles - ' + lines[0].split(' - ', 1)[1])
    c.setAuthor('Fortius Inmuebles')
    c.drawImage(image, 48, 724, width=180, height=180*h/w, mask='auto')
    c.setStrokeColor(HexColor('#8A1634'))
    c.line(48, 698, 564, 698)
    y = 672
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
    assert y > 48, (name, y)
    c.save()
    extracted = '\n'.join(p.extract_text() for p in PdfReader(target).pages)
    normalize = lambda s: ' '.join(s.split())
    assert all(normalize(line) in normalize(extracted) for line in expected), 'Text preservation failed'
    print(f'{target.name}: all {len(expected)} original source lines preserved')
