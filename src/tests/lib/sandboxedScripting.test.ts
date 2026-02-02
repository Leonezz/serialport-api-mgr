import { describe, it, expect } from "vitest";
import { executeSandboxedScript } from "../../lib/sandboxedScripting";

describe("sandboxedScripting", () => {
  describe("executeSandboxedScript", () => {
    it("should execute simple arithmetic", async () => {
      const result = await executeSandboxedScript("return 2 + 2", {});
      expect(result).toBe(4);
    });

    it("should access context variables", async () => {
      const result = await executeSandboxedScript("return context.value * 2", {
        value: 21,
      });
      expect(result).toBe(42);
    });

    it("should handle Uint8Array in context", async () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      const result = await executeSandboxedScript(
        "return context.data.length",
        { data },
      );
      expect(result).toBe(4);
    });

    it("should timeout on infinite loops", async () => {
      await expect(
        executeSandboxedScript("while(true){}", {}, { timeout: 100 }),
      ).rejects.toThrow();
    });

    it("should NOT have access to window", async () => {
      const result = await executeSandboxedScript("return typeof window", {});
      expect(result).toBe("undefined");
    });

    it("should NOT have access to fetch", async () => {
      const result = await executeSandboxedScript("return typeof fetch", {});
      expect(result).toBe("undefined");
    });

    it("should NOT have access to localStorage", async () => {
      const result = await executeSandboxedScript(
        "return typeof localStorage",
        {},
      );
      expect(result).toBe("undefined");
    });

    it("should handle script errors gracefully", async () => {
      await expect(
        executeSandboxedScript("throw new Error('test error')", {}),
      ).rejects.toThrow("test error");
    });

    it("should provide Math built-in", async () => {
      const result = await executeSandboxedScript("return Math.floor(3.7)", {});
      expect(result).toBe(3);
    });
  });
});
