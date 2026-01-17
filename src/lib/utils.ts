import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DataMode } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getBytes = (data: string | Uint8Array): Uint8Array => {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  console.warn("getBytes", "Unsupported data type", data);
  return new Uint8Array();
};

export const formatContent = (
  data: string | Uint8Array,
  mode: DataMode,
): string => {
  const bytes = getBytes(data);

  if (mode === "HEX") {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
  }

  if (mode === "BINARY") {
    return Array.from(bytes)
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(" ");
  }

  // TEXT Mode
  if (typeof data === "string") return data;

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch (e) {
    console.warn("formatContent", "Failed to decode UTF-8", e);
    return String.fromCharCode(...bytes);
  }
};

export const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (e.g. http://ip-address)
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
};

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
