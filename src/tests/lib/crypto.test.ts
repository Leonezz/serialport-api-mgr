import { describe, it, expect } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  generateEncryptionKey,
} from "../../lib/crypto";

describe("crypto utilities", () => {
  it("should encrypt and decrypt API key", async () => {
    const originalKey = "sk-test-api-key-12345";
    const encryptionKey = await generateEncryptionKey();

    const encrypted = await encryptApiKey(originalKey, encryptionKey);
    expect(encrypted).not.toBe(originalKey);
    expect(encrypted).toContain(":"); // IV:ciphertext format

    const decrypted = await decryptApiKey(encrypted, encryptionKey);
    expect(decrypted).toBe(originalKey);
  });

  it("should produce different ciphertext for same plaintext", async () => {
    const key = "test-key";
    const encryptionKey = await generateEncryptionKey();

    const encrypted1 = await encryptApiKey(key, encryptionKey);
    const encrypted2 = await encryptApiKey(key, encryptionKey);

    // Different IVs should produce different ciphertext
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail to decrypt with wrong key", async () => {
    const originalKey = "test-api-key";
    const key1 = await generateEncryptionKey();
    const key2 = await generateEncryptionKey();

    const encrypted = await encryptApiKey(originalKey, key1);

    await expect(decryptApiKey(encrypted, key2)).rejects.toThrow();
  });
});
