# Letterpress Markdown

A VSCode extension for typographically refined markdown preview and a calmer editing experience. Theme-agnostic — works with any color theme.

## What It Does

**Preview styling** — Centered prose column (720px default, resizable per-doc via a slider summoned with `w`), opacity-based text hierarchy, gradient-faded dividers, consistent vertical rhythm. Inter for body, Instrument Serif italic for headings, JetBrains Mono for code. The aesthetic goal is calm legibility — text reads like a printed page, not a wall of UI.

**Width slider** — Press `w` anywhere in the preview to summon a floating slider; `w` again or `Esc` dismisses it. Resize the column live, anywhere from 480 to 1280px. The chosen width is remembered per-document, so each file restores its own preference — even across projects. New documents inherit the last-used value. Click "reset" to return to 720px. The slider stays out of the way until you call it up; your width still applies while it's hidden.

**Color swatches** — Inline `` `#rrggbb` `` codes get a small filled circle prefix showing the actual color, matching the editor's built-in color decorator. Six-digit hex only (shorter forms misfire on references like `#109`); block code is left alone.

**Task lists** — GFM task lists (`- [ ]` / `- [x]`) render as drawn checkboxes in a left gutter, with wrapped lines hanging-indented so they align under the text rather than the box. Checked items fill with a faint accent tint and an accent checkmark, and their text recedes (dimmed, with a hairline strikethrough); the accent follows the active theme. The boxes are display-only — VS Code's markdown preview is a one-way render, so toggle a task by editing the source and the preview follows. The styling rides on the bundled `bierner.markdown-checkbox` companion, which this extension's pack installs for you.

**Table of contents** — Two modes. Toggle between them by pressing `t`, or with the `≡` control in the rail header / breadcrumb bar; your choice is remembered across documents and projects:
- *Rail* (default): a faded vertical list in the side margin. Brightens on hover. Sits on the right by default; flip sides with `s` or the `⇄` control in its header — the side also persists. Falls back to the breadcrumb automatically when the window is too narrow to fit it.
- *Breadcrumb*: a slim sticky bar at the top showing the current heading path (`Section › Subsection › Current`). Click anywhere on the bar to drop down a list of every heading.

Press `/` anywhere in the preview to bring up a fuzzy-filterable overlay of all headings. It opens on the section you're currently reading; navigate with `↑`/`↓` or `Ctrl+P`/`Ctrl+N` (Emacs-style), Enter to jump, Esc to dismiss.

**Word counter** — Status bar item (bottom-right) showing total prose word count. Strips markdown syntax (code blocks, link URLs, heading markers) before counting. Shows selected word count when text is selected. Only visible for markdown files.

**Editor defaults** — Soft `[markdown]` settings for a plaintext-like editing feel: word wrap at 80 columns, no line numbers, no minimap, no autocomplete. Override any of these in your `settings.json`.

## Preview controls

Everything adjustable lives *in* the preview as a keypress or a small control — there are no VS Code settings to manage. Each choice is saved in the preview's `localStorage`, so it persists across documents and projects on its own.

| Control | Action |
|---------|--------|
| `w` | Summon / dismiss the column-width slider (`Esc` also dismisses) |
| `t` / `≡` | Toggle the table of contents between rail and breadcrumb (`≡` control in the rail header / breadcrumb bar) |
| `s` / `⇄` | Move the rail to the other margin (`⇄` control in the rail header; active while the rail is showing) |
| `/` | Open the heading jump-overlay (then `↑`/`↓` or `Ctrl+P`/`Ctrl+N` to move, Enter to jump, Esc to close) |

> **Why no settings:** VS Code's built-in markdown preview runs in a webview this extension only contributes scripts to — the extension host can't message it live, and pushing a setting into it is unreliable. Keeping these in the preview (backed by `localStorage`) makes them instant, dependable, and identical on Remote-SSH.

## Installation

Install **Letterpress Markdown** from the VS Code Marketplace (or Open VSX for Cursor / VSCodium / Windsurf), then reload the window. The companion `bierner.markdown-checkbox` is pulled in automatically via the extension pack — it renders the task-list checkboxes this extension styles.

**Disable `bierner.markdown-preview-github-styles`** if you have it — it targets the same preview styling surface and will conflict. Other Bierner markdown extensions (emoji, footnotes, mermaid, etc.) are fine.

### From a `.vsix` (pre-publish or offline install)

Build the package once with `npm run package`, then install (match the version in `package.json`):

```bash
code --install-extension dist-vsix/letterpress-markdown-<version>.vsix
```

For Remote-SSH hosts, install on the remote with:

```bash
code --install-extension dist-vsix/letterpress-markdown-<version>.vsix --remote ssh-remote+<host>
```

Then reload VSCode (Cmd+Shift+P → "Developer: Reload Window").

## How It Works on SSH Remotes

The extension is declared as `extensionKind: ["workspace"]`, so VS Code loads it in the extension host that *owns the file* — the local host for local files, and the remote (workspace) host for files opened over Remote-SSH, alongside VS Code's built-in `vscode.markdown-language-features`.

This matters because VS Code's markdown preview is rendered by the host that owns the file. The `markdown.previewStyles` and `markdown.previewScripts` contributions only take effect if the extension is present in that host, so for remote files the extension must run on the remote.

> An earlier `["ui", "workspace"]` declaration broke this: with both hosts eligible, VS Code preferred the local install, so the CSS/JS sat on the local machine while the preview was rendered by the remote server — and the styling silently dropped. Workspace-only guarantees the extension runs wherever the file lives. (See CHANGELOG 0.2.1.)

**Once installed from the marketplace**, VS Code handles this automatically. If you want it auto-installed on every Remote-SSH host you connect to, add to your user `settings.json`:

```json
"remote.SSH.defaultExtensions": [
  "rsomani95.letterpress-markdown"
]
```

For pre-publish development, install the `.vsix` directly on the remote: `code --install-extension letterpress-markdown-<version>.vsix --remote ssh-remote+<host>`.

## Disabling / Falling Back to Default Markdown

### Per-workspace (recommended)

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

> **Note**: this setting is not officially documented and may not work in all VSCode versions. The UI method above is more reliable.

### Globally (temporary)

Disable the extension everywhere:

1. Extensions sidebar (Cmd+Shift+X) → find "Letterpress Markdown" → **"Disable"**

Or from the command line:

```bash
code --disable-extension rsomani95.letterpress-markdown
```

This launches VSCode with the extension disabled for that session only.

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

Your explicit settings always override the extension's `configurationDefaults`.

## Fonts

The extension bundles all three typefaces it uses — **Inter** (body), **Instrument Serif Italic** (headings), and **JetBrains Mono** (code) — and loads them via `@font-face` in the preview webview, so the preview looks identical on every machine regardless of what's installed locally. All three are under the SIL Open Font License; see [`CREDITS.md`](CREDITS.md).

If headings fall back to a generic serif (Georgia) instead of Instrument Serif, the bundled font isn't loading — confirm the `fonts/` directory shipped with the extension (it shouldn't be excluded by `.vscodeignore`).

## Contributing

Development loop, architecture, theme-agnostic color strategy, and the release/publishing workflow live in [CONTRIBUTING.md](CONTRIBUTING.md).
