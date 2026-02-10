import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupMSW, server } from "@/tests/mocks/server";
import {
  generateProjectFromDescription,
  analyzeSerialLog,
  getGeminiChatModel,
} from "@/services/geminiService";
import { useStore } from "@/lib/store";
import type { LogEntry } from "@/types";

setupMSW();

// Helper: build a Gemini-style generateContent response
function geminiResponse(text: string, promptTokens = 10, responseTokens = 20) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text }],
          role: "model",
        },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: responseTokens,
      totalTokenCount: promptTokens + responseTokens,
    },
  };
}

// Valid AI project result matching AIProjectResultSchema
const validProjectResult = {
  deviceName: "Test Device",
  config: { baudRate: 115200 },
  commands: [
    {
      name: "Test Command",
      payload: "TEST",
      mode: "TEXT",
    },
  ],
  sequences: [],
};

describe("geminiService", () => {
  beforeEach(() => {
    // Reset module-level state by clearing cached AI instance
    // The service caches the GoogleGenAI instance, so we need to ensure
    // each test has a fresh state
    vi.restoreAllMocks();

    // Mock store methods
    const store = useStore.getState();
    vi.spyOn(store, "getDecryptedApiKey").mockResolvedValue("test-api-key");

    // Reset the addTokenUsage to a trackable spy
    const addTokenUsage = vi.fn();
    useStore.setState({ addTokenUsage } as never);
  });

  describe("getGeminiChatModel", () => {
    it("returns the expected model name", () => {
      expect(getGeminiChatModel()).toBe("gemini-3-flash-preview");
    });
  });

  describe("generateProjectFromDescription", () => {
    it("returns validated project result on successful API response", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            geminiResponse(JSON.stringify(validProjectResult)),
          );
        }),
      );

      const result = await generateProjectFromDescription(
        "Configure a test serial device",
      );

      expect(result.deviceName).toBe("Test Device");
      expect(result.config?.baudRate).toBe(115200);
      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].name).toBe("Test Command");
      expect(result.sourceText).toBe("Configure a test serial device");
      expect(result.usage).toBeDefined();
    });

    it("handles JSON wrapped in markdown code blocks", async () => {
      const wrappedJson =
        "```json\n" + JSON.stringify(validProjectResult) + "\n```";
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(geminiResponse(wrappedJson));
        }),
      );

      const result = await generateProjectFromDescription("test");
      expect(result.deviceName).toBe("Test Device");
    });

    it("includes attachment info in sourceText when provided", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            geminiResponse(JSON.stringify(validProjectResult)),
          );
        }),
      );

      const result = await generateProjectFromDescription("test", {
        name: "datasheet.pdf",
        mimeType: "application/pdf",
        data: "base64data",
      });

      expect(result.sourceText).toBe("test [Attached File: datasheet.pdf]");
    });

    it("throws on API key not configured", async () => {
      vi.spyOn(useStore.getState(), "getDecryptedApiKey").mockResolvedValue("");

      // Also ensure process.env.API_KEY is not set
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = "";

      await expect(generateProjectFromDescription("test")).rejects.toThrow(
        "API key not configured",
      );

      process.env.API_KEY = originalApiKey;
    });

    it("throws with Zod error on invalid AI response structure", async () => {
      const invalidResult = {
        deviceName: "Test",
        // Missing required 'commands' array
      };
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            geminiResponse(JSON.stringify(invalidResult)),
          );
        }),
      );

      await expect(generateProjectFromDescription("test")).rejects.toThrow(
        "AI generated invalid configuration structure",
      );
    });

    it("throws user-friendly message on 400 Bad Request", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            { error: { message: "API key not valid", code: 400 } },
            { status: 400 },
          );
        }),
      );

      await expect(generateProjectFromDescription("test")).rejects.toThrow();
    });

    it("throws user-friendly message on 429 Rate Limit", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            {
              error: {
                message: "Resource exhausted: quota exceeded",
                code: 429,
              },
            },
            { status: 429 },
          );
        }),
      );

      await expect(generateProjectFromDescription("test")).rejects.toThrow();
    });

    it("throws user-friendly message on 500 Server Error", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            { error: { message: "Internal server error", code: 500 } },
            { status: 500 },
          );
        }),
      );

      await expect(generateProjectFromDescription("test")).rejects.toThrow();
    });

    it("throws on network error", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.error();
        }),
      );

      await expect(generateProjectFromDescription("test")).rejects.toThrow();
    });
  });

  describe("analyzeSerialLog", () => {
    const mockLogs: LogEntry[] = [
      {
        id: "1",
        timestamp: Date.now(),
        direction: "TX" as const,
        data: new Uint8Array([0x48, 0x45, 0x4c, 0x4c, 0x4f]),
        format: "TEXT" as const,
      },
      {
        id: "2",
        timestamp: Date.now(),
        direction: "RX" as const,
        data: new Uint8Array([0x4f, 0x4b]),
        format: "TEXT" as const,
      },
    ];

    it("returns analysis text on successful response", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            geminiResponse("This is a simple text protocol exchange."),
          );
        }),
      );

      const result = await analyzeSerialLog(mockLogs, new Map());
      expect(result).toBe("This is a simple text protocol exchange.");
    });

    it("returns fallback message when response has no text", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json({
            candidates: [
              {
                content: { parts: [{ text: "" }], role: "model" },
                finishReason: "STOP",
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 0,
              totalTokenCount: 5,
            },
          });
        }),
      );

      const result = await analyzeSerialLog(mockLogs, new Map());
      expect(result).toBe("No analysis generated.");
    });

    it("returns user-friendly message when API key is not configured", async () => {
      vi.spyOn(useStore.getState(), "getDecryptedApiKey").mockResolvedValue("");
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = "";

      const result = await analyzeSerialLog(mockLogs, new Map());
      expect(result).toContain("API key not configured");

      process.env.API_KEY = originalApiKey;
    });

    it("returns error message on network failure", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.error();
        }),
      );

      const result = await analyzeSerialLog(mockLogs, new Map());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns error message on API error response", async () => {
      server.use(
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json(
            { error: { message: "API key not valid", code: 400 } },
            { status: 400 },
          );
        }),
      );

      const result = await analyzeSerialLog(mockLogs, new Map());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("includes context information when contexts are provided", async () => {
      const logsWithContext: LogEntry[] = [
        {
          id: "1",
          timestamp: Date.now(),
          direction: "TX" as const,
          data: new Uint8Array([0x01, 0x03]),
          format: "HEX" as const,
          contextIds: ["ctx-1"],
        },
      ];

      const contexts = new Map([
        [
          "ctx-1",
          {
            id: "ctx-1",
            title: "Modbus Protocol",
            content: "Modbus RTU protocol documentation...",
            type: "PROTOCOL" as const,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      ]);

      let capturedBody = "";
      server.use(
        http.post(
          "https://generativelanguage.googleapis.com/*",
          async ({ request }) => {
            capturedBody = await request.text();
            return HttpResponse.json(
              geminiResponse("Modbus RTU read holding registers request."),
            );
          },
        ),
      );

      const result = await analyzeSerialLog(logsWithContext, contexts);
      expect(result).toBe("Modbus RTU read holding registers request.");
      // The prompt sent to the API should include context info
      expect(capturedBody).toContain("Modbus Protocol");
    });
  });
});
