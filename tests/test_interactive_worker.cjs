'use strict';
/** IPC regression test of the worker, with a deterministic mocked Pyodide. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const workerSource=fs.readFileSync(path.join(root,'worker.js'),'utf8');
const requests=[],sent=[],pending=new Map(),globals=new Map(),files=new Map();
let callbackCount=0;
const py={
  FS:{mkdirTree(){},writeFile(name,value){files.set(name,value)},readFile(name){return files.get(name)},readdir(folder){return [...files.keys()].filter(x=>x.startsWith(folder+'/')).map(x=>x.split('/').pop())},chdir(){}},
  globals:{set(k,v){globals.set(k,v)},delete(k){globals.delete(k)}},
  runPython(src){
    if(src.includes('sys.version'))return '3.14.0';
    if(src.includes('json.dumps(astraforge_db.perform'))return JSON.stringify({tables:['experiments']});
    if(src.includes('json.dumps(astraforge_web.take_previews())'))return JSON.stringify({ui:{title:'Callback',controls:[{id:'result',type:'label',text:'updated'}]},scene:null,html:null});
    return false;
  },
  async runPythonAsync(src){if(src.includes('astraforge_web.dispatch('))callbackCount++},
  async loadPackage(){},setStdout(){},setStderr(){},async loadPackagesFromImports(){}
};
function response(body){return {ok:true,text:async()=>body,clone(){return response(body)}}}
const self={location:{href:'https://eleman07.github.io/Astraforge/worker.js'},postMessage(msg){sent.push(msg);if((msg.kind==='done'||msg.kind==='error')&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id)}}};
const fetch=async url=>{requests.push(String(url));if(String(url).endsWith('.py'))return response('# python helper');throw Error('Unexpected asset '+url)};
const code=workerSource.replace(/^import \{[^}]+\} from '\.\/catalog\.js';/m,"const BROWSER_IDS=new Set();const BUNDLED_IDS=new Set();const STDLIB_IDS=new Set(['sqlite3']);const PYODIDE_VERSION='314.0.7';")
 .replace("const {loadPyodide}=await import(CDN+'pyodide.mjs');",'const {loadPyodide}={loadPyodide:()=>Promise.resolve(fakePyodide)};');
vm.runInNewContext(code,{self,fetch,fakePyodide:py,URL,Promise,Set,Map,Array,String,Error,Uint8Array,Object,JSON,console},{filename:'worker-ipc.js'});
function ask(id,type,params={}){return new Promise(resolve=>{pending.set(id,resolve);self.onmessage({data:{id,type,...params}})})}
(async()=>{
 const r1=await ask(1,'ui_event',{event:'compute',values:{altitude:'400'},target:'go'});
 assert.equal(r1.kind,'done',r1.error);
 assert.equal(r1.ui.controls[0].text,'updated');
 assert.equal(callbackCount,1);
 const r2=await ask(2,'db',{database:'engineering.db',command:{action:'tables'}});
 assert.equal(r2.kind,'done',r2.error);
 assert.deepEqual(JSON.parse(JSON.stringify(r2.db.tables)),['experiments']);
 const r3=await ask(3,'db_import',{name:'engineering.db',bytes:new Uint8Array([1,2,3])});
 assert.equal(r3.kind,'done',r3.error);
 assert.equal(r3.dbFiles['engineering.db'].length,3);
 assert.ok(requests.some(x=>x.endsWith('/astraforge_web.py')));
 assert.ok(requests.some(x=>x.endsWith('/astraforge_db.py')));
 console.log('PASS: worker UI events, SQLite table explorer and binary database imports');
})().catch(err=>{console.error(err);process.exitCode=1});
