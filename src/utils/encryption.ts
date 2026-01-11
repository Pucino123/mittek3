/**
 * MitTek Vault Encryption Utilities
 * 
 * End-to-end encryption using WebCrypto API
 * - AES-GCM for symmetric encryption
 * - PBKDF2 for key derivation from passphrase
 * 
 * IMPORTANT: The passphrase is NEVER stored. Only the salt and KDF params
 * are stored in the database. If the user forgets their passphrase,
 * their vault data cannot be recovered.
 */

// Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random salt for PBKDF2
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt.buffer);
}

// Generate a random IV for AES-GCM
export function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return arrayBufferToBase64(iv.buffer);
}

// Derive encryption key from passphrase using PBKDF2
export async function deriveKey(
  passphrase: string,
  salt: string,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBuffer = encoder.encode(passphrase);
  const saltBuffer = base64ToArrayBuffer(salt);

  // Import passphrase as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passphraseBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

// Encrypt plaintext using AES-GCM
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// Decrypt ciphertext using AES-GCM
export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    ciphertextBuffer
  );

  return decoder.decode(plaintextBuffer);
}

// Validate passphrase by attempting to decrypt a test value
export async function validatePassphrase(
  passphrase: string,
  salt: string,
  testCiphertext: string,
  testIv: string,
  iterations: number = 100000
): Promise<boolean> {
  try {
    const key = await deriveKey(passphrase, salt, iterations);
    await decrypt(testCiphertext, testIv, key);
    return true;
  } catch {
    return false;
  }
}
