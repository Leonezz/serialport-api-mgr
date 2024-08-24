export const ViewModeOptions = ["Text", "Hex", "Bin"] as const;
export type ViewModeType = (typeof ViewModeOptions)[number];