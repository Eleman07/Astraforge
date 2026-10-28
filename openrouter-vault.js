/**
 * AstraForge OpenRouter personal key vault.
 * Per-origin IndexedDB storage with AES-256-GCM ciphertext and a non-extractable
 * Web Crypto key. No passphrase required; browser profile access and scripts
 * executing on this origin can still decrypt. Never use this for shared secrets.
 * No API key is sent to a server by this module.
 */
const DB_NAME = 'astraforge-local-credentials-v1';
const STORE = 'secrets';
const RECORD = 'openrouter-api-key';

function requireFeatures() {
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle || !globalThis.indexedDB) {
    throw new Error('Secure local key storage needs HTTPS, Web Crypto and IndexedDB.');
  }
}

function openVault() {
  requireFeatures();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || Error('Cannot open local credential storage'));
    request.onblocked = () => reject(Error('Key storage upgrade blocked by another tab'));
  });
}

async function withStore(mode, action) {
  const db = await openVault();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      let value;
      request.onsuccess = () => { value = request.result; };
      request.onerror = () => reject(request.error || Error('Cannot access key storage'));
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || Error('Key storage transaction failed'));
      tx.onabort = () => reject(tx.error || Error('Key storage transaction aborted'));
    });
  } finally {
    db.close();
  }
}

export async function saveOpenRouterKey(secret) {
  if (typeof secret !== 'string' || !secret.trim()) throw Error('Enter a valid API key before saving.');
  requireFeatures();
  const value = secret.trim();
  // 256-bit key remains non-extractable; it is stored as a structured-cloned CryptoKey.
  const key = await crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt','decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(value));
  await withStore('readwrite', store => store.put({version: 1, key, iv, ciphertext}, RECORD));
  return value;
}

export async function loadOpenRouterKey() {
  const item = await withStore('readonly', store => store.get(RECORD));
  if (item == null) return null;
  if (item.version !== 1 || !item.key || !item.iv || !item.ciphertext) {
    throw Error('Saved key format is not recognized; remove it and save a new key.');
  }
  try {
    const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv:item.iv}, item.key, item.ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    throw Error('Could not decrypt the saved key. Remove it and save a new key.');
  }
}

export async function forgetOpenRouterKey() {
  await withStore('readwrite', store => store.delete(RECORD));
}
