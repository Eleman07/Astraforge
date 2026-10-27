# Come aggiornare AstraForge a 5.4 su Windows 11 (PowerShell)

**Repository ufficiale:** https://github.com/Eleman07/Astraforge

**Versione sorgente di partenza:** 5.3 Holst (verificata nel repository `main` prima di creare questa patch).

## 0. Prerequisiti

Apri **Windows PowerShell** oppure **Windows Terminal → PowerShell**. Verifica Git:

```powershell
git --version
```

Se Git non viene trovato, puoi installarlo con:

```powershell
winget install --id Git.Git -e --source winget
```

Dopo l'installazione **chiudi e riapri PowerShell**.

## 1. Apri o clona il repository

Questo esempio usa `Documents\Astraforge`; se il progetto è già in un'altra cartella, modifica il valore di `$repo`.

```powershell
$repo = Join-Path $HOME 'Documents\Astraforge'

if (-not (Test-Path (Join-Path $repo '.git'))) {
    git clone https://github.com/Eleman07/Astraforge.git $repo
}

Set-Location $repo
git status
git pull --ff-only origin main
```

Se `git status` mostra modifiche locali, controllale e salvale prima del `pull`; **non cancellare lavori esistenti**.

## 2. Estrai la PATCH

Scarica **`astraforge-5.4-observatory-PATCH.zip`** nella cartella Download di Windows. Esegui:

```powershell
$zip = Join-Path $HOME 'Downloads\astraforge-5.4-observatory-PATCH.zip'
$stage = Join-Path $env:TEMP 'astraforge-5.4-update'

if (-not (Test-Path $zip)) { throw "ZIP non trovato: $zip" }
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $stage -Force
```

## 3. Copia i file nel repository senza eliminare i tuoi progetti

```powershell
robocopy $stage $repo /E /R:1 /W:1
if ($LASTEXITCODE -gt 7) { throw 'Errore durante la copia con robocopy' }

Remove-Item (Join-Path $repo 'holst-theme.css') -ErrorAction SilentlyContinue
Set-Location $repo
git status
git diff --stat
```

`robocopy` non usa `/MIR`, quindi **non elimina** altri file dal repository. L'unica eliminazione proposta riguarda il vecchio stylesheet Holst, non più utilizzato.

## 4. Verifica i file e pubblica

Se hai Node.js (opzionale), verifica la sintassi:

```powershell
node --check .\app.js
node --check .\webviz.js
node --check .\sw.js
```

Poi pubblica:

```powershell
git add -A
git commit -m "AstraForge 5.4 - Observatory Azure redesign"
git push origin main
```

Se Git ti chiede di autenticarti, completa l'accesso tramite il browser o Git Credential Manager. **Non inserire un token personale nel codice dell'app.**

Se non compare alcuna modifica dopo `git add -A`, Git dirà che non c'è nulla da committare; significa che l'aggiornamento è già presente o non è stato copiato correttamente. Controlla `git status`.

## 5. Controlla il deployment e prova l'interfaccia

1. Apri https://github.com/Eleman07/Astraforge/actions e verifica che il deployment sia verde.
2. Apri https://eleman07.github.io/Astraforge/ e premi `Ctrl+Shift+R`.
3. Desktop: conferma la presenza dell'editor a sinistra, della scena orbitale illustrativa a destra e del tasto **Run** azzurro.
4. Premi `Ctrl+K`, cerca `NumPy`, poi apri un file con la stessa ricerca.
5. Premi **Run 3D sample** e verifica che il placeholder venga sostituito da un vero canvas WebGL interattivo.
6. Prova uno script NumPy, una UI Python e SQLite dal catalogo degli esempi.
7. Sul telefono, usa le schede **Code / Visualize / Database / Astra AI**.

**Attenzione:** la prima esecuzione deve scaricare Pyodide e alcune librerie dalla rete. La visualizzazione introduttiva non rappresenta dati fisici eseguiti finché non lanci un esempio.

Se vedi ancora l'interfaccia precedente, chiudi la scheda, riapri e forza l'aggiornamento. Solo se persiste, dalla scheda Application/Applicazione di DevTools puoi rimuovere il service worker del sito e ricaricare.

## Versione FULL

La versione `astraforge-5.4-observatory-FULL.zip` include tutti i file sorgente di 5.4. È utile per partire da un nuovo clone o ricostruire il sito, ma per aggiornare il repository attuale è consigliata la **PATCH**.
