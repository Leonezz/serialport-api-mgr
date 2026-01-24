import * as React from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * FileInput Component
 *
 * A clean wrapper around the native file input with imperative handle support.
 * Can be used as:
 * 1. Hidden input triggered programmatically via ref
 * 2. Visible input with trigger button
 * 3. Inline compact file input
 */

export interface FileInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value"
> {
  /** Accepted file types (e.g., ".json", "image/*", ".pdf,.doc,.docx") */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Callback when files are selected */
  onFilesSelected?: (files: FileList | null) => void;
  /** Whether to show the default trigger button */
  showTrigger?: boolean;
  /** Custom trigger element (replaces default button) */
  trigger?: React.ReactNode;
  /** Label text for the trigger button */
  triggerLabel?: string;
  /** Whether file upload is in progress */
  loading?: boolean;
  /** Show selected file name(s) */
  showSelected?: boolean;
  /** Currently selected files (controlled) */
  selectedFiles?: File[];
  /** Callback to clear selected files */
  onClear?: () => void;
  /** Variant style */
  variant?: "default" | "compact" | "outline";
}

export interface FileInputRef {
  /** Open the file picker dialog */
  open: () => void;
  /** Reset/clear the input */
  reset: () => void;
  /** The underlying input element */
  input: HTMLInputElement | null;
}

const FileInput = React.forwardRef<FileInputRef, FileInputProps>(
  (
    {
      className,
      accept,
      multiple = false,
      onFilesSelected,
      onChange,
      showTrigger = false,
      trigger,
      triggerLabel = "Choose File",
      loading = false,
      showSelected = false,
      selectedFiles,
      onClear,
      variant = "default",
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalFiles, setInternalFiles] = React.useState<File[]>([]);

    const files = selectedFiles ?? internalFiles;

    // Expose imperative methods
    React.useImperativeHandle(ref, () => ({
      open: () => {
        inputRef.current?.click();
      },
      reset: () => {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        setInternalFiles([]);
      },
      input: inputRef.current,
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;

      if (fileList) {
        setInternalFiles(Array.from(fileList));
      } else {
        setInternalFiles([]);
      }

      // Call both callbacks
      onFilesSelected?.(fileList);
      onChange?.(e);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setInternalFiles([]);
      onClear?.();
    };

    const handleTriggerClick = () => {
      if (!disabled && !loading) {
        inputRef.current?.click();
      }
    };

    // Hidden input only (no visual UI)
    if (!showTrigger && !trigger) {
      return (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className={cn("hidden", className)}
          disabled={disabled}
          {...props}
        />
      );
    }

    // With trigger button
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
          {...props}
        />

        {/* Custom trigger or default button */}
        {trigger ? (
          <div onClick={handleTriggerClick} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <Button
            type="button"
            variant={variant === "outline" ? "outline" : "secondary"}
            size={variant === "compact" ? "sm" : "default"}
            onClick={handleTriggerClick}
            disabled={disabled || loading}
            className={cn(variant === "compact" && "h-8 text-xs", "gap-2")}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {triggerLabel}
          </Button>
        )}

        {/* Selected files display */}
        {showSelected && files.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-sm">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate max-w-[150px]">
              {files.length === 1
                ? files[0].name
                : `${files.length} files selected`}
            </span>
            {onClear && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 p-0.5 hover:bg-background rounded transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
