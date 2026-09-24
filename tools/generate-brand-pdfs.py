"""Rebrand the preserved example content with vector geometry; no new advice.

Requires reportlab and pypdf. Run generate-brand.mjs before this script.
Original files are preserved outside the public folder and hash-verified.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
for name, filename in [('Archivo', 'Archivo-Regular.ttf'), ('Archivo-SemiBold', 'Archivo-SemiBold.ttf'), ('Plex', 'IBMPlexMono-Medium.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / 'public/fonts' / filename)))
ARCHIVE = ROOT / '.superpowers/sdd/mnt-implementation/source-assets'
ARCHIVE.mkdir(parents=True, exist_ok=True)
PUBLIC = ROOT / 'public/descargas'
SOURCES = ['checklist-venta-cota.pdf', 'ficha-tecnica-demo.pdf']
CONTENT = ROOT / 'tools/brand-document-content.json'
if not CONTENT.exists():
    captured = {}
    for name in SOURCES:
        source = PUBLIC / name
        backup = ARCHIVE / name
        if not backup.exists():
            shutil.copy2(source, backup)
        assert hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(backup.read_bytes()).digest()
        captured[name] = '\n'.join(p.extract_text() for p in PdfReader(source).pages).splitlines()
    CONTENT.write_text(json.dumps(captured, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
sources = json.loads(CONTENT.read_text(encoding='utf-8'))
raw = (ROOT / 'src/components/brand/brand-paths.ts').read_text(encoding='utf-8')
geometry = json.loads(raw.split('export const brandPaths = ', 1)[1].split(' as const;',1)[0])

def path(c, d):
    tokens = re.findall(r'[MLHVQZ]|-?\d+(?:\.\d+)?', d)
    p = c.beginPath()
    i = 0
    x = y = 0
    while i < len(tokens):
        op = tokens[i]; i += 1
        count = {'M':2,'L':2,'H':1,'V':1,'Q':4,'Z':0}[op]
        values = list(map(float, tokens[i:i+count])); i += count
        if op in ('M','L'):
            x,y = values
            (p.moveTo if op == 'M' else p.lineTo)(x,y)
        elif op == 'H':
            x = values[0]; p.lineTo(x,y)
        elif op == 'V':
            y = values[0]; p.lineTo(x,y)
        elif op == 'Q':
            qx,qy,nx,ny = values
            p.curveTo(x+2*(qx-x)/3, y+2*(qy-y)/3, nx+2*(qx-nx)/3, ny+2*(qy-ny)/3, nx,ny)
            x,y = nx,ny
        else: p.close()
    c.drawPath(p, stroke=0, fill=1, fillMode=0)

def logo(c):
    c.saveState(); c.translate(48, 745); c.scale(0.8,-0.8)
    c.setFillColor(HexColor('#0F6B4E')); path(c,geometry['symbol'])
    c.translate(88,0); c.setFillColor(HexColor('#15201B')); path(c,geometry['initials'])
    c.translate(0,47)
    for glyph in geometry['descriptor']:
        c.saveState(); c.translate(glyph['x'],0); path(c,glyph['d']); c.restoreState()
    c.restoreState()

for name, lines in sources.items():
    target = PUBLIC / name.replace('checklist-venta-cota','checklist-venta-mnt')
    c = canvas.Canvas(str(target), pagesize=(612,792), invariant=1)
    c.setTitle('MNT Inmuebles - '+lines[0].split(' - ',1)[1])
    c.setAuthor('MNT Inmuebles')
    logo(c)
    c.setStrokeColor(HexColor('#0F6B4E')); c.line(48,674,564,674)
    y=646
    expected=[]
    for index, original in enumerate(lines):
        line = original.replace('COTA - ','').replace('COTA-000','MNT-000')
        line = re.sub(r'cota\.example(?:/#evaluar)?','Contacto: consultar el sitio web',line)
        line = line.replace('Documento de ejemplo con marca provisional.','Documento de ejemplo.')
        expected.append(line)
        c.setFillColor(HexColor('#15201B' if index<2 else '#59635B'))
        c.setFont('Archivo-SemiBold' if index==0 else ('Plex' if index==1 else 'Archivo'), 13 if index==0 else 10)
        if index==2: y-=12
        columns = re.split(r'\s{2,}', line, maxsplit=1)
        if name == 'ficha-tecnica-demo.pdf' and len(columns) == 2:
            c.drawString(48,y,columns[0]); c.drawString(228,y,columns[1])
        else:
            c.drawString(48,y,line)
        y-=24 if index<2 else 18
    assert y>48, (name,y)
    c.save()
    extracted='\n'.join(p.extract_text() for p in PdfReader(target).pages)
    normalize = lambda s: ' '.join(s.split())
    assert all(normalize(line) in normalize(extracted) for line in expected), 'Text preservation failed'
    print(f'{target.name}: 1 page; all {len(expected)} source lines verified after brand substitutions')

old = PUBLIC / SOURCES[0]
if old.exists():
    backup = ARCHIVE / SOURCES[0]
    assert backup.exists() and hashlib.sha256(old.read_bytes()).digest() == hashlib.sha256(backup.read_bytes()).digest()
    old.unlink()  # authorized rename; the original content is preserved and verified above
