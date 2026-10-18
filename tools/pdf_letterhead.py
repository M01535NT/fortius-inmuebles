"""Gráficos originales del Plan de negocio para los descargables estáticos."""
from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]

def draw_letterhead(pdf, title, page=1, total=1, width=612, height=792, font='Archivo-SemiBold'):
    scale = width / 612
    pdf.drawImage(ImageReader(str(ROOT / 'public/brand/membrete-encabezado.png')), 0, height - 118.8 * scale, width=width, height=118.8 * scale, mask='auto')
    pdf.drawImage(ImageReader(str(ROOT / 'public/brand/membrete-pie.png')), 0, 0, width=width, height=108 * scale, mask='auto')
    pdf.setFillColor(HexColor('#061F3F'))
    pdf.setFont(font, 12 * scale)
    pdf.drawRightString(width - 61.2 * scale, height - 67 * scale, title)
    pdf.setFont(font, 8)
    pdf.drawRightString(width - 61.2 * scale, 108 * scale + 6, f'{page} / {total}')
