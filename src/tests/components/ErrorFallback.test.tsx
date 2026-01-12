import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorFallback } from "@/components/ErrorFallback";

describe("ErrorFallback", () => {
  const mockError = new Error("Test error message");
  const mockReset = vi.fn();

  beforeEach(() => {
    mockReset.mockClear();
  });

  it("should render error message", () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An error occurred while rendering this component."),
    ).toBeInTheDocument();
  });

  it("should show error details in collapsed state by default", () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    expect(screen.getByText("Error details")).toBeInTheDocument();
    const errorMessage = screen.getByText("Test error message");
    // Check if details element is collapsed (closed by default)
    const details = errorMessage.closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("should expand error details when clicked", () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    const summary = screen.getByText("Error details");
    fireEvent.click(summary);

    const errorMessage = screen.getByText("Test error message");
    expect(errorMessage).toBeVisible();
  });

  it("should call resetErrorBoundary when Try Again is clicked", () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    const button = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(button);

    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("should display AlertTriangle icon", () => {
    const { container } = render(
      <ErrorFallback error={mockError} resetErrorBoundary={mockReset} />,
    );

    // lucide-react icons have a specific SVG structure
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should display RefreshCw icon in button", () => {
    const { container } = render(
      <ErrorFallback error={mockError} resetErrorBoundary={mockReset} />,
    );

    const button = screen.getByRole("button", { name: /try again/i });
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should handle errors with special characters in message", () => {
    const specialError = new Error('Error with "quotes" and <tags>');
    render(
      <ErrorFallback error={specialError} resetErrorBoundary={mockReset} />,
    );

    const summary = screen.getByText("Error details");
    fireEvent.click(summary);

    expect(
      screen.getByText('Error with "quotes" and <tags>'),
    ).toBeInTheDocument();
  });

  it("should handle errors with long messages", () => {
    const longMessage = "A".repeat(500);
    const longError = new Error(longMessage);
    render(<ErrorFallback error={longError} resetErrorBoundary={mockReset} />);

    const summary = screen.getByText("Error details");
    fireEvent.click(summary);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should handle errors with multiline messages", () => {
    const multilineError = new Error("Line 1\nLine 2\nLine 3");
    render(
      <ErrorFallback error={multilineError} resetErrorBoundary={mockReset} />,
    );

    const summary = screen.getByText("Error details");
    fireEvent.click(summary);

    expect(screen.getByText(/Line 1.*Line 2.*Line 3/s)).toBeInTheDocument();
  });

  it("should not call resetErrorBoundary on render", () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    expect(mockReset).not.toHaveBeenCalled();
  });

  it("should have correct styling classes", () => {
    const { container } = render(
      <ErrorFallback error={mockError} resetErrorBoundary={mockReset} />,
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass("flex", "flex-col", "bg-background");
  });
});
