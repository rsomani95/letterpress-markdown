## How It Works on SSH Remotes

The extension is declared as `extensionKind: ["workspace"]`, so VS Code loads it in the extension host that *owns the file* — the local host for local files, and the remote (workspace) host for files opened over Remote-SSH, alongside VS Code's built-in `vscode.markdown-language-features`.

This matters because VS Code's markdown preview is rendered by the host that owns the file. The `markdown.previewStyles` and `markdown.previewScripts` contributions only take effect if the extension is present in that host, so for remote files the extension must run on the remote.

**Once installed from the marketplace**, VS Code handles this automatically. If you want it auto-installed on every Remote-SSH host you connect to, add to your user `settings.json`:

```json
"remote.SSH.defaultExtensions": [
  "rsomani95.letterpress-markdown"
]
```
