/**
 * Cryptographic utilities for secure API key storage
 * Uses Web Crypto API for browser-compatible encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Generate a new encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable for storage
    ["encrypt", "decrypt"],
  );
}

/**
 * Export encryption key to storable format
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import encryption key from stored format
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt an API key
 * @returns Encrypted string in format "iv:ciphertext" (base64 encoded)
 */
export async function encryptApiKey(
  apiKey: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    encryptionKey,
    data,
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext)),
  );

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypt an API key
 * @param encrypted - Encrypted string in format "iv:ciphertext"
 */
export async function decryptApiKey(
  encrypted: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  const [ivBase64, ciphertextBase64] = encrypted.split(":");

  if (!ivBase64 || !ciphertextBase64) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), (c) =>
    c.charCodeAt(0),
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    encryptionKey,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a string is in encrypted format
 */
export function isEncrypted(value: string): boolean {
  return value.includes(":") && !value.startsWith("sk-");
}
