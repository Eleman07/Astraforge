/* Browser-side Python Web Worker. No backend execution. Pyodide pinned to v314.0.7. */
const PYODIDE_BASE="https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let pyodide=null; let loading=null;let installed=new Set();
// Custom, same-origin, pure-Python wheel shipped with AstraForge.
// Never pass arbitrary user-supplied URLs to micropip.
const CUSTOM_WHEELS=Object.freeze({
 "astra-simulator-client":"./wheels/astra_simulator_client-1.3.0-py3-none-any.whl"
});
function send(id,kind,data={}){self.postMessage({id,kind,...data});}
async function initialize(id){
 if(pyodide)return;
 if(!loading)loading=(async()=>{
  importScripts(PYODIDE_BASE+"pyodide.js");
  pyodide=await self.loadPyodide({indexURL:PYODIDE_BASE});
  pyodide.FS.mkdirTree("/home/pyodide/workspace");
 })();
 await loading; send(id,"ready",{version:pyodide.runPython("import sys; sys.version.split()[0]")});
}
function safeName(value){return /^[A-Za-z0-9_ .-]{1,100}\.(py|txt|json|md)$/i.test(value)&&!value.startsWith(".");}
async function handle(event){const {id,type}=event.data;
 try{
  await initialize(id);
  if(type==="init"){send(id,"done",{version:pyodide.runPython("import sys; sys.version.split()[0]")});return;}
  if(type==="packages"){
   const candidates=(event.data.packages||[]).filter(x=>/^[a-z0-9][a-z0-9_-]{0,49}$/i.test(x)).slice(0,12);
   const fresh=candidates.filter(x=>!installed.has(x));
   const standard=fresh.filter(name=>!(name in CUSTOM_WHEELS));
   if(standard.length){
    send(id,"progress",{text:"Loading "+standard.join(", ")+" …"});
    await pyodide.loadPackage(standard,{messageCallback:msg=>send(id,"progress",{text:msg})});
    standard.forEach(name=>installed.add(name));
   }
   for(const name of fresh.filter(item=>item in CUSTOM_WHEELS)){
    send(id,"progress",{text:"Installing ASTRA Simulator Client 1.3.0 …"});
    await pyodide.loadPackage("micropip");
    // Absolute same-origin URL also works when GitHub Pages serves the app under /<repo>/.
    const wheelUrl=new URL(CUSTOM_WHEELS[name],self.location.href).href;
    pyodide.globals.set("_astraforge_wheel_url",wheelUrl);
    try{
     await pyodide.runPythonAsync("import micropip\nawait micropip.install(_astraforge_wheel_url, deps=False)");
     const version=pyodide.runPython("import astra; astra.__version__");
     if(version!=="1.3.0")throw Error("Unexpected ASTRA SDK version: "+version);
     installed.add(name);
     send(id,"progress",{text:"ASTRA SDK v"+version+" installed and import verified."});
    }finally{pyodide.globals.delete("_astraforge_wheel_url");}
   }
   send(id,"done",{packages:[...installed]});return;
  }
  if(type==="exec"){
   const files=event.data.files||{},name=event.data.name;
   if(!safeName(name))throw Error("Invalid filename");
   for(const [filename,contents] of Object.entries(files)){
    if(!safeName(filename)||typeof contents!=="string"||contents.length>1024*1024)continue;
    pyodide.FS.writeFile("/home/pyodide/workspace/"+filename,contents,{encoding:"utf8"});
   }
   pyodide.FS.chdir("/home/pyodide/workspace");
   const output=[];
   pyodide.setStdout({batched:text=>{output.push(text);send(id,"output",{stream:"stdout",text});}});
   pyodide.setStderr({batched:text=>{output.push(text);send(id,"output",{stream:"stderr",text});}});
   const src=String(files[name]||"");
   await pyodide.loadPackagesFromImports(src);
   await pyodide.runPythonAsync(`import builtins\n__name__ = '__main__'\n__file__ = ${JSON.stringify(name)}`);
   await pyodide.runPythonAsync(src);
   let plots=[];
   if(pyodide.runPython("import sys; 'matplotlib.pyplot' in sys.modules")){
    const data=pyodide.runPython(`import matplotlib.pyplot as plt, io, base64, json\n__af_plots=[]\nfor __af_num in plt.get_fignums()[:3]:\n    __af_buffer=io.BytesIO()\n    plt.figure(__af_num).savefig(__af_buffer,format='png',dpi=90)\n    __af_plots.append(base64.b64encode(__af_buffer.getvalue()).decode('ascii'))\nplt.close('all')\njson.dumps(__af_plots)`);
    plots=JSON.parse(data);
   }
   send(id,"done",{plots});return;
  }
  throw Error("Unsupported operation");
 }catch(error){send(id,"error",{error:String(error?.stack||error)});}
}
self.onmessage=e=>{void handle(e);};
