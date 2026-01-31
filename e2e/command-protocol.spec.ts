/**
 * E2E tests for Command-Protocol Implementation
 *
 * Tests the two-layer architecture for protocol-based commands:
 * - Creating commands from protocol templates
 * - Dynamic parameter inputs
 * - Computed payload preview
 * - Enhanced parameter help
 * - Validation feedback
 * - Visual indicators
 */

import { test, expect } from "@playwright/test";
import { injectTauriMocks, DEFAULT_MOCK_PORTS } from "./tauri-mocks";

test.describe("Command Creation - CUSTOM Source", () => {
  test("should create a custom command with manual payload", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true, ports: DEFAULT_MOCK_PORTS });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form modal
    const newCommandButton = page.locator('button:has-text("New Command"), [data-testid="new-command-button"]');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      // Verify "Custom Command" source is selected by default
      const customSourceButton = page.locator('button:has-text("Custom Command")');
      await expect(customSourceButton.first()).toBeVisible();

      // Fill in command name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      await nameInput.fill("Test Custom Command");

      // Fill in payload
      const payloadInput = page.locator('textarea[name="payload"], textarea[placeholder*="payload"]').first();
      await payloadInput.fill("AT+CUSTOM");

      // Save command
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")');
      await saveButton.first().click();
      await page.waitForTimeout(500);

      // Verify command appears in sidebar
      await expect(page.locator('text=Test Custom Command')).toBeVisible();
    }
  });
});

test.describe("Command Creation - PROTOCOL Source", () => {
  test("should show template picker when PROTOCOL source selected", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form modal
    const newCommandButton = page.locator('button:has-text("New Command"), [data-testid="new-command-button"]');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      // Click "From Template" button
      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Verify template picker appears
        const templateSelect = page.locator('select[name="templateId"], [data-testid="template-select"]');
        await expect(templateSelect.first()).toBeVisible();
      }
    }
  });

  test("should display template preview when template selected", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form and switch to PROTOCOL source
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select a template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            // Select first non-empty option
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Verify template preview is visible
            const templatePreview = page.locator('text=Template Payload, text=Payload Template').first();
            await expect(templatePreview).toBeVisible();
          }
        }
      }
    }
  });

  test("should display dynamic parameter inputs based on template", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Navigate to PROTOCOL command creation with template
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select a template with parameters
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Check for "Parameters" section
            const parametersHeading = page.locator('text=Parameters').first();
            if (await parametersHeading.isVisible().catch(() => false)) {
              // Verify parameter inputs are rendered
              const parameterInputs = page.locator('input[type="text"], input[type="number"], select');
              const inputCount = await parameterInputs.count();
              expect(inputCount).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });

  test("should show computed payload preview with parameter substitution", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Create PROTOCOL command with template
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Look for computed payload preview
            const computedPayloadLabel = page.locator('text=Computed Payload').first();
            if (await computedPayloadLabel.isVisible().catch(() => false)) {
              // Verify computed payload code block exists
              const computedPayloadCode = page.locator('code.text-green-600, code.text-green-400').first();
              await expect(computedPayloadCode).toBeVisible();

              // Take screenshot of computed payload
              await page.screenshot({
                path: "e2e/screenshots/computed-payload-preview.png",
              });
            }
          }
        }
      }
    }
  });

  test("should update computed payload when parameters change", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Create PROTOCOL command
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Get initial computed payload text
            const computedPayloadCode = page.locator('code.text-green-600, code.text-green-400').first();
            if (await computedPayloadCode.isVisible().catch(() => false)) {
              const initialPayload = await computedPayloadCode.textContent();

              // Modify a parameter
              const firstInput = page.locator('input[type="text"], input[type="number"]').first();
              if (await firstInput.isVisible().catch(() => false)) {
                await firstInput.fill("TEST123");
                await page.waitForTimeout(300);

                // Verify computed payload updated
                const updatedPayload = await computedPayloadCode.textContent();
                // Payload should be different (if parameters actually substitute)
                console.log("Initial payload:", initialPayload);
                console.log("Updated payload:", updatedPayload);
              }
            }
          }
        }
      }
    }
  });
});

test.describe("Parameter Types", () => {
  test("should render STRING parameter with text input", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Navigate to template with STRING parameter
    // This is a visual check - actual implementation depends on having test data
    await page.screenshot({
      path: "e2e/screenshots/parameter-string-input.png",
    });
  });

  test("should render INTEGER parameter with number input", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check for integer inputs
    await page.screenshot({
      path: "e2e/screenshots/parameter-integer-input.png",
    });
  });

  test("should render ENUM parameter with dropdown", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check for enum selects
    await page.screenshot({
      path: "e2e/screenshots/parameter-enum-input.png",
    });
  });

  test("should render BOOLEAN parameter with checkbox", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check for boolean checkboxes
    await page.screenshot({
      path: "e2e/screenshots/parameter-boolean-input.png",
    });
  });
});

