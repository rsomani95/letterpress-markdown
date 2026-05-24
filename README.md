# Letterpress Markdown

A VSCode extension for a nicer, opinionated Markdown _Preview_ experience.

Quick demo:

![Letterpress Markdown demo](https://raw.githubusercontent.com/rsomani95/letterpress-markdown/f16dbdd16641d01cf95d6f3c0fa41e77c2b6bc6f/demo.gif)

## Key Features

- Centered prose column
- Opinionated styling for headings vs. content sections
- Table of contents for ease of navigation
- Word counter in editing mode
- Color swatches for inline 6 character hex codes

## Preview controls

Everything adjustable lives *in* the preview as a keypress or a small control — there are no VS Code settings to manage. Each choice is saved in the preview's `localStorage`, so it persists across documents and projects on its own.

| Control | Action |
|---------|--------|
| `w` | Summon / dismiss the column-width slider (`Esc` also dismisses) |
| `t` / `≡` | Toggle the table of contents between rail and breadcrumb (`≡` control in the rail header / breadcrumb bar) |
| `s` / `⇄` | Move the rail to the other margin (`⇄` control in the rail header; active while the rail is showing) |
| `/` | Open the heading jump-overlay (then `↑`/`↓` or `Ctrl+P`/`Ctrl+N` to move, Enter to jump, Esc to close) |

> **Why no settings:** VS Code's built-in markdown preview runs in a webview this extension only contributes scripts to — the extension host can't message it live, and pushing a setting into it is unreliable. Keeping these in the preview (backed by `localStorage`) makes them instant, dependable, and identical on Remote-SSH. Same reason why we can't use the 'Explorer' tab for ToC in Preview mode

## How It Works on SSH Remotes

The extension is declared as `extensionKind: ["workspace"]`, so VS Code loads it in the extension host that *owns the file* — the local host for local files, and the remote (workspace) host for files opened over Remote-SSH, alongside VS Code's built-in `vscode.markdown-language-features`.

This matters because VS Code's markdown preview is rendered by the host that owns the file. The `markdown.previewStyles` and `markdown.previewScripts` contributions only take effect if the extension is present in that host, so for remote files the extension must run on the remote.

**Once installed from the marketplace**, VS Code handles this automatically. If you want it auto-installed on every Remote-SSH host you connect to, add to your user `settings.json`:

```json
"remote.SSH.defaultExtensions": [
  "rsomani95.letterpress-markdown"
]
```

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

## Fonts

The extension bundles all three typefaces it uses — **Inter** (body), **Instrument Serif Italic** (headings), and **JetBrains Mono** (code) — and loads them via `@font-face` in the preview webview, so the preview looks identical on every machine regardless of what's installed locally. All three are under the SIL Open Font License; see [`CREDITS.md`](CREDITS.md).

If headings fall back to a generic serif (Georgia) instead of Instrument Serif, the bundled font isn't loading — confirm the `fonts/` directory shipped with the extension (it shouldn't be excluded by `.vscodeignore`). These may be made customisable in a future version.
