/**
 * API Key Encryption Management
 *
 * Handles encryption/decryption of API keys stored in the Zustand store.
 * Uses Web Crypto API for browser-compatible AES-GCM encryption.
 */

import {
  encryptApiKey,
  decryptApiKey,
  generateEncryptionKey,
  exportKey,
  importKey,
  isEncrypted,
} from "./crypto";

const ENCRYPTION_KEY_STORAGE = "serialport-encryption-key";

// Cached encryption key to avoid repeated imports
let cachedKey: CryptoKey | null = null;

/**
 * Get or create the encryption key for API key storage
 */
export async function getEncryptionKey(): Promise<CryptoKey> {
  // Return cached key if available
  if (cachedKey) {
    return cachedKey;
  }

  const stored = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  if (stored) {
    cachedKey = await importKey(stored);
    return cachedKey;
  }

  // Generate new key
  const key = await generateEncryptionKey();
  const exported = await exportKey(key);
  localStorage.setItem(ENCRYPTION_KEY_STORAGE, exported);
  cachedKey = key;
  return key;
}

/**
 * Encrypt an API key for storage
 * Returns the encrypted string, or empty string if input is empty
 */
export async function encryptForStorage(apiKey: string): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    return "";
  }

  const key = await getEncryptionKey();
  return encryptApiKey(apiKey.trim(), key);
}

/**
 * Decrypt an API key from storage
 * Handles both encrypted and legacy plaintext keys
 */
export async function decryptFromStorage(storedValue: string): Promise<string> {
  if (!storedValue || !storedValue.trim()) {
    return "";
  }

  // If not encrypted, return as-is (legacy plaintext key)
  if (!isEncrypted(storedValue)) {
    return storedValue;
  }

  try {
    const key = await getEncryptionKey();
    return await decryptApiKey(storedValue, key);
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    // Return empty string on decryption failure
    // User will need to re-enter their API key
    return "";
  }
}

/**
 * Check if a stored value needs migration (is plaintext)
 */
export function needsMigration(storedValue: string): boolean {
  if (!storedValue || !storedValue.trim()) {
    return false;
  }
  return !isEncrypted(storedValue);
}

/**
 * Migrate a plaintext API key to encrypted format
 * Returns the encrypted value
 */
export async function migrateToEncrypted(
  plaintextKey: string,
): Promise<string> {
  if (!plaintextKey || !plaintextKey.trim()) {
    return "";
  }
  return encryptForStorage(plaintextKey);
}

// Re-export isEncrypted for convenience
export { isEncrypted };
