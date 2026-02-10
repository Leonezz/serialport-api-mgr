import * as React from "react";
import { cn } from "../../lib/utils";
import { Input, InputProps } from "./Input";
import { hexToBytes, bytesToHex } from "../../lib/utils/dataUtils";

/**
 * HexInput Component
 *
 * Natural hex/binary byte input that:
 * - Manages editing state internally to prevent value round-trip issues
 * - Auto-formats on blur (spaces between bytes, uppercase)
 * - Shows diagnostic error messages for invalid input
 * - Uses existing hexToBytes/bytesToHex utilities from dataUtils.ts
 */

export interface HexInputProps extends Omit<
  InputProps,
  "value" | "onChange" | "type"
> {
  /** Current value (hex string, e.g., "48 65 6C 6C 6F") */
  value: string;
  /** Callback when value changes (called on blur with valid/formatted value) */
  onChange: (value: string) => void;
  /** Input mode: HEX or BINARY */
  mode?: "HEX" | "BINARY";
  /** Auto-format on blur (uppercase, spaces) - default: true */
  autoFormat?: boolean;
  /** Show byte count - default: false */
  showByteCount?: boolean;
  /** Show ASCII preview - default: false */
  showPreview?: boolean;
}

const HexInput = React.forwardRef<HTMLInputElement, HexInputProps>(
  (
    {
      value,
      onChange,
      mode = "HEX",
      autoFormat = true,
      showByteCount = false,
      showPreview = false,
      className,
      helperText,
      errorMessage,
      error,
      onBlur,
      onFocus,
      placeholder,
      ...props
    },
    ref,
  ) => {
    // Internal editing state - null when not editing, string when editing
    const [editingValue, setEditingValue] = React.useState<string | null>(null);
    const [localError, setLocalError] = React.useState<string | undefined>();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // The display value: use editingValue when focused, otherwise use prop value
    const displayValue = editingValue !== null ? editingValue : value;

    // Parse and validate the input, returning detailed error info
    const parseValue = (
      str: string,
    ): { bytes: Uint8Array | null; error?: string } => {
      const trimmed = str.trim();
      if (trimmed === "") {
        return { bytes: new Uint8Array(0) };
      }

      if (mode === "HEX") {
        // Remove all spaces and validate hex characters
        const normalized = trimmed.replace(/\s+/g, "");

        // Check for invalid characters
        const invalidMatch = normalized.match(/[^0-9a-fA-F]/);
        if (invalidMatch) {
          const char = invalidMatch[0];
          const pos = invalidMatch.index! + 1;
          return {
            bytes: null,
            error: `Invalid character '${char}' at position ${pos}. Only 0-9 and A-F allowed.`,
          };
        }

        // Check for odd number of characters (incomplete byte)
        if (normalized.length % 2 !== 0) {
          return {
            bytes: null,
            error: `Incomplete byte: need ${normalized.length + 1} hex digits (${Math.ceil(normalized.length / 2)} bytes).`,
          };
        }

        try {
          const bytes = hexToBytes(trimmed);
          return { bytes };
        } catch (e) {
          return {
            bytes: null,
            error: e instanceof Error ? e.message : "Invalid hex",
          };
        }
      } else {
        // BINARY mode - parse binary strings like "01010101 00001101"
        const parts = trimmed.split(/\s+/).filter((s) => s.length > 0);
        const bytes: number[] = [];

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          // Check for invalid binary characters
          const invalidMatch = part.match(/[^01]/);
          if (invalidMatch) {
            const char = invalidMatch[0];
            return {
              bytes: null,
              error: `Invalid character '${char}' in group ${i + 1}. Only 0 and 1 allowed.`,
            };
          }

          // Pad to multiple of 8 bits
          const padded = part.padStart(Math.ceil(part.length / 8) * 8, "0");

          // Parse each byte
          for (let j = 0; j < padded.length; j += 8) {
            const byte = parseInt(padded.substring(j, j + 8), 2);
            bytes.push(byte);
          }
        }

        return { bytes: new Uint8Array(bytes) };
      }
    };

    // Format value for final output (on blur)
    const formatFinal = (str: string): string => {
      const { bytes, error: parseError } = parseValue(str);

      if (parseError || !bytes) {
        // If invalid, just clean up whitespace and uppercase
        if (mode === "HEX") {
          return str.trim().toUpperCase();
        }
        return str.trim();
      }

      if (bytes.length === 0) {
        return "";
      }

      if (mode === "HEX") {
        return bytesToHex(bytes, true, " ");
      } else {
        // BINARY mode
        return Array.from(bytes)
          .map((b) => b.toString(2).padStart(8, "0"))
          .join(" ");
      }
    };

    // Get byte count from the current display value (for showing during editing)
    const { bytes: currentBytes, error: currentError } =
      parseValue(displayValue);
    const byteCount = currentBytes?.length ?? 0;
    const asciiPreview =
      currentBytes && currentBytes.length > 0
        ? Array.from(currentBytes)
            .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
            .join("")
        : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // During editing, just update local state and validate
      // Allow any input - don't transform it
      if (mode === "HEX") {
        // Only allow hex characters and spaces
        const filtered = newValue.replace(/[^0-9a-fA-F\s]/g, "").toUpperCase();
        setEditingValue(filtered);

        // Validate for error display
        const { error: validationError } = parseValue(filtered);
        setLocalError(validationError);
      } else {
        // BINARY mode - only allow 0, 1, and spaces
        const filtered = newValue.replace(/[^01\s]/g, "");
        setEditingValue(filtered);

        const { error: validationError } = parseValue(filtered);
        setLocalError(validationError);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Enter editing mode with current value
      setEditingValue(value);
      setLocalError(undefined);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const currentEditValue = editingValue ?? value;

      // Check if the value is valid before committing
      const { error: validationError } = parseValue(currentEditValue);

      if (!validationError) {
        // Valid value - format and commit
        if (autoFormat) {
          const formatted = formatFinal(currentEditValue);
          onChange(formatted);
        } else {
          onChange(currentEditValue);
        }
        setLocalError(undefined);
      } else {
        // Invalid value - revert to original, show error briefly
        setLocalError(validationError);
        // Don't call onChange - keep the original value
      }

      // Exit editing mode
      setEditingValue(null);

      onBlur?.(e);
    };

    const isError = error || !!localError;
    const displayError = errorMessage || localError;

    // Build helper text with optional byte count and preview
    let fullHelperText = helperText || "";
    const extras: string[] = [];
    if (showByteCount) {
      // Show byte count, or error message if invalid
      if (currentError) {
        extras.push(currentError);
      } else {
        extras.push(`${byteCount} byte${byteCount !== 1 ? "s" : ""}`);
      }
    }
    if (showPreview && asciiPreview && !currentError) {
      extras.push(`ASCII: ${asciiPreview}`);
    }
    if (extras.length > 0) {
      fullHelperText = fullHelperText
        ? `${fullHelperText} | ${extras.join(" | ")}`
        : extras.join(" | ");
    }

    const defaultPlaceholder =
      mode === "HEX" ? "48 65 6C 6C 6F (Hello)" : "01001000 01100101 (He)";

    return (
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={isError}
        errorMessage={!showByteCount ? displayError : undefined}
        helperText={fullHelperText || undefined}
        placeholder={placeholder || defaultPlaceholder}
        className={cn("font-mono", className)}
        {...props}
      />
    );
  },
);

HexInput.displayName = "HexInput";

export { HexInput };
