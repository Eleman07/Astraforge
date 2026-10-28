// Runs in Node 22 with an event-based in-memory IndexedDB test double.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.isSecureContext = true;

const records = new Map();
let storeCreated=false;
const counters = {opens:0,puts:0};
const fakeDb = {
  objectStoreNames: {contains: name => storeCreated && name === 'secrets'},
  createObjectStore(name) {assert.equal(name,'secrets');storeCreated=true;},
  close(){},
  transaction(name, mode) {
    assert.equal(name,'secrets');
    const tx = {oncomplete:null,onerror:null,onabort:null, error:null};
    tx.objectStore = () => ({
      put(value, key) {assert.equal(mode,'readwrite');counters.puts++;return operation(() => records.set(key, structuredClone(value)));},
      get(key) {return operation(() => structuredClone(records.get(key)));},
      delete(key) {assert.equal(mode,'readwrite');return operation(() => records.delete(key));}
    });
    function operation(work) {
      const request = {onsuccess:null,onerror:null,error:null,result:undefined};
      setTimeout(() => {
        try { request.result=work(); request.onsuccess?.(); tx.oncomplete?.(); }
        catch (error) {request.error=error;request.onerror?.();tx.onerror?.();}
      }, 0);
      return request;
    }
    return tx;
  }
};
globalThis.indexedDB = {open(name, version) {
  assert.equal(name,'astraforge-local-credentials-v1');assert.equal(version,1);
  counters.opens++;
  const req={onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null,result:null,error:null};
  setTimeout(()=>{req.result=fakeDb;if(!storeCreated)req.onupgradeneeded?.();req.onsuccess?.();},0);
  return req;
}};
const {saveOpenRouterKey, loadOpenRouterKey, forgetOpenRouterKey} = await import('../openrouter-vault.js');
assert.equal(await loadOpenRouterKey(),null,'empty vault');
const SECRET='sk-or-v1-test-unique-secret-78934';
assert.equal(await saveOpenRouterKey('  '+SECRET+'  '),SECRET);
assert.equal(counters.puts,1);
const record=records.get('openrouter-api-key');
assert.equal(record.version,1);
assert.equal(record.key.extractable,false,'crypto key must not be extractable');
assert.equal(record.key.algorithm.name,'AES-GCM');
assert.equal(record.key.algorithm.length,256);
assert.equal(record.iv.length,12,'96-bit GCM nonce');
assert.equal(new TextDecoder().decode(record.ciphertext).includes(SECRET),false,'no cleartext key stored');
assert.equal(await loadOpenRouterKey(),SECRET,'key is restored after roundtrip');
await saveOpenRouterKey('new-secret-456');
assert.equal(await loadOpenRouterKey(),'new-secret-456','updating key overwrites previous key');
await assert.rejects(()=>saveOpenRouterKey('   '),/Enter a valid/);
const damaged=records.get('openrouter-api-key');damaged.ciphertext=new Uint8Array(damaged.ciphertext);damaged.ciphertext[0]^=1;
records.set('openrouter-api-key',damaged);
await assert.rejects(()=>loadOpenRouterKey(),/Could not decrypt/,'tampered ciphertext is detected');
await forgetOpenRouterKey();
assert.equal(await loadOpenRouterKey(),null,'forget removes key');
globalThis.isSecureContext=false;
await assert.rejects(()=>saveOpenRouterKey(SECRET),/HTTPS/,'insecure origin cannot store credentials');
globalThis.isSecureContext=true;
assert.ok(counters.opens>=7);
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const id of ['btnSaveAIKey','btnForgetAIKey','aiKeyStatus']){
  assert.ok(html.includes('id="'+id+'"'),'UI ID '+id);
  assert.ok(app.includes("$('"+id+"')"),'handler '+id);
}
assert.ok(!app.includes("localStorage.setItem('aiKey'"));
assert.ok(sw.includes("'./openrouter-vault.js'"));
assert.ok(sw.includes('v12-openrouter-vault'));
console.log('PASS: OpenRouter key encrypted/roundtripped, overwritten, tamper detected, deleted, HTTPS enforcement, UI and PWA wiring');
