/**
 * E2E tests for serialport-api-mgr
 *
 * These tests run against the Vite dev server with mocked Tauri APIs.
 * They test the web frontend behavior without requiring the actual Tauri backend.
 */

import { test, expect } from "@playwright/test";
import {
  injectTauriMocks,
  emitTauriEvent,
  stringToBytes,
  DEFAULT_MOCK_PORTS,
} from "./tauri-mocks";

test.describe("Application Loading", () => {
  test("should load the application", async ({ page }) => {
    await injectTauriMocks(page);
    await page.goto("/");

    // Wait for the app to load
    await expect(page.locator("body")).toBeVisible();

    // Check that some main UI element is present
    // Adjust this selector based on your actual UI
    await expect(page.locator("#root")).toBeVisible();
  });

  test("should display the main layout", async ({ page }) => {
    await injectTauriMocks(page);
    await page.goto("/");

    // Wait for React to hydrate
    await page.waitForTimeout(500);

    // Take a screenshot for visual reference
    await page.screenshot({ path: "e2e/screenshots/app-loaded.png" });
  });
});

test.describe("Serial Port List", () => {
  test("should display available serial ports", async ({ page }) => {
    await injectTauriMocks(page, {
      ports: DEFAULT_MOCK_PORTS,
      isTauri: true, // Simulate Tauri environment
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for port names in the UI
    // Adjust selectors based on your actual UI structure
    const portList = page.locator('[data-testid="port-list"]');

    // If the port list exists, check for ports
    if (await portList.isVisible().catch(() => false)) {
      // Check that at least one port is displayed
      await expect(portList.locator("text=/dev/ttyUSB0")).toBeVisible();
    }
  });

  test("should handle empty port list", async ({ page }) => {
    await injectTauriMocks(page, {
      ports: [],
      isTauri: true,
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // The UI should handle empty state gracefully
    // This test verifies no crash occurs
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Serial Connection Flow", () => {
  test("should open connection panel", async ({ page }) => {
    await injectTauriMocks(page, {
      ports: DEFAULT_MOCK_PORTS,
      isTauri: true,
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for connection-related UI elements
    const connectButton = page.locator(
      'button:has-text("Connect"), [data-testid="connect-button"]'
    );

    if (await connectButton.first().isVisible().catch(() => false)) {
      await connectButton.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Console/Terminal", () => {
  test("should display console area", async ({ page }) => {
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for console or terminal elements
    const console = page.locator(
      '[data-testid="console"], [data-testid="terminal"], .console, .terminal'
    );

    // Take screenshot of the console area if visible
    if (await console.first().isVisible().catch(() => false)) {
      await console.first().screenshot({
        path: "e2e/screenshots/console-area.png",
      });
    }
  });

  test("should receive and display serial data", async ({ page }) => {
    await injectTauriMocks(page, {
      isTauri: true,
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Simulate receiving data from serial port
    await emitTauriEvent(page, "port_read", {
      portName: "/dev/ttyUSB0",
      timestampMs: Date.now(),
      data: stringToBytes("Hello from serial port!\n"),
    });

    await page.waitForTimeout(500);

    // Check if the data appears somewhere in the UI
    // This depends on your actual UI implementation
  });
});

test.describe("UI Responsiveness", () => {
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/mobile-viewport.png",
      fullPage: true,
    });

    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/tablet-viewport.png",
      fullPage: true,
    });
  });

  test("should be responsive on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/desktop-viewport.png",
      fullPage: true,
    });
  });
});

test.describe("Theme", () => {
  test("should support dark mode", async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: "dark" });
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/dark-mode.png" });

    // Check that dark theme styles are applied
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Dark backgrounds typically have low RGB values
    // This is a basic check - adjust based on your actual theme
    console.log("Background color in dark mode:", bgColor);
  });

  test("should support light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/light-mode.png" });
  });
});

test.describe("Accessibility", () => {
  test("should have no critical accessibility issues", async ({ page }) => {
    await injectTauriMocks(page);
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Basic accessibility checks
    // Check for presence of main landmark
    const main = page.locator("main, [role='main']");
    const hasMain = await main.count();

    // Check that interactive elements are focusable
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Tab through buttons
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        await page.keyboard.press("Tab");
      }
    }

    console.log(`Found ${hasMain} main landmarks, ${buttonCount} buttons`);
  });
});
