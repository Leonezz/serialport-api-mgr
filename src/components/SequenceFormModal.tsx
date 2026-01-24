import React, { useState } from "react";
import { SerialSequence, SequenceStep, SavedCommand } from "../types";
import {
  X,
  Check,
  Plus,
  Zap,
  Clock,
  AlertTriangle,
  ChevronDown,
  FileText,
  ListOrdered,
  Variable,
} from "lucide-react";
import { SortableList, DragHandle, DragHandleProps } from "./ui/SortableList";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { SelectDropdown } from "./ui/Select";
import { DropdownOption } from "./ui/Dropdown";
import { Label } from "./ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { Textarea } from "./ui/Textarea";
import { Checkbox } from "./ui/Checkbox";
import { cn } from "../lib/utils";
import { NumberInput } from "./ui/NumberInput";

interface Props {
  initialData?: Partial<SerialSequence>;
  availableCommands: SavedCommand[];
  onSave: (sequence: Omit<SerialSequence, "id">) => void;
  onClose: () => void;
}

type TabId = "general" | "steps" | "variables";

const SequenceFormModal: React.FC<Props> = ({
  initialData,
  availableCommands,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("steps");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [steps, setSteps] = useState<SequenceStep[]>(initialData?.steps || []);
  const [selectedCommandId, setSelectedCommandId] = useState<string>("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addCommandStep = (commandId: string) => {
    const newStep: SequenceStep = {
      id: crypto.randomUUID(),
      commandId,
      delay: 500,
      stopOnError: true,
    };
    setSteps([...steps, newStep]);
    setSelectedCommandId("");
    setShowAddMenu(false);
  };

  const addDelayStep = () => {
    // For delay-only step, we use a special marker
    const newStep: SequenceStep = {
      id: crypto.randomUUID(),
      commandId: "__DELAY__",
      delay: 1000,
      stopOnError: false,
    };
    setSteps([...steps, newStep]);
    setShowAddMenu(false);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const handleReorder = (reorderedSteps: SequenceStep[]) => {
    setSteps(reorderedSteps);
  };

  // Get command info helper
  const getCommandInfo = (commandId: string) => {
    if (commandId === "__DELAY__") {
      return { name: "Delay", isDelay: true };
    }
    const cmd = availableCommands.find((c) => c.id === commandId);
    return {
      name: cmd?.name || "Unknown Command",
      command: cmd,
      isDelay: false,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      steps,
      // Metadata fields handled by parent for update/create, we just pass what we might have
      creator: initialData?.creator,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            {initialData?.id ? "Edit Sequence" : "New Sequence"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-border px-4">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "general"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <FileText className="w-4 h-4" />
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "steps"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <ListOrdered className="w-4 h-4" />
              Steps
              {steps.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-muted">
                  {steps.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("variables")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "variables"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Variable className="w-4 h-4" />
              Variables
            </button>
          </div>

          <CardContent className="pt-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* General Tab */}
            {activeTab === "general" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="seqName">Sequence Name</Label>
                  <Input
                    id="seqName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Device Initialization"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seqDesc">Description (Optional)</Label>
                  <Textarea
                    id="seqDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this sequence do?"
                    className="h-20"
                  />
                </div>
              </>
            )}

            {/* Steps Tab */}
            {activeTab === "steps" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sequence Steps</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-1 z-10 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                        <div className="px-3 py-2">
                          <Label className="text-xs text-muted-foreground">
                            Select Command
                          </Label>
                          <SelectDropdown
                            options={availableCommands.map(
                              (c): DropdownOption<string> => ({
                                value: c.id,
                                label: c.group
                                  ? `[${c.group}] ${c.name}`
                                  : c.name,
                              }),
                            )}
                            value={selectedCommandId}
                            onChange={(value) => addCommandStep(value)}
                            placeholder="Select command..."
                            size="sm"
                          />
                        </div>
                        <div className="border-t border-border my-1" />
                        <button
                          type="button"
                          onClick={addDelayStep}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          Delay Step
                        </button>
                        <button
                          type="button"
                          disabled
                          className="w-full px-3 py-2 text-left text-sm text-muted-foreground flex items-center gap-2 opacity-50 cursor-not-allowed"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Condition Block (Soon)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Flow */}
                <div className="relative min-h-[200px]">
                  {steps.length === 0 ? (
                    <div className="p-8 border border-dashed border-border rounded-lg text-center">
                      <p className="text-muted-foreground text-sm mb-3">
                        No steps added yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click &quot;Add&quot; to add commands or delays to this
                        sequence.
                      </p>
                    </div>
                  ) : (
                    <SortableList
                      items={steps}
                      getItemId={(step) => step.id}
                      onReorder={handleReorder}
                      renderItem={(
                        step: SequenceStep,
                        idx: number,
                        dragHandleProps: DragHandleProps,
                      ) => {
                        const {
                          name: stepName,
                          command,
                          isDelay,
                        } = getCommandInfo(step.commandId);
                        const hasParams =
                          command?.parameters && command.parameters.length > 0;

                        return (
                          <div>
                            {/* Connection Line (before step, except first) */}
                            {idx > 0 && (
                              <div className="flex justify-center py-1">
                                <div className="w-px h-4 bg-border" />
                              </div>
                            )}

                            {/* Step Card */}
                            <div
                              className={cn(
                                "border rounded-lg bg-card transition-all",
                                dragHandleProps.isDragging
                                  ? "border-primary shadow-lg"
                                  : "border-border hover:border-muted-foreground/50",
                              )}
                            >
                              <div className="flex">
                                {/* Drag Handle */}
                                <div className="flex items-center px-2 border-r border-border bg-muted/30 rounded-l-lg">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-muted-foreground">
                                      {idx + 1}
                                    </span>
                                    <DragHandle {...dragHandleProps} />
                                  </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {isDelay ? (
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <Zap className="w-4 h-4 text-primary" />
                                      )}
                                      <span className="font-medium text-sm">
                                        {stepName}
                                      </span>
                                    </div>
                                    <IconButton
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => removeStep(step.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                      aria-label="Delete step"
                                    >
                                      <X className="w-4 h-4" />
                                    </IconButton>
                                  </div>

                                  {/* Step Details */}
                                  <div className="space-y-2 text-xs">
                                    {/* Parameters Preview */}
                                    {hasParams && (
                                      <div className="text-muted-foreground">
                                        <span className="text-[10px] uppercase tracking-wider">
                                          Params:
                                        </span>
                                        {command
                                          .parameters!.slice(0, 2)
                                          .map((p) => (
                                            <span key={p.name} className="ml-2">
                                              {p.name}=${"{"}
                                              {p.name.toUpperCase()}
                                              {"}"}
                                            </span>
                                          ))}
                                        {command.parameters!.length > 2 && (
                                          <span className="ml-1 text-muted-foreground">
                                            +{command.parameters!.length - 2}{" "}
                                            more
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Wait Time */}
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                          Wait:
                                        </span>
                                        <NumberInput
                                          value={step.delay}
                                          onChange={(val) =>
                                            updateStep(step.id, {
                                              delay: val ?? 0,
                                            })
                                          }
                                          min={0}
                                          defaultValue={500}
                                          className="h-6 w-20 text-xs"
                                        />
                                        <span className="text-muted-foreground">
                                          ms
                                        </span>
                                      </div>
                                    </div>

                                    {/* Stop on Error */}
                                    {!isDelay && (
                                      <Checkbox
                                        checked={step.stopOnError}
                                        onChange={(e) =>
                                          updateStep(step.id, {
                                            stopOnError: e.target.checked,
                                          })
                                        }
                                        label="Stop on error"
                                        labelClassName="text-muted-foreground"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Connection Arrow (after step, except last) */}
                            {idx < steps.length - 1 && (
                              <div className="flex justify-center py-1">
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Variables Tab */}
            {activeTab === "variables" && (
              <div className="space-y-4">
                <div className="p-8 border border-dashed border-border rounded-lg text-center">
                  <Variable className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm mb-2">
                    Sequence Variables
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Define variables that can be shared between steps.
                    <br />
                    Coming soon.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Check className="w-4 h-4 mr-2" /> Save Sequence
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SequenceFormModal;