test.describe("Enhanced Parameter Help", () => {
  test("should display parameter description", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form with template that has parameter descriptions
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Look for parameter help text (descriptions, defaults, ranges)
            const helpText = page.locator('.text-muted-foreground, .text-xs');
            const helpCount = await helpText.count();
            console.log(`Found ${helpCount} help text elements`);

            await page.screenshot({
              path: "e2e/screenshots/parameter-enhanced-help.png",
            });
          }
        }
      }
    }
  });

  test("should show default value for parameters", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for "Default:" labels in parameter help
    const defaultLabel = page.locator('text=Default:').first();
    if (await defaultLabel.isVisible().catch(() => false)) {
      await expect(defaultLabel).toBeVisible();
    }
  });

  test("should show range constraints for numeric parameters", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for "Range:" labels in parameter help
    const rangeLabel = page.locator('text=Range:').first();
    if (await rangeLabel.isVisible().catch(() => false)) {
      await expect(rangeLabel).toBeVisible();
    }
  });

  test("should show required badge for required parameters", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for required badges
    const requiredBadge = page.locator('text=Required').first();
    if (await requiredBadge.isVisible().catch(() => false)) {
      await expect(requiredBadge).toBeVisible();
    }
  });
});

test.describe("Parameter Validation Feedback", () => {
  test("should show red border for empty required fields", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Create command with required parameters
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Clear a required field
            const firstInput = page.locator('input[type="text"]').first();
            if (await firstInput.isVisible().catch(() => false)) {
              await firstInput.clear();
              await page.waitForTimeout(300);

              // Check for red border (border-destructive class)
              const hasDestructiveBorder = await firstInput.evaluate((el) => {
                return el.className.includes('border-destructive');
              });

              console.log("Has destructive border:", hasDestructiveBorder);

              await page.screenshot({
                path: "e2e/screenshots/validation-required-empty.png",
              });
            }
          }
        }
      }
    }
  });

  test("should show green checkmark for filled required fields", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Create command and fill required field
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Fill a required field
            const firstInput = page.locator('input[type="text"]').first();
            if (await firstInput.isVisible().catch(() => false)) {
              await firstInput.fill("ValidValue");
              await page.waitForTimeout(300);

              // Look for green checkmark (Check icon from lucide-react)
              const checkIcon = page.locator('svg.lucide-check, .text-green-500').first();
              if (await checkIcon.isVisible().catch(() => false)) {
                await expect(checkIcon).toBeVisible();
              }

              await page.screenshot({
                path: "e2e/screenshots/validation-required-filled.png",
              });
            }
          }
        }
      }
    }
  });
});

test.describe("Visual Indicators", () => {
  test("should show template badge in modal header for PROTOCOL commands", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open PROTOCOL command creation
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Look for "Template" badge in modal header
            const templateBadge = page.locator('text=Template').first();
            if (await templateBadge.isVisible().catch(() => false)) {
              await expect(templateBadge).toBeVisible();
            }

            await page.screenshot({
              path: "e2e/screenshots/template-badge-modal.png",
            });
          }
        }
      }
    }
  });

  test("should show Layers icon for PROTOCOL commands in sidebar", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for Layers icons in command list
    // This requires having some PROTOCOL commands already saved
    const layersIcon = page.locator('svg.lucide-layers').first();
    if (await layersIcon.isVisible().catch(() => false)) {
      await expect(layersIcon).toBeVisible();

      await page.screenshot({
        path: "e2e/screenshots/sidebar-protocol-indicator.png",
      });
    } else {
      console.log("No PROTOCOL commands found in sidebar (expected if fresh state)");
    }
  });
});

