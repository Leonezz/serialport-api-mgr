import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CommandParameter, SavedCommand } from "../types";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { SelectDropdown } from "./ui/Select";
import { DropdownOption } from "./ui/Dropdown";
import { Modal } from "./ui/Modal";
import { Checkbox } from "./ui/Checkbox";

interface Props {
  command: SavedCommand;
  onSend: (values: Record<string, unknown>) => void;
  onClose: () => void;
}

const ParameterInputModal: React.FC<Props> = ({ command, onSend, onClose }) => {
  // 1. Define Schema Dynamically
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodType<any>> = {};

    command.parameters?.forEach((p) => {
      let validator;
      switch (p.type) {
        case "INTEGER":
          validator = z.number({
            invalid_type_error: "Must be a number",
            required_error: "Required",
          });
          if (p.min !== undefined) validator = validator.min(p.min);
          if (p.max !== undefined) validator = validator.max(p.max);
          break;
        case "FLOAT":
          validator = z.number({
            invalid_type_error: "Must be a number",
            required_error: "Required",
          });
          if (p.min !== undefined) validator = validator.min(p.min);
          if (p.max !== undefined) validator = validator.max(p.max);
          break;
        case "BOOLEAN":
          validator = z.boolean();
          break;
        case "ENUM":
          validator = z.union([z.string(), z.number()]);
          break;
        default: // STRING
          validator = z.string();
          if (p.maxLength) validator = validator.max(p.maxLength);
          break;
      }
      shape[p.name] = validator;
    });

    return z.object(shape);
  }, [command.parameters]);

  // 2. Initial Values
  const defaultValues = useMemo(() => {
    const initial: Record<string, unknown> = {};
    command.parameters?.forEach((p) => {
      if (p.defaultValue !== undefined) {
        initial[p.name] = p.defaultValue;
      } else if (p.type === "BOOLEAN") {
        initial[p.name] = false;
      } else {
        // For numbers, empty string might cause issues with valueAsNumber if not handled,
        // but typically defaultValues should match the type.
        // If no default, we might leave it undefined or empty string for text.
        initial[p.name] = p.type === "STRING" ? "" : undefined;
      }
    });
    return initial;
  }, [command.parameters]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = (data: Record<string, unknown>) => {
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
            control={control}
            name={param.name}
            render={({ field }) => (
              <SelectDropdown
                options={enumOptions}
                value={field.value as string | number}
                onChange={field.onChange}
                error={!!errors[param.name]}
                errorMessage={errors[param.name]?.message as string}
              />
            )}
          />
        );
      }
      case "BOOLEAN":
        // Watch the value to update the label text dynamically
        const checked = watch(param.name) as boolean;
        return (
          <div className="flex items-center h-10">
            <Checkbox
              {...register(param.name)}
              checked={!!checked}
              label={checked ? "True / Enabled" : "False / Disabled"}
              labelClassName="text-muted-foreground"
            />
          </div>
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
            error={!!errors[param.name]}
            errorMessage={errors[param.name]?.message as string}
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
            error={!!errors[param.name]}
            errorMessage={errors[param.name]?.message as string}
          />
        );
      default: // STRING
        return (
          <Input
            {...register(param.name)}
            maxLength={param.maxLength}
            placeholder="Enter text..."
            error={!!errors[param.name]}
            errorMessage={errors[param.name]?.message as string}
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
        onClick={() => reset()}
        title="Reset to defaults"
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
