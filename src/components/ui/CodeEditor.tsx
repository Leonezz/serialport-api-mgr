
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { githubLight } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { useStore } from '../../lib/store';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder, height = "200px", className }) => {
  const { themeMode } = useStore();
  
  // Determine if dark mode is active for the editor theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div 
        className={`border border-border rounded-md overflow-hidden resize-y flex flex-col ${className}`}
        style={{ height, minHeight: '100px' }}
    >
      <CodeMirror
        value={value}
        height="100%"
        theme={isDark ? vscodeDark : githubLight}
        extensions={[javascript({ jsx: false })]}
        onChange={(val) => onChange(val)}
        placeholder={placeholder}
        basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
        }}
        className="text-xs font-mono flex-1 h-full"
      />
    </div>
  );
};

export default CodeEditor;
