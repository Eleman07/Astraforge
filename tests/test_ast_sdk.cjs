'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const workerCode = fs.readFileSync(path.join(__dirname, '..', 'worker.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const swCode = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

assert.match(appCode, /aerospace:\{[^\n]*'astra-simulator-client'/);
assert.match(appCode, /ALLOWED=\[[^\n]*'astra-simulator-client'/);
assert.match(appCode, /ASTRA Simulator Client · 1\.3\.0/);
assert.match(swCode, /astra_simulator_client-1\.3\.0-py3-none-any\.whl/);
assert.ok(fs.existsSync(path.join(__dirname, '..', 'wheels', 'astra_simulator_client-1.3.0-py3-none-any.whl')));

const outputs=[];
const installedCalls=[];
const globals=new Map();
const fakePyodide={
 FS:{mkdirTree(){}},
 globals:{set(k,v){globals.set(k,v);},delete(k){globals.delete(k);}},
 async loadPackage(value){installedCalls.push(['loadPackage',value]);},
 async runPythonAsync(src){
  if(src.includes('micropip.install')){
   const url=globals.get('_astraforge_wheel_url');
   assert.equal(url,'https://example.github.io/astraforge-ide/wheels/astra_simulator_client-1.3.0-py3-none-any.whl');
   installedCalls.push(['micropip.install',url]);
  }
 },
 runPython(code){
  if(code.includes('sys.version'))return '3.14.0';
  if(code.includes('astra.__version__'))return '1.3.0';
  throw Error('Unexpected Python '+code);
 }
};
let done;
let resolveDone;
const context={
 URL, Promise, Set, Object, Error, String,
 self:{
  location:{href:'https://example.github.io/astraforge-ide/worker.js'},
  postMessage(msg){outputs.push(msg);if(msg.kind==='done'||msg.kind==='error')resolveDone(msg);},
  async loadPyodide(){return fakePyodide;}
 },
 importScripts(){}
};
vm.createContext(context);vm.runInContext(workerCode,context);
function runMessage(message){
 done=new Promise(resolve=>{resolveDone=resolve;});
 context.self.onmessage({data:message});
 return done;
}
(async()=>{
 let result=await runMessage({id:1,type:'packages',packages:['numpy','astra-simulator-client']});
 assert.equal(result.kind,'done',JSON.stringify(result));
 assert.deepEqual([...result.packages].sort(),['astra-simulator-client','numpy']);
 assert.equal(installedCalls.filter(x=>x[0]==='micropip.install').length,1);
 assert.deepEqual(installedCalls[0],['loadPackage',['numpy']]);
 assert.deepEqual(installedCalls[1],['loadPackage','micropip']);
 result=await runMessage({id:2,type:'packages',packages:['astra-simulator-client']});
 assert.equal(result.kind,'done');
 assert.equal(installedCalls.filter(x=>x[0]==='micropip.install').length,1,'Should not reinstall in same worker');
 assert.equal(globals.size,0,'No temporary globals left');
 console.log('PASS: Aerospace selection, wheel path, worker install, and idempotent load');
})().catch(e=>{console.error(e);process.exitCode=1;});
