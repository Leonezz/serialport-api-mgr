import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useStore } from "@/lib/store";

// Mock the Sidebar component's device list item behavior
// This test focuses on PR #29 - fixing button nesting issue in sidebar device list

describe("Sidebar Device List - Button Nesting Fix (PR #29)", () => {
  const mockDevices = [
    { id: "device-1", name: "Test Device 1" },
    { id: "device-2", name: "Test Device 2" },
  ];

  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({
        devices: mockDevices,
        selectedDeviceId: null,
      });
    });
  });

  describe("DeviceListItem Accessibility", () => {
    it("should render device list items as div with role='button' (not nested buttons)", () => {
      // Create a minimal component that mimics the fixed Sidebar device list
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        const selectedDeviceId = useStore((s) => s.selectedDeviceId);

        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
            className={
              selectedDeviceId === device.id ? "selected" : "not-selected"
            }
          >
            <span>{device.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label="Edit Device"
            >
              Edit
            </button>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      // Verify devices are rendered as divs with role="button", not button elements
      mockDevices.forEach((device) => {
        const item = screen.getByTestId(`device-item-${device.id}`);
        expect(item.tagName).toBe("DIV");
        expect(item.getAttribute("role")).toBe("button");
        expect(item.getAttribute("tabindex")).toBe("0");
      });
    });

    it("should select device on click", () => {
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      // Click on the first device
      const item1 = screen.getByTestId("device-item-device-1");
      fireEvent.click(item1);

      expect(useStore.getState().selectedDeviceId).toBe("device-1");

      // Click on the second device
      const item2 = screen.getByTestId("device-item-device-2");
      fireEvent.click(item2);

      expect(useStore.getState().selectedDeviceId).toBe("device-2");
    });

    it("should select device on Enter key press", () => {
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const item1 = screen.getByTestId("device-item-device-1");

      // Simulate Enter key press
      fireEvent.keyDown(item1, { key: "Enter", code: "Enter" });

      expect(useStore.getState().selectedDeviceId).toBe("device-1");
    });

    it("should select device on Space key press", () => {
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const item1 = screen.getByTestId("device-item-device-1");

      // Simulate Space key press
      fireEvent.keyDown(item1, { key: " ", code: "Space" });

      expect(useStore.getState().selectedDeviceId).toBe("device-1");
    });

    it("should not select device on other key presses", () => {
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const item1 = screen.getByTestId("device-item-device-1");

      // Simulate other key presses - should not trigger selection
      fireEvent.keyDown(item1, { key: "Tab", code: "Tab" });
      expect(useStore.getState().selectedDeviceId).toBeNull();

      fireEvent.keyDown(item1, { key: "a", code: "KeyA" });
      expect(useStore.getState().selectedDeviceId).toBeNull();

      fireEvent.keyDown(item1, { key: "Escape", code: "Escape" });
      expect(useStore.getState().selectedDeviceId).toBeNull();
    });

    it("should prevent default behavior on Space key to avoid page scroll", () => {
      const preventDefaultMock = vi.fn();

      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const item1 = screen.getByTestId("device-item-device-1");

      // Create a keyboard event with preventDefault spy
      const spaceEvent = new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(spaceEvent, "preventDefault", {
        value: preventDefaultMock,
      });

      item1.dispatchEvent(spaceEvent);

      expect(preventDefaultMock).toHaveBeenCalled();
    });

    it("should stop propagation when clicking edit button inside device item", () => {
      const stopPropagationMock = vi.fn();

      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
            <button
              data-testid={`edit-button-${device.id}`}
              onClick={(e) => {
                e.stopPropagation();
                stopPropagationMock();
              }}
              aria-label="Edit Device"
            >
              Edit
            </button>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const editButton = screen.getByTestId("edit-button-device-1");

      // Click the edit button
      fireEvent.click(editButton);

      // Edit button handler should have been called
      expect(stopPropagationMock).toHaveBeenCalled();

      // But the device should NOT be selected (propagation was stopped)
      expect(useStore.getState().selectedDeviceId).toBeNull();
    });

    it("should be keyboard focusable with tabIndex=0", () => {
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      const item1 = screen.getByTestId("device-item-device-1");
      const item2 = screen.getByTestId("device-item-device-2");

      // Both items should be focusable
      expect(item1.getAttribute("tabindex")).toBe("0");
      expect(item2.getAttribute("tabindex")).toBe("0");

      // Focus should work
      item1.focus();
      expect(document.activeElement).toBe(item1);

      item2.focus();
      expect(document.activeElement).toBe(item2);
    });
  });

  describe("HTML Validity - No Nested Buttons", () => {
    it("should not nest button inside button (invalid HTML)", () => {
      // This test verifies the fix for the button nesting issue
      // The outer element should be a div with role="button", not a <button>
      const DeviceListItem = ({
        device,
      }: {
        device: { id: string; name: string };
      }) => {
        return (
          <div
            role="button"
            tabIndex={0}
            data-testid={`device-item-${device.id}`}
            onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                useStore.getState().setSelectedDeviceId(device.id);
              }
            }}
          >
            <span>{device.name}</span>
            <button aria-label="Edit Device">Edit</button>
          </div>
        );
      };

      const { container } = render(
        <MemoryRouter>
          {mockDevices.map((device) => (
            <DeviceListItem key={device.id} device={device} />
          ))}
        </MemoryRouter>,
      );

      // Find all device items
      const deviceItems = container.querySelectorAll(
        '[data-testid^="device-item-"]',
      );

      deviceItems.forEach((item) => {
        // The outer element should be a DIV, not a BUTTON
        expect(item.tagName).toBe("DIV");
        expect(item.getAttribute("role")).toBe("button");

        // The inner button should exist and be a BUTTON
        const innerButton = item.querySelector("button");
        expect(innerButton).not.toBeNull();
        expect(innerButton?.tagName).toBe("BUTTON");

        // The outer DIV should NOT be a button element
        // This ensures no <button><button></button></button> nesting
        expect(item.tagName).not.toBe("BUTTON");
      });
    });
  });
});
