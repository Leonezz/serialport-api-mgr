/**
 * Static analysis for AI-generated scripts (#79)
 *
 * Scans script strings for suspicious patterns before import.
 * Scripts already run in a QuickJS sandbox, so this is a defense-in-depth
 * measure to help users identify potentially problematic code.
 */

export type ScriptWarningSeverity = "info" | "warning" | "critical";

export interface ScriptWarning {
  severity: ScriptWarningSeverity;
  message: string;
  pattern: string;
}

export interface ScriptAnalysisResult {
  warnings: ScriptWarning[];
  hasWarnings: boolean;
  hasCritical: boolean;
}

const SUSPICIOUS_PATTERNS: {
  pattern: RegExp;
  severity: ScriptWarningSeverity;
  message: string;
}[] = [
  // Infinite loops
  {
    pattern: /while\s*\(\s*true\s*\)/,
    severity: "critical",
    message: "Infinite loop detected (while(true))",
  },
  {
    pattern: /while\s*\(\s*(1|!0|!false)\s*\)/,
    severity: "critical",
    message: "Infinite loop detected (while(truthy))",
  },
  {
    pattern: /for\s*\(\s*;\s*;\s*\)/,
    severity: "critical",
    message: "Infinite loop detected (for(;;))",
  },

  // Dynamic code execution attempts (blocked by sandbox but suspicious intent)
  {
    pattern: /\beval\s*\(/,
    severity: "critical",
    message: "eval() call detected",
  },
  {
    pattern: /\bFunction\s*\(/,
    severity: "critical",
    message: "Function constructor detected",
  },

  // Network/storage references (blocked by sandbox but suspicious intent)
  {
    pattern: /https?:\/\//,
    severity: "warning",
    message: "URL reference detected in script",
  },
  {
    pattern: /\bfetch\s*\(/,
    severity: "warning",
    message: "fetch() call detected (blocked in sandbox)",
  },
  {
    pattern: /\blocalStorage\b/,
    severity: "warning",
    message: "localStorage reference detected (blocked in sandbox)",
  },
  {
    pattern: /\bXMLHttpRequest\b/,
    severity: "warning",
    message: "XMLHttpRequest reference detected (blocked in sandbox)",
  },

  // Encoding that could hide intent
  {
    pattern: /\batob\s*\(/,
    severity: "warning",
    message: "Base64 decoding (atob) detected",
  },
  {
    pattern: /String\.fromCharCode/,
    severity: "warning",
    message: "String.fromCharCode detected (may obscure string content)",
  },

  // Timer-based code execution (eval equivalents)
  {
    pattern: /\bsetTimeout\s*\(\s*["'`]/,
    severity: "warning",
    message: "setTimeout with string argument (eval-like)",
  },
  {
    pattern: /\bsetInterval\s*\(\s*["'`]/,
    severity: "warning",
    message: "setInterval with string argument (eval-like)",
  },

  // Dynamic module loading
  {
    pattern: /\bimport\s*\(/,
    severity: "warning",
    message: "Dynamic import() detected",
  },

  // Excessive resource usage patterns
  {
    pattern: /\.repeat\s*\(\s*\d{6,}\s*\)/,
    severity: "critical",
    message: "Very large string repeat detected",
  },
];

/**
 * Analyze a single script string for suspicious patterns.
 */
export function analyzeScript(script: string): ScriptAnalysisResult {
  if (typeof script !== "string") {
    return {
      warnings: [
        {
          severity: "critical",
          message: `Script content is not a valid string (type: ${typeof script})`,
          pattern: `type: ${typeof script}`,
        },
      ],
      hasWarnings: true,
      hasCritical: true,
    };
  }

  const warnings: ScriptWarning[] = [];

  if (script.length > 5000) {
    warnings.push({
      severity: "critical",
      message: `Script is very long (${script.length} chars) — may contain obfuscated code`,
      pattern: `${script.length} chars`,
    });
  } else if (script.length > 2000) {
    warnings.push({
      severity: "warning",
      message: `Script is unusually long (${script.length} chars)`,
      pattern: `${script.length} chars`,
    });
  }

  for (const { pattern, severity, message } of SUSPICIOUS_PATTERNS) {
    const match = script.match(pattern);
    if (match) {
      warnings.push({ severity, message, pattern: match[0] });
    }
  }

  return {
    warnings,
    hasWarnings: warnings.length > 0,
    hasCritical: warnings.some((w) => w.severity === "critical"),
  };
}

export interface CommandScriptInfo {
  commandName: string;
  commandIndex: number;
  scriptType: "preRequestScript" | "postResponseScript";
  script: string;
  analysis: ScriptAnalysisResult;
}

/**
 * Extract and analyze all scripts from a set of AI-generated commands.
 */
export function analyzeCommandScripts(
  commands: Array<{
    name?: string;
    scripting?: {
      enabled?: boolean;
      preRequestScript?: string;
      postResponseScript?: string;
    };
  }>,
): CommandScriptInfo[] {
  const results: CommandScriptInfo[] = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const hasAnyScript =
      cmd.scripting?.preRequestScript || cmd.scripting?.postResponseScript;
    if (!hasAnyScript) continue;

    const name = cmd.name || `Command ${i + 1}`;

    if (cmd.scripting.preRequestScript) {
      results.push({
        commandName: name,
        commandIndex: i,
        scriptType: "preRequestScript",
        script: cmd.scripting.preRequestScript,
        analysis: analyzeScript(cmd.scripting.preRequestScript),
      });
    }

    if (cmd.scripting.postResponseScript) {
      results.push({
        commandName: name,
        commandIndex: i,
        scriptType: "postResponseScript",
        script: cmd.scripting.postResponseScript,
        analysis: analyzeScript(cmd.scripting.postResponseScript),
      });
    }
  }

  return results;
}
