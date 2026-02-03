import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  encryptForStorage,
  decryptFromStorage,
  needsMigration,
  migrateToEncrypted,
  getEncryptionKey,
} from "../../lib/apiKeyEncryption";

describe("apiKeyEncryption", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getEncryptionKey", () => {
    it("should generate and store a new key on first call", async () => {
      expect(localStorage.getItem("serialport-encryption-key")).toBeNull();
      const key = await getEncryptionKey();
      expect(key).toBeDefined();
      expect(key.type).toBe("secret");
      expect(localStorage.getItem("serialport-encryption-key")).not.toBeNull();
    });

    it("should return consistent key across calls", async () => {
      const key1 = await getEncryptionKey();
      const key2 = await getEncryptionKey();
      expect(key1).toBe(key2);
    });
  });

  describe("encryptForStorage / decryptFromStorage", () => {
    it("should encrypt and decrypt an API key round-trip", async () => {
      const apiKey = "AIzaSyTest1234567890";
      const encrypted = await encryptForStorage(apiKey);
      expect(encrypted).not.toBe(apiKey);
      expect(encrypted).toContain(":");
      const decrypted = await decryptFromStorage(encrypted);
      expect(decrypted).toBe(apiKey);
    });

    it("should return empty string for empty input", async () => {
      expect(await encryptForStorage("")).toBe("");
      expect(await encryptForStorage("  ")).toBe("");
      expect(await decryptFromStorage("")).toBe("");
      expect(await decryptFromStorage("  ")).toBe("");
    });

    it("should return plaintext key as-is if not encrypted", async () => {
      const plaintextKey = "sk-plaintext-key-123";
      const result = await decryptFromStorage(plaintextKey);
      expect(result).toBe(plaintextKey);
    });

    it("should handle decryption failure gracefully", async () => {
      // Encrypt with one key, then clear localStorage to force a new key
      const encrypted = await encryptForStorage("test-api-key");
      localStorage.removeItem("serialport-encryption-key");
      // Force a new key by clearing the module-level cache
      // Since we can't clear the cached key directly, we test with
      // a value that looks encrypted but has invalid base64 payload
      // Use valid base64 chars only to pass isEncrypted check
      const fakeEncrypted =
        "AAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const result = await decryptFromStorage(fakeEncrypted);
      expect(result).toBe("");
      consoleSpy.mockRestore();
    });
  });

  describe("needsMigration", () => {
    it("should return true for plaintext API keys", () => {
      expect(needsMigration("sk-proj-abc123")).toBe(true);
      expect(needsMigration("AIzaSyTest1234567890")).toBe(true);
    });

    it("should return false for empty values", () => {
      expect(needsMigration("")).toBe(false);
      expect(needsMigration("  ")).toBe(false);
    });

    it("should return false for already encrypted values", async () => {
      const encrypted = await encryptForStorage("test-key");
      expect(needsMigration(encrypted)).toBe(false);
    });
  });

  describe("migrateToEncrypted", () => {
    it("should encrypt a plaintext key", async () => {
      const plaintext = "sk-test-key-12345";
      const encrypted = await migrateToEncrypted(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(":");
      const decrypted = await decryptFromStorage(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should return empty string for empty input", async () => {
      expect(await migrateToEncrypted("")).toBe("");
      expect(await migrateToEncrypted("  ")).toBe("");
    });
  });
});
