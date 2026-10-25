'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'worker.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'astra-bridge/engine-manifest.json'),'utf8'));
const bridge=fs.readFileSync(path.join(root,'astra-bridge/browser_client_bridge.py'),'utf8');
assert.equal(manifest.files.length,22);
assert.match(manifest.revision,/^[a-f0-9]{40}$/);
assert.match(source,/ensureAstraEngine\(id\)/);
assert.match(source,/browser_client_bridge\.activate\(\)/);
assert.doesNotMatch(source,/importScripts\(/);
const output=[],events=[],slots=[];const globals=new Map();
let upstreamLoads=0,pythonEngineImports=0,wheelInstalls=0;
const virtual={
 FS:{mkdirTree(p){events.push(['mkdir',p])},writeFile(p,s){events.push(['write',p]);},chdir(){},readdir(){return []}},
 globals:{set(k,v){globals.set(k,v)},delete(k){globals.delete(k)}},
 runPython(s){
  if(s.includes('json.dumps(astraforge_web.take_previews())'))return '{\"scene\":null,\"ui\":null,\"html\":null}';
  if(s.includes('sys.version'))return '3.14.1';
  if(s.includes('astra.__version__'))return '1.3.0';
  if(s.includes('list(astra.__path__)'))return '/lib/python3.14/site-packages/astra';
  if(s.includes('AstraClient().status().get'))return 'ASTRA';
  if(s.includes("'matplotlib.pyplot' in sys.modules"))return false;
  return null;
 },
 async runPythonAsync(s){
  if(s.includes('micropip.install('))wheelInstalls++;
  else if(s.includes('browser_client_bridge.activate()'))pythonEngineImports++;
  else events.push(['execute',s]);
 },
 async loadPackage(s){events.push(['pkg',s])},
 async loadPackagesFromImports(s){events.push(['imports',s])},
 setStdout(){},setStderr(){}
};
function response(body){return {ok:true,text:async()=>body,json:async()=>JSON.parse(body),clone(){return response(body)}}}
const fakeFetch=async url=>{
 const u=url.toString();
 if(u.endsWith('/astraforge_web.py')||u.endsWith('/astraforge_db.py'))return response('# test Python browser bridge');
 if(u.endsWith('/engine-manifest.json'))return response(JSON.stringify(manifest));
 if(u.endsWith('/browser_client_bridge.py'))return response(bridge);
 if(manifest.files.some(p=>u.endsWith('/'+p))){upstreamLoads++;return response('# downloaded pinned ASTRA simulator source\n')}
 throw Error('Unexpected fetch '+u);
};
const fakeCache={async match(){return null},async put(){}};
const fakeCaches={async open(){return fakeCache}};
const self={location:{href:'https://eleman07.github.io/Astraforge/worker.js'},postMessage(x){output.push(x);const slot=slots.find(w=>w.id===x.id&&(x.kind==='done'||x.kind==='error'));if(slot)slot.resolve(x)}};
let code=source.replace(/^import \{[^}]+\} from '\.\/catalog\.js';/m,"const BROWSER_IDS=new Set(['numpy']);const BUNDLED_IDS=new Set(['astra-simulator-client']);const STDLIB_IDS=new Set(['sqlite3']);const PYODIDE_VERSION='314.0.7';").replace("const {loadPyodide}=await import(CDN+'pyodide.mjs');", "const {loadPyodide}={loadPyodide:testLoadPyodide};");
const context={self,fetch:fakeFetch,caches:fakeCaches,testLoadPyodide:async()=>virtual,Promise,Set,Map,Error,String,Object,Array,URL,console};
vm.createContext(context);
vm.runInContext(code,context,{filename:'worker-mock.js'});
function request(id,src,autoAstra=false){const p=new Promise(resolve=>slots.push({id,resolve}));self.onmessage({data:{id,type:'exec',name:'main.py',files:{'main.py':src},autoAstra}});return p}
(async()=>{
 let r=await request(1,'import astra\nprint(astra.__version__)');assert.equal(r.kind,'done',r.error);
 assert.equal(wheelInstalls,1);assert.equal(upstreamLoads,0,'Version check must not fetch physics engine');
 r=await request(2,'from astra.client import AstraClient\nsim=AstraClient()\nprint(sim.status())');assert.equal(r.kind,'done',r.error);
 assert.equal(pythonEngineImports,1);
 assert.equal(upstreamLoads,manifest.files.length);
 assert.ok(events.some(e=>e[0]==='write'&&e[1].endsWith('/astra/engine.py')));
 assert.ok(events.some(e=>e[0]==='write'&&e[1]==='/home/pyodide/browser_bridge.py'));
 const prepare=events.findIndex(e=>e[0]==='write'&&e[1]==='/home/pyodide/browser_bridge.py');
 const execute=events.findIndex(e=>e[0]==='execute'&&e[1].includes('sim.status'));
 assert.ok(prepare>=0&&execute>prepare,'Physics engine must load before user code');
 r=await request(3,'from astra.client import AstraClient\nsim=AstraClient()\nprint(sim.step(.1))');assert.equal(r.kind,'done',r.error);
 assert.equal(pythonEngineImports,1,'Installed engine must be reused');
 assert.equal(wheelInstalls,1,'Wheel must not reinstall');
 assert.equal(upstreamLoads,manifest.files.length,'Source should not re-download');
 r=await request(4,'print(2 + 2)');assert.equal(r.kind,'done',r.error);
 console.log('PASS: ASTRA wheel + local physics adapter, source manifest, order, reuse and generic Python');
})().catch(e=>{console.error(e);process.exitCode=1})
