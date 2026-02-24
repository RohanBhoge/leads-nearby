/**
 * E2E Encryption utilities using Web Crypto API
 * - ECDH P-256 for key exchange
 * - AES-256-GCM for message encryption
 * - IndexedDB for private key storage
 */

const DB_NAME = 'leads-nearby-crypto';
const STORE_NAME = 'keys';
const PRIVATE_KEY_ID = 'ecdh-private-key';

// ========== IndexedDB helpers ==========

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getFromIDB(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putToIDB(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== Key Generation & Management ==========

/**
 * Generate a new ECDH key pair for key exchange
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true, // extractable (needed to export public key)
        ['deriveKey']
    );
}

/**
 * Export a public key to JWK format (for storing in DB)
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const jwk = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(jwk);
}

/**
 * Import a public key from JWK format (from DB)
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString);
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
    );
}

/**
 * Store the private key securely in IndexedDB
 */
export async function storePrivateKey(privateKey: CryptoKey): Promise<void> {
    const jwk = await crypto.subtle.exportKey('jwk', privateKey);
    await putToIDB(PRIVATE_KEY_ID, jwk);
}

/**
 * Retrieve the private key from IndexedDB
 */
export async function getStoredPrivateKey(): Promise<CryptoKey | null> {
    const jwk = await getFromIDB(PRIVATE_KEY_ID);
    if (!jwk) return null;

    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
    );
}

/**
 * Get or create the user's ECDH key pair.
 * Returns { privateKey, publicKeyJwk }
 */
export async function getOrCreateKeyPair(): Promise<{
    privateKey: CryptoKey;
    publicKeyJwk: string;
}> {
    let privateKey = await getStoredPrivateKey();

    if (privateKey) {
        // Derive public key from existing private key by re-exporting
        // We need to store public key too, or regenerate
        const publicKeyJwk = await getFromIDB('ecdh-public-key-jwk');
        if (publicKeyJwk) {
            return { privateKey, publicKeyJwk };
        }
    }

    // Generate new pair
    const keyPair = await generateKeyPair();
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);

    await storePrivateKey(keyPair.privateKey);
    await putToIDB('ecdh-public-key-jwk', publicKeyJwk);

    return { privateKey: keyPair.privateKey, publicKeyJwk };
}

// ========== Key Derivation ==========

/**
 * Derive a shared AES-256-GCM key from own private key + other's public key
 */
export async function deriveSharedKey(
    privateKey: CryptoKey,
    otherPublicKey: CryptoKey
): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
        { name: 'ECDH', public: otherPublicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ========== Encryption / Decryption ==========

/**
 * Encrypt a plaintext message with AES-256-GCM
 * Returns { ciphertext, iv } as base64 strings
 */
export async function encryptMessage(
    sharedKey: CryptoKey,
    plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedKey,
        data
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

/**
 * Decrypt a ciphertext message with AES-256-GCM
 * Returns the plaintext string
 */
export async function decryptMessage(
    sharedKey: CryptoKey,
    ciphertext: string,
    iv: string
): Promise<string> {
    const decoder = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
        sharedKey,
        base64ToArrayBuffer(ciphertext)
    );

    return decoder.decode(decrypted);
}

// ========== Utility ==========

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
