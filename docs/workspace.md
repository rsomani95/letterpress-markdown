## Disabling / Falling Back to Default Markdown

### Per-workspace

Disable the extension for a specific project without affecting others:

1. Open the Extensions sidebar (Cmd+Shift+X)
2. Find "Letterpress Markdown"
3. Click the dropdown arrow next to "Disable" → **"Disable (Workspace)"**

This writes an entry to `.vscode/extensions.json` in the workspace. The extension stays globally installed but is inactive for that project. To re-enable, repeat the same steps and click "Enable (Workspace)".

### Per-workspace via settings file

If you prefer editing files directly, create or edit `.vscode/settings.json` in the project root:

```json
{
  "extensions.disabled": ["rsomani95.letterpress-markdown"]
}
```

### Reverting editor defaults only

If you want to keep the preview styling but revert the plaintext editor feel, add this to your user or workspace `settings.json`:

```json
{
  "[markdown]": {
    "editor.wordWrap": "off",
    "editor.lineNumbers": "on",
    "editor.glyphMargin": true,
    "editor.folding": true,
    "editor.minimap.enabled": true,
    "editor.renderWhitespace": "selection",
    "editor.quickSuggestions": true,
    "editor.renderLineHighlight": "line"
  }
}
```
