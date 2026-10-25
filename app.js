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
let files={'main.py':DEMO},active='main.py';
let pyWorker=null,running=false,nextId=1,toastTimer=null,deadline=null;
const pending=new Map();
const installed=new Set();
const selectedByProfile={};
let showAll=false,dbPromise=null;
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
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=p.id;checkbox.checked=selection.has(p.id);checkbox.disabled=p.kind==='external';checkbox.setAttribute('aria-label','Select '+p.name);
 checkbox.addEventListener('change',()=>{const values=getSelection(role);checkbox.checked?values.add(p.id):values.delete(p.id);selectedByProfile[role]=[...values];updatePackageCounts();scheduleSave();});
 const body=document.createElement('span');body.className='pkg-content';const head=document.createElement('span');head.className='pkg-name';const title=document.createElement('span');title.textContent=p.name;head.append(title);if(p.kind!=='browser'){const badge=document.createElement('span');badge.className='pkg-flag '+(p.kind==='external'?'native':'bundled');badge.textContent=p.kind==='external'?'Desktop / server':'Bundled';head.append(badge);}const desc=document.createElement('span');desc.className='pkg-desc';desc.textContent=p.description;
 if(p.kind==='external'){const link=document.createElement('a');link.target='_blank';link.rel='noopener noreferrer';link.href=p.url||'https://pyodide.org/en/stable/usage/packages-in-pyodide.html';link.textContent='Learn more';link.addEventListener('click',event=>event.stopPropagation());desc.append(' · ',link);}
 body.append(head,desc);row.append(checkbox,body);return row;}
function updatePackageCounts(){const current=$('role').value;const selected=getSelection(current);const supported=[...selected].filter(id=>BROWSER_IDS.has(id)||BUNDLED_IDS.has(id)).length;$('packageCounts').textContent=supported+' selected for installation · '+(showAll?'Entire catalog':'Field-focused catalog');}
function renderPackages(){const key=$('role').value;const role=PROFILES[key]||PROFILES.general;const selected=getSelection(key);const query=$('packageSearch').value.trim().toLowerCase();const list=showAll?CATALOG:forProfile(key);let matched=list.filter(pkg=>!query||[pkg.name,pkg.id,pkg.description,pkg.group].some(v=>String(v).toLowerCase().includes(query)));
 matched=[...matched].sort((a,b)=>{const rank=x=>x.kind==='external'?2:selected.has(x.id)?0:1;return rank(a)-rank(b)||a.group.localeCompare(b.group)||a.name.localeCompare(b.name)});
 const container=$('packages');container.replaceChildren();if(!matched.length){const empty=document.createElement('p');empty.className='pkg-group-note';empty.textContent='No packages match your search.';container.append(empty);} else {
 let group=null;for(const pkg of matched){const headline=selected.has(pkg.id)&&pkg.kind!=='external'?'Recommended':pkg.kind==='external'?'Desktop / server':pkg.group;if(headline!==group){group=headline;const h=document.createElement('div');h.className='pkg-group';h.textContent=group;container.append(h);}container.append(makePackageRow(pkg,selected,key));}
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
async function runCode(){if(running)return;updateBusy(true);await saveFiles();$('output').replaceChildren();$('plotZone').replaceChildren();log('Python 3.14 / browser runtime\n');const start=performance.now();deadline=setTimeout(()=>{if(running){stopEngine(false);log('\nExecution exceeded 60 seconds and was stopped.\n',true);}},60000);
 try{const result=await send('exec',{files,name:active});for(const [i,base64] of (result.plots||[]).entries()){const img=document.createElement('img');img.alt='Matplotlib figure '+(i+1);img.src='data:image/png;base64,'+base64;$('plotZone').append(img);}log('\nCompleted in '+((performance.now()-start)/1000).toFixed(2)+' s\n');}catch(e){log('\n'+e.message+'\n',true);}finally{clearTimeout(deadline);updateBusy(false);}}
async function installPackages(){if(running)return;const selected=getSelection($('role').value);const names=[...selected].filter(x=>BROWSER_IDS.has(x)||BUNDLED_IDS.has(x));if(!names.length){toast('Select at least one browser package');return;}updateBusy(true);log('\nInstalling '+names.length+' selected packages. Large libraries may take time…\n');try{const response=await send('packages',{packages:names});for(const id of response.packages||[])installed.add(id);toast('Packages loaded: '+names.length);if(installed.has('astra-simulator-client'))log('ASTRA SDK v1.3.0 import available. Remote ASTRA API requires HTTPS+CORS and a browser-compatible transport.\n');}catch(e){log(e.message+'\n',true);toast('Package installation incomplete');}finally{updateBusy(false);}}
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
 $('btnSave').onclick=()=>{void saveFiles();toast('Saved locally');};$('btnRun').onclick=()=>void runCode();$('btnStop').onclick=()=>stopEngine();$('btnInstall').onclick=()=>void installPackages();$('btnClear').onclick=()=>$('output').replaceChildren();
 $('btnNew').onclick=()=>{const filename=window.prompt('New Python filename','simulation.py');if(filename===null)return;if(!safeFile(filename)){toast('Use .py, .txt, .json or .md and a simple filename');return;}if(!Object.hasOwn(files,filename))files[filename]='# New file\n';switchFile(filename);};
 $('btnImport').onclick=()=>$('importInput').click();$('importInput').onchange=async e=>{for(const file of [...e.target.files].slice(0,20)){if(!safeFile(file.name)||file.size>1048576){toast('Unsupported filename or file larger than 1 MB');continue;}files[file.name]=await file.text();active=file.name;}$('editor').value=files[active];renderFiles();updateLineNumbers();void saveFiles();e.target.value='';};
 $('btnExport').onclick=()=>{files[active]=$('editor').value;download(active,files[active]);};
 $('role').onchange=()=>{updateProfile();void saveFiles();};$('packageSearch').oninput=renderPackages;$('btnAllPackages').onclick=()=>{showAll=!showAll;$('btnAllPackages').setAttribute('aria-pressed',String(showAll));renderPackages();};
 $('btnSettings').onclick=()=>$('settingsDialog').showModal();$('closeSettings').onclick=()=>$('settingsDialog').close();$('btnGithub').onclick=()=>$('githubDialog').showModal();$('closeGithub').onclick=()=>$('githubDialog').close();
 $('btnRailPackages').onclick=()=>{$('sidebar').classList.add('open');$('packageSearch').focus();};$('btnRailAI').onclick=()=>toggleMobile('rightbar');$('btnAI').onclick=()=>toggleMobile('rightbar');$('btnCloseAI').onclick=()=>$('rightbar').classList.remove('open');$('btnSide').onclick=()=>toggleMobile('sidebar');
 $('importRaw').onclick=async()=>{try{const u=new URL($('rawUrl').value);if(u.protocol!=='https:'||u.hostname!=='raw.githubusercontent.com'||!u.pathname.endsWith('.py'))throw Error('Use a public raw.githubusercontent.com .py URL');const filename=u.pathname.split('/').at(-1);if(!safeFile(filename))throw Error('Invalid source filename');const res=await fetch(u);if(!res.ok)throw Error('GitHub HTTP '+res.status);if(Number(res.headers.get('content-length')||0)>1048576)throw Error('File too large');const content=await res.text();if(content.length>1048576)throw Error('File too large');files[filename]=content;switchFile(filename);$('githubDialog').close();toast('Python file imported');}catch(e){toast(e.message);}};
 $('btnAsk').onclick=()=>void askAI();document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void saveFiles();toast('Saved locally');}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();void runCode();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('editor').focus();}});
 if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('ServiceWorker:',e));}
}
void init();
