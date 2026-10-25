'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const workerSource=fs.readFileSync(path.join(root,'worker.js'),'utf8');
const appSource=fs.readFileSync(path.join(root,'app.js'),'utf8');
const swSource=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.match(workerSource,/pyodide\.mjs/);
assert.doesNotMatch(workerSource,/importScripts\(/);
assert.match(appSource,/new Worker\('\.\/worker\.js',\{type:'module'/);
assert.match(swSource,/astraforge-ghpages-v5-module-worker/);
assert.match(swSource,/astra_simulator_client-1\.3\.0-py3-none-any\.whl/);
assert.ok(fs.existsSync(path.join(root,'wheels','astra_simulator_client-1.3.0-py3-none-any.whl')));
const log=[],globals=new Map(),calls=[],outputs=[];
const fakeRuntime={
 FS:{mkdirTree(path){calls.push(['mkdir',path]);},writeFile(){},chdir(){}},
 globals:{set(k,v){globals.set(k,v);},delete(k){globals.delete(k);}},
 runPython(source){
  if(source.includes('sys.version'))return '3.14.5';
  if(source.includes('astra.__version__'))return '1.3.0';
  if(source.includes('matplotlib.pyplot')&&source.includes('sys.modules'))return false;
  return null;
 },
 async runPythonAsync(source){
  if(source.includes('micropip.install')){
   assert.equal(globals.get('_af_local_wheel'),'https://example.github.io/Astraforge/wheels/astra_simulator_client-1.3.0-py3-none-any.whl');
   calls.push(['wheel-install',globals.get('_af_local_wheel')]);
  }else{calls.push(['execute',source]);}
 },
 async loadPackage(packageId){calls.push(['load',packageId]);},
 async loadPackagesFromImports(source){calls.push(['imports',source]);},
 setStdout(){},setStderr(){}
};
const fakeSelf={location:{href:'https://example.github.io/Astraforge/worker.js'},postMessage(event){outputs.push(event);for(const waiter of listeners){if(event.id===waiter.id&&(event.kind==='done'||event.kind==='error'))waiter.resolve(event);}}};
const listeners=[];
let code=workerSource
 .replace(/^import \{[^}]+\} from '\.\/catalog\.js';/m,"const BROWSER_IDS=new Set(['numpy','astropy','casadi']); const BUNDLED_IDS=new Set(['astra-simulator-client']); const PYODIDE_VERSION='314.0.7';")
 .replace("const {loadPyodide}=await import(CDN+'pyodide.mjs');",'const {loadPyodide}={loadPyodide:testLoadPyodide};');
const context={self:fakeSelf,testLoadPyodide:async()=>fakeRuntime,Promise,Set,Map,Error,String,Object,Array,URL,console};
vm.createContext(context);vm.runInContext(code,context,{filename:'worker-test.js'});
async function request(id,type,body={}){const result=new Promise(resolve=>listeners.push({id,resolve}));fakeSelf.onmessage({data:{id,type,...body}});return await result;}
(async()=>{
 const r1=await request(1,'packages',{packages:['numpy','astropy','astra-simulator-client']});
 assert.equal(r1.kind,'done',JSON.stringify(r1));
 assert.deepEqual([...r1.packages].sort(),['astra-simulator-client','astropy','numpy']);
 assert.equal(calls.filter(item=>item[0]==='wheel-install').length,1);
 const r2=await request(2,'packages',{packages:['numpy','astra-simulator-client']});
 assert.equal(r2.kind,'done');
 assert.equal(calls.filter(item=>item[0]==='wheel-install').length,1,'wheel must not reinstall on same session');
 const r3=await request(3,'packages',{packages:['tkinter']});
 assert.equal(r3.kind,'error');assert.match(r3.error,/Not available in the browser/);
 const r4=await request(4,'exec',{name:'main.py',files:{'main.py':'print(2 + 2)'}});
 assert.equal(r4.kind,'done');assert.deepEqual([...r4.plots],[]);
 assert.ok(calls.some(item=>item[0]==='execute'&&item[1]==='print(2 + 2)'));
 assert.equal(globals.has('_af_local_wheel'),false);
 assert.ok(outputs.some(x=>x.kind==='ready'));
 console.log('PASS 9: module worker, ASTRA, package loading, dedupe, native rejection and Python exec simulation');
})().catch(e=>{console.error(e);process.exitCode=1;});
