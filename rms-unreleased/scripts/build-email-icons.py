"""Export the website's chip/contactless SVGs as email-safe, 3x PNGs.
Requires Python GI (Rsvg) and Pillow only when regenerating assets.
"""
from pathlib import Path
import re
from PIL import Image
import gi

gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text()
styles = (root / 'src/card/card.styles.css').read_text()
for name, width, height in [('chip', 42, 33), ('contactless', 17, 25)]:
    svg = re.search(r'<svg\s+class="' + name + r'"[\s\S]*?</svg\s*>', html).group()
    rules = re.search(r'\.' + name + r'\s*\{([^}]+)\}', styles).group(1)
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" style="' + rules.replace('\n', '') + '"', 1)
    svg = re.sub(r'(?<![-\w])(width|height):[^;]+;', '', svg)
    svg = svg.replace('<svg ', f'<svg width="{width * 3}" height="{height * 3}" ', 1)
    handle = Rsvg.Handle.new_from_data(svg.encode())
    pixels = handle.get_pixbuf()
    image = Image.frombytes('RGBA', (pixels.get_width(), pixels.get_height()), pixels.get_pixels(), 'raw', 'RGBA', pixels.get_rowstride())
    image.save(root / 'public/email' / f'{name}.png')
