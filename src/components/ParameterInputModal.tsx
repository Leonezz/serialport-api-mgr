import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CommandParameter, SavedCommand } from "../types";
import { Play, RotateCcw } from "lucide-react";
import {
  Button,
  Checkbox,
  DropdownOption,
  Input,
  Label,
  Modal,
  SelectDropdown,
} from "./ui";

interface Props {
  command: SavedCommand;
  onSend: (values: Record<string, unknown>) => void;
  onClose: () => void;
}

function buildDefaultValues(
  parameters: CommandParameter[] | undefined,
): Record<string, unknown> {
  const initial: Record<string, unknown> = {};
  parameters?.forEach((p) => {
    if (p.defaultValue !== undefined) {
      initial[p.name] = p.defaultValue;
    } else if (p.type === "BOOLEAN") {
      initial[p.name] = false;
    } else {
      initial[p.name] = "";
    }
  });
  return initial;
}

function buildSchema(
  parameters: CommandParameter[] | undefined,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  parameters?.forEach((p) => {
    switch (p.type) {
      case "INTEGER": {
        let s = z.coerce.number().int("Must be an integer");
        if (p.min !== undefined) s = s.min(p.min);
        if (p.max !== undefined) s = s.max(p.max);
        shape[p.name] = p.required === false ? s.optional() : s;
        break;
      }
      case "FLOAT": {
        let s = z.coerce.number();
        if (p.min !== undefined) s = s.min(p.min);
        if (p.max !== undefined) s = s.max(p.max);
        shape[p.name] = p.required === false ? s.optional() : s;
        break;
      }
      case "BOOLEAN":
        shape[p.name] = z.boolean();
        break;
      case "ENUM":
        shape[p.name] = z.union([z.string(), z.number()]);
        break;
      default: {
        // STRING
        let s = z.string();
        if (p.maxLength) s = s.max(p.maxLength);
        shape[p.name] = p.required === false ? s.optional() : s;
        break;
      }
    }
  });
  return z.object(shape);
}

const ParameterInputModal: React.FC<Props> = ({ command, onSend, onClose }) => {
  const defaultValues = useMemo(
    () => buildDefaultValues(command.parameters),
    [command.parameters],
  );

  const schema = useMemo(
    () => buildSchema(command.parameters),
    [command.parameters],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (data: Record<string, unknown>): void => {
    onSend(data);
    onClose();
  };

  const renderInput = (param: CommandParameter) => {
    switch (param.type) {
      case "ENUM": {
        const enumOptions: DropdownOption<string | number>[] =
          param.options?.map((opt) => ({
            value: opt.value,
            label: String(opt.label || opt.value),
          })) || [];
        return (
          <Controller
            name={param.name}
            control={control}
            render={({ field }) => (
              <SelectDropdown
                options={enumOptions}
                value={field.value as string | number}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        );
      }
      case "BOOLEAN":
        return (
          <Controller
            name={param.name}
            control={control}
            render={({ field }) => (
              <div className="flex items-center h-10">
                <Checkbox
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  label={field.value ? "True / Enabled" : "False / Disabled"}
                  labelClassName="text-muted-foreground"
                />
              </div>
            )}
          />
        );
      case "INTEGER":
        return (
          <Input
            type="number"
            {...register(param.name, { valueAsNumber: true })}
            min={param.min}
            max={param.max}
            step={1}
            placeholder={`Integer ${param.min !== undefined ? `${param.min} - ${param.max}` : ""}`}
          />
        );
      case "FLOAT":
        return (
          <Input
            type="number"
            {...register(param.name, { valueAsNumber: true })}
            min={param.min}
            max={param.max}
            step="any"
            placeholder="Float value"
          />
        );
      default: // STRING
        return (
          <Input
            {...register(param.name)}
            maxLength={param.maxLength}
            placeholder="Enter text..."
          />
        );
    }
  };

  const titleSection = (
    <div>
      <div className="text-lg font-semibold">Command Parameters</div>
      <div className="text-xs text-muted-foreground font-mono mt-1">
        {command.name}
      </div>
    </div>
  );

  const footer = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => reset(defaultValues)}
        title="Reset all"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <div className="flex gap-2 ml-auto">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="param-input-form" className="gap-2">
          <Play className="w-4 h-4" /> Send Command
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titleSection}
      size="md"
      footer={footer}
      className="flex flex-col max-h-[90vh]"
      contentClassName="overflow-y-auto custom-scrollbar"
      footerClassName="justify-between"
    >
      <form
        id="param-input-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {command.parameters && command.parameters.length > 0 ? (
          command.parameters.map((param) => (
            <div key={param.id} className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <Label
                  htmlFor={`param-${param.id}`}
                  className="text-sm font-semibold"
                >
                  {param.label || param.name}
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono opacity-70">
                  {param.name} ({param.type})
                </span>
              </div>
              {renderInput(param)}
              {errors[param.name] && (
                <p className="text-xs text-destructive">
                  {errors[param.name]?.message as string}
                </p>
              )}
              {param.description && (
                <div className="text-[10px] text-muted-foreground">
                  {param.description}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            No parameters defined.
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ParameterInputModal;
