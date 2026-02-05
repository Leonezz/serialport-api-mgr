import React from "react";
import { Calculator, Terminal } from "lucide-react";
import {
  Button,
  CardContent,
  Input,
  Label,
  SelectDropdown,
  type DropdownOption,
} from "../ui";
import { cn } from "../../lib/utils";
import {
  generateModbusFrame,
  MODBUS_FUNCTIONS,
  AT_COMMAND_LIBRARY,
  type ModbusParams,
} from "../../services/protocolUtils";
import type { DataMode } from "../../types";

interface ProtocolTabProps {
  protoType: "MODBUS" | "AT";
  onProtoTypeChange: (type: "MODBUS" | "AT") => void;
  mbParams: ModbusParams;
  onMbParamsChange: (params: ModbusParams) => void;
  onUsePayload: (mode: DataMode, payload: string, description?: string) => void;
}

const ProtocolTab: React.FC<ProtocolTabProps> = ({
  protoType,
  onProtoTypeChange,
  mbParams,
  onMbParamsChange,
  onUsePayload,
}) => {
  return (
    <CardContent className="pt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => onProtoTypeChange("MODBUS")}
          className={cn(
            "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
            protoType === "MODBUS"
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-card",
          )}
        >
          <Calculator className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-sm">Modbus RTU Generator</span>
        </div>
        <div
          onClick={() => onProtoTypeChange("AT")}
          className={cn(
            "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
            protoType === "AT"
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-card",
          )}
        >
          <Terminal className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-sm">AT Command Library</span>
        </div>
      </div>

      {protoType === "MODBUS" && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/10 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Slave ID</Label>
              <Input
                type="number"
                value={mbParams.slaveId}
                onChange={(e) =>
                  onMbParamsChange({
                    ...mbParams,
                    slaveId: parseInt(e.target.value),
                  })
                }
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Function</Label>
              <SelectDropdown
                options={MODBUS_FUNCTIONS.map(
                  (f): DropdownOption<number> => ({
                    value: f.code,
                    label: f.name,
                  }),
                )}
                value={mbParams.functionCode}
                onChange={(value) =>
                  onMbParamsChange({
                    ...mbParams,
                    functionCode: value,
                  })
                }
                size="sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Address</Label>
              <Input
                type="number"
                value={mbParams.startAddress}
                onChange={(e) =>
                  onMbParamsChange({
                    ...mbParams,
                    startAddress: parseInt(e.target.value),
                  })
                }
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantity/Value</Label>
              <Input
                type="number"
                value={mbParams.quantityOrValue}
                onChange={(e) =>
                  onMbParamsChange({
                    ...mbParams,
                    quantityOrValue: parseInt(e.target.value),
                  })
                }
                className="h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background border p-2 rounded text-xs font-mono">
              {generateModbusFrame(mbParams)}
            </code>
            <Button
              size="sm"
              type="button"
              onClick={() => onUsePayload("HEX", generateModbusFrame(mbParams))}
            >
              Use Payload
            </Button>
          </div>
        </div>
      )}

      {protoType === "AT" && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/10 animate-in fade-in">
          <div className="space-y-2">
            <Label>Common AT Commands</Label>
            <div className="h-50 overflow-y-auto border rounded bg-background p-2 space-y-1">
              {Object.entries(AT_COMMAND_LIBRARY).map(([cat, cmds]) => (
                <div key={cat} className="mb-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 sticky top-0 bg-background">
                    {cat}
                  </div>
                  {cmds.map((c) => (
                    <div
                      key={c.cmd}
                      className="flex justify-between items-center p-1.5 hover:bg-muted rounded cursor-pointer group"
                      onClick={() => onUsePayload("TEXT", c.cmd, c.desc)}
                    >
                      <code className="text-xs font-bold text-primary">
                        {c.cmd}
                      </code>
                      <span className="text-[10px] text-muted-foreground">
                        {c.desc}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CardContent>
  );
};

export default ProtocolTab;
