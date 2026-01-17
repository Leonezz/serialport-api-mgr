import { PlotterConfig, PlotterDataPoint } from "../types";

/**
 * Parses a data frame into a numeric data point for the plotter.
 * Supports CSV, JSON, and Regex-based parsing.
 */
export const parsePlotterData = (
  data: Uint8Array,
  config: PlotterConfig,
): PlotterDataPoint | null => {
  try {
    const text = new TextDecoder().decode(data).trim();
    if (!text) return null;

    const timestamp = Date.now();
    const result: PlotterDataPoint = { time: timestamp };

    let parser = config.parser;

    // Auto-discovery logic
    if (config.autoDiscover) {
      if (text.startsWith("{") && text.endsWith("}")) {
        parser = "JSON";
      } else if (
        text.includes(",") ||
        /^-?\d+(\.\d+)?(,\s*-?\d+(\.\d+)?)*$/.test(text)
      ) {
        parser = "CSV";
      }
    }

    if (parser === "JSON") {
      try {
        const obj = JSON.parse(text);
        let hasNumericData = false;
        Object.keys(obj).forEach((key) => {
          const val = obj[key];
          if (typeof val === "number") {
            result[key] = val;
            hasNumericData = true;
          }
        });
        return hasNumericData ? result : null;
      } catch {
        // Fallback or ignore
      }
    }

    if (parser === "CSV") {
      const parts = text.split(/[,;\s]+/).filter((p) => p.length > 0);
      let hasNumericData = false;
      parts.forEach((part, index) => {
        const num = parseFloat(part);
        if (!isNaN(num)) {
          result[`Series ${index + 1}`] = num;
          hasNumericData = true;
        }
      });
      return hasNumericData ? result : null;
    }

    if (parser === "REGEX" && config.regexString) {
      try {
        const regex = new RegExp(config.regexString);
        const match = text.match(regex);
        if (match) {
          let hasNumericData = false;
          // Capture groups (starting from index 1)
          for (let i = 1; i < match.length; i++) {
            const num = parseFloat(match[i]);
            if (!isNaN(num)) {
              result[`Group ${i}`] = num;
              hasNumericData = true;
            }
          }
          return hasNumericData ? result : null;
        }
      } catch {
        // Invalid regex
      }
    }

    return null;
  } catch {
    return null;
  }
};
