# AstraForge 5.5 — OpenRouter Local Key Vault

Aggiornamento del repository GitHub da Windows 11 (PowerShell). **Non inserire mai la tua chiave OpenRouter in questo documento, in Git o nei file `.js`.**

## 1. Apri il tuo repository

Apri Windows Terminal → PowerShell:

```powershell
$repo = Join-Path $HOME 'Documents\Astraforge'
Set-Location $repo
git status
git pull --ff-only origin main
```

Se `git status` mostra modifiche non salvate, crea un commit o uno stash prima di proseguire. Se il percorso è diverso, aggiorna `$repo`.

## 2. Scarica ed estrai la patch

Scarica `astraforge-5.5-openrouter-key-vault-PATCH.zip` nella cartella Downloads.

```powershell
$zip = Join-Path $HOME 'Downloads\astraforge-5.5-openrouter-key-vault-PATCH.zip'
$stage = Join-Path $env:TEMP 'astraforge-5.5-patch'
if (-not (Test-Path $zip)) { throw "ZIP non trovato: $zip" }
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $stage -Force
```

## 3. Copia i file e pubblica

```powershell
robocopy $stage $repo /E /R:1 /W:1
if ($LASTEXITCODE -gt 7) { throw "Errore copia patch: $LASTEXITCODE" }
Set-Location $repo
git diff --stat
git add -A
git commit -m "AstraForge 5.5 - Encrypted local OpenRouter key vault"
git push origin main
```

Se Git mostra `Please tell me who you are`, configura nome ed email **associati al tuo account GitHub** (puoi usare l'indirizzo noreply visibile su https://github.com/settings/emails):

```powershell
git config user.name "Eleman07"
git config user.email "INDIRIZZO_EMAIL_O_NOREPLY_GITHUB"
git commit -m "AstraForge 5.5 - Encrypted local OpenRouter key vault"
git push origin main
```

Verifica il deploy su https://github.com/Eleman07/Astraforge/actions e apri https://eleman07.github.io/Astraforge/ . Aggiorna con **Ctrl+Shift+R** se necessario.

## 4. Salva la tua chiave una volta sola

1. Apri la sezione **Astra AI** e espandi **Model & API key**.
2. Incolla la tua chiave personale OpenRouter (nel campo della pagina web, **non nel terminale Git**).
3. Premi **Save key on this device**: la chiave verrà cifrata e memorizzata in IndexedDB nel profilo browser corrente.
4. Aggiorna la pagina: lo stato deve indicare **Saved key loaded automatically from this browser**.
5. Scrivi una domanda e premi Send: la richiesta usa la chiave caricata anche se il campo password è vuoto.
6. Premi **Forget key** per rimuoverla dal browser.

Il modello OpenRouter selezionato viene ricordato separatamente. Il salvataggio funziona sullo **stesso browser e stesso dispositivo** (non sincronizza tra PC e telefono). In modalità in incognito, o dopo eliminazione dei dati del sito, la chiave può andare persa.

## Nota sulla sicurezza

La chiave è cifrata in IndexedDB con AES-256-GCM; la chiave crittografica non esportabile è conservata **nello stesso profilo browser** per consentire l'accesso automatico. **Non protegge da codice malevolo eseguito sullo stesso origin né da utenti che controllano il profilo browser**. Su PC condivisi utilizza la modalità senza salvataggio. Le richieste all'API OpenRouter inviano la chiave direttamente al provider soltanto quando premi Send.
