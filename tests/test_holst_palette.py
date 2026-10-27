"""Regression tests for AstraForge's new user-selected Holst palette."""
from pathlib import Path
import json,re
import unittest

ROOT = Path(__file__).resolve().parents[1]
COLORS = ('#0D1B2A', '#1B263B', '#415A77', '#778D7A', '#D4C4A8', '#F4F1DE')


def ratio(fore, back):
    def lum(rgb):
        channels = [int(rgb[i:i+2],16)/255 for i in (1,3,5)]
        linear = [x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in channels]
        return sum(a*b for a,b in zip(linear,(0.2126,0.7152,0.0722)))
    a,b=sorted((lum(fore),lum(back)),reverse=True)
    return (a+.05)/(b+.05)

class HolstPaletteTest(unittest.TestCase):
    def test_exact_colors(self):
        css=(ROOT/'holst-theme.css').read_text()
        self.assertTrue(all(c in css for c in COLORS))
        self.assertEqual(len(re.findall(r'--holst-(?:deep|navy|slate|sage|sand|ivory):',css)),6)

    def test_stylesheet_order_and_metadata(self):
        html=(ROOT/'index.html').read_text()
        self.assertLess(html.index('./style.css'),html.index('./holst-theme.css'))
        self.assertNotIn('nebula-theme.css',html)
        self.assertIn('content="#0D1B2A"',html)

    def test_service_worker_and_pwa(self):
        sw=(ROOT/'sw.js').read_text()
        self.assertIn('astraforge-ghpages-v10-holst-palette',sw)
        self.assertIn("'./holst-theme.css'",sw)
        m=json.loads((ROOT/'manifest.webmanifest').read_text())
        self.assertEqual(m['background_color'],'#0D1B2A')
        self.assertEqual(m['theme_color'],'#0D1B2A')
        self.assertTrue((ROOT/'icons/icon-192.png').exists())
        self.assertTrue((ROOT/'icons/icon-512.png').exists())
        logo=(ROOT/'icons/logo.svg').read_text()
        self.assertTrue(all(c in logo for c in ('#0D1B2A','#D4C4A8','#415A77','#778D7A')))

    def test_threejs_defaults(self):
        js=(ROOT/'webviz.js').read_text()
        self.assertIn("THREE.Color('#0D1B2A')",js)
        self.assertIn('0x415A77,0x1B263B',js)
        self.assertIn("'#D4C4A8'",js)

    def test_wcag_text_contrast(self):
        for fore,back in (
            ('#F4F1DE','#0D1B2A'),('#D4C4A8','#1B263B'),
            ('#F4F1DE','#415A77'),('#0D1B2A','#D4C4A8'),
            ('#778D7A','#0D1B2A'),('#BDC1B4','#1B2A3D'),
        ):
            with self.subTest(fore=fore,back=back):self.assertGreaterEqual(ratio(fore,back),4.5)

    def test_preserves_application_logic(self):
        for fn in ('app.js','worker.js','astraforge_web.py','astraforge_db.py','catalog.js'):
            self.assertTrue((ROOT/fn).exists())

if __name__ == '__main__':unittest.main()
