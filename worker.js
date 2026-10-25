/** AstraForge Python Web Worker (Pyodide 314 = module worker; no importScripts). */
import {BROWSER_IDS,BUNDLED_IDS,STDLIB_IDS,PYODIDE_VERSION} from './catalog.js';
const CDN=`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const LOCAL_WHEELS={'astra-simulator-client':'./wheels/astra_simulator_client-1.3.0-py3-none-any.whl'};
let runtime=null,bootPromise=null,astraEnginePromise=null,astraEngineReady=false,restoredDbs=false;
const ASTRA_MANIFEST_URL=new URL('./astra-bridge/engine-manifest.json',self.location.href);
const ASTRA_BRIDGE_URL=new URL('./astra-bridge/browser_client_bridge.py',self.location.href);
const installed=new Set();
let queue=Promise.resolve();
const reply=(id,kind,extra={})=>self.postMessage({id,kind,...extra});
async function boot(id){
 if(runtime)return runtime;
 if(!bootPromise)bootPromise=(async()=>{
  reply(id,'progress',{text:'Starting Python 3.14 WebAssembly engine…'});
  // Dynamic module import turns CDN errors into actionable messages instead of an opaque Worker exception.
  const {loadPyodide}=await import(CDN+'pyodide.mjs');
  const instance=await loadPyodide({indexURL:CDN});
  instance.FS.mkdirTree('/home/pyodide/workspace');
  for (const helperName of ['astraforge_web.py','astraforge_db.py']){
   const helper=await fetch(new URL('./'+helperName,self.location.href));
   if(!helper.ok)throw Error('Missing Python browser module: '+helperName);
   instance.FS.writeFile('/home/pyodide/'+helperName,await helper.text(),{encoding:'utf8'});
  }
  instance.runPython("import sys; sys.path.insert(0,'/home/pyodide')");
  instance.runPython("import os; os.environ['MPLBACKEND']='Agg'");
  runtime=instance;
  return instance;
 })().catch(err=>{bootPromise=null;throw new Error('Unable to load Pyodide 314.0.7. Check internet access and browser restrictions on cdn.jsdelivr.net. '+String(err));});
 const p=await bootPromise;
 reply(id,'ready',{version:p.runPython('import sys; sys.version.split()[0]')});
 return p;
}
const safeFilename=name=>typeof name==='string' && /^[\w .-]{1,100}\.(py|txt|md|json|html|css|js)$/i.test(name) && !name.startsWith('.');
// Detect normal ASTRA imports even outside the Aerospace profile. The bundled
// client is tiny, so install it lazily only when the code actually needs it.
const importsAstra=source => /^\s*(?:import\s+astra(?:[\s,.]|$)|from\s+astra(?:[\s.]|$))/m.test(source)
 || /\b__import__\(\s*['"]astra['"]\s*\)/.test(source);
async function loadPackages(id,names){
 const unique=[...new Set(names)].slice(0,85);
 const unsupported=unique.filter(x=>!BROWSER_IDS.has(x)&&!BUNDLED_IDS.has(x)&&!STDLIB_IDS.has(x));
 if(unsupported.length)throw Error('Not available in the browser: '+unsupported.join(', '));
 const fresh=unique.filter(x=>!installed.has(x));
 for(const name of fresh){
  if(STDLIB_IDS.has(name)){
   reply(id,'progress',{text:'Ready: built-in '+name});
  } else if(BROWSER_IDS.has(name)){
   reply(id,'progress',{text:'Loading '+name+'…'});
   await runtime.loadPackage(name);
  } else {
   reply(id,'progress',{text:'Installing ASTRA Simulator Client 1.3.0…'});
   await runtime.loadPackage('micropip');
   const url=new URL(LOCAL_WHEELS[name],self.location.href).href;
   runtime.globals.set('_af_local_wheel',url);
   try{
    await runtime.runPythonAsync('import micropip\nawait micropip.install(_af_local_wheel, deps=False)');
    const v=runtime.runPython('import astra; astra.__version__');
    if(v!=='1.3.0')throw Error('Unexpected ASTRA version: '+v);
   }catch(error){
    throw Error('ASTRA SDK wheel installation failed. Verify that the file is accessible: '+url+' — '+String(error?.message||error));
   }finally{runtime.globals.delete('_af_local_wheel');}
  }
  installed.add(name);
  reply(id,'progress',{text:'Ready: '+name});
 }
 return [...installed];
}
// ASTRA's Python simulation engine is imported into the SAME Pyodide runtime
// as the public AstraClient wheel. API calls then dispatch in-process instead
// of attempting urllib socket connections (unsupported in a browser worker).
const usesAstraEngine=source => /\bAstraClient\b|\bfrom\s+astra\s+import\s+(?:client|engine|engineering|gnc)|\bfrom\s+astra\.(?:engine|browser|client|engineering|gnc|celestial|attitude)\b|\bimport\s+astra\.(?:engine|browser|client|engineering|gnc|celestial|attitude)\b/.test(source);
async function fetchSource(url,cache){
 // Only public, immutable ASTRA files from its pinned Git commit are accepted.
 if(cache){const saved=await cache.match(url);if(saved?.ok)return saved.text();}
 const response=await fetch(url,{mode:'cors',cache:'default'});
 if(!response.ok)throw Error('HTTP '+response.status+' for '+url);
 const copy=cache?response.clone():null;
 const content=await response.text();
 if(content.length>1_000_000)throw Error('ASTRA source file unexpectedly large: '+url);
 if(cache)await cache.put(url,copy).catch(()=>{}); // cache is optional
 return content;
}
async function ensureAstraEngine(id){
 if(astraEngineReady)return;
 if(astraEnginePromise)return astraEnginePromise;
 astraEnginePromise=(async()=>{
  await loadPackages(id,['astra-simulator-client']);
  reply(id,'progress',{text:'Preparing local ASTRA physics engine (no server required)…'});
  const manifestResponse=await fetch(ASTRA_MANIFEST_URL,{cache:'no-store'});
  if(!manifestResponse.ok)throw Error('ASTRA source manifest is missing from the IDE: '+manifestResponse.status);
  const manifest=await manifestResponse.json();
  if(manifest.upstream!=='Eleman07/ASTRA-Aerospace-Simulator'||!/^[a-f0-9]{40}$/.test(manifest.revision)||!Array.isArray(manifest.files)||manifest.files.length>40)
   throw Error('Invalid pinned ASTRA engine manifest');
  const paths=manifest.files;
  if(!paths.includes('browser_bridge.py')||!paths.includes('astra/engine.py')||paths.some(p=>!/^astra\/[a-z0-9_]+\.py$/.test(p)&&p!=='browser_bridge.py'))
   throw Error('Unexpected ASTRA source path in manifest');
  // GitHub raw and the jsDelivr GitHub mirror support cross-origin fetches.
  const upstream=`https://raw.githubusercontent.com/${manifest.upstream}/${manifest.revision}/`;
  const mirror=`https://cdn.jsdelivr.net/gh/${manifest.upstream}@${manifest.revision}/`;
  const cache=typeof caches!=='undefined'?await caches.open('astraforge-astra-core-'+manifest.revision).catch(()=>null):null;
  const sources=await Promise.all(paths.map(async (p,index)=>{
   let code;
   try{code=await fetchSource(upstream+p,cache);}catch(primary){
    try{code=await fetchSource(mirror+p,cache);}catch(secondary){
     throw Error('Cannot load ASTRA source '+p+'. GitHub: '+String(primary.message||primary)+'; mirror: '+String(secondary.message||secondary));
    }
   }
   reply(id,'progress',{text:`ASTRA source ${index+1}/${paths.length}: ${p}`});
   return [p,code];
  }));
  const adapterResponse=await fetch(ASTRA_BRIDGE_URL);
  if(!adapterResponse.ok)throw Error('ASTRA browser adapter missing (HTTP '+adapterResponse.status+')');
  const adapter=await adapterResponse.text();
  const packageDir=runtime.runPython('import astra; list(astra.__path__)[0]');
  // Retain ASTRA client.py from the installed wheel; add only the simulation modules.
  for(const [path,source] of sources){
   if(path==='astra/__init__.py')continue;
   const dest=path==='browser_bridge.py'?'/home/pyodide/browser_bridge.py':packageDir+'/'+path.slice('astra/'.length);
   runtime.FS.writeFile(dest,source,{encoding:'utf8'});
  }
  runtime.FS.writeFile('/home/pyodide/browser_client_bridge.py',adapter,{encoding:'utf8'});
  runtime.runPython("import sys; sys.path.insert(0,'/home/pyodide') if '/home/pyodide' not in sys.path else None");
  await runtime.runPythonAsync('import browser_client_bridge\nbrowser_client_bridge.activate()');
  const check=runtime.runPython('from astra.client import AstraClient; AstraClient().status().get("name")');
  if(check!=='ASTRA')throw Error('ASTRA Browser Engine self-check returned '+check);
  astraEngineReady=true;
  reply(id,'progress',{text:'ASTRA Browser Engine ready: Python simulation running on your device (no HTTP server).'});
 })().catch(e=>{astraEnginePromise=null;throw Error('ASTRA browser engine could not start. '+String(e?.message||e))});
 return astraEnginePromise;
}