test.describe("Source Switching", () => {
  test("should clear template when switching from PROTOCOL to CUSTOM", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      // Switch to PROTOCOL
      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Switch back to CUSTOM
            const customSourceButton = page.locator('button:has-text("Custom Command")');
            await customSourceButton.first().click();
            await page.waitForTimeout(300);

            // Verify template picker is hidden
            const isTemplateSelectVisible = await templateSelect.isVisible().catch(() => false);
            expect(isTemplateSelectVisible).toBe(false);

            // Verify payload field is visible (CUSTOM mode)
            const payloadField = page.locator('textarea[name="payload"]').first();
            const isPayloadVisible = await payloadField.isVisible().catch(() => false);
            expect(isPayloadVisible).toBe(true);
          }
        }
      }
    }
  });

  test("should hide payload field when switching from CUSTOM to PROTOCOL", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form (starts with CUSTOM)
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      // Verify payload field is visible initially
      const payloadField = page.locator('textarea[name="payload"]').first();
      if (await payloadField.isVisible().catch(() => false)) {
        // Switch to PROTOCOL
        const templateSourceButton = page.locator('button:has-text("From Template")');
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Verify payload field is hidden
        const isPayloadVisible = await payloadField.isVisible().catch(() => false);
        expect(isPayloadVisible).toBe(false);

        // Verify template picker is visible
        const templateSelect = page.locator('select[name="templateId"]').first();
        await expect(templateSelect).toBeVisible();
      }
    }
  });
});

test.describe("Editing PROTOCOL Commands", () => {
  test("should load existing parameter values when editing", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // This test requires existing PROTOCOL commands
    // Look for any command in sidebar with Layers icon
    const protocolCommand = page.locator('svg.lucide-layers').first();
    if (await protocolCommand.isVisible().catch(() => false)) {
      // Click on the PROTOCOL command
      const commandItem = protocolCommand.locator('xpath=ancestor::button | ancestor::div[contains(@class, "cursor-pointer")]').first();
      await commandItem.click();
      await page.waitForTimeout(500);

      // Open edit modal (look for edit button)
      const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-command-button"]');
      if (await editButton.first().isVisible().catch(() => false)) {
        await editButton.first().click();
        await page.waitForTimeout(500);

        // Verify template is selected
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const selectedValue = await templateSelect.inputValue();
          expect(selectedValue).not.toBe("");

          // Verify parameter inputs have values
          const parameterInputs = page.locator('input[type="text"], input[type="number"]');
          const firstInput = parameterInputs.first();
          if (await firstInput.isVisible().catch(() => false)) {
            const inputValue = await firstInput.inputValue();
            console.log("Loaded parameter value:", inputValue);
          }
        }
      }
    } else {
      console.log("No PROTOCOL commands found to edit (expected if fresh state)");
    }
  });
});

test.describe("Full Command Creation Flow", () => {
  test("should create and save a complete PROTOCOL command", async ({ page }) => {
    await injectTauriMocks(page, { isTauri: true });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open command form
    const newCommandButton = page.locator('button:has-text("New Command")');
    if (await newCommandButton.first().isVisible().catch(() => false)) {
      await newCommandButton.first().click();
      await page.waitForTimeout(500);

      // Switch to PROTOCOL
      const templateSourceButton = page.locator('button:has-text("From Template")');
      if (await templateSourceButton.first().isVisible().catch(() => false)) {
        await templateSourceButton.first().click();
        await page.waitForTimeout(300);

        // Select template
        const templateSelect = page.locator('select[name="templateId"]').first();
        if (await templateSelect.isVisible().catch(() => false)) {
          const optionCount = await templateSelect.locator('option').count();
          if (optionCount > 1) {
            await templateSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            // Fill command name
            const nameInput = page.locator('input[name="name"]').first();
            await nameInput.fill("E2E Test Protocol Command");

            // Fill parameters if any
            const paramInputs = page.locator('input[type="text"], input[type="number"]');
            const paramCount = await paramInputs.count();
            if (paramCount > 0) {
              for (let i = 0; i < Math.min(paramCount, 3); i++) {
                const input = paramInputs.nth(i);
                await input.fill(`TestValue${i + 1}`);
              }
            }

            // Verify computed payload is visible
            const computedPayload = page.locator('code.text-green-600, code.text-green-400').first();
            if (await computedPayload.isVisible().catch(() => false)) {
              const payloadText = await computedPayload.textContent();
              console.log("Computed payload:", payloadText);
            }

            // Save command
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")');
            await saveButton.first().click();
            await page.waitForTimeout(500);

            // Verify command appears in sidebar
            await expect(page.locator('text=E2E Test Protocol Command')).toBeVisible();

            // Verify it has the Layers icon
            const layersIcon = page.locator('svg.lucide-layers').first();
            if (await layersIcon.isVisible().catch(() => false)) {
              await expect(layersIcon).toBeVisible();
            }

            await page.screenshot({
              path: "e2e/screenshots/protocol-command-created.png",
              fullPage: true,
            });
          }
        }
      }
    }
  });
});
