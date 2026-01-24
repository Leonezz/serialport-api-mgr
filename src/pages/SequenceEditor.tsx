/**
 * Sequence Editor Page
 *
 * Provides a flow-based editor for creating and editing command sequences.
 * Placeholder for future implementation.
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Plus, GripVertical, Trash2, Settings } from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../routes";

const SequenceEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sequences, commands } = useStore();

  const sequence = sequences.find((s) => s.id === id);

  if (!sequence) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader title="Sequence Not Found" backTo="/" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Sequence Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The sequence you&apos;re looking for doesn&apos;t exist or has
              been deleted.
            </p>
            <Button onClick={() => navigate("/")}>Back to Workspace</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={`Edit: ${sequence.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Test Run
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Sequence Info */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-semibold mb-2">{sequence.name}</h2>
            {sequence.description && (
              <p className="text-sm text-muted-foreground">
                {sequence.description}
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Steps ({sequence.steps.length})
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>

            {sequence.steps.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No steps in this sequence yet. Add a step to get started.
                </p>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sequence.steps.map((step, index) => {
                  const command = commands.find((c) => c.id === step.commandId);
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group"
                    >
                      <div className="cursor-grab text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {command?.name || "Unknown Command"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delay: {step.delay}ms
                          {step.stopOnError && " • Stop on error"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Placeholder for future features */}
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
            <p className="text-sm">
              Full sequence editor with drag-and-drop, parameter binding, and
              flow visualization coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceEditor;
