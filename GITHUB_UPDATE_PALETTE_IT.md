# AstraForge 5.3 Holst — Guida aggiornamento GitHub Pages (Ubuntu)

Questa release sostituisce la palette **Nebula** con **Holst**, mantenendo lo stesso layout e gli stessi moduli Python. Non serve configurare server, backend o pagamenti.

## Aggiornamento consigliato: PATCH

1. Scarica `astraforge-5.3-holst-PATCH.zip` in `~/Downloads`.
2. Apri il terminale:

```bash
cd ~/Astraforge
# Se non hai ancora il repository locale: git clone https://github.com/Eleman07/Astraforge.git ~/Astraforge
git status
git pull --ff-only origin main
```

Se ci sono modifiche locali, salvale/committale prima di eseguire il pull.

3. Estrai e copia i file:

```bash
mkdir -p ~/Downloads/af-holst-update
unzip -o ~/Downloads/astraforge-5.3-holst-PATCH.zip -d ~/Downloads/af-holst-update
rsync -av ~/Downloads/af-holst-update/ ~/Astraforge/
```

4. Facoltativo: il vecchio `nebula-theme.css` non è più referenziato e può essere eliminato:

```bash
cd ~/Astraforge
rm -f nebula-theme.css
```

5. Verifica e pubblica:

```bash
node --check app.js
node --check worker.js
node --check webviz.js
node --check sw.js

git add -A
git commit -m "AstraForge 5.3 - Holst color palette"
git push origin main
```

6. Attendi il deployment nella scheda **Actions** del repository; poi apri https://eleman07.github.io/Astraforge/ e aggiorna con `Ctrl+Shift+R`. Su mobile chiudi e riapri la PWA se si vede ancora il vecchio tema.

## Installazione completa (alternativa)

Scarica `astraforge-5.3-holst-FULL.zip`, estrailo in una cartella e copiane il contenuto **nella root** di `~/Astraforge/`. Non eliminare file di progetto personali eventualmente aggiunti al tuo repository senza averne una copia.

## Collaudo veloce

- L'editor deve apparire blu notte; Run color sabbia, testo crema, indicatori salvia.
- Apri Explorer, Database e Web UI. I testi devono essere leggibili.
- Seleziona **3D / WebGL orbit**, premi Create example e Run: il fondale deve essere blu notte; riprova anche il controllo touch sul telefono.
- Testa `import numpy` e l'esempio SQLite per escludere regressioni (l'overlay CSS non altera il runtime).

L'anteprima grafica allegata deriva dal vero HTML/CSS, ma l'avvio runtime completo con Pyodide su GitHub Pages va controllato dopo il deployment.
