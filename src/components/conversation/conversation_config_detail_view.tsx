import { SerialportConversation } from "@/types/conversation";
import { Tab, Tabs, Textarea } from "@nextui-org/react";

import { ScriptTester } from "./script_tester";
import { capitalize } from "es-toolkit";
import { ScriptCodeMirror } from "./script_code_mirror";
import { getScriptContent } from "@/util/js_scripts/js_script_util";
import { StyledTitle } from "../basics/styled_title";

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
        <div className="flex flex-col gap-2">
          <StyledTitle size="small" color={readonly ? "default" : "primary"}>
            {capitalize(type)}
          </StyledTitle>
          <Tabs
            selectedKey={value[type].mode}
            onSelectionChange={(key) =>
              setMode({ mode: key as "text" | "script", type: type })
            }
            key={type}
          >
            {(["text", "script"] as const).map((mode) => (
              <Tab title={mode} key={mode}>
                {mode === "script" ? (
                  <div className="flex flex-col gap-2">
                    <ScriptCodeMirror
                      value={value[type][mode]}
                      onValudChange={(value) => {
                        setContentScript({
                          v: value,
                          type: type,
                          field: "script",
                        });
                      }}
                      readonly={!!readonly}
                    />

                    <ScriptTester
                      input={value[type]["text"]}
                      script={getScriptContent(value[type]["script"])}
                      argument={type === "request" ? "message" : "response"}
                    />
                  </div>
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
        </div>
      ))}
    </div>
  );
};

export { ConversationConfiger };
