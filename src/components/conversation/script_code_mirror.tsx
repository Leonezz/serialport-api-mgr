import ReactCodeMirror from "@uiw/react-codemirror";
import globals from "globals";
import js from "@eslint/js";
import * as eslint from "eslint-linter-browserify";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import { esLint, javascript } from "@codemirror/lang-javascript";
import { linter } from "@codemirror/lint";
const ESLINT_CONFIG = {
  // eslint configuration
  languageOptions: {
    globals: {
      ...globals.node,
    },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  rules: {
    ...js.configs.recommended.rules,
    "no-unused-vars": [
      "error",
      { varsIgnorePattern: "[(process_request)(verify_response)]" },
    ],
  },
};

type ScriptCodeMirrorProps = {
  value: string;
  onValudChange: (value: string) => void;
  readonly: boolean;
};
export const ScriptCodeMirror = ({
  value,
  onValudChange,
  readonly,
}: ScriptCodeMirrorProps) => {
  return (
    <ReactCodeMirror
      lang="javascript"
      className="rounded-md w-full"
      indentWithTab
      editable
      value={value}
      onChange={onValudChange}
      theme={vscodeLight}
      extensions={[
        javascript(),
        linter(esLint(new eslint.Linter(), ESLINT_CONFIG)),
      ]}
      readOnly={readonly}
    />
  );
};
