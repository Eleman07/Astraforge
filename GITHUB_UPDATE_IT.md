# Pubblicare AstraForge 4.3 su GitHub Pages (Ubuntu)

Non serve alcun VPS e **non devi avviare `server.py`**: le chiamate di `AstraClient` vengono eseguite in Pyodide utilizzando il motore ASTRA locale al browser.

## 1. Scarica lo ZIP

Salva `astraforge-4.3-github-pages-astra-browser-engine.zip` in `~/Downloads`.

## 2. Prepara la copia Git (una sola volta)

```bash
cd ~
if [ ! -d "$HOME/Astraforge/.git" ]; then
  git clone https://github.com/Eleman07/Astraforge.git "$HOME/Astraforge"
fi
cd "$HOME/Astraforge"
git pull --ff-only origin main
```

Se la directory esiste ma non è un repository, non eliminarla senza controllarne prima il contenuto.

## 3. Estrai e copia correttamente i file

```bash
mkdir -p "$HOME/Downloads/astraforge-4.3-update"
unzip -o "$HOME/Downloads/astraforge-4.3-github-pages-astra-browser-engine.zip" \
  -d "$HOME/Downloads/astraforge-4.3-update"
rsync -av --exclude='.git/' \
  "$HOME/Downloads/astraforge-4.3-update/" \
  "$HOME/Astraforge/"
```

**Verifica che nel repository esistano** `worker.js`, `astra-bridge/engine-manifest.json`, `astra-bridge/browser_client_bridge.py`, `wheels/astra_simulator_client-1.3.0-py3-none-any.whl` e `index.html` nella root.

## 4. Test locali

```bash
cd ~/Astraforge
node --check app.js
node --check worker.js
node tests/catalog.test.mjs
node tests/test_browser_engine.cjs
python3 -m unittest discover -s tests -p 'test_browser_bridge.py' -v
```

Se non hai Node.js, installalo da una fonte fidata prima dei test JavaScript.

## 5. Pubblica

```bash
cd ~/Astraforge
git status
git add -A
git commit -m "Integrate ASTRA simulator browser engine without HTTP server"
git push origin main
```

Se `git commit` mostra `nothing to commit`, non ci sono differenze da inviare.

## 6. Test online, decisivo

1. Apri https://github.com/Eleman07/Astraforge/actions e verifica che Pages sia verde.
2. Apri https://eleman07.github.io/Astraforge/ e premi **Ctrl+Shift+R**.
3. Seleziona **Aerospace engineering** → **Create ASTRA simulator example** → **Run**.
4. Il primo run installerà il wheel SDK e scaricherà i file del motore dal repository ASTRA originale, fissato a uno specifico commit; verifica che appaia `ASTRA Browser Engine ready`.
5. Controlla che siano stampati `ASTRA status` e i valori della simulazione.
6. Ripremi **Run** per confermare che il motore rimane caricato. Provalo anche da telefono.

Se vedi ancora la vecchia versione: apri F12 → Application → Service Workers → Unregister per Astraforge, quindi ricarica. Se la prima esecuzione mostra un errore di rete relativo a raw.githubusercontent.com, prova con la rete attiva e controlla le richieste Network: il loader prevede un mirror jsDelivr.

Nota: **aprire l'ASTRA 3D Viewer** dalla barra dei toolkit apre una seconda simulazione indipendente, non sincronizzata con la sessione Python nell'IDE.
