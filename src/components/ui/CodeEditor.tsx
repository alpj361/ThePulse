import React, { useRef } from 'react';

// Note: This component will use Monaco Editor if available
// To enable advanced features, install: npm install @monaco-editor/react monaco-editor

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  theme?: string;
  readOnly?: boolean;
  placeholder?: string;
  onExecute?: () => void;
}

// Enhanced simple editor for development
const SimpleCodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  height = '400px',
  placeholder,
  readOnly = false,
  onExecute
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Ctrl+Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onExecute) {
      e.preventDefault();
      onExecute();
    }
  };

  // Auto-indent on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';

      // Add extra indent for lines ending with {
      const extraIndent = currentLine.trim().endsWith('{') ? '  ' : '';

      e.preventDefault();
      const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(textarea.selectionEnd);
      onChange(newValue);

      setTimeout(() => {
        const newPosition = start + 1 + indent.length + extraIndent.length;
        textarea.selectionStart = textarea.selectionEnd = newPosition;
      }, 0);
    }
  };

  return (
    <div className="relative border rounded overflow-hidden">
      {/* Header with info */}
      <div className="bg-slate-100 border-b px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-slate-600">JavaScript</div>
          <div className="text-xs text-slate-500">Simple Editor</div>
        </div>
        <div className="text-xs text-slate-500">
          {onExecute ? 'Ctrl+Enter para ejecutar' : ''}
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`
          w-full font-mono text-sm resize-none border-0 p-3
          bg-white text-slate-800 leading-6
          focus:outline-none focus:ring-0
          ${readOnly ? 'bg-slate-50 text-slate-600' : ''}
        `}
        style={{ height: `calc(${height} - 40px)` }}
        spellCheck={false}
      />

      {/* Line count indicator */}
      <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded shadow">
        {value.split('\n').length} líneas
      </div>

      {/* Upgrade notice */}
      <div className="bg-blue-50 border-t px-3 py-1">
        <div className="text-xs text-blue-600">
          💡 Instala Monaco Editor para syntax highlighting: <code className="bg-blue-100 px-1 rounded">npm install @monaco-editor/react monaco-editor</code>
        </div>
      </div>
    </div>
  );
};

// Monaco Editor will be available after installation
// Run: npm install @monaco-editor/react monaco-editor

// Main CodeEditor component with fallback
const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  // Always use simple editor for now - Monaco Editor requires installation
  // To enable Monaco: npm install @monaco-editor/react monaco-editor
  console.info('Using simple code editor. To enable advanced features, install: npm install @monaco-editor/react monaco-editor');
  return <SimpleCodeEditor {...props} />;
};

export default CodeEditor;