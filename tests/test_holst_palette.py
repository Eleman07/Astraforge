"""AstraForge palette regression: this historical filename is retained so updates overwrite old tests.
The active theme is Observatory Azure as of v5.4; Holst is no longer active.
"""
from pathlib import Path
import json
import re
import unittest

ROOT=Path(__file__).resolve().parents[1]

def contrast(a,b):
    def luminance(c):
        rgb=[int(c[x:x+2],16)/255 for x in (1,3,5)]
        channels=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in rgb]
        return sum(v*x for v,x in zip(channels,(.2126,.7152,.0722)))
    high,low=sorted((luminance(a),luminance(b)),reverse=True)
    return (high+.05)/(low+.05)

class ObservatoryAzureTests(unittest.TestCase):
    def test_theme_and_metadata(self):
        html=(ROOT/'index.html').read_text()
        self.assertLess(html.index('./style.css'),html.index('observatory-theme.css'))
        self.assertNotIn('href="./holst-theme.css"',html)
        self.assertIn('content="#081522"',html)
        css=(ROOT/'observatory-theme.css').read_text()
        for color in ('#06111e','#081522','#54aeff','#55b5ff','#d8b48a'):
            self.assertIn(color,css.lower() if color!='#081522' else html.lower())
    def test_service_worker_pwa(self):
        sw=(ROOT/'sw.js').read_text()
        self.assertIn('astraforge-ghpages-v12-openrouter-vault',sw)
        self.assertIn("'./observatory-theme.css'",sw)
        manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
        self.assertEqual(manifest['background_color'],'#081522')
        self.assertEqual(manifest['theme_color'],'#081522')
        for asset in ('icons/logo.svg','icons/icon-192.png','icons/icon-512.png'):
            self.assertTrue((ROOT/asset).exists(),asset)
        self.assertIn('#D8B48A',(ROOT/'icons/logo.svg').read_text())
    def test_layout_has_real_panels_and_single_ids(self):
        from html.parser import HTMLParser
        class IDs(HTMLParser):
            def __init__(self):super().__init__();self.all=[]
            def handle_starttag(self,tag,attrs):
                d=dict(attrs)
                if 'id' in d:self.all.append(d['id'])
        html=(ROOT/'index.html').read_text();p=IDs();p.feed(html)
        self.assertEqual(len(p.all),len(set(p.all)))
        for key in ('btnRun','editor','output','scenePanel','webPanel','databasePanel','rightbar','syntaxLayer','quickOpenDialog','btnSampleOrbit'):
            self.assertIn(key,p.all)
    def test_webviz_color_defaults(self):
        s=(ROOT/'webviz.js').read_text()
        self.assertIn("THREE.Color('#061320')",s)
        self.assertIn('0x31597b,0x16344f',s)
    def test_text_contrast(self):
        for fore,back in (('#e5effa','#06111e'),('#a3bacd','#0b1b2a'),('#061729','#55b5ff'),('#95b4cd','#081724')):
            with self.subTest(fore=fore,back=back):self.assertGreaterEqual(contrast(fore,back),4.5)
    def test_core_engine_unchanged(self):
        for fn in ('worker.js','catalog.js','astraforge_web.py','astraforge_db.py'):
            self.assertTrue((ROOT/fn).is_file())

if __name__=='__main__':unittest.main()
