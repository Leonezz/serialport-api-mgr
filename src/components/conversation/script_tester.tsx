import { ERR, match, OK, Result } from "@/types/global";
import { Button, Snippet, Textarea } from "@nextui-org/react";
import { ChevronsDownUp, ChevronsUpDown, Play } from "lucide-react";
import { useMemo, useState } from "react";

type ScriptTesterProps = {
  input: string;
  script: string;
  argument: string;
};

export const BuildScriptRunner = <T extends any>({
  argument,
  script,
}: {
  argument: string;
  script: string;
}) => {
  return (input: string): Result<T> => {
    try {
      const scriptFunc = new Function(argument, script);
      const res = scriptFunc(input);
      return OK(res);
    } catch (e) {
      return ERR(new Error(`run script failed: ${e}`));
    }
  };
};

export const ScriptTester = ({
  input,
  script,
  argument,
}: ScriptTesterProps) => {
  const [localInput, setLocalInput] = useState(input);
  const [scriptError, setScriptError] = useState<string | undefined>(undefined);
  const [output, setOutput] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const runTest = useMemo(
    () => BuildScriptRunner({ script: script, argument: argument }),
    [script, argument]
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-between items-center">
        <span className="text-medium font-semibold">Script Tester</span>
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm font-mono">
            {script.length} characters of script body
          </span>
          <Button
            variant="light"
            size="sm"
            color="primary"
            isIconOnly
            onClick={() => {
              match({
                ok: (value) => {
                  setOutput(`${value}`);
                  setScriptError(undefined);
                },
                err: (reason) => setScriptError(reason.message),
              })(runTest(localInput));
            }}
          >
            <Play />
          </Button>
          <Button
            size="sm"
            isIconOnly
            onClick={() => setCollapsed((prev) => !prev)}
            color="primary"
            variant="light"
          >
            {collapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
          </Button>
        </div>
      </div>
      <div className={`flex flex-col gap-2 ${collapsed ? "hidden" : ""}`}>
        <Textarea
          value={localInput}
          onValueChange={setLocalInput}
          label={<span className="text-medium font-semibold">input</span>}
        />
        <Snippet
          symbol={<span className="text-medium font-semibold">output: </span>}
          codeString={scriptError !== undefined ? scriptError : output}
          color={scriptError !== undefined ? "danger" : "success"}
          classNames={{
            pre: "text-wrap max-w-full  break-all",
          }}
        >
          {scriptError !== undefined ? scriptError : `${output}`}
        </Snippet>
      </div>
    </div>
  );
};
