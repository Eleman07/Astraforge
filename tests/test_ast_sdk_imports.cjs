'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let content=fs.readFileSync(path.join(root,'worker.js'),'utf8');
content=content.replace(/^import \{[^}]+\} from '\.\/catalog\.js';/m, "const BROWSER_IDS=new Set();const BUNDLED_IDS=new Set(['astra-simulator-client']);const PYODIDE_VERSION='314.0.7';")
 .replace("const {loadPyodide}=await import(CDN+'pyodide.mjs');", "const {loadPyodide}={loadPyodide:testLoadPyodide};");
const files=[];const responses=[];let installCount=0;
const fake={
 FS:{mkdirTree(){},writeFile(){},chdir(){}}, globals:{set(){},delete(){}},
 runPython(source){if(source.includes('sys.version'))return '3.14';if(source.includes('astra.__version__'))return '1.3.0';if(source.includes('sys.modules'))return false;return null;},
 async runPythonAsync(source){if(source.includes('micropip.install'))installCount++;else files.push(source)},
 async loadPackagesFromImports(){},async loadPackage(){},setStdout(){},setStderr(){}
};
const self={location:{href:'https://eleman07.github.io/Astraforge/worker.js'},postMessage:data=>responses.push(data)};
const context={self,testLoadPyodide:async()=>fake,Promise,Set,Map,Error,String,Object,Array,URL,console};
vm.runInNewContext(content,context,{filename:'worker.js'});
async function send(id,code,autoAstra=false){self.onmessage({data:{id,type:'exec',name:'main.py',files:{'main.py':code},autoAstra}});for(let i=0;i<150;i++){await new Promise(r=>setTimeout(r,2));const reply=responses.find(x=>x.id===id&&(x.kind==='done'||x.kind==='error'));if(reply)return reply;}throw Error('timeout');}
(async()=>{
 let r=await send(1,'from astra import __version__\nprint(__version__)');assert.equal(r.kind,'done',r.error);assert.equal(installCount,1);
 r=await send(2,'import astra as sdk');assert.equal(r.kind,'done',r.error);assert.equal(installCount,1);
 r=await send(3,'print(5)',true);assert.equal(r.kind,'done',r.error);assert.equal(installCount,1);
 r=await send(4,'print(5)',false);assert.equal(r.kind,'done',r.error);assert.equal(installCount,1);
 console.log('PASS: ASTRA from-import, import-as, selected Aerospace, other profiles, dedupe');
})().catch(e=>{console.error(e);process.exitCode=1});
