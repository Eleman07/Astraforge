/** AstraForge IDE: offline-first files, WebAssembly Python and curated STEM libraries. */
import {CATALOG,PROFILES,forProfile,BROWSER_IDS,BUNDLED_IDS,PYODIDE_VERSION} from './catalog.js';
const $=id=>document.getElementById(id);
const DEMO=`# Circular low-Earth orbit — two-body approximation
# Change the altitude and run the script.

import math

MU = 3.986004418e14    # Earth GM [m^3/s^2]
R_EARTH = 6371e3        # mean Earth radius [m]
altitude = 400e3        # orbital altitude [m]
radius = R_EARTH + altitude

velocity = math.sqrt(MU / radius)
period = 2 * math.pi * math.sqrt(radius**3 / MU)

print(f"Circular velocity: {velocity/1000:.3f} km/s")
print(f"Orbital period:    {period/60:.2f} min")
`;
const ASTRA_EXAMPLE=`# ASTRA simulator — in-process browser engine (no server, no HTTP)
from astra.client import AstraClient

sim = AstraClient()
print('ASTRA status:', sim.status())
print('Available model families:', list(sim.models()))
sim.reset(vehicle='space', scenario='mission')
sim.launch()
for _ in range(5):
    state = sim.step(0.1)
    print('t =', state.get('time_s'), 's, altitude =', state.get('altitude_m'), 'm')
`;
let files={'main.py':DEMO},active='main.py';
let pyWorker=null,running=false,nextId=1,toastTimer=null,deadline=null;
const pending=new Map();
const installed=new Set();
const selectedByProfile={};
let showAll=false,dbPromise=null;
let desktopConnected=false, desktopToken='', activeNativeJob=null;
const DESKTOP_BASE='http://127.0.0.1:8766';
const NATIVE_MODULE_IDS=new Set(['django','tkinter','pyfme','moderngl']);
const NATIVE_EXAMPLES={
 tkinter:`import tkinter as tk
root = tk.Tk()
root.title("AstraForge · Tkinter")
root.geometry("460x240")
tk.Label(root, text="Native Tkinter via AstraForge",font=("Arial",18)).pack(pady=30)
tk.Button(root,text="Close",command=root.destroy).pack()
root.mainloop()
`,
 django:`# Minimal Django demo. Open http://127.0.0.1:8000/ ON THIS COMPUTER.
import os
from django.conf import settings
from django.http import HttpResponse
from django.urls import path
from django.core.wsgi import get_wsgi_application
from django.core.management import execute_from_command_line

def index(request):
    return HttpResponse("<h1>AstraForge Django native runtime</h1>")
urlpatterns=[path('',index)]
if not settings.configured:
    settings.configure(DEBUG=True, SECRET_KEY='astraforge-demo-not-for-production',
        ROOT_URLCONF=__name__, ALLOWED_HOSTS=['127.0.0.1','localhost'],
        INSTALLED_APPS=[], MIDDLEWARE=[])
application=get_wsgi_application()
execute_from_command_line(['manage.py','runserver','127.0.0.1:8000','--noreload'])
`,
 moderngl:`# Headless ModernGL verification (EGL preferred on Linux).
import moderngl
try:
    ctx=moderngl.create_standalone_context(backend='egl')
except Exception:
    ctx=moderngl.create_standalone_context()
print("OpenGL version:", ctx.version_code)
print("GL vendor:", ctx.info.get('GL_VENDOR'))
print("GL renderer:", ctx.info.get('GL_RENDERER'))
ctx.release()
`,
 pyfme:`# PyFME is a legacy project; use the companion's compatible Python environment.
try:
    import pyfme
    print("PyFME import successful:", pyfme.__file__)
except ImportError as e:
    print("PyFME unavailable in this interpreter:", e)
    print("See desktop_companion/README.md for compatibility notes")
`};
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('astraforge-pwa-workspace',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('data'))req.result.createObjectStore('data');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
async function storageGet(k){const database=await db();return new Promise((res,rej)=>{const tx=database.transaction('data','readonly');const request=tx.objectStore('data').get(k);request.onsuccess=()=>res(request.result);request.onerror=()=>rej(request.error);});}
async function storageSet(k,v){const database=await db();return new Promise((res,rej)=>{const tx=database.transaction('data','readwrite');tx.objectStore('data').put(v,k);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
function toast(text){const el=$('toast');el.textContent=String(text);el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3100);}
function log(text,error=false){const s=document.createElement('span');s.textContent=text;s.className=error?'out-error':'';$('output').appendChild(s);$('output').scrollTop=$('output').scrollHeight;}
function updateBusy(isBusy){running=isBusy;$('btnRun').disabled=isBusy;$('btnInstall').disabled=isBusy;$('runStatus').textContent=isBusy?'Working…':'Ready';}
function setStatus(text,state='loading'){$('runtimeStatus').className='engine-chip '+(state==='ready'?'ready':state==='error'?'failed':'');$('runtimeStatus').innerHTML='';const led=document.createElement('span');led.className='led';$('runtimeStatus').append(led,document.createTextNode(text));}
function safeFile(filename){return /^[A-Za-z0-9_ .-]{1,100}\.(py|txt|json|md)$/i.test(filename)&&!filename.startsWith('.');}
async function saveFiles(){files[active]=$('editor').value;try{await storageSet('workspace',{files,active,role:$('role').value,selectedByProfile});$('fileStatus').textContent=active+' · saved locally';}catch(e){toast('Local save failed: '+e.message);}}
function scheduleSave(){clearTimeout(window.afAutosave);window.afAutosave=setTimeout(()=>{void saveFiles();},450);}
function updateLineNumbers(){const editor=$('editor');const count=editor.value.split('\n').length;const previous=Number($('lineNumbers').dataset.count||0);if(previous!==count){$('lineNumbers').textContent=Array.from({length:count},(_,i)=>String(i+1)).join('\n');$('lineNumbers').dataset.count=String(count);} $('lineNumbers').scrollTop=editor.scrollTop;}
function renderFiles(){const wrap=$('files');wrap.replaceChildren();for(const name of Object.keys(files).sort()){const button=document.createElement('button');button.className='file-item'+(name===active?' active':'');button.type='button';const icon=document.createElement('span');icon.className='file-icon';icon.textContent=name.endsWith('.py')?'Py':'◇';const title=document.createElement('span');title.textContent=name;button.append(icon,title);button.onclick=()=>switchFile(name);wrap.append(button);} $('tabname').textContent=active;$('pathLabel').textContent='workspace / '+active;}
function switchFile(filename){if(!(filename in files))return;files[active]=$('editor').value;active=filename;$('editor').value=files[active];renderFiles();updateLineNumbers();void saveFiles();if(matchMedia('(max-width:650px)').matches)$('sidebar').classList.remove('open');}
function getSelection(role){if(!Array.isArray(selectedByProfile[role])) selectedByProfile[role]=[...(PROFILES[role]||PROFILES.general).recommended];return new Set(selectedByProfile[role]);}
function makePackageRow(p,selection,role){const row=document.createElement('label');row.className='package-row';row.title=p.description;
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=p.id;checkbox.checked=selection.has(p.id);checkbox.disabled=p.kind==='external'&&!(desktopConnected&&NATIVE_MODULE_IDS.has(p.id));checkbox.setAttribute('aria-label','Select '+p.name);
 checkbox.addEventListener('change',()=>{const values=getSelection(role);checkbox.checked?values.add(p.id):values.delete(p.id);selectedByProfile[role]=[...values];updatePackageCounts();scheduleSave();});
 const body=document.createElement('span');body.className='pkg-content';const head=document.createElement('span');head.className='pkg-name';const title=document.createElement('span');title.textContent=p.name;head.append(title);if(p.kind!=='browser'){const badge=document.createElement('span');badge.className='pkg-flag '+(p.kind==='external'?'native':'bundled');badge.textContent=p.kind==='external'?'Desktop / server':'Bundled';head.append(badge);}const desc=document.createElement('span');desc.className='pkg-desc';desc.textContent=p.description;
 if(p.kind==='external'){const link=document.createElement('a');link.target='_blank';link.rel='noopener noreferrer';link.href=p.url||'https://pyodide.org/en/stable/usage/packages-in-pyodide.html';link.textContent='Learn more';link.addEventListener('click',event=>event.stopPropagation());desc.append(' · ',link);}
 body.append(head,desc);row.append(checkbox,body);return row;}
function updatePackageCounts(){const current=$('role').value;const selected=getSelection(current);const supported=[...selected].filter(id=>BROWSER_IDS.has(id)||BUNDLED_IDS.has(id)||(desktopConnected&&NATIVE_MODULE_IDS.has(id))).length;$('packageCounts').textContent=supported+' selected for installation · '+(showAll?'Entire catalog':'Field-focused catalog');}
function renderPackages(){const key=$('role').value;const role=PROFILES[key]||PROFILES.general;const selected=getSelection(key);const query=$('packageSearch').value.trim().toLowerCase();const list=showAll?CATALOG:forProfile(key);let matched=list.filter(pkg=>!query||[pkg.name,pkg.id,pkg.description,pkg.group].some(v=>String(v).toLowerCase().includes(query)));
 matched=[...matched].sort((a,b)=>{const rank=x=>x.kind==='external'?2:selected.has(x.id)?0:1;return rank(a)-rank(b)||a.group.localeCompare(b.group)||a.name.localeCompare(b.name)});
 const container=$('packages');container.replaceChildren();if(!matched.length){const empty=document.createElement('p');empty.className='pkg-group-note';empty.textContent='No packages match your search.';container.append(empty);} else {
 let group=null;for(const pkg of matched){const headline=selected.has(pkg.id)&&(pkg.kind!=='external'||desktopConnected)?'Recommended':pkg.kind==='external'?'Desktop / server':pkg.group;if(headline!==group){group=headline;const h=document.createElement('div');h.className='pkg-group';h.textContent=group;container.append(h);}container.append(makePackageRow(pkg,selected,key));}
 }
 $('profileSummary').textContent=role.subtitle;$('packageTotal').textContent=String(matched.length);updatePackageCounts();}
function updateProfile(){renderPackages();}
function getWorker(){if(pyWorker)return pyWorker;
 const worker=new Worker('./worker.js',{type:'module',name:'astraforge-python314'});pyWorker=worker;
 worker.onmessage=event=>{const {id,kind}=event.data;
  if(kind==='ready'){setStatus('Python '+event.data.version,'ready');return;}
  const call=pending.get(id);if(!call)return;
  if(kind==='progress'){log(event.data.text+'\n');return;}
  if(kind==='output'){log(event.data.text+'\n',event.data.stream==='stderr');return;}
  pending.delete(id);
  if(kind==='error'){setStatus('Python error','error');call.reject(Error(event.data.error));return;}
  if(kind==='done'){setStatus('Python ready','ready');call.resolve(event.data);}
 };
 worker.onerror=event=>{setStatus('Runtime load failed','error');const err=Error('Python runtime worker failed. Refresh, check your network and access to cdn.jsdelivr.net. '+(event.message||''));for(const call of pending.values())call.reject(err);pending.clear();if(pyWorker===worker){worker.terminate();pyWorker=null;}toast('Python runtime could not start');};
 worker.onmessageerror=()=>toast('Browser worker messaging error');return worker;
}
function send(type,body={}){const worker=getWorker(),id=nextId++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,type,...body});});}
function stopEngine(showMessage=true){clearTimeout(deadline);const worker=pyWorker;pyWorker=null;if(worker)worker.terminate();for(const task of pending.values())task.reject(Error('Python engine reset or execution timed out'));pending.clear();installed.clear();updateBusy(false);setStatus('Python idle');if(showMessage)log('\nRuntime stopped. It will restart with a fresh state on the next run.\n');}
function updateRuntimeBadge(){
 if($('runTarget').value!=='desktop'){setStatus('Python idle');return;}
 setStatus(desktopConnected?'Desktop Python connected':'Desktop disconnected',desktopConnected?'ready':'error');
}
async function nativeFetch(path,options={}){
 const token=desktopToken;
 if(!token)throw Error('Connect using the companion token first');
 const response=await fetch(DESKTOP_BASE+path,{
  ...options, targetAddressSpace:'loopback', cache:'no-store',
  headers:{'Authorization':'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})}
 });
 const result=await response.json();
 if(!response.ok)throw Error(result.error||'Local companion HTTP '+response.status);
 return result;
}
async function connectDesktop(){
 desktopToken=$('desktopToken').value.trim();desktopConnected=false;
 if(!desktopToken){toast('Paste the companion token');return;}
 try{
  const info=await nativeFetch('/api/health');desktopConnected=true;
  $('desktopState').textContent='Connected · '+info.python+' · modules: '+Object.entries(info.modules).filter(([,v])=>v).map(([k])=>k).join(', ');
  log('Desktop companion connected. Python: '+info.python+'\n');
 }catch(e){desktopToken='';$('desktopState').textContent='Connection failed: '+e.message;
   log('Local connection error: '+e.message+'\nCheck companion, browser local-network permission and CORS.\n',true);
 }
 updateRuntimeBadge();renderPackages();
}
async function monitorNativeJob(jobId){
 let last=0;
 for(;;){
  if(activeNativeJob!==jobId)throw Error('Execution stopped');
  const status=await nativeFetch('/api/jobs/'+encodeURIComponent(jobId));
  if(status.output.length>last){log(status.output.slice(last));last=status.output.length;}
  if(!status.running){
   if(status.truncated)log('\n[Output truncated]\n',true);
   log('\nProcess finished (exit '+status.exit_code+').\n',status.exit_code!==0);
   return status;
  }
  await new Promise(resolve=>setTimeout(resolve,600));
 }
}
async function nativeJob(endpoint,payload){
 if(!desktopConnected)throw Error('Connect to the local Desktop companion first');
 if(activeNativeJob)throw Error('Another native job is active in this browser tab');
 const result=await nativeFetch(endpoint,{method:'POST',body:JSON.stringify(payload)});
 activeNativeJob=result.job_id;
 try{return await monitorNativeJob(result.job_id);}
 finally{if(activeNativeJob===result.job_id)activeNativeJob=null;}
}
async function runDesktopCode(){
 if(running)return;
 updateBusy(true);
 try{
  await saveFiles();$('output').replaceChildren();$('plotZone').replaceChildren();
  log('Native Python / desktop companion (trusted local code only)\n');
  const result=await nativeJob('/api/run',{files,name:active});
  if(result.exit_code!==0)toast('Native script exited with an error');
 }catch(e){log(e.message+'\n',true);}finally{updateBusy(false);}
}
async function stopDesktopJob(){
 const id=activeNativeJob;if(!id)return;
 activeNativeJob=null;
 try{await nativeFetch('/api/jobs/'+encodeURIComponent(id),{method:'DELETE'});log('\nNative job stopped.\n');}
 catch(e){log('Stop failed: '+e.message+'\n',true);}
 updateBusy(false);
}
async function installNativeModules(){
 if(running)return;
 if(!desktopConnected){toast('Connect to the Desktop companion first');return;}
 const chosen=[...getSelection($('role').value)].filter(x=>NATIVE_MODULE_IDS.has(x));
 if(chosen.includes('tkinter'))log('Tkinter is installed through Ubuntu apt: sudo apt install python3-tk\n');
 const install=chosen.filter(x=>x!=='tkinter');
 if(!install.length){toast('Select Django, ModernGL, or PyFME in the toolkit');return;}
 updateBusy(true);log('Installing native packages: '+install.join(', ')+'\n');
 try{await nativeJob('/api/install',{packages:install});
  log('Python packages requested. Reconnect for updated module availability.\n');}
 catch(e){log(e.message+'\n',true);}finally{updateBusy(false);}
}
function createNativeExample(){
 const name=$('nativeExample').value;
 files[active]=$('editor').value;
 const file=name+'_native_demo.py'; files[file]=NATIVE_EXAMPLES[name];switchFile(file);
 toast('Example ready. Run in Desktop mode on your own computer.');
}
async function runCode(){if($('runTarget').value==='desktop'){await runDesktopCode();return;}if(running)return;updateBusy(true);await saveFiles();$('output').replaceChildren();$('plotZone').replaceChildren();log('Python 3.14 / browser runtime\n');const start=performance.now();deadline=setTimeout(()=>{if(running){stopEngine(false);log('\nExecution timed out and was stopped.\n',true);}},pyWorker?60000:150000);
 try{
  const autoAstra=$('role').value==='aerospace' && getSelection('aerospace').has('astra-simulator-client');
  const result=await send('exec',{files,name:active,autoAstra});for(const [i,base64] of (result.plots||[]).entries()){const img=document.createElement('img');img.alt='Matplotlib figure '+(i+1);img.src='data:image/png;base64,'+base64;$('plotZone').append(img);}log('\nCompleted in '+((performance.now()-start)/1000).toFixed(2)+' s\n');}catch(e){log('\n'+e.message+'\n',true);}finally{clearTimeout(deadline);updateBusy(false);}}
async function installPackages(){if($('runTarget').value==='desktop'){await installNativeModules();return;}if(running)return;const selected=getSelection($('role').value);const names=[...selected].filter(x=>BROWSER_IDS.has(x)||BUNDLED_IDS.has(x));if(!names.length){toast('Select at least one browser package');return;}updateBusy(true);log('\nInstalling '+names.length+' selected packages. Large libraries may take time…\n');try{const response=await send('packages',{packages:names});for(const id of response.packages||[])installed.add(id);toast('Packages loaded: '+names.length);if(installed.has('astra-simulator-client'))log('ASTRA SDK ready. First AstraClient call loads the local simulation engine; no server required.\n');}catch(e){log(e.message+'\n',true);toast('Package installation incomplete');}finally{updateBusy(false);}}
function download(filename,text){const obj=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=obj;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(obj),2000);}
function toggleMobile(id){const el=$(id);el.classList.toggle('open');if(el.classList.contains('open'))$(id==='sidebar'?'rightbar':'sidebar').classList.remove('open');}
async function askAI(){const key=$('aiKey').value.trim(),prompt=$('aiPrompt').value.trim(),model=$('aiModel').value.trim()||'openrouter/free';if(!key){toast('Enter your OpenRouter API key');return;}if(!prompt){toast('Write your question first');return;}const add=(text,who)=>{const bubble=document.createElement('div');bubble.className='ai-msg '+who;bubble.textContent=text;$('aiMessages').append(bubble);$('aiMessages').scrollTop=$('aiMessages').scrollHeight;};add(prompt,'user');$('btnAsk').disabled=true;
 try{const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','X-Title':'AstraForge IDE'},body:JSON.stringify({model,messages:[{role:'system',content:'You are a precise engineering and Python development assistant. Explain assumptions and limitations. Never claim to have executed code that you have not run.'},{role:'user',content:prompt+'\n\nCurrent Python file '+active+':\n```python\n'+$('editor').value.slice(0,14000)+'\n```'}],max_tokens:1600})});const answer=await res.json();if(!res.ok)throw Error(answer?.error?.message||'OpenRouter HTTP '+res.status);add(typeof answer?.choices?.[0]?.message?.content==='string'?answer.choices[0].message.content:JSON.stringify(answer?.choices?.[0]?.message?.content??''),'assistant');$('aiPrompt').value='';}catch(e){add('Request failed: '+e.message,'assistant');}finally{$('btnAsk').disabled=false;}}
async function init(){for(const [key,p] of Object.entries(PROFILES)){const o=document.createElement('option');o.value=key;o.textContent=p.name;$('role').append(o);}
 try{const saved=await storageGet('workspace');if(saved?.files&&typeof saved.files==='object'){const clean=Object.fromEntries(Object.entries(saved.files).filter(([n,s])=>safeFile(n)&&typeof s==='string'&&s.length<=1048576));if(Object.keys(clean).length){files=clean;active=clean[saved.active]!==undefined?saved.active:Object.keys(clean)[0];}}if(saved?.role&&PROFILES[saved.role])$('role').value=saved.role;if(saved?.selectedByProfile&&typeof saved.selectedByProfile==='object'){for(const k of Object.keys(PROFILES)){const savedSelection=saved.selectedByProfile[k];if(Array.isArray(savedSelection))selectedByProfile[k]=savedSelection.filter(s=>CATALOG.some(p=>p.id===s));}}}catch(e){console.warn('IndexedDB:',e);toast('Local workspace persistence not available');}
 $('editor').value=files[active];renderFiles();updateLineNumbers();updateProfile();
 const updateConn=()=>{$('connection').textContent=navigator.onLine?'Online':'Offline';$('connectionDot').style.background=navigator.onLine?'var(--green)':'var(--red)';};updateConn();window.addEventListener('online',updateConn);window.addEventListener('offline',updateConn);
 $('editor').addEventListener('input',()=>{files[active]=$('editor').value;$('fileStatus').textContent=active+' · unsaved';updateLineNumbers();scheduleSave();});$('editor').addEventListener('scroll',updateLineNumbers);
 $('editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const a=e.target.selectionStart,b=e.target.selectionEnd;e.target.setRangeText('    ',a,b,'end');e.target.dispatchEvent(new Event('input',{bubbles:true}));}});
 $('runTarget').onchange=()=>{const isDesktop=$('runTarget').value==='desktop';$('desktopControls').hidden=!isDesktop;updateRuntimeBadge();renderPackages();};
 $('btnDesktopConnect').onclick=()=>void connectDesktop();$('btnNativeInstall').onclick=()=>void installNativeModules();$('btnNativeExample').onclick=createNativeExample;
 $('btnSave').onclick=()=>{void saveFiles();toast('Saved locally');};$('btnRun').onclick=()=>void runCode();$('btnStop').onclick=()=>{$('runTarget').value==='desktop'?void stopDesktopJob():stopEngine();};$('btnInstall').onclick=()=>void installPackages();$('btnClear').onclick=()=>$('output').replaceChildren();
 $('btnNew').onclick=()=>{const filename=window.prompt('New Python filename','simulation.py');if(filename===null)return;if(!safeFile(filename)){toast('Use .py, .txt, .json or .md and a simple filename');return;}if(!Object.hasOwn(files,filename))files[filename]='# New file\n';switchFile(filename);};
 $('btnImport').onclick=()=>$('importInput').click();$('importInput').onchange=async e=>{for(const file of [...e.target.files].slice(0,20)){if(!safeFile(file.name)||file.size>1048576){toast('Unsupported filename or file larger than 1 MB');continue;}files[file.name]=await file.text();active=file.name;}$('editor').value=files[active];renderFiles();updateLineNumbers();void saveFiles();e.target.value='';};
 $('btnExport').onclick=()=>{files[active]=$('editor').value;download(active,files[active]);};
 $('btnAstraDemo').onclick=()=>{files[active]=$('editor').value;const filename='astra_browser_demo.py';files[filename]=ASTRA_EXAMPLE;switchFile(filename);$('role').value='aerospace';updateProfile();void saveFiles();toast('ASTRA example ready — press Run');};
 $('role').onchange=()=>{updateProfile();void saveFiles();};$('packageSearch').oninput=renderPackages;$('btnAllPackages').onclick=()=>{showAll=!showAll;$('btnAllPackages').setAttribute('aria-pressed',String(showAll));renderPackages();};
 $('btnSettings').onclick=()=>$('settingsDialog').showModal();$('closeSettings').onclick=()=>$('settingsDialog').close();$('btnGithub').onclick=()=>$('githubDialog').showModal();$('closeGithub').onclick=()=>$('githubDialog').close();
 $('btnRailPackages').onclick=()=>{$('sidebar').classList.add('open');$('packageSearch').focus();};$('btnRailAI').onclick=()=>toggleMobile('rightbar');$('btnAI').onclick=()=>toggleMobile('rightbar');$('btnCloseAI').onclick=()=>$('rightbar').classList.remove('open');$('btnSide').onclick=()=>toggleMobile('sidebar');
 $('importRaw').onclick=async()=>{try{const u=new URL($('rawUrl').value);if(u.protocol!=='https:'||u.hostname!=='raw.githubusercontent.com'||!u.pathname.endsWith('.py'))throw Error('Use a public raw.githubusercontent.com .py URL');const filename=u.pathname.split('/').at(-1);if(!safeFile(filename))throw Error('Invalid source filename');const res=await fetch(u);if(!res.ok)throw Error('GitHub HTTP '+res.status);if(Number(res.headers.get('content-length')||0)>1048576)throw Error('File too large');const content=await res.text();if(content.length>1048576)throw Error('File too large');files[filename]=content;switchFile(filename);$('githubDialog').close();toast('Python file imported');}catch(e){toast(e.message);}};
 $('btnAsk').onclick=()=>void askAI();document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void saveFiles();toast('Saved locally');}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();void runCode();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('editor').focus();}});
 if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('ServiceWorker:',e));}
}
void init();
