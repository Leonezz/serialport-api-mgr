interface ZoomPanOptions {
  totalPoints: number;
  minPoints?: number; // Minimum points visible (max zoom in)
  initialRange?: { start: number; end: number };
  onUserInteraction?: () => void;
}

export function useChartZoomPan(options: ZoomPanOptions) {
  const { totalPoints, minPoints = 10, onUserInteraction } = options;

  // We keep track of the logical range even if it exceeds data bounds,
  // but we clamp it when returning the actual viewWindow.
  // However, for simplicity, let's keep start/end valid indices.

  // Internal state for the hook to manage if not controlled externally?
  // Actually, PlotterPanel controls viewRange.
  // Let's make this hook return the handler and take the setter.
}

// Refactored approach: helper function instead of full stateful hook
// because PlotterPanel manages complex state (auto-scroll etc).

export const handleChartWheel = (
  e: React.WheelEvent,
  currentRange: { start: number; end: number },
  totalPoints: number,
  onUpdate: (newRange: { start: number; end: number }) => void,
  onInteraction?: () => void,
  minWindowSize: number = 10,
) => {
  // Prevent browser back/forward navigation or page scroll
  e.preventDefault();
  e.stopPropagation();

  if (onInteraction) onInteraction();

  const { start, end } = currentRange;
  const currentWindowSize = end - start;
  const zoomFactor = 0.05; // Speed of zoom
  const panFactor = 1; // Speed of pan

  let newStart = start;
  let newEnd = end;

  // ZOOM (Pinch or Ctrl+Wheel)
  if (e.ctrlKey || e.metaKey) {
    const delta = e.deltaY;
    const zoomAmount = Math.max(1, Math.round(currentWindowSize * zoomFactor)); // At least 1 point change

    if (delta < 0) {
      // Zoom In (Shrink Window)
      // Attempt to zoom towards the mouse pointer?
      // Recharts doesn't give us easy mouse-relative-to-chart-index without ReferenceArea or similar.
      // We will zoom towards the center of the current view.

      const targetSize = Math.max(
        minWindowSize,
        currentWindowSize - zoomAmount * 2,
      );
      const diff = currentWindowSize - targetSize;
      const halfDiff = Math.floor(diff / 2);

      newStart = start + halfDiff;
      newEnd = end - (diff - halfDiff); // Handle odd diffs
    } else {
      // Zoom Out (Expand Window)
      const targetSize = Math.min(
        totalPoints,
        currentWindowSize + zoomAmount * 2,
      );
      const diff = targetSize - currentWindowSize;
      const halfDiff = Math.floor(diff / 2);

      newStart = Math.max(0, start - halfDiff);
      newEnd = Math.min(totalPoints - 1, end + (diff - halfDiff));
    }
  }
  // PAN (Horizontal Scroll)
  else {
    // Standard trackpad horizontal scroll = deltaX
    // Some mice use shift + wheel for horizontal
    const delta = Math.round(e.deltaX * panFactor);

    if (delta !== 0) {
      // Moving right (showing later data) -> Increase indices
      // Moving left (showing earlier data) -> Decrease indices

      // If we are at the edge, clamp
      if (newEnd + delta >= totalPoints) {
        const offset = totalPoints - 1 - newEnd;
        newStart += offset;
        newEnd += offset;
      } else if (newStart + delta < 0) {
        const offset = -newStart;
        newStart += offset;
        newEnd += offset;
      } else {
        newStart += delta;
        newEnd += delta;
      }
    }
  }

  // Final Clamp Safety
  newStart = Math.max(0, Math.floor(newStart));
  newEnd = Math.min(totalPoints - 1, Math.floor(newEnd));

  if (newEnd < newStart) newEnd = newStart + minWindowSize;

  if (newStart !== start || newEnd !== end) {
    onUpdate({ start: newStart, end: newEnd });
  }
};
