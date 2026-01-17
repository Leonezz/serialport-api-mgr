/**
 * Convert a File object to a Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Download a base64 string as a file
 */
export const downloadBase64File = (
  base64Data: string,
  fileName: string,
  mimeType: string,
) => {
  const linkSource = `data:${mimeType};base64,${base64Data}`;
  const downloadLink = document.createElement("a");
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.click();
};

import { AttachmentCategory } from "../types";

/**
 * Suggest a category based on file name or mime type
 */
export const suggestCategory = (
  fileName: string,
  mimeType: string,
): AttachmentCategory => {
  const lowerName = fileName.toLowerCase();
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (lowerName.includes("datasheet")) return "DATASHEET";
  if (lowerName.includes("manual") || lowerName.includes("guide"))
    return "MANUAL";
  if (
    lowerName.includes("schematic") ||
    lowerName.includes("wiring") ||
    lowerName.includes("circuit")
  )
    return "SCHEMATIC";
  if (
    lowerName.includes("protocol") ||
    lowerName.includes("api") ||
    lowerName.includes("spec")
  )
    return "PROTOCOL";
  return "OTHER";
};
