"""Integration tests for browser adapter using original ASTRA SDK wheel + fake engine.
Run: python3 -m unittest discover -s tests -p 'test_browser_bridge.py' -v
"""
import importlib
import json
from pathlib import Path
import sys
import types
import unittest

ROOT = Path(__file__).resolve().parents[1]
WHEEL = ROOT/'wheels'/'astra_simulator_client-1.3.0-py3-none-any.whl'
sys.path.insert(0,str(WHEEL))
sys.path.insert(0,str(ROOT/'astra-bridge'))

calls=[]
engine=types.ModuleType('browser_bridge')
def fake_route(raw):
    request=json.loads(raw)
    calls.append(request)
    if request['path']=='/status':
        return json.dumps({'ok':True,'data':{'name':'ASTRA','execution_mode':'browser-pyodide'}})
    if request['path']=='/models':
        return json.dumps({'ok':True,'data':{'space':{},'aircraft':{},'drone':{}}})
    if request['path']=='/state':
        return json.dumps({'ok':True,'data':{'time_s':2.0}})
    if request['path']=='/reset':
        return json.dumps({'ok':True,'data':{'vehicle':request['payload']['vehicle']}})
    if request['path']=='/step':
        return json.dumps({'ok':True,'data':{'time_s':request['payload']['dt_s']}})
    if request['path']=='/engineering':
        return json.dumps({'ok':True,'data':{'solvers':['orbital']}})
    return json.dumps({'ok':False,'error':'intentional simulator failure'})
engine.route_raw=fake_route
sys.modules['browser_bridge']=engine

from astra.client import AstraClient
adapter=importlib.import_module('browser_client_bridge')

class BridgeTests(unittest.TestCase):
    def setUp(self):
        calls.clear()
        adapter.activate()
    def test_client_status(self):
        sim=AstraClient()
        self.assertEqual(sim.base_url,'browser://astra')
        self.assertEqual(sim.status()['name'],'ASTRA')
        self.assertEqual(calls[0]['method'],'GET')
        self.assertEqual(calls[0]['path'],'/status')
    def test_models_and_state(self):
        sim=AstraClient()
        self.assertEqual(list(sim.models()),['space','aircraft','drone'])
        self.assertEqual(sim.state()['time_s'],2.0)
    def test_reset_and_step(self):
        sim=AstraClient()
        self.assertEqual(sim.reset(vehicle='drone')['vehicle'],'drone')
        self.assertEqual(calls[0]['method'],'POST')
        self.assertAlmostEqual(sim.step(.02)['time_s'],.02)
        self.assertEqual(calls[1]['path'],'/step')
    def test_engineering_and_errors(self):
        sim=AstraClient()
        self.assertIn('orbital',sim.engineering_models()['solvers'])
        self.assertIsInstance(sim.engineering("beam", length_m=2),dict)
        with self.assertRaisesRegex(RuntimeError,'intentional simulator failure'):
            sim.launch()
    def test_external_urls_rejected(self):
        for base in ('http://192.168.1.10:8765','https://eleman07.github.io/Astraforge/','https://example.com'):
            with self.subTest(base=base),self.assertRaisesRegex(ValueError,'browser'):
                AstraClient(base_url=base)
    def test_local_compatibility_and_idempotence(self):
        self.assertEqual(AstraClient(base_url='http://127.0.0.1:8765').status()['name'],'ASTRA')
        self.assertIs(adapter.activate(),AstraClient)
        self.assertTrue(AstraClient._astraforge_browser_bridge)
    def test_safety_path(self):
        with self.assertRaisesRegex(ValueError,'/api/v1/'):
            AstraClient()._request('/anything')
    def test_no_socket_access_from_bridge(self):
        source=(ROOT/'astra-bridge'/'browser_client_bridge.py').read_text()
        self.assertNotIn('urlopen(',source)
        self.assertNotIn('requests.',source)

if __name__=='__main__': unittest.main()
