import { SerialportConversation } from "@/types/conversation";
import { Tab, Tabs, Textarea } from "@nextui-org/react";
import CodeMirror from "@uiw/react-codemirror";
import { esLint, javascript } from "@codemirror/lang-javascript";
import { linter } from "@codemirror/lint";
import globals from "globals";
import * as eslint from "eslint-linter-browserify";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import js from "@eslint/js";

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

type ConversationConfigerProps = {
  value: SerialportConversation;
  onValueChange: (v: Partial<SerialportConversation>) => void;
  verticalLayout?: boolean;
  readonly?: boolean;
};
const ConversationConfiger = ({
  value,
  onValueChange,
  readonly,
}: ConversationConfigerProps) => {
  const setContentScript = ({
    v,
    type,
    field,
  }: {
    v: string;
    type: "request" | "response";
    field: "text" | "script";
  }) => onValueChange({ [type]: { ...value[type], [field]: v } });
  const setMode = ({
    mode,
    type,
  }: {
    mode: "text" | "script";
    type: "request" | "response";
  }) => onValueChange({ [type]: { ...value[type], mode: mode } });
  return (
    <div className="flex flex-col gap-2">
      {(["request", "response"] as const).map((type) => (
        <Tabs
          selectedKey={value[type].mode}
          onSelectionChange={(key) =>
            setMode({ mode: key as "text" | "script", type: type })
          }
        >
          {(["text", "script"] as const).map((mode) => (
            <Tab title={mode} key={mode}>
              {mode === "script" ? (
                <CodeMirror
                  lang="javascript"
                  className="border-2 rounded-lg"
                  indentWithTab
                  editable
                  value={value[type][mode]}
                  onChange={(v) =>
                    setContentScript({ v: v, type: type, field: "script" })
                  }
                  theme={vscodeLight}
                  extensions={[
                    javascript(),
                    linter(esLint(new eslint.Linter(), ESLINT_CONFIG)),
                  ]}
                  readOnly={readonly}
                />
              ) : (
                <Textarea
                  value={value[type][mode]}
                  onValueChange={(v) =>
                    setContentScript({ v: v, field: "text", type: type })
                  }
                  variant="bordered"
                  placeholder={`Enter the ${type} content`}
                  classNames={{
                    base: "max-w-full",
                    input: "resize-none min-h-[40px]",
                  }}
                  readOnly={readonly}
                />
              )}
            </Tab>
          ))}
        </Tabs>
      ))}
    </div>
  );
};

export { ConversationConfiger };
