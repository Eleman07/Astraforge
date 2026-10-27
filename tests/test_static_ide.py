from html.parser import HTMLParser
from pathlib import Path
import json
import unittest

ROOT=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=set();self.scripts=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.add(d['id'])
        if tag=='script':self.scripts.append(d)

class StaticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/'index.html').read_text()
        cls.app=(ROOT/'app.js').read_text()
        cls.sw=(ROOT/'sw.js').read_text()
        cls.worker=(ROOT/'worker.js').read_text()
    def test_ui_demo_button_and_callback(self):
        parser=Parser();parser.feed(self.html)
        self.assertTrue({'btnAstraDemo','btnRun','btnInstall','editor','role'}.issubset(parser.ids))
        self.assertIn("$('btnAstraDemo').onclick",self.app)
        self.assertIn("from astra.client import AstraClient",self.app)
    def test_assets_in_service_worker(self):
        for asset in ['astra-bridge/engine-manifest.json','astra-bridge/browser_client_bridge.py','worker.js','catalog.js','wheels/astra_simulator_client-1.3.0-py3-none-any.whl']:
            self.assertTrue((ROOT/asset).is_file(),asset)
            self.assertIn(asset,self.sw)
    def test_manifest_and_sample(self):
        man=json.loads((ROOT/'astra-bridge/engine-manifest.json').read_text())
        self.assertEqual(man['upstream'],'Eleman07/ASTRA-Aerospace-Simulator')
        self.assertEqual(len(man['files']),22)
        self.assertIn('browser_bridge.py',man['files'])
        sample=(ROOT/'examples/astra_browser_demo.py').read_text()
        self.assertIn('sim = AstraClient()',sample)
        self.assertIn('sim.step(',sample)
    def test_csp_fetch_and_worker_module(self):
        self.assertIn('https://raw.githubusercontent.com',self.html)
        self.assertIn('https://cdn.jsdelivr.net',self.html)
        self.assertIn("new Worker('./worker.js',{type:'module'",self.app)
        self.assertIn('astraforge-ghpages-v11-observatory-azure',self.sw)
if __name__=='__main__':unittest.main()
