/* AstraForge client-only engineering workspace. No remote code execution. */
const $=id=>document.getElementById(id);
const INITIAL=`# AstraForge · Engineering Studio
# Python 3.14 · WebAssembly · Browser runtime

import math
import sys

print("✧ ASTRAFORGE / PYTHON", sys.version.split()[0])
print("Orbital mechanics — first principles")

mu = 3.986004418e14     # Earth's GM [m³/s²]
radius = 6371e3 + 400e3 # Circular LEO [m]
v = math.sqrt(mu / radius)
period = 2 * math.pi * math.sqrt(radius**3 / mu)

print(f"Orbital velocity : {v / 1000:.3f} km/s")
print(f"Orbital period   : {period / 60:.2f} min")
print("✓ Computation complete")
`;
const PROFILE={
 aerospace:{label:'Orbital mechanics · GNC · CFD fundamentals · ASTRA client',modules:['numpy','scipy','sympy','matplotlib','astra-simulator-client']},
 mechanical:{label:'Mechanics · Materials · Numerical analysis',modules:['numpy','scipy','sympy','matplotlib']},
 computer:{label:'Algorithms · Data science · ML',modules:['numpy','pandas','scikit-learn','matplotlib']},
 electrical:{label:'Signal processing · Control · Electronics',modules:['numpy','scipy','sympy','matplotlib']},
 chemical:{label:'Reaction kinetics · Materials · Statistics',modules:['numpy','scipy','pandas','matplotlib']},
 biomedical:{label:'Biomedical signals · Statistics · Modelling',modules:['numpy','scipy','pandas','matplotlib']},
 math:{label:'Mathematics · Physics · Symbolic calculus',modules:['numpy','sympy','scipy','matplotlib']},
 general:{label:'Programming · General Python',modules:['numpy','sympy','pandas','matplotlib']}
};
const ALLOWED=['numpy','scipy','sympy','matplotlib','pandas','scikit-learn','networkx','statsmodels','astra-simulator-client'];
let files={'main.py':INITIAL};let active='main.py';let pyWorker=null;let running=false;let nextId=1;const pending=new Map();let savedAt=0;
let dbPromise=null;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('astraforge-pwa-workspace',1);req.onupgradeneeded=()=>req.result.createObjectStore('data');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
async function storageGet(key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('data','readonly').objectStore('data').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function storageSet(key,value){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('data','readwrite');t.objectStore('data').put(value,key);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function append(text,error=false){const s=document.createElement('span');s.textContent=text;s.className=error?'out-error':'';$('output').appendChild(s);$('output').scrollTop=$('output').scrollHeight;}
function setBusy(flag){running=flag;$('btnRun').disabled=flag;$('btnInstall').disabled=flag;$('runStatus').textContent=flag?'Executing…':'Ready to execute';}
async function persist(){files[active]=$('editor').value;try{await storageSet('workspace',{files,active,role:$('role').value});savedAt=Date.now();$('fileStatus').textContent=active+' · saved locally';}catch(err){toast('Saving failed: '+err.message);}}
function renderFiles(){const list=$('files');list.replaceChildren();Object.keys(files).sort().forEach(name=>{const b=document.createElement('button');b.className='file'+(name===active?' active':'');const ext=name.endsWith('.py')?'◇':'▧';const icon=document.createElement('span');icon.textContent=ext;const txt=document.createElement('span');txt.textContent=name;b.append(icon,txt);b.onclick=()=>switchFile(name);list.appendChild(b);});$('tabname').innerHTML='';const i=document.createElement('span');i.textContent='◇';const t=document.createTextNode(' '+active);const state=document.createElement('i');state.textContent='●';$('tabname').append(i,t,state);}
function switchFile(name){files[active]=$('editor').value;active=name;$('editor').value=files[name]||'';renderFiles();persist();hideMobileSide();}
function updateProfile(){const p=PROFILE[$('role').value]||PROFILE.general;$('profileSummary').textContent=p.label;const wrap=$('packages');wrap.replaceChildren();const selected=new Set(p.modules);ALLOWED.forEach(name=>{const l=document.createElement('label');const c=document.createElement('input');c.type='checkbox';c.name='package';c.value=name;c.checked=selected.has(name);const t=document.createTextNode(name==='astra-simulator-client'?'ASTRA Simulator Client · 1.3.0':name);l.append(c,t);wrap.appendChild(l);});}
function send(type,data={}){if(!pyWorker){pyWorker=new Worker('./worker.js');pyWorker.onmessage=e=>{const {id,kind}=e.data; if(kind==='ready'){$('runtimeStatus').textContent='● Python '+e.data.version+' · local';$('runtimeStatus').classList.remove('status-loading');return;}const call=pending.get(id);if(!call)return;if(kind==='output'){append(e.data.text+'\n',e.data.stream==='stderr');return;}if(kind==='progress'){append(e.data.text+'\n');return;}if(kind==='error'){pending.delete(id);call.reject(Error(e.data.error));return;}if(kind==='done'){pending.delete(id);call.resolve(e.data);}};pyWorker.onerror=e=>{for(const call of pending.values())call.reject(Error(e.message||'Web Worker error'));pending.clear();toast('Python worker failed');};}
 const id=nextId++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});pyWorker.postMessage({id,type,...data});});}
