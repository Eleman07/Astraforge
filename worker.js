/** AstraForge Python Web Worker (Pyodide 314 = module worker; no importScripts). */
import {BROWSER_IDS,BUNDLED_IDS,PYODIDE_VERSION} from './catalog.js';
const CDN=`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const LOCAL_WHEELS={'astra-simulator-client':'./wheels/astra_simulator_client-1.3.0-py3-none-any.whl'};
let runtime=null,bootPromise=null;
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
  instance.runPython("import os; os.environ['MPLBACKEND']='Agg'");
  runtime=instance;
  return instance;
 })().catch(err=>{bootPromise=null;throw new Error('Unable to load Pyodide 314.0.7. Check internet access and browser restrictions on cdn.jsdelivr.net. '+String(err));});
 const p=await bootPromise;
 reply(id,'ready',{version:p.runPython('import sys; sys.version.split()[0]')});
 return p;
}
const safeFilename=name=>typeof name==='string' && /^[\w .-]{1,100}\.(py|txt|md|json)$/i.test(name) && !name.startsWith('.');
// Detect normal ASTRA imports even outside the Aerospace profile. The bundled
// client is tiny, so install it lazily only when the code actually needs it.
const importsAstra=source => /^\s*(?:import\s+astra(?:[\s,.]|$)|from\s+astra(?:[\s.]|$))/m.test(source)
 || /\b__import__\(\s*['"]astra['"]\s*\)/.test(source);
async function loadPackages(id,names){
 const unique=[...new Set(names)].slice(0,85);
 const unsupported=unique.filter(x=>!BROWSER_IDS.has(x)&&!BUNDLED_IDS.has(x));
 if(unsupported.length)throw Error('Not available in the browser: '+unsupported.join(', '));
 const fresh=unique.filter(x=>!installed.has(x));
 for(const name of fresh){
  if(BROWSER_IDS.has(name)){
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
async function execute(id,data){
 const {files={},name}=data;
 if(!safeFilename(name)||typeof files[name]!=='string')throw Error('Invalid active Python file');
 for(const [filename,content] of Object.entries(files)){
  if(safeFilename(filename)&&typeof content==='string'&&content.length<=1048576)
   runtime.FS.writeFile('/home/pyodide/workspace/'+filename,content,{encoding:'utf8'});
 }
 runtime.FS.chdir('/home/pyodide/workspace');
 runtime.setStdout({batched:text=>reply(id,'output',{stream:'stdout',text})});
 runtime.setStderr({batched:text=>reply(id,'output',{stream:'stderr',text})});
 const code=files[name];
 // loadPackagesFromImports only recognizes Pyodide-distributed modules, not
 // our site-hosted ASTRA wheel. Do this before executing the user's imports.
 if(data.autoAstra===true || importsAstra(code)){
  await loadPackages(id,['astra-simulator-client']);
 }
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
 return plots;
}
async function handle({data}){
 const {id,type}=data;
 try{
  await boot(id);
  if(type==='packages'){const names=Array.isArray(data.packages)?data.packages:[];reply(id,'done',{packages:await loadPackages(id,names)});return;}
  if(type==='exec'){reply(id,'done',{plots:await execute(id,data)});return;}
  if(type==='init'){reply(id,'done',{version:runtime.runPython('import sys; sys.version.split()[0]')});return;}
  throw Error('Unsupported operation');
 }catch(error){reply(id,'error',{error:String(error?.stack||error)});}
}
// Serialize message handling to avoid simultaneous Pyodide FS/global manipulation.
self.onmessage=e=>{queue=queue.then(()=>handle(e),()=>handle(e));};
