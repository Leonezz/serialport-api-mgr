import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useValidation } from "@/hooks/useValidation";
import { useStore } from "@/lib/store";

describe("useValidation", () => {
  beforeEach(() => {
    // Reset store state
    const store = useStore.getState();
    const activeSessionId = store.activeSessionId;

    // Ensure session exists with proper config
    act(() => {
      useStore.setState({
        sessions: {
          [activeSessionId]: {
            ...store.sessions[activeSessionId],
            logs: [],
            variables: {},
          },
        },
        systemLogs: [],
      });
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerValidation", () => {
    it("should register a validation and return a promise", () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      // Register a validation (don't await, just check it returns a promise)
      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 100,
        },
        "Test Command",
      );

      expect(validationPromise).toBeInstanceOf(Promise);

      // Clean up
      result.current.clearValidation(sessionId);
    });

    it("should timeout if no matching data received", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onError = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 50,
        },
        "Test Command",
        undefined,
        onError,
      );

      await expect(validationPromise).rejects.toThrow("validation timeout");
      expect(onError).toHaveBeenCalled();
    });

    it("should add system log on timeout", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 50,
        },
        "Timeout Test",
      );

      await expect(validationPromise).rejects.toThrow();

      await waitFor(() => {
        const systemLogs = useStore.getState().systemLogs;
        const timeoutLog = systemLogs.find(
          (log) =>
            log.message.includes("Timeout Test") &&
            log.message.includes("timeout"),
        );
        expect(timeoutLog).toBeDefined();
      });
    });
  });

  describe("checkValidation - ALWAYS_PASS mode", () => {
    it("should pass validation on any data in ALWAYS_PASS mode", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "ALWAYS_PASS",
          timeout: 1000,
        },
        "Always Pass Command",
        onSuccess,
      );

      // Send any data
      act(() => {
        result.current.checkValidation(new Uint8Array([65, 66, 67]), sessionId);
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("checkValidation - PATTERN mode", () => {
    it("should pass validation with CONTAINS match type", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 1000,
        },
        "Contains Pattern Command",
        onSuccess,
      );

      // Send data containing "OK"
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(
          encoder.encode("Response: OK\r\n"),
          sessionId,
        );
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should not pass validation if pattern not found", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 50,
        },
        "No Match Command",
      );

      // Send data without "OK"
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(encoder.encode("ERROR"), sessionId);
      });

      await expect(validationPromise).rejects.toThrow("timeout");
    });

    it("should pass validation with REGEX match type", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "^OK\\s+\\d+$",
          matchType: "REGEX",
          timeout: 1000,
        },
        "Regex Pattern Command",
        onSuccess,
      );

      // Send data matching regex
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(encoder.encode("OK 123"), sessionId);
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should handle invalid regex gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "PATTERN",
          pattern: "[invalid(regex",
          matchType: "REGEX",
          timeout: 50,
        },
        "Invalid Regex Command",
      );

      // Send any data
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(encoder.encode("test"), sessionId);
      });

      await expect(validationPromise).rejects.toThrow("timeout");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("checkValidation - SCRIPT mode", () => {
    it("should pass validation when script returns true", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "SCRIPT",
          valScript: 'return data.includes("SUCCESS");',
          timeout: 1000,
        },
        "Script Validation Command",
        onSuccess,
      );

      // Send data that makes script return true
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(
          encoder.encode("RESULT: SUCCESS"),
          sessionId,
        );
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should not pass validation when script returns false", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "SCRIPT",
          valScript: 'return data.includes("SUCCESS");',
          timeout: 50,
        },
        "Script Fail Command",
      );

      // Send data that makes script return false
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(encoder.encode("FAILURE"), sessionId);
      });

      await expect(validationPromise).rejects.toThrow("timeout");
    });

    it("should handle script errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "SCRIPT",
          valScript: "throw new Error('Script error');",
          timeout: 50,
        },
        "Script Error Command",
      );

      // Send any data
      act(() => {
        result.current.checkValidation(new Uint8Array([65]), sessionId);
      });

      await expect(validationPromise).rejects.toThrow("timeout");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should provide raw Uint8Array to validation script", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "SCRIPT",
          valScript: "return raw.length === 3 && raw[0] === 65;",
          timeout: 1000,
        },
        "Raw Data Command",
        onSuccess,
      );

      act(() => {
        result.current.checkValidation(new Uint8Array([65, 66, 67]), sessionId);
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("transform script execution", () => {
    it("should execute transform script on successful validation", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "ALWAYS_PASS",
          transformScript: 'setVar("TestVar", 42);',
          timeout: 1000,
        },
        "Transform Command",
      );

      act(() => {
        result.current.checkValidation(new Uint8Array([65]), sessionId);
      });

      await validationPromise;

      // Check that variable was set
      const session = useStore.getState().sessions[sessionId];
      expect(session.variables["TestVar"]).toBeDefined();
      expect(session.variables["TestVar"].value).toBe(42);
    });

    it("should provide log function to transform script", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "ALWAYS_PASS",
          transformScript: 'log("Test message from script");',
          timeout: 1000,
        },
        "Log Command",
      );

      act(() => {
        result.current.checkValidation(new Uint8Array([65]), sessionId);
      });

      await validationPromise;

      // Check that log was added
      await waitFor(() => {
        const systemLogs = useStore.getState().systemLogs;
        const scriptLog = systemLogs.find((log) =>
          log.message.includes("Test message from script"),
        );
        expect(scriptLog).toBeDefined();
      });
    });

    it("should provide params to transform script", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "ALWAYS_PASS",
          transformScript: 'setVar("ParamValue", params.testParam);',
          params: { testParam: "hello" },
          timeout: 1000,
        },
        "Params Command",
      );

      act(() => {
        result.current.checkValidation(new Uint8Array([65]), sessionId);
      });

      await validationPromise;

      // Check that param value was used
      const session = useStore.getState().sessions[sessionId];
      expect(session.variables["ParamValue"]).toBeDefined();
      expect(session.variables["ParamValue"].value).toBe("hello");
    });

    it("should handle transform script errors gracefully", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "ALWAYS_PASS",
          transformScript: "throw new Error('Transform error');",
          timeout: 1000,
        },
        "Transform Error Command",
      );

      // Should not throw, validation still passes
      act(() => {
        result.current.checkValidation(new Uint8Array([65]), sessionId);
      });

      await validationPromise;

      // Check that error was logged
      await waitFor(() => {
        const systemLogs = useStore.getState().systemLogs;
        const errorLog = systemLogs.find(
          (log) =>
            log.message.includes("Transform Error Command") &&
            log.message.includes("error"),
        );
        expect(errorLog).toBeDefined();
      });
    });
  });

  describe("clearValidation", () => {
    it("should clear all validations for a session", () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;

      // Register multiple validations
      result.current.registerValidation(
        sessionId,
        { mode: "PATTERN", pattern: "A", matchType: "CONTAINS", timeout: 5000 },
        "Command A",
      );
      result.current.registerValidation(
        sessionId,
        { mode: "PATTERN", pattern: "B", matchType: "CONTAINS", timeout: 5000 },
        "Command B",
      );

      // Verify validations are registered
      expect(result.current.activeValidationsRef.current.size).toBe(2);

      // Clear validations
      result.current.clearValidation(sessionId);

      // Verify all validations are cleared
      expect(result.current.activeValidationsRef.current.size).toBe(0);
    });

    it("should only clear validations for specified session", () => {
      const { result } = renderHook(() => useValidation());

      const sessionId1 = useStore.getState().activeSessionId;

      // Add a second session
      act(() => {
        useStore.getState().addSession();
      });

      const sessions = Object.keys(useStore.getState().sessions);
      const sessionId2 = sessions.find((id) => id !== sessionId1)!;

      // Register validations for both sessions
      result.current.registerValidation(
        sessionId1,
        { mode: "ALWAYS_PASS", timeout: 5000 },
        "Session 1 Command",
      );
      result.current.registerValidation(
        sessionId2,
        { mode: "ALWAYS_PASS", timeout: 5000 },
        "Session 2 Command",
      );

      expect(result.current.activeValidationsRef.current.size).toBe(2);

      // Clear only session 1
      result.current.clearValidation(sessionId1);

      // Should have 1 validation remaining (session 2)
      expect(result.current.activeValidationsRef.current.size).toBe(1);

      // Clean up
      result.current.clearValidation(sessionId2);
    });
  });

  describe("session isolation", () => {
    it("should only check validations for matching session", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId1 = useStore.getState().activeSessionId;

      // Add a second session
      act(() => {
        useStore.getState().addSession();
      });

      const sessions = Object.keys(useStore.getState().sessions);
      const sessionId2 = sessions.find((id) => id !== sessionId1)!;

      const onSuccess1 = vi.fn();

      // Register validation for session 1
      const validationPromise = result.current.registerValidation(
        sessionId1,
        {
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 100,
        },
        "Session 1 Command",
        onSuccess1,
      );

      // Send matching data to session 2 (should not trigger session 1's validation)
      const encoder = new TextEncoder();
      act(() => {
        result.current.checkValidation(encoder.encode("OK"), sessionId2);
      });

      // Wait and verify session 1's validation times out
      await expect(validationPromise).rejects.toThrow("timeout");
      expect(onSuccess1).not.toHaveBeenCalled();

      // Clean up
      result.current.clearValidation(sessionId2);
    });
  });

  describe("binary data handling", () => {
    it("should handle non-UTF8 binary data", async () => {
      const { result } = renderHook(() => useValidation());

      const sessionId = useStore.getState().activeSessionId;
      const onSuccess = vi.fn();

      const validationPromise = result.current.registerValidation(
        sessionId,
        {
          mode: "SCRIPT",
          valScript: "return raw[0] === 0xFF && raw[1] === 0xFE;",
          timeout: 1000,
        },
        "Binary Command",
        onSuccess,
      );

      // Send binary data with non-UTF8 bytes
      act(() => {
        result.current.checkValidation(
          new Uint8Array([0xff, 0xfe, 0x00, 0x01]),
          sessionId,
        );
      });

      await validationPromise;
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("activeValidationsRef", () => {
    it("should expose activeValidationsRef", () => {
      const { result } = renderHook(() => useValidation());

      expect(result.current.activeValidationsRef).toBeDefined();
      expect(result.current.activeValidationsRef.current).toBeInstanceOf(Map);
    });
  });
});
