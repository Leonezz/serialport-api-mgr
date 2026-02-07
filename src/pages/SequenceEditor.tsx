/**
 * Sequence Editor Page
 *
 * Full-page editor for Sequence definitions.
 * Contains tabs for:
 * - General: Name, description, settings
 * - Steps: Step management with drag-and-drop
 * - Settings: Execution settings
 */

import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Workflow,
  ListOrdered,
  Save,
  Trash2,
  Plus,
  X,
  GripVertical,
  Play,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  NumberInput,
  SelectDropdown,
  Textarea,
  workspaceItem,
} from "../components/ui";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import { cn, generateId } from "../lib/utils";
import { SequenceStepSchema } from "../lib/schemas";
import type { SerialSequence, SequenceStep } from "../types";

const SequenceEditorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  deviceId: z.string().optional(),
  steps: z.array(SequenceStepSchema),
});

type SequenceEditorFormData = z.infer<typeof SequenceEditorFormSchema>;

// Tab definitions
type EditorTab = "general" | "steps" | "settings";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "steps", label: "Steps", icon: ListOrdered },
  { id: "settings", label: "Settings", icon: Workflow },
];

interface SequenceEditorContentProps {
  sequence: SerialSequence;
}

const SequenceEditorContent: React.FC<SequenceEditorContentProps> = ({
  sequence,
}) => {
  const navigate = useNavigate();
  const { updateSequence, deleteSequence, commands, devices, addToast } =
    useStore();
  const id = sequence.id;

  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const {
    register,
    watch,
    setValue,
    formState: { isDirty },
    control,
  } = useForm<SequenceEditorFormData>({
    resolver: zodResolver(SequenceEditorFormSchema),
    defaultValues: {
      name: sequence.name,
      description: sequence.description || "",
      deviceId: sequence.deviceId || "",
      steps: sequence.steps || [],
    },
  });

  const {
    fields: steps,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: "steps",
  });

  const editName = watch("name");
  const editDeviceId = watch("deviceId");

  const handleSave = () => {
    const formData = watch();
    updateSequence(id, {
      ...sequence,
      name: formData.name,
      description: formData.description,
      deviceId: formData.deviceId || undefined,
      steps: formData.steps,
      updatedAt: Date.now(),
    });
    addToast(
      "success",
      "Saved",
      `Sequence "${formData.name}" saved successfully.`,
    );
  };

  const handleDelete = () => {
    deleteSequence(id);
    addToast("success", "Deleted", `Sequence "${editName}" deleted.`);
    navigate("/sequences");
  };

  // Steps helpers
  const addStep = () => {
    const newStep: SequenceStep = {
      id: generateId(),
      commandId: commands[0]?.id || "",
      delay: 500,
      stopOnError: false,
    };
    append(newStep);
  };

  const updateStep = (idx: number, updates: Partial<SequenceStep>) => {
    const current = steps[idx];
    setValue(`steps.${idx}`, { ...current, ...updates }, { shouldDirty: true });
  };

  const removeStep = (idx: number) => {
    remove(idx);
  };

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= steps.length) return;
    move(fromIdx, toIdx);
  };

  const getCommandName = (commandId: string) => {
    if (commandId === "__DELAY__") return "Delay Only";
    return commands.find((c) => c.id === commandId)?.name || "Unknown Command";
  };

  const getDeviceName = (deviceId?: string) => {
    if (!deviceId) return null;
    return devices.find((d) => d.id === deviceId)?.name;
  };

  const totalDelay = steps.reduce((acc, step) => acc + step.delay, 0);

  // Command options for dropdown
  const commandOptions = [
    { label: "-- Delay Only --", value: "__DELAY__" },
    ...commands.map((cmd) => ({
      label: cmd.name + (cmd.group ? ` (${cmd.group})` : ""),
      value: cmd.id,
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={editName}
        backTo="/sequences"
        backLabel="Sequences"
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-sm text-amber-500">Unsaved changes</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        }
      />

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border/50">
        <Breadcrumb
          items={[
            workspaceItem,
            { label: "Sequences", href: "/sequences" },
            { label: editName },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Sequence Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="Sequence name" />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    {...register("description")}
                    placeholder="What does this sequence do?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Device (Optional)</Label>
                  <SelectDropdown
                    value={editDeviceId || ""}
                    onChange={(v) =>
                      setValue("deviceId", v || undefined, {
                        shouldDirty: true,
                      })
                    }
                    options={[
                      { label: "-- No Device --", value: "" },
                      ...devices.map((d) => ({ label: d.name, value: d.id })),
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Assign this sequence to a specific device for organization.
                  </p>
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {steps.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Steps</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {totalDelay}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Delay (ms)
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {getDeviceName(editDeviceId) || "None"}
                      </p>
                      <p className="text-xs text-muted-foreground">Device</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "steps" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Sequence Steps ({steps.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addStep}
                  disabled={commands.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent>
                {commands.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">
                      No commands available. Create commands first to build
                      sequences.
                    </p>
                    <Link to="/commands">
                      <Button variant="outline">Go to Commands</Button>
                    </Link>
                  </div>
                ) : steps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-4">No steps in this sequence yet.</p>
                    <Button variant="outline" onClick={addStep}>
                      Add First Step
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, idx) => {
                      const isDelayOnly = step.commandId === "__DELAY__";
                      return (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card group"
                        >
                          {/* Drag Handle & Number */}
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <div className="cursor-grab text-muted-foreground hover:text-foreground">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {idx + 1}
                            </div>
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Command</Label>
                                <SelectDropdown
                                  value={step.commandId}
                                  onChange={(v) =>
                                    updateStep(idx, { commandId: v })
                                  }
                                  options={commandOptions}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Delay After (ms)
                                </Label>
                                <NumberInput
                                  value={step.delay}
                                  onChange={(v) =>
                                    updateStep(idx, { delay: v ?? 0 })
                                  }
                                  min={0}
                                  max={60000}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Checkbox
                                  checked={step.stopOnError || false}
                                  onChange={(e) =>
                                    updateStep(idx, {
                                      stopOnError: e.target.checked,
                                    })
                                  }
                                  label="Stop on error"
                                />
                                {isDelayOnly && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Delay Only
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveStep(idx, idx - 1)}
                                  disabled={idx === 0}
                                  title="Move Up"
                                >
                                  <span className="text-xs">↑</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveStep(idx, idx + 1)}
                                  disabled={idx === steps.length - 1}
                                  title="Move Down"
                                >
                                  <span className="text-xs">↓</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => removeStep(idx)}
                                  title="Remove Step"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Step Button at bottom */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                      onClick={addStep}
                    >
                      <Plus className="w-4 h-4" />
                      Add Step
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Execution Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Execution Behavior
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Steps are executed sequentially in order</li>
                    <li>
                      • Each step waits for its delay before the next step
                    </li>
                    <li>
                      • If &quot;Stop on error&quot; is enabled, the sequence
                      stops when that step fails
                    </li>
                    <li>
                      • Use &quot;Delay Only&quot; steps for timing between
                      commands
                    </li>
                  </ul>
                </div>

                <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Tips
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Add delays between commands if the device needs time to
                      process
                    </li>
                    <li>
                      • Use &quot;Stop on error&quot; for critical commands that
                      must succeed
                    </li>
                    <li>
                      • Test sequences with the device connected to verify
                      timing
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Sequence"
          message={`Are you sure you want to delete "${editName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

const SequenceEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sequences } = useStore();

  const sequence = useMemo(
    () => sequences.find((s) => s.id === id),
    [sequences, id],
  );

  if (!sequence) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          title="Sequence Not Found"
          backTo="/sequences"
          backLabel="Sequences"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Workflow className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sequence Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The sequence you&apos;re looking for doesn&apos;t exist or has
              been deleted.
            </p>
            <Button onClick={() => navigate("/sequences")}>
              Back to Sequences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <SequenceEditorContent key={sequence.id} sequence={sequence} />;
};

export default SequenceEditor;