// Database files stay inside the same-origin browser workspace. They are NOT
// backed up to GitHub. Files >4 MiB are intentionally not persisted.
const dbFilename = n => /^[A-Za-z0-9_-]{1,64}\.(db|sqlite|sqlite3)$/.test(n);
function restoreDbs(data){
 if(restoredDbs)return;
 for(const [name,bytes] of Object.entries(data||{})){
  if(!dbFilename(name))continue;
  const binary=bytes instanceof Uint8Array?bytes:(Array.isArray(bytes)?new Uint8Array(bytes):null);
  if(!binary||binary.length>4*1024*1024)continue;
  runtime.FS.writeFile('/home/pyodide/workspace/'+name,binary);
 }
 restoredDbs=true;
}
function snapshotDbs(){
 const dir='/home/pyodide/workspace';const output={};
 for(const name of runtime.FS.readdir(dir)){
  if(!dbFilename(name))continue;
  const bytes=runtime.FS.readFile(dir+'/'+name);
  if(bytes.length<=4*1024*1024)output[name]=bytes; // structured clone avoids JSON-sized copies
 }
 return output;
}
async function sqlQuery(data){
 restoreDbs(data.dbFiles);
 const name=dbFilename(data.database)?data.database:'engineering.db';
 const query=String(data.query||'').trim();
 if(query.length>20000)throw Error('SQL statement is too long');
 runtime.globals.set('_af_query',query);runtime.globals.set('_af_database',name);
 try {return JSON.parse(runtime.runPython(`import sqlite3,json,os
_conn=sqlite3.connect('/home/pyodide/workspace/'+_af_database)
try:
    _cursor=_conn.execute(_af_query)
    _columns=[d[0] for d in _cursor.description] if _cursor.description else []
    _records=[list(row) for row in _cursor.fetchmany(200)] if _columns else []
    _conn.commit()
    _result=json.dumps({'columns':_columns,'rows':_records,'changes':_cursor.rowcount},default=str)
finally:
    _conn.close()
_result`));}
 finally{runtime.globals.delete('_af_query');runtime.globals.delete('_af_database')}
}

