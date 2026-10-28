# AstraForge 5.5 — Local Key Vault Test Report

## Implementato
- `openrouter-vault.js`: Web Crypto AES-256-GCM, IV casuale da 96 bit, chiave non esportabile e record IndexedDB per l'origin.
- `app.js`: caricamento automatico del segreto, salvataggio esplicito, cancellazione, stato accessibile e selezione del modello salvata in localStorage.
- `index.html`, `observatory-theme.css`: pulsanti e avvertenze per l'utente.
- `sw.js`: asset aggiunto alla cache PWA, versione `astraforge-ghpages-v12-openrouter-vault`.

## Verifiche automatiche
- `node tests/test_openrouter_vault.mjs`: PASS, test su mock IndexedDB con Web Crypto reale di Node 22 (salva/carica/sostituisci/cancella, record senza testo in chiaro, chiave non esportabile, rilevamento manomissioni, controllo HTTPS, UI e Service Worker).
- `node tests/test_ast_sdk.cjs`: PASS (9 casi).
- `node tests/test_ast_sdk_imports.cjs`: PASS.
- `node tests/test_browser_engine.cjs`: PASS.
- `node tests/test_interactive_worker.cjs`: PASS.
- `node tests/catalog.test.mjs`: PASS (16 profili, 91 moduli).
- `python -m unittest discover -s tests -p 'test_*.py' -q`: PASS (38 test, 1 saltato).
- `node --check`: PASS per app.js, vault, worker e sw.js.

## Limiti di verifica
Il test automatico di salvataggio ha usato un'implementazione **fittizia di IndexedDB**, ma l'implementazione reale di Web Crypto di Node. Il collaudo end-to-end nel browser effettivo del sito non è stato completato: Chromium nell'ambiente di prova blocca la navigazione verso il sito e `localhost`. Verifica obbligatoria sul sito dopo il deploy: salva chiave, ricarica, invia una domanda, elimina chiave, ricarica, conferma che non sia più caricata.

## Threat model
L'archivio separa la credenziale dai file Git e non la memorizza in testo in chiaro nel database. Non garantisce segretezza da script eseguiti sotto il medesimo origin; la chiave crittografica è conservata nello stesso browser per consentire il recupero senza password. Chiunque abbia accesso al browser aperto o uno script malevolo sul sito può usarla. Non salva né sincronizza le chiavi tra dispositivi. Il browser può svuotare i dati del sito, specialmente in modalità privata.
