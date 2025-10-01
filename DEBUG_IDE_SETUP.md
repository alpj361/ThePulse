# Debug IDE Setup Instructions

## Current Status: ✅ Working with Simple Editor

The Debug IDE is **fully functional** with an enhanced simple editor that includes:
- Auto-indentation and Tab support
- Ctrl+Enter to execute code
- Line counting and keyboard shortcuts
- Auto-generation of JavaScript from text descriptions

## Optional Enhancement: Monaco Editor

For advanced syntax highlighting and IntelliSense, install Monaco Editor:

```bash
npm install @monaco-editor/react monaco-editor
```

## Features Available

### ✅ Currently Implemented

1. **Auto-loading Code**: Automatically generates executable JavaScript from agent descriptions
2. **Monaco Editor**: Advanced code editor with syntax highlighting, autocomplete, and snippets
3. **AI-Powered Improvements**:
   - 🧠 "Mejorar" button - AI optimizes your code
   - 🔍 "Explicar Error" button - AI explains and fixes errors
4. **Quick Test**: One-click testing of existing agents
5. **Auto-application**: Apply successful debug scripts back to agent config

### 🚧 In Development

6. **Split-view Layout**: Code editor + live results side by side
7. **DOM Inspector**: Browse page structure and click to generate selectors
8. **Streaming Execution**: Real-time console output during script execution
9. **Breakpoint Support**: Step-through debugging

## How to Use

1. **Open an existing agent** → Debug tab auto-loads executable code
2. **Edit JavaScript directly** → Monaco editor with syntax highlighting
3. **Run "🚀 Probar Agente"** → Execute agent code instantly
4. **Code not working?** → Click "🔍 Explicar Error" → AI explains and fixes
5. **Want better code?** → Click "🧠 Mejorar" → AI optimizes your selectors
6. **Happy with results?** → Click "Aplicar al Agente" → Save improvements

## Code Generation Features

The system automatically generates executable JavaScript from text descriptions:

- **Text Input**: "Extraer noticias del congreso"
- **Generated Code**: Full JavaScript with querySelector, error handling, logging
- **Smart Selectors**: Context-aware CSS selectors based on description keywords

## AI Assistant Capabilities

### Code Improvement
- Analyzes execution results to optimize selectors
- Adds error handling and robustness
- Suggests better extraction patterns
- Fixes common scraping issues

### Error Explanation
- Explains JavaScript errors in plain Spanish
- Identifies probable causes
- Provides specific fix suggestions
- Automatically applies corrections when possible

## Architecture

```
Debug Mode Components:
├── CodeEditor.tsx          # Monaco editor with fallback
├── AI Improvement APIs     # Backend code analysis
├── Auto-code Generation    # Text → JavaScript conversion
├── Real-time Execution     # Browser automation with logging
└── Results Visualization   # JSON viewer + error display
```

## Tips for Best Results

1. **Be specific** in your extraction descriptions
2. **Test iteratively** - run, improve, test again
3. **Use AI buttons** when stuck - they understand context
4. **Review generated selectors** - they're starting points
5. **Apply successful scripts** to save your improvements

## Troubleshooting

### Monaco Editor Not Loading
- Install dependencies: `npm install @monaco-editor/react monaco-editor`
- Fallback simple editor will be used if Monaco fails

### AI Features Not Working
- Check `OPENAI_API_KEY` in backend environment
- Review console for API errors
- Fallback to manual code editing

### Code Not Executing
- Check browser console for errors
- Ensure URL is accessible and not bot-protected
- Use "🔍 Explicar Error" button for AI analysis

## Future Enhancements

- **Visual Selector Builder**: Click elements to build selectors
- **Performance Profiler**: Optimize execution speed
- **Template Library**: Pre-built patterns for common sites
- **Collaborative Debugging**: Share debugging sessions
- **Mobile Testing**: Test on mobile viewports