async function execute(id,data){
 const {files={},name}=data;
 if(!safeFilename(name)||!name.endsWith('.py')||typeof files[name]!=='string')throw Error('Only .py files can run in Pyodide. Use Web UI for HTML.');
 restoreDbs(data.dbFiles);
 for(const [filename,content] of Object.entries(files)){
  if(safeFilename(filename)&&typeof content==='string'&&content.length<=1048576)
   runtime.FS.writeFile('/home/pyodide/workspace/'+filename,content,{encoding:'utf8'});
 }
 runtime.FS.chdir('/home/pyodide/workspace');
 runtime.setStdout({batched:text=>reply(id,'output',{stream:'stdout',text})});
 runtime.setStderr({batched:text=>reply(id,'output',{stream:'stderr',text})});
 const code=files[name];
 runtime.runPython('import astraforge_web; astraforge_web.reset_handlers()');
 // loadPackagesFromImports only recognizes Pyodide-distributed modules, not
 // our site-hosted ASTRA wheel. Do this before executing the user's imports.
 if(data.autoAstra===true || importsAstra(code)){
  await loadPackages(id,['astra-simulator-client']);
 }
 if(usesAstraEngine(code))await ensureAstraEngine(id);
 await runtime.loadPackagesFromImports(code);
 // Ensure __file__/__name__ identify the running file. These are simple per-run globals.
 runtime.globals.set('__file__',name);runtime.globals.set('__name__','__main__');
 await runtime.runPythonAsync(code);
 let plots=[];
 if(runtime.runPython("import sys; 'matplotlib.pyplot' in sys.modules")){
  plots=JSON.parse(runtime.runPython(`import matplotlib.pyplot as _plt, io as _io, base64 as _b64, json as _json
_af_plots=[]
for _af_num in _plt.get_fignums()[:4]:
    _af_buffer=_io.BytesIO()
    _plt.figure(_af_num).savefig(_af_buffer,format='png',dpi=110)
    _af_plots.append(_b64.b64encode(_af_buffer.getvalue()).decode('ascii'))
_plt.close('all')
_json.dumps(_af_plots)`));
 }
 const previews=JSON.parse(runtime.runPython('import json, astraforge_web; json.dumps(astraforge_web.take_previews())'));
 return {plots,...previews,dbFiles:snapshotDbs()};
}
async function dispatchUI(id,data){
 const action=String(data.event||'');
 if(!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(action))throw Error('Invalid UI action');
 runtime.globals.set('_af_ui_event',action);
 runtime.globals.set('_af_ui_values',JSON.stringify(data.values||{}));
 runtime.globals.set('_af_ui_target',String(data.target||'').slice(0,64));
 try {
  await runtime.runPythonAsync(`import json, astraforge_web
astraforge_web.dispatch(_af_ui_event, json.loads(_af_ui_values), target=_af_ui_target)`);
  return JSON.parse(runtime.runPython('import json, astraforge_web; json.dumps(astraforge_web.take_previews())'));
 } finally {
  for(const key of ['_af_ui_event','_af_ui_values','_af_ui_target'])runtime.globals.delete(key);
 }
}
async function browseDB(id,data){
 restoreDbs(data.dbFiles);
 const filename=dbFilename(data.database)?data.database:'engineering.db';
 runtime.globals.set('_af_db_filename',filename);
 runtime.globals.set('_af_db_request',JSON.stringify(data.command||{action:'tables'}));
 try{
  const result=JSON.parse(runtime.runPython(`import astraforge_db, json
json.dumps(astraforge_db.perform(_af_db_filename,json.loads(_af_db_request)), default=str)`));
  return {db:result,dbFiles:snapshotDbs()};
 }finally{
  runtime.globals.delete('_af_db_filename');runtime.globals.delete('_af_db_request');
 }
}
async function handle({data}){
 const {id,type}=data;
 try{
  await boot(id);
  if(type==='packages'){const names=Array.isArray(data.packages)?data.packages:[];reply(id,'done',{packages:await loadPackages(id,names)});return;}
  if(type==='exec'){reply(id,'done',await execute(id,data));return;}
  if(type==='sql'){const result=await sqlQuery(data);reply(id,'done',{sql:result,dbFiles:snapshotDbs()});return;}
  if(type==='ui_event'){const result=await dispatchUI(id,data);reply(id,'done',{...result,dbFiles:snapshotDbs()});return;}
  if(type==='db'){reply(id,'done',await browseDB(id,data));return;}
  if(type==='db_import'){const filename=data.name;const bytes=data.bytes;if(!dbFilename(filename)||!(bytes instanceof Uint8Array)||bytes.length>4*1024*1024)throw Error('Invalid SQLite import');runtime.FS.writeFile('/home/pyodide/workspace/'+filename,bytes);reply(id,'done',{dbFiles:snapshotDbs()});return;}
  if(type==='init'){reply(id,'done',{version:runtime.runPython('import sys; sys.version.split()[0]')});return;}
  throw Error('Unsupported operation');
 }catch(error){let dbFiles;try{if(runtime)dbFiles=snapshotDbs();}catch(_){}reply(id,'error',{error:String(error?.stack||error),dbFiles});}
}
// Serialize message handling to avoid simultaneous Pyodide FS/global manipulation.
self.onmessage=e=>{queue=queue.then(()=>handle(e),()=>handle(e));};
