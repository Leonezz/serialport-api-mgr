import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";
import { useStore } from "@/lib/store";
import { ThemeColor } from "@/types";

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Reset document classes
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");

    // Reset store to initial state
    const { setState } = useStore;
    act(() => {
      setState({
        themeMode: "system",
        themeColor: "zinc",
      });
    });
  });

  describe("Theme Application", () => {
    it("should apply theme mode to document root", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "dark", themeColor: "zinc" });
      });

      renderHook(() => useTheme(), { wrapper });

      const root = document.documentElement;
      expect(root.classList.contains("dark")).toBe(true);
      expect(root.getAttribute("data-theme")).toBe("zinc");
    });

    it("should apply light theme", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "light", themeColor: "blue" });
      });

      renderHook(() => useTheme(), { wrapper });

      const root = document.documentElement;
      expect(root.classList.contains("light")).toBe(true);
      expect(root.getAttribute("data-theme")).toBe("blue");
    });

    it("should apply system theme based on media query", () => {
      // Mock matchMedia to return dark mode
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "system", themeColor: "green" });
      });

      renderHook(() => useTheme(), { wrapper });

      const root = document.documentElement;
      expect(root.classList.contains("dark")).toBe(true);
      expect(root.getAttribute("data-theme")).toBe("green");
    });

    it("should update theme when themeMode changes", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "light", themeColor: "zinc" });
      });

      renderHook(() => useTheme(), { wrapper });

      let root = document.documentElement;
      expect(root.classList.contains("light")).toBe(true);

      act(() => {
        useStore.setState({ themeMode: "dark" });
      });

      root = document.documentElement;
      expect(root.classList.contains("light")).toBe(false);
      expect(root.classList.contains("dark")).toBe(true);
    });

    it("should update theme when themeColor changes", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "dark", themeColor: "zinc" });
      });

      renderHook(() => useTheme(), { wrapper });

      let root = document.documentElement;
      expect(root.getAttribute("data-theme")).toBe("zinc");

      act(() => {
        useStore.setState({ themeColor: "blue" });
      });

      root = document.documentElement;
      expect(root.getAttribute("data-theme")).toBe("blue");
    });

    it("should remove previous theme class when switching", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "light", themeColor: "zinc" });
      });

      renderHook(() => useTheme(), { wrapper });

      act(() => {
        useStore.setState({ themeMode: "dark" });
      });

      const root = document.documentElement;
      expect(root.classList.contains("light")).toBe(false);
      expect(root.classList.contains("dark")).toBe(true);
    });
  });

  describe("System Theme Detection", () => {
    it("should listen for system preference changes", () => {
      const addEventListenerSpy = vi.fn();
      const removeEventListenerSpy = vi.fn();

      const mockMatchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "system", themeColor: "zinc" });
      });

      const { unmount } = renderHook(() => useTheme(), { wrapper });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });

    it("should not listen for changes when not in system mode", () => {
      const addEventListenerSpy = vi.fn();

      const mockMatchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "dark", themeColor: "zinc" });
      });

      renderHook(() => useTheme(), { wrapper });

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe("useTheme Hook", () => {
    it("should provide theme context values", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "dark", themeColor: "blue" });
      });

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.themeMode).toBe("dark");
      expect(result.current.themeColor).toBe("blue");
      expect(typeof result.current.setThemeMode).toBe("function");
      expect(typeof result.current.setThemeColor).toBe("function");
    });

    it("should throw error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within ThemeProvider");

      consoleSpy.mockRestore();
    });

    it("should allow updating theme mode through context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "light", themeColor: "zinc" });
      });

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setThemeMode("dark");
      });

      expect(useStore.getState().themeMode).toBe("dark");
    });

    it("should allow updating theme color through context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      act(() => {
        useStore.setState({ themeMode: "dark", themeColor: "zinc" });
      });

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setThemeColor("green");
      });

      expect(useStore.getState().themeColor).toBe("green");
    });
  });

  describe("Children Rendering", () => {
    it("should render children correctly", () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>,
      );

      expect(getByText("Test Child")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ThemeProvider>,
      );

      expect(getByText("Child 1")).toBeInTheDocument();
      expect(getByText("Child 2")).toBeInTheDocument();
      expect(getByText("Child 3")).toBeInTheDocument();
    });
  });

  describe("All Theme Colors", () => {
    const colors = ["zinc", "blue", "green", "orange", "rose", "yellow"];

    colors.forEach((color) => {
      it(`should apply ${color} theme color`, () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        );

        act(() => {
          useStore.setState({
            themeMode: "dark",
            themeColor: color as ThemeColor,
          });
        });

        renderHook(() => useTheme(), { wrapper });

        const root = document.documentElement;
        expect(root.getAttribute("data-theme")).toBe(color);
      });
    });
  });
});
