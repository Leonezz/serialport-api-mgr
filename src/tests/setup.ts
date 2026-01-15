import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Tauri environment variables
Object.defineProperty(globalThis, "__TAURI_ENV_TARGET_TRIPLE__", {
  value: "test",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_PLATFORM_VERSION__", {
  value: "test",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_ARCH__", {
  value: "test",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_FAMILY__", {
  value: "test",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_DEBUG__", {
  value: "false",
  writable: true,
});

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

// Mock Tauri plugin-store
vi.mock("@tauri-apps/plugin-store", () => {
  class StoreMock {
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue(undefined);
    save = vi.fn().mockResolvedValue(undefined);
    load = vi.fn().mockResolvedValue(undefined);
  }

  class LazyStoreMock {
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue(undefined);
    save = vi.fn().mockResolvedValue(undefined);
    load = vi.fn().mockResolvedValue(undefined);
  }

  return {
    Store: StoreMock,
    LazyStore: LazyStoreMock,
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
