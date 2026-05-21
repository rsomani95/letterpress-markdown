# Letterpress Markdown

A VSCode extension for typographically refined markdown preview and a calmer editing experience. Theme-agnostic — works with any color theme.

## What It Does

**Preview styling** — Centered prose column (720px default, resizable per-doc via a slider summoned with `w`), opacity-based text hierarchy, gradient-faded dividers, consistent vertical rhythm. Inter for body, Instrument Serif italic for headings, JetBrains Mono for code. The aesthetic goal is calm legibility — text reads like a printed page, not a wall of UI.

**Width slider** — Press `w` anywhere in the preview to summon a floating slider; `w` again or `Esc` dismisses it. Resize the column live, anywhere from 480 to 1280px. The chosen width is remembered per-document, so each file restores its own preference — even across projects. New documents inherit the last-used value. Click "reset" to return to 720px. The slider stays out of the way until you call it up; your width still applies while it's hidden.

**Color swatches** — Inline `` `#hex` `` codes get a small filled circle prefix showing the actual color, matching the editor's built-in color decorator. Supports 3/4/6/8-digit hex; block code is left alone.

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

### From a local checkout (development)

Symlink into VSCode's extension directory — fast iteration loop, edits to CSS or scripts show up after "Markdown: Refresh Preview":

```bash
ln -sfn /path/to/vscode-themes/letterpress-markdown \
  ~/.vscode/extensions/rsomani95.letterpress-markdown-0.1.0
```

### From a `.vsix` (production-style install)

Build the package once with `npm run package`, then install:

```bash
code --install-extension dist-vsix/letterpress-markdown-0.1.0.vsix
```

For Remote-SSH hosts, install on the remote with:

```bash
code --install-extension dist-vsix/letterpress-markdown-0.1.0.vsix --remote ssh-remote+<host>
```

Then reload VSCode (Cmd+Shift+P → "Developer: Reload Window").

**Disable `bierner.markdown-preview-github-styles`** — it targets the same preview styling surface and will conflict. Other Bierner markdown extensions (emoji, footnotes, mermaid, etc.) are fine.

## How It Works on SSH Remotes

The extension is declared as `extensionKind: ["ui", "workspace"]`, so VS Code will load it in whichever extension host opens the markdown file:

- **Local files** → loaded in the local (UI) extension host.
- **Remote files over SSH** → loaded in the remote (workspace) extension host, alongside VS Code's built-in `vscode.markdown-language-features`.

The reason both are needed: VS Code's markdown preview is rendered by the same extension host that opens the file. For our `markdown.previewStyles` and `markdown.previewScripts` contributions to take effect on remote files, our extension must be present on the remote.

**Once installed from the marketplace**, VS Code handles this automatically. If you want it auto-installed on every Remote-SSH host you connect to, add to your user `settings.json`:

```json
"remote.SSH.defaultExtensions": [
  "rsomani95.letterpress-markdown"
]
```

For pre-publish development, install the `.vsix` directly on the remote: `code --install-extension letterpress-markdown-0.1.0.vsix --remote ssh-remote+<host>`.

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

The extension bundles **Instrument Serif Italic** (~64KB TTF) for headings, loaded via `@font-face` in the preview webview. **Inter** and **JetBrains Mono** are referenced by name with system fallbacks — they should already be installed on your system.

If Instrument Serif doesn't render (you'll see Georgia as the fallback), the bundled font may not be loading. Check that the symlink is intact and the `fonts/` directory contains the TTF.

## Publishing to the Marketplace

One-time setup:

1. **Register publisher `rsomani95`** at https://marketplace.visualstudio.com/manage. The ID must match `package.json`'s `publisher` field.
2. **Generate a Personal Access Token (PAT)** in your Azure DevOps organization with the `Marketplace > Manage` scope (Azure DevOps is the auth backend the marketplace uses; you don't have to use it for anything else). Save it durably — you'll need it for every login.
3. **Replace the placeholder `icon.png`** with the final design (256×256 PNG recommended). The current one is a leftover serif "R" from before the rename to Letterpress — needs replacement.

Per-release flow, run from `vscode-themes/letterpress-markdown/`:

```bash
# Bump the version — also creates a git commit + tag
npm version patch                 # 0.1.0 → 0.1.1, or use minor / major

# Update the changelog for the new version, commit
$EDITOR CHANGELOG.md
git commit -am "letterpress-markdown $(jq -r .version package.json) changelog"

# First time only — paste the PAT when prompted
npx vsce login rsomani95

# Publish (this runs vscode:prepublish → tsc, then packages and uploads)
npm run publish
```

A few minutes after publishing, the extension is live at `https://marketplace.visualstudio.com/items?itemName=rsomani95.letterpress-markdown`.

### Pre-release versions

For experimental drops, use `npx vsce publish --pre-release`. Pre-release versions show up in a separate marketplace slot; users opt in via "Switch to Pre-Release Version" in the extension page.

### What changes after publish

The `home.activation.installLetterpressMarkdown` hook in `home.nix` was built to side-load this extension before it existed on the marketplace. Once it's published, you have two cleaner options:

1. **Auto-install on Remote-SSH connect.** Add to your VS Code user `settings.json`:

   ```json
   "remote.SSH.defaultExtensions": [
     "rsomani95.letterpress-markdown"
   ]
   ```

   VS Code will auto-install on every Remote-SSH host you connect to.

2. **One-shot install on existing remotes:** `code --install-extension rsomani95.letterpress-markdown --remote ssh-remote+<host>`.

The home-manager activation hook can stay as a safety net (it's idempotent) or be removed once you're confident the marketplace path is the canonical one.

### Optional: GitHub Actions release pipeline

For tag-based publishing:

```yaml
name: Publish Extension
on:
  push:
    tags: ["letterpress-markdown-v*"]
jobs:
  publish:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: vscode-themes/letterpress-markdown
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

Store the PAT as the repo secret `VSCE_PAT`.

## Development

### Iterating on preview CSS

Edit `styles/preview.css`, then Cmd+Shift+P → "Markdown: Refresh Preview". No reload needed — CSS changes are picked up immediately.

### Iterating on the word counter

```bash
npm run build    # compiles src/extension.ts → dist/extension.js
```

Then reload VSCode window (Cmd+Shift+P → "Developer: Reload Window"). TypeScript changes require a full reload.

### Architecture

The extension contributes through two independent mechanisms:

| Concern | Mechanism | Runs where |
|---------|-----------|------------|
| Preview CSS | `markdown.previewStyles` in package.json → CSS files injected into preview webview | Local (UI) |
| Word counter | `main` entry point → StatusBarItem via VSCode API | Local (UI) |
| Editor defaults | `configurationDefaults` in package.json → `[markdown]` settings | Local (UI) |

All three are purely client-side. The extension never touches the remote filesystem or runs code on a remote host.

### Theme-agnostic color strategy

No colors are hardcoded. All text colors use `color-mix()` to apply opacity to the active theme's `--vscode-editor-foreground`:

```css
color: color-mix(in srgb, var(--vscode-editor-foreground) 85%, transparent);
```

This means the extension adapts to any light or dark theme automatically. `color-mix()` requires Chromium 111+; VSCode 1.80+ satisfies this.

### Files

```
├── package.json              # Extension manifest
├── tsconfig.json
├── styles/
│   ├── fonts.css             # @font-face for Instrument Serif
│   └── preview.css           # Layout, typography, spacing, hierarchy
├── fonts/
│   └── InstrumentSerif-Italic.ttf
├── src/
│   └── extension.ts          # Word counter source
└── dist/
    └── extension.js          # Compiled word counter
```