async function runCode(){if(running)return;setBusy(true);await persist();$('output').replaceChildren();$('plotZone').replaceChildren();append('AstraForge · Python browser execution\n');const start=performance.now();try{const result=await send('exec',{files,name:active});if(Array.isArray(result.plots)){result.plots.forEach((data,i)=>{const img=new Image();img.alt='Scientific figure '+(i+1);img.src='data:image/png;base64,'+data;$('plotZone').append(img);});}append('\n✓ Finished in '+((performance.now()-start)/1000).toFixed(2)+' s\n');}catch(e){append('\n'+e.message+'\n',true);}finally{setBusy(false);}}
async function installPackages(){if(running)return;const packages=[...document.querySelectorAll('input[name=package]:checked')].map(x=>x.value);if(!packages.length){toast('Select at least one module');return;}setBusy(true);append('\nInstalling browser-compatible packages (first load may take a while)…\n');try{await send('packages',{packages});toast('Modules loaded');if(packages.includes('astra-simulator-client'))append('ASTRA 1.3.0 installed: import astra; from astra.client import AstraClient\nNote: ASTRA remote HTTP calls need a browser-compatible API adapter and a live ASTRA server.\n');}catch(e){append(e.message+'\n',true);}finally{setBusy(false);}}
function resetWorker(){if(pyWorker)pyWorker.terminate();pyWorker=null;for(const call of pending.values())call.reject(Error('Engine reset'));pending.clear();setBusy(false);$('runtimeStatus').textContent='○ Restart required';$('runtimeStatus').classList.add('status-loading');append('\nPython runtime reset. Packages will reload when needed.\n');}
function download(filename,text){const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function hideMobileSide(){if(matchMedia('(max-width:620px)').matches)$('sidebar').classList.add('closed');}
async function askAI(){const key=$('aiKey').value.trim();const message=$('aiPrompt').value.trim();const model=$('aiModel').value.trim()||'openrouter/free';if(!key){toast('Enter your personal OpenRouter key');return;}if(!message){toast('Write a question first');return;}$('btnAsk').disabled=true;
 const addMsg=(val,who)=>{const e=document.createElement('div');e.className='aimsg '+who;e.textContent=val;$('aiMessages').appendChild(e);$('aiMessages').scrollTop=$('aiMessages').scrollHeight;};addMsg(message,'user');
 try{const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','X-Title':'AstraForge Studio'},body:JSON.stringify({model,messages:[{role:'system',content:'You are a careful engineering and Python tutor. Explain any assumptions. Do not invent physics or claim to have run code.'},{role:'user',content:message+'\n\nCurrent file '+active+':\n```python\n'+$('editor').value.slice(0,14000)+'\n```'}],max_tokens:1400})});const body=await res.json();if(!res.ok)throw Error(body?.error?.message||'HTTP '+res.status);const text=body?.choices?.[0]?.message?.content;addMsg(typeof text==='string'?text:JSON.stringify(text),'assistant');$('aiPrompt').value='';}catch(e){addMsg('Error: '+e.message,'assistant');}finally{$('btnAsk').disabled=false;}}
async function init(){try{const saved=await storageGet('workspace');if(saved?.files&&typeof saved.files==='object'){const clean=Object.fromEntries(Object.entries(saved.files).filter(([k,v])=>/^[A-Za-z0-9_ .-]{1,100}\.(py|txt|json|md)$/i.test(k)&&typeof v==='string'));if(Object.keys(clean).length){files=clean;active=files[saved.active]?saved.active:Object.keys(files)[0];}}if(saved?.role&&PROFILE[saved.role])$('role').value=saved.role;}catch(e){toast('Local persistence unavailable');}
 $('editor').value=files[active];renderFiles();updateProfile();$('connection').textContent=navigator.onLine?'ONLINE':'OFFLINE';
 window.addEventListener('online',()=>$('connection').textContent='ONLINE');window.addEventListener('offline',()=>$('connection').textContent='OFFLINE');
 $('editor').addEventListener('input',()=>{files[active]=$('editor').value;$('fileStatus').textContent=active+' · unsaved';clearTimeout(window.afSaveTimer);window.afSaveTimer=setTimeout(()=>void persist(),600);});
 $('editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const p=e.target.selectionStart;e.target.setRangeText('    ',p,e.target.selectionEnd,'end');}});
 $('btnRun').onclick=runCode;$('btnSave').onclick=()=>{persist();toast('Saved to this browser');};$('btnStop').onclick=resetWorker;$('btnInstall').onclick=installPackages;$('btnClear').onclick=()=>$('output').replaceChildren();
 $('btnNew').onclick=()=>{const n=prompt('New filename (.py):','simulation.py');if(n===null)return;if(!/^[A-Za-z0-9_ .-]{1,100}\.(py|txt|json|md)$/i.test(n)){toast('Use a safe filename ending .py, .txt, .json or .md');return;}if(files[n]){switchFile(n);return;}files[n]='# New Python file\n';switchFile(n);};
 $('btnImport').onclick=()=>$('importInput').click();$('importInput').onchange=async e=>{for(const f of [...e.target.files].slice(0,20)){if(f.size>1024*1024){toast('Files must be under 1 MB');continue;}if(!/^[A-Za-z0-9_ .-]{1,100}\.(py|txt|json|md)$/i.test(f.name))continue;files[f.name]=await f.text();active=f.name;}$('editor').value=files[active];renderFiles();persist();e.target.value='';};
 $('btnExport').onclick=()=>{files[active]=$('editor').value;download(active,files[active]);};$('role').onchange=()=>{updateProfile();persist();};
 $('btnSettings').onclick=()=>$('settingsDialog').showModal();$('closeSettings').onclick=()=>$('settingsDialog').close();$('btnGithub').onclick=()=>$('githubDialog').showModal();$('closeGithub').onclick=()=>$('githubDialog').close();
 $('importRaw').onclick=async()=>{try{const u=new URL($('rawUrl').value);if(u.protocol!=='https:'||u.hostname!=='raw.githubusercontent.com'||!u.pathname.endsWith('.py'))throw Error('Only public raw.githubusercontent.com Python files are accepted');const name=u.pathname.split('/').at(-1);if(!/^[A-Za-z0-9_ .-]{1,100}\.py$/.test(name))throw Error('Invalid filename');const res=await fetch(u);if(!res.ok)throw Error('GitHub HTTP '+res.status);if(Number(res.headers.get('content-length')||0)>1024*1024)throw Error('File too large');const s=await res.text();if(s.length>1024*1024)throw Error('File too large');files[name]=s;switchFile(name);$('githubDialog').close();toast('Public source imported');}catch(e){toast(e.message);}};
 $('btnSide').onclick=()=>$('sidebar').classList.toggle('closed');$('btnAsk').onclick=askAI;
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persist();toast('Saved locally');}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCode();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('editor').focus();}});
 hideMobileSide();if('serviceWorker' in navigator && location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('PWA service worker:',e));}
}
void init();
