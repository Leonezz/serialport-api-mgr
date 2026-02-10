import { describe, it, expect } from "vitest";
import { analyzeScript, analyzeCommandScripts } from "../../lib/scriptAnalyzer";

describe("scriptAnalyzer", () => {
  describe("analyzeScript", () => {
    it("should return no warnings for safe scripts", () => {
      const result = analyzeScript("return params.freq * 1000;");
      expect(result.hasWarnings).toBe(false);
      expect(result.hasCritical).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should flag while(true) as critical", () => {
      const result = analyzeScript("while(true) { x++; }");
      expect(result.hasCritical).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "critical",
          message: expect.stringContaining("Infinite loop"),
        }),
      );
    });

    it("should flag for(;;) as critical", () => {
      const result = analyzeScript("for(;;) { break; }");
      expect(result.hasCritical).toBe(true);
    });

    it("should flag eval() as critical", () => {
      const result = analyzeScript('eval("alert(1)")');
      expect(result.hasCritical).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "critical",
          message: expect.stringContaining("eval()"),
        }),
      );
    });

    it("should flag Function constructor as critical", () => {
      const result = analyzeScript('new Function("return 1")');
      expect(result.hasCritical).toBe(true);
    });

    it("should flag URLs as warning", () => {
      const result = analyzeScript('var url = "https://evil.com/exfil"');
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("URL"),
        }),
      );
    });

    it("should flag fetch() as warning", () => {
      const result = analyzeScript("fetch('/api/data')");
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("fetch()"),
        }),
      );
    });

    it("should flag localStorage as warning", () => {
      const result = analyzeScript("localStorage.getItem('key')");
      expect(result.hasWarnings).toBe(true);
    });

    it("should flag atob as warning", () => {
      const result = analyzeScript('atob("dGVzdA==")');
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("Base64"),
        }),
      );
    });

    it("should flag String.fromCharCode as warning", () => {
      const result = analyzeScript("String.fromCharCode(72, 101)");
      expect(result.hasWarnings).toBe(true);
    });

    it("should flag very large string repeat as critical", () => {
      const result = analyzeScript("'x'.repeat(1000000)");
      expect(result.hasCritical).toBe(true);
    });

    it("should flag scripts longer than 2000 chars as warning", () => {
      const longScript = "return " + "x + ".repeat(600) + "0;";
      expect(longScript.length).toBeGreaterThan(2000);
      const result = analyzeScript(longScript);
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("unusually long"),
        }),
      );
    });

    it("should flag scripts longer than 5000 chars as critical", () => {
      const veryLongScript = "return " + "x + ".repeat(1500) + "0;";
      expect(veryLongScript.length).toBeGreaterThan(5000);
      const result = analyzeScript(veryLongScript);
      expect(result.hasCritical).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "critical",
          message: expect.stringContaining("very long"),
        }),
      );
    });

    it("should handle empty string without warnings", () => {
      const result = analyzeScript("");
      expect(result.hasWarnings).toBe(false);
    });

    it("should handle non-string input gracefully", () => {
      const result = analyzeScript(null as unknown as string);
      expect(result.hasCritical).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "critical",
          message: expect.stringContaining("not a valid string"),
        }),
      );
    });

    it("should flag while(1) as critical", () => {
      const result = analyzeScript("while(1) { x++; }");
      expect(result.hasCritical).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "critical",
          message: expect.stringContaining("Infinite loop"),
        }),
      );
    });

    it("should flag while(!0) as critical", () => {
      const result = analyzeScript("while(!0) { x++; }");
      expect(result.hasCritical).toBe(true);
    });

    it("should flag setTimeout with string argument as warning", () => {
      const result = analyzeScript('setTimeout("alert(1)", 0)');
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("setTimeout"),
        }),
      );
    });

    it("should flag setInterval with string argument as warning", () => {
      const result = analyzeScript("setInterval('tick()', 100)");
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("setInterval"),
        }),
      );
    });

    it("should flag dynamic import() as warning", () => {
      const result = analyzeScript("import('malicious-module')");
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          message: expect.stringContaining("import()"),
        }),
      );
    });

    it("should allow normal Math and bitwise operations", () => {
      const result = analyzeScript("return Math.floor(params.value) | 0x0F;");
      expect(result.hasWarnings).toBe(false);
    });

    it("should allow normal array operations", () => {
      const result = analyzeScript(
        "return [0x01, 0x03, params.reg >> 8, params.reg & 0xFF];",
      );
      expect(result.hasWarnings).toBe(false);
    });
  });

  describe("analyzeCommandScripts", () => {
    it("should return empty for commands without scripts", () => {
      const result = analyzeCommandScripts([
        { name: "CMD1" },
        { name: "CMD2", scripting: { enabled: false } },
      ]);
      expect(result).toHaveLength(0);
    });

    it("should extract preRequestScript", () => {
      const result = analyzeCommandScripts([
        {
          name: "SET_FREQ",
          scripting: {
            enabled: true,
            preRequestScript: "return 'SETF ' + params.freq;",
          },
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].commandName).toBe("SET_FREQ");
      expect(result[0].scriptType).toBe("preRequestScript");
      expect(result[0].script).toBe("return 'SETF ' + params.freq;");
    });

    it("should extract postResponseScript", () => {
      const result = analyzeCommandScripts([
        {
          name: "READ_TEMP",
          scripting: {
            enabled: true,
            postResponseScript:
              "setVar('temp', parseFloat(data.split(':')[1]));",
          },
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].scriptType).toBe("postResponseScript");
    });

    it("should extract both scripts from one command", () => {
      const result = analyzeCommandScripts([
        {
          name: "DUAL",
          scripting: {
            enabled: true,
            preRequestScript: "return payload;",
            postResponseScript: "log(data);",
          },
        },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].scriptType).toBe("preRequestScript");
      expect(result[1].scriptType).toBe("postResponseScript");
    });

    it("should handle commands with optional name", () => {
      const result = analyzeCommandScripts([
        {
          scripting: {
            enabled: true,
            preRequestScript: "return 1;",
          },
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].commandName).toBe("Command 1");
    });

    it("should still analyze scripts when scripting.enabled is false", () => {
      const result = analyzeCommandScripts([
        {
          name: "DORMANT",
          scripting: {
            enabled: false,
            preRequestScript: "eval('malicious')",
          },
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].commandName).toBe("DORMANT");
      expect(result[0].analysis.hasCritical).toBe(true);
    });

    it("should skip commands with no script strings", () => {
      const result = analyzeCommandScripts([
        { name: "SKIP", scripting: { enabled: false } },
        { name: "ALSO_SKIP" },
      ]);
      expect(result).toHaveLength(0);
    });

    it("should analyze scripts for warnings", () => {
      const result = analyzeCommandScripts([
        {
          name: "MALICIOUS",
          scripting: {
            enabled: true,
            preRequestScript: "while(true) {}",
          },
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].analysis.hasCritical).toBe(true);
    });

    it("should handle multiple commands", () => {
      const result = analyzeCommandScripts([
        {
          name: "SAFE",
          scripting: {
            enabled: true,
            preRequestScript: "return payload;",
          },
        },
        { name: "NO_SCRIPT" },
        {
          name: "RISKY",
          scripting: {
            enabled: true,
            preRequestScript: "eval('code')",
          },
        },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].analysis.hasCritical).toBe(false);
      expect(result[1].analysis.hasCritical).toBe(true);
    });
  });
});
