# AstraForge 4.2 — Aggiornamento del sito GitHub Pages

Il problema risolto è `ModuleNotFoundError: No module named 'astra'`: il wheel era già presente in `wheels/`, ma AstraForge 4.1 lo installava solo dopo un clic su **Load selected packages**. Con 4.2 basta selezionare Aerospace e premere **Run**, oppure scrivere un import di ASTRA nel file Python ed eseguirlo.

## Procedura da Ubuntu

1. Scarica `astraforge-4.2-github-pages-astra-sdk-autoload.zip` nella cartella `~/Downloads`.
2. Esegui:

```bash
cd ~
# Solo se ~/Astraforge NON è già una copia Git del repository:
if [ ! -d "$HOME/Astraforge/.git" ]; then
  git clone https://github.com/Eleman07/Astraforge.git "$HOME/Astraforge"
fi
cd ~/Astraforge
git pull --ff-only origin main

mkdir -p ~/Downloads/astraforge-4.2-update
unzip -o ~/Downloads/astraforge-4.2-github-pages-astra-sdk-autoload.zip -d ~/Downloads/astraforge-4.2-update
rsync -av --exclude='.git/' ~/Downloads/astraforge-4.2-update/ ~/Astraforge/

# Verifiche JavaScript (se Node.js è installato):
node --check worker.js
node --check app.js
node tests/test_ast_sdk.cjs
node tests/test_ast_sdk_imports.cjs
node tests/catalog.test.mjs

git status
git add -A
git commit -m "Fix automatic ASTRA SDK installation on browser Python run"
git push origin main
```

Se `git commit` segnala `nothing to commit`, non c'è nulla da inviare (controlla che l'estrazione e `rsync` siano avvenuti nella cartella giusta). Se `git clone` segnala una directory esistente ma non Git, usa una directory diversa o sposta la cartella locale con cautela; non sovrascrivere dati personali.

## Verifica del sito

1. Controlla il deploy in https://github.com/Eleman07/Astraforge/actions.
2. Apri https://eleman07.github.io/Astraforge/ e usa Ctrl+Shift+R.
3. Seleziona **Aerospace engineering** e verifica che il modulo ASTRA sia selezionato.
4. Nell'editor esegui:

```python
import astra
from astra.client import AstraClient
print('ASTRA SDK', astra.__version__)
```

Deve comparire `ASTRA SDK 1.3.0` senza cliccare **Load selected packages**.
5. Ripremi **Run**: non deve reinstallare il wheel finché non premi **Reset** o chiudi la scheda.
6. Se appare ancora il vecchio errore, controlla il download dell'asset con l'URL:
   https://eleman07.github.io/Astraforge/wheels/astra_simulator_client-1.3.0-py3-none-any.whl
   Se il file non si scarica, controlla che la cartella `wheels/` sia stata inviata sul branch `main` e che il deploy sia riuscito.
7. Se il sito è ancora vecchio: F12 → Application → Service Workers → Unregister per la voce Astraforge, poi ricarica la pagina.

> Installare/importare ASTRA SDK non rende automaticamente funzionante la connessione del client HTTP al simulatore ASTRA remoto. Nel browser sono ancora necessari un trasporto compatibile (Fetch), HTTPS e CORS abilitato dall'API.
