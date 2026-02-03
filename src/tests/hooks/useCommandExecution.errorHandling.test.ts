import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("error handling anti-pattern prevention", () => {
  const emptyCatchPattern = /\.catch\(\(\)\s*=>\s*\{\s*\}\)/;

  it("useCommandExecution should not have empty catch blocks", () => {
    const content = fs.readFileSync(
      "src/hooks/useCommandExecution.ts",
      "utf-8",
    );
    expect(content).not.toMatch(emptyCatchPattern);
  });

  it("MainWorkspace should not have empty catch blocks", () => {
    const content = fs.readFileSync("src/pages/MainWorkspace.tsx", "utf-8");
    expect(content).not.toMatch(emptyCatchPattern);
  });
});
