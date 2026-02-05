import React from "react";
import { Button, CardContent, Checkbox, Input, Label, Textarea } from "../ui";
import { generateId } from "../../lib/utils";
import type { ProjectContext } from "../../types";

interface ContextTabProps {
  contexts: ProjectContext[];
  contextIds: string[];
  onContextIdsChange: (ids: string[]) => void;
  contextTitle: string;
  onContextTitleChange: (title: string) => void;
  contextContent: string;
  onContextContentChange: (content: string) => void;
  onUpdateContext?: (context: ProjectContext) => void;
  onCreateContext: (context: ProjectContext) => void;
}

const ContextTab: React.FC<ContextTabProps> = ({
  contexts,
  contextIds,
  onContextIdsChange,
  contextTitle,
  onContextTitleChange,
  contextContent,
  onContextContentChange,
  onUpdateContext,
  onCreateContext,
}) => {
  const activeContexts = contexts.filter((c) => contextIds.includes(c.id));

  const handleSaveContext = () => {
    if (contextTitle && contextContent) {
      if (contextIds.length === 1 && activeContexts.length === 1) {
        if (onUpdateContext)
          onUpdateContext({
            ...activeContexts[0],
            title: contextTitle,
            content: contextContent,
          });
      } else {
        const newCtx: ProjectContext = {
          id: generateId(),
          title: contextTitle,
          content: contextContent,
          source: "USER" as const,
          createdAt: Date.now(),
        };
        onCreateContext(newCtx);
        onContextIdsChange([...contextIds, newCtx.id]);
      }
    }
  };

  return (
    <CardContent className="pt-6 space-y-4 h-full flex flex-col">
      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <Label>Context ID / Link</Label>
          <div className="space-y-2">
            {contexts.map((context) => (
              <Checkbox
                key={context.id}
                checked={contextIds.includes(context.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onContextIdsChange([...contextIds, context.id]);
                  } else {
                    onContextIdsChange(
                      contextIds.filter((id) => id !== context.id),
                    );
                  }
                }}
                label={context.title}
              />
            ))}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={handleSaveContext}>
          Save Context
        </Button>
      </div>

      <div className="space-y-1">
        <Label>Context Title</Label>
        <Input
          value={contextTitle}
          onChange={(e) => onContextTitleChange(e.target.value)}
          placeholder="Protocol Manual Section 1..."
        />
      </div>

      <div className="space-y-1 flex-1 flex flex-col">
        <Label>Content (Markdown/Text)</Label>
        <Textarea
          value={contextContent}
          onChange={(e) => onContextContentChange(e.target.value)}
          className="flex-1 resize-none font-mono text-xs"
          placeholder="Paste documentation or protocol details here..."
        />
      </div>
    </CardContent>
  );
};

export default ContextTab;
