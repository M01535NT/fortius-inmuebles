"""Regenerate the public, printable Fortius seller checklist."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from pdf_letterhead import draw_letterhead


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/descargas/checklist-venta-fortius.pdf"
pdfmetrics.registerFont(TTFont("Archivo", str(ROOT / "public/fonts/Archivo-Regular.ttf")))
pdfmetrics.registerFont(TTFont("ArchivoBold", str(ROOT / "public/fonts/Archivo-SemiBold.ttf")))

navy = HexColor("#102644")
burgundy = HexColor("#8A1634")
ink = HexColor("#262A30")
muted = HexColor("#59616A")
paper = HexColor("#FAF8F3")
line = HexColor("#D9D7D1")

items = [
    ("Titular y representación", "¿Quién puede autorizar la venta? Reúne el título disponible y los documentos de identidad o representación que correspondan."),
    ("Gravámenes y adeudos", "¿Existe hipoteca, gravamen o saldo pendiente? Identifica su estado y la vía para resolverlo; no todos impiden vender."),
    ("Superficies y datos", "¿Coinciden escritura, catastro y realidad física? Registra la fuente de cada superficie y cualquier diferencia por aclarar."),
    ("Cuentas del inmueble", "¿Qué indican predial, agua, mantenimiento y otros comprobantes pertinentes? Revisa saldos y periodos."),
    ("Ocupación y entrega", "¿Está ocupado o arrendado? Aclara las condiciones de uso y cuándo podría entregarse."),
    ("Bienes incluidos", "¿Qué muebles, equipos e instalaciones forman parte de la operación? Deja por escrito las exclusiones."),
    ("Precio de salida", "¿Qué información de mercado respalda el precio? Distingue anuncios, ofertas y cierres documentados cuando existan."),
    ("Neto esperado", "¿Cuánto quedaría después de gastos, impuestos y saldos aplicables? Trabaja con estimaciones antes de fijar un mínimo."),
    ("Información pública", "¿Qué fotos, ubicación y datos se pueden difundir? Autoriza el material y protege los documentos y datos personales."),
    ("Visitas y ofertas", "¿Quién coordinará el acceso y recibirá propuestas? Acuerda filtros, horarios y seguimiento por escrito."),
]

width, height = 612, 792
pdf = canvas.Canvas(str(DEST), pagesize=(width, height), pageCompression=1)
pdf.setTitle("Preparar una propiedad para vender | Fortius Inmuebles")
pdf.setAuthor("Fortius Inmuebles")
pdf.setSubject("Diez preguntas para organizar una venta inmobiliaria")
pdf.setFillColor(paper)
pdf.rect(0, 0, width, height, fill=1, stroke=0)

draw_letterhead(pdf, 'Guía para propietarios', font='ArchivoBold')
pdf.setFillColor(burgundy)
pdf.setFont("ArchivoBold", 9)
pdf.drawRightString(569, 656, "GUÍA PARA PROPIETARIOS")

pdf.setFillColor(navy)
pdf.setFont("ArchivoBold", 25)
pdf.drawString(43, 627, "Antes de poner tu propiedad")
pdf.drawString(43, 594, "en venta")

intro_style = ParagraphStyle("intro", fontName="Archivo", fontSize=10.5, leading=15.5, textColor=muted, alignment=TA_JUSTIFY)
intro = Paragraph("Estas preguntas ayudan a detectar qué está claro y qué necesita verificación antes de publicar. Marca lo que ya conoces y anota los pendientes.", intro_style)
intro.wrapOn(pdf, 526, 70)
intro.drawOn(pdf, 43, 547)

body_style = ParagraphStyle("item", fontName="Archivo", fontSize=8.5, leading=11.5, textColor=ink, alignment=TA_JUSTIFY)
columns = [(43, "Información del inmueble", items[:5]), (315, "Preparación de la venta", items[5:])]
for x, heading, entries in columns:
    pdf.setFillColor(burgundy)
    pdf.setFont("ArchivoBold", 10)
    pdf.drawString(x, 512, heading.upper())
    pdf.setStrokeColor(line)
    pdf.line(x, 502, x + 254, 502)
    for index, (title, body) in enumerate(entries):
        top = 484 - index * 64
        pdf.setStrokeColor(burgundy)
        pdf.setLineWidth(1)
        pdf.rect(x, top - 11, 12, 12, fill=0, stroke=1)
        pdf.setFillColor(navy)
        pdf.setFont("ArchivoBold", 9.3)
        pdf.drawString(x + 21, top - 9, title)
        paragraph = Paragraph(body, body_style)
        _, used = paragraph.wrap(230, 58)
        paragraph.drawOn(pdf, x + 21, top - 16 - used)

pdf.setStrokeColor(line)
pdf.line(43, 164, 569, 164)
footer_style = ParagraphStyle("footer", fontName="Archivo", fontSize=9.2, leading=13.5, textColor=muted, alignment=TA_JUSTIFY)
footer = Paragraph("Si algo falta, anótalo. En la primera conversación podemos ordenar contigo qué conviene resolver y quién debe confirmarlo.", footer_style)
footer.wrapOn(pdf, 526, 35)
footer.drawOn(pdf, 43, 132)
pdf.showPage()
pdf.save()
