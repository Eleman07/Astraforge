import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATALOG,BROWSER_IDS,BUNDLED_IDS,PROFILES,forProfile,PYODIDE_VERSION} from '../catalog.js';
assert.equal(PYODIDE_VERSION,'314.0.7');
assert.equal(Object.keys(PROFILES).length,16);
assert.ok(CATALOG.length>=75,`expected broad catalogue, got ${CATALOG.length}`);
assert.equal(new Set(CATALOG.map(x=>x.id)).size,CATALOG.length,'duplicate package IDs');
for(const [key,profile] of Object.entries(PROFILES)){
 const chosen=forProfile(key);
 assert.ok(chosen.length>=10,key+' must have at least 10 relevant modules');
 assert.ok(profile.recommended.length>=5,key+' must have recommended modules');
 for(const name of profile.recommended)assert.ok(BROWSER_IDS.has(name)||BUNDLED_IDS.has(name),key+' cannot recommend backend-only '+name);
 for(const name of profile.extra)assert.ok(CATALOG.some(x=>x.id===name),key+' unknown extra: '+name);
}
for(const pkg of CATALOG)assert.ok(pkg.name&&pkg.description&&pkg.group);
for(const field of ['aerospace','mechanical','chemical','energetic','management','materials','automation','biomedical','ai','telecom','electronics','electrical'])assert.ok(PROFILES[field]);
assert.ok(PROFILES.aerospace.recommended.includes('astropy'));
assert.ok(PROFILES.aerospace.recommended.includes('astra-simulator-client'));
for(const field of ['aerospace','computer','general'])assert.ok(forProfile(field).length>10);
for(const name of ['django','tkinter','pyfme'])assert.equal(CATALOG.find(x=>x.id===name).kind,'external');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of ['role','packageSearch','btnAllPackages','packages','editor','btnRun','btnInstall','aiPrompt','output'])assert.ok(html.includes(`id="${id}"`));
assert.match(html,/\.\/catalog\.js|\.\/app\.js/);
console.log('PASS: 16 discipline profiles, '+CATALOG.length+' modules, recommendations & compatibility flags');
