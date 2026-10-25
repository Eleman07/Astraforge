import contextlib
import http.server
import importlib.util
import os
import pathlib
import socketserver
import sqlite3
import subprocess
import sys
import threading
import unittest
try:
    from playwright.sync_api import sync_playwright, Error as PlaywrightError
except ImportError:
    sync_playwright = None
    PlaywrightError = Exception

ROOT = pathlib.Path(__file__).resolve().parents[1]

class PythonBridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0,str(ROOT))
        import astraforge_web
        cls.web=astraforge_web
    @classmethod
    def tearDownClass(cls):
        sys.path.remove(str(ROOT))
    def test_scene_example(self):
        g={'__name__':'__main__'}
        exec((ROOT/'examples/scene.py').read_text(),g)
        result=self.web.take_previews()
        self.assertEqual(len(result['scene']['objects']),4)
        self.assertEqual(result['scene']['objects'][2]['type'],'path')
    def test_gui_example(self):
        exec((ROOT/'examples/ui.py').read_text(),{})
        result=self.web.take_previews()
        self.assertTrue(any(c['type']=='button' and c.get('on_click')=='orbit' for c in result['ui']['controls']))
    def test_flight_example(self):
        exec((ROOT/'examples/flight.py').read_text(),{})
        result=self.web.take_previews()
        self.assertIn('Flight',result['scene']['title'])
    def test_database_example(self):
        import tempfile
        with tempfile.TemporaryDirectory() as work:
            old=os.getcwd();os.chdir(work)
            try:
                exec((ROOT/'examples/database.py').read_text(),{})
                with sqlite3.connect('engineering.db') as conn:
                    self.assertEqual(conn.execute('SELECT COUNT(*) FROM experiments').fetchone()[0],3)
            finally:os.chdir(old)
    def test_scene_input_validation(self):
        with self.assertRaises(ValueError):self.web.show_scene([{'type':'arbitrary'}])
    def test_jinja_preview(self):
        try: from jinja2 import Template
        except ImportError: self.skipTest('Jinja2 not installed in host Python')
        exec((ROOT/'examples/python_site.py').read_text(),{})
        result=self.web.take_previews()
        self.assertIn('Mission Dashboard',result['html'])

class BrowserUITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
            def log_message(self,*args):pass
        cls.server=socketserver.TCPServer(('127.0.0.1',0),Quiet)
        cls.port=cls.server.server_address[1]
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
    @unittest.skipUnless(sync_playwright is not None, "Optional Playwright is not installed")
    def test_ui_desktop_and_mobile(self):
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            try:
                for width,height,filename in [(1440,900,'qa-desktop.png'),(390,844,'qa-mobile.png')]:
                    context=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
                    page=context.new_page();errors=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    # The execution environment blocks HTTP navigation, so serve the
                    # real static files through Playwright request interception.
                    def serve(route):
                        from urllib.parse import urlsplit, unquote
                        path=unquote(urlsplit(route.request.url).path).lstrip('/') or 'index.html'
                        target=(ROOT/path).resolve()
                        if not target.is_relative_to(ROOT) or not target.is_file():
                            route.fulfill(status=404,body='not found');return
                        mime= 'text/javascript' if target.suffix=='.js' else 'text/css' if target.suffix=='.css' else 'text/html' if target.suffix in ('.html','') else 'application/octet-stream'
                        route.fulfill(status=200,body=target.read_bytes(),content_type=mime)
                    page.route('https://ide.astraforge.test/**',serve)
                    try:
                        page.goto('https://ide.astraforge.test/',wait_until='domcontentloaded',timeout=20000)
                    except PlaywrightError as error:
                        if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(error):
                            self.skipTest('Chromium navigation blocked by execution environment; run on local computer')
                        raise
                    page.locator('#role option').first.wait_for()
                    self.assertGreaterEqual(page.locator('#role option').count(),16)
                    if width<600:page.locator('#btnSide').click()
                    page.locator('#exampleSelect').select_option('database')
                    page.locator('#btnCreateExample').click()
                    page.locator('#editor').wait_for()
                    self.assertIn('sqlite3',page.locator('#editor').input_value())
                    self.assertTrue(page.locator('#databasePanel').is_visible())
                    page.locator('button[data-studio="scene"]').click()
                    self.assertTrue(page.locator('#scenePanel').is_visible())
                    page.locator('button[data-studio="web"]').click()
                    self.assertTrue(page.locator('#webPanel').is_visible())
                    page.screenshot(path=str(ROOT/'docs'/filename),full_page=True)
                    self.assertFalse(errors,errors)
                    context.close()
            finally:browser.close()

if __name__=='__main__':unittest.main()
