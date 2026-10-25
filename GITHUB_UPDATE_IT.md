# Tutorial: aggiornare AstraForge 5.0 su GitHub Pages

Questo ZIP contiene **solo il sito statico**. Non serve installare un server, creare un VPS o configurare Docker.

## 1) Prepara il progetto sul tuo Ubuntu

Scarica `astraforge-5.0-browser-first-free.zip` nella cartella Downloads. Poi:

```bash
cd ~
# Solo se non hai ancora clonato il repository:
if [ ! -d "$HOME/Astraforge/.git" ]; then
  git clone https://github.com/Eleman07/Astraforge.git "$HOME/Astraforge"
fi
cd ~/Astraforge
git status
git pull --ff-only origin main
```

Se Git dice che hai modifiche locali non salvate, **non** usare `git reset --hard`. Fai prima una copia delle modifiche o committale.

## 2) Estrai l'aggiornamento

```bash
mkdir -p ~/Downloads/astraforge-5-update
unzip -o ~/Downloads/astraforge-5.0-browser-first-free.zip \
  -d ~/Downloads/astraforge-5-update
```

## 3) Copia i nuovi file

```bash
rsync -av \
  --exclude='__pycache__' \
  ~/Downloads/astraforge-5-update/ \
  ~/Astraforge/
```

Non usare `rsync --delete`, così non elimini involontariamente file del repository che non sono presenti nello ZIP.

## 4) Verifica e pubblica

```bash
cd ~/Astraforge
node --check app.js
node --check worker.js
node --check webviz.js
python3 -m unittest discover -s tests -v
git status
git diff --stat
git add -A
git commit -m "AstraForge 5.0 browser-first WebGL and local SQL"
git push origin main
```

Se `git commit` mostra `nothing to commit`, controlla se hai copiato i file nella directory corretta. Se `node` non è disponibile, il controllo sintattico è opzionale, non indispensabile per GitHub Pages.

## 5) Apri la pagina

- Controlla il deployment: <https://github.com/Eleman07/Astraforge/actions>
- Apri l'IDE: <https://eleman07.github.io/Astraforge/>
- Se vedi la vecchia versione: aggiorna con Ctrl+Shift+R oppure elimina i dati del Service Worker per quel sito.

## 6) Prove funzionali consigliate

- Scegli `SQLite persistent database`, premi Create example e poi Run; entra in Database e fai `SELECT * FROM experiments;`
- Scegli `3D / WebGL orbit`, premi Run e verifica la vista 3D.
- Scegli `Tkinter-style web UI`: si vede un'interfaccia web, **non** una vera finestra Tkinter.
- Scegli `Python Jinja2 page`: si renderizza HTML prodotto da Python, **non** un server Django.
- Scegli `Flight mechanics (browser)`: è una demo fisica autonoma, **non** il pacchetto PyFME.

**Limiti importanti:** serve una connessione Internet al primo download di Pyodide/Three.js. I database SQLite sono locali al dispositivo e devono essere esportati per backup. Il JavaScript pubblicato su GitHub Pages è visibile ai visitatori.
