"""Integration tests for browser-native UI callbacks, scene animations and SQLite CRUD."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]

def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/(name+'.py'))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

class InteractivityTests(unittest.TestCase):
    def setUp(self):
        self.web=load('astraforge_web')
    def test_ui_event_and_value_update(self):
        web=self.web
        @web.on('compute')
        def compute(values):
            web.set_control('out',text=str(int(values['speed'])*2))
        web.show_ui('test',[{'type':'input','id':'speed','text':'speed','value':'5'},
                            {'type':'label','id':'out','text':'ready'},
                            {'type':'button','id':'run','text':'Run','on_click':'compute'}])
        before=web.take_previews()['ui']
        self.assertEqual(before['controls'][1]['text'],'ready')
        web.dispatch('compute',{'speed':'16'},target='run')
        after=web.take_previews()['ui']
        self.assertEqual(after['controls'][1]['text'],'32')
        self.assertIsNone(web.take_previews()['ui'])
    def test_non_registered_events_cannot_be_executed(self):
        with self.assertRaises(ValueError):self.web.dispatch('unknown',{})
        with self.assertRaises(ValueError):self.web.on('__import__("os")')
    def test_registration_reset(self):
        @self.web.on('action')
        def action(values): pass
        self.web.reset_handlers()
        with self.assertRaises(ValueError):self.web.dispatch('action',{})
    def test_scene_animation_and_callback(self):
        web=self.web
        @web.on('select')
        def select(values): web.set_scene_object('sat',color='#ff0000',position=(1,2,3))
        web.show_scene([web.sphere(id='sat',on_click='select')],frames=[{'sat':[1,0,0]},{'sat':[0,1,0]}],fps=24)
        scene=web.take_previews()['scene']
        self.assertEqual(len(scene['frames']),2)
        self.assertEqual(scene['objects'][0]['id'],'sat')
        web.dispatch('select',{},target='sat')
        changed=web.take_previews()['scene']
        self.assertEqual(changed['objects'][0]['position'],[1.,2.,3.])
        self.assertEqual(changed['objects'][0]['color'],'#ff0000')
    def test_rejects_unknown_animation_object(self):
        with self.assertRaises(ValueError):self.web.show_scene([self.web.sphere(id='earth')],frames=[{'sat':[1,2,3]}])
    def test_rejects_bad_html_and_colors(self):
        with self.assertRaises(ValueError):self.web.sphere(color='<script>')
        with self.assertRaises(ValueError):self.web.show_html('a'*500001)
    def test_ui_and_scene_examples(self):
        import runpy
        self.web.reset_handlers()
        # Example imports need to point to our loaded module.
        import sys
        previous=sys.modules.get('astraforge_web')
        sys.modules['astraforge_web']=self.web
        try:
            runpy.run_path(str(ROOT/'examples/ui.py'))
            self.web.dispatch('orbit',{'altitude':'400'},target='calculate')
            ui=self.web.take_previews()['ui']
            self.assertIn('7.',next(c['text'] for c in ui['controls'] if c['id']=='answer'))
            self.web.reset_handlers()
            runpy.run_path(str(ROOT/'examples/scene.py'))
            scene=self.web.take_previews()['scene']
            self.assertEqual(len(scene['frames']),120)
            self.web.dispatch('satellite_pick',{},target='satellite')
            self.assertEqual(self.web.take_previews()['scene']['objects'][1]['color'],'#ee8f76')
        finally:
            if previous is None:sys.modules.pop('astraforge_web',None)
            else:sys.modules['astraforge_web']=previous

class DBExplorerTests(unittest.TestCase):
    def setUp(self):
        self.ctx=tempfile.TemporaryDirectory()
        self.db=load('astraforge_db')
        self.db.WORKSPACE=self.ctx.name
    def tearDown(self):self.ctx.cleanup()
    def call(self,**command):return self.db.perform('example.db',command)
    def test_create_insert_browse_update_delete(self):
        self.call(action='create',table='experiments',columns=[{'name':'mission','type':'TEXT'},{'name':'score','type':'REAL'}])
        self.assertEqual(self.call(action='tables')['tables'],['experiments'])
        result=self.call(action='insert',table='experiments',values={'mission':'LQR','score':0.99})
        self.assertEqual(result['rows'][0][1:],["LQR",0.99])
        key=result['rows'][0][0]
        result=self.call(action='update',table='experiments',rowid=key,values={'score':0.75})
        self.assertEqual(result['rows'][0][2],0.75)
        result=self.call(action='delete',table='experiments',rowid=key)
        self.assertEqual(len(result['rows']),0)
        self.assertTrue((Path(self.ctx.name)/'example.db').exists())
    def test_sql_injection_table_and_column_names_rejected(self):
        with self.assertRaises(ValueError):self.call(action='create',table='x;DROP TABLE y',columns=[{'name':'name','type':'TEXT'}])
        self.call(action='create',table='test',columns=[{'name':'good','type':'TEXT'}])
        with self.assertRaises(ValueError):self.call(action='insert',table='test',values={'good);DROP TABLE test;--':'bad'})
        self.assertEqual(self.call(action='tables')['tables'],['test'])
    def test_parameters_keep_quotes_as_data(self):
        self.call(action='create',table='test',columns=[{'name':'notes','type':'TEXT'}])
        text="test'); DROP TABLE test; --"
        result=self.call(action='insert',table='test',values={'notes':text})
        self.assertEqual(result['rows'][0][1],text)
    def test_empty_workspace_db_exists(self):
        self.assertEqual(self.call(action='tables')['tables'],[])
    def test_invalid_name(self):
        with self.assertRaises(ValueError):self.db.perform('../../tmp/evil.db',{'action':'tables'})
    def test_unknown_table_and_action(self):
        with self.assertRaises(ValueError):self.call(action='browse',table='missing')
        self.call(action='create',table='ok',columns=[{'name':'name','type':'TEXT'}])
        with self.assertRaises(ValueError):self.call(action='TRUNCATE',table='ok')

if __name__=='__main__':unittest.main()
