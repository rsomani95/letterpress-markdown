# Contributing & Releasing

Maintainer docs for Letterpress Markdown — the development loop, architecture, and the
release/publish workflow. User-facing documentation lives in [`README.md`](README.md).

## Repository layout

The canonical source lives in the author's home-manager monorepo at
`vscode-themes/letterpress-markdown/`, and is mirrored to the standalone public repo
(`github.com/rsomani95/letterpress-markdown`) via `git subtree`. Develop in the monorepo;
the mirror exists to give the marketplace a clean `repository` URL, an issue tracker, and a
findable project home.

```bash
# one-time: add the mirror as a remote (from the monorepo root)
git remote add lp git@github.com:rsomani95/letterpress-markdown.git

# each release: push the subdirectory's history to the mirror
git subtree push --prefix=vscode-themes/letterpress-markdown lp main
```

The split is path-filtered: only changes under the prefix reach the mirror — monorepo and
dotfiles changes never do, even when a single commit touched both.

## Development

### Iterating on preview CSS

Edit `styles/preview.css`, then Cmd+Shift+P → "Markdown: Refresh Preview". No reload
needed — CSS changes are picked up immediately.

### Iterating on the scripts or word counter

```bash
npm run build    # compiles src/ → dist/
```

The preview scripts (`scripts/*.js`) are plain JS — a "Markdown: Refresh Preview" picks
them up. TypeScript changes to the word counter (`src/`) require a full window reload
(Cmd+Shift+P → "Developer: Reload Window").

### Local install for testing

Symlink into VS Code's extension directory for a fast iteration loop (match the version in
`package.json`):

```bash
ln -sfn /path/to/vscode-themes/letterpress-markdown \
  ~/.vscode/extensions/rsomani95.letterpress-markdown-<version>
```

Or build and install a real package: `npm run package` then
`code --install-extension dist-vsix/letterpress-markdown-<version>.vsix`.

### Architecture

The extension contributes through several independent mechanisms, all client-side:

| Concern | Mechanism | Runs where |
|---------|-----------|------------|
| Preview CSS | `markdown.previewStyles` → `styles/*.css` injected into the preview webview | Host that owns the file |
| Preview behavior | `markdown.previewScripts` → `scripts/*.js` (fold, width slider, color swatches, TOC) run in the webview | Same |
| Word counter | `main` entry point → `StatusBarItem` via the VS Code API | Same |
| Editor defaults | `configurationDefaults` → `[markdown]` settings | Same |

The extension never touches the remote filesystem or runs arbitrary code on a remote host —
the scripts run only inside the preview webview's sandbox. Because `extensionKind` is
`["workspace"]`, all of this runs in whichever extension host owns the file (see the README's
"How It Works on SSH Remotes").

### Theme-agnostic color strategy

No colors are hardcoded. All text colors use `color-mix()` to apply opacity to the active
theme's `--vscode-editor-foreground`:

```css
color: color-mix(in srgb, var(--vscode-editor-foreground) 85%, transparent);
```

This means the extension adapts to any light or dark theme automatically. `color-mix()`
requires Chromium 111+; VS Code 1.80+ satisfies this.

### Files

```
├── package.json              # Extension manifest
├── tsconfig.json
├── README.md                 # User-facing listing
├── CONTRIBUTING.md           # This file
├── CHANGELOG.md
├── CREDITS.md                # Bundled-font attribution (OFL-1.1)
├── LICENSE                   # MIT (the code)
├── icon.png
├── styles/
│   ├── fonts.css             # @font-face for the three bundled typefaces
│   └── preview.css           # Layout, typography, spacing, hierarchy, task lists
├── scripts/
│   ├── fold.js               # Heading fold/collapse
│   ├── width-slider.js       # `w` column-width slider
│   ├── color-swatches.js     # Inline `#rrggbb` swatches
│   └── toc.js                # Rail / breadcrumb / `/` overlay
├── fonts/
│   ├── Inter.ttf
│   ├── InstrumentSerif-Italic.ttf
│   └── JetBrainsMono.ttf
├── src/
│   ├── extension.ts          # Activation entry
│   └── wordCounter.ts        # Word counter
└── dist/                     # Compiled output (shipped; src/ is not)
    ├── extension.js
    └── wordCounter.js
```

## Publishing

### One-time setup

1. **Register publisher `rsomani95`** at <https://marketplace.visualstudio.com/manage>. The
   ID must match `package.json`'s `publisher` field.
2. **Azure DevOps PAT** scoped **Marketplace → Manage**, **All accessible organizations**
   (org-scoped tokens silently fail). Save it durably — it's needed for every `vsce login`.
3. **Open VSX** (for Cursor / VSCodium / Windsurf / Gitpod, which can't use the MS
   marketplace): create an account at <https://open-vsx.org>, generate an access token, and
   claim the `rsomani95` namespace.
4. **Verified Publisher badge** is optional — it requires proving ownership of a domain via a
   DNS TXT record. Not needed to publish.

### Per-release flow

Run from the extension directory:

```bash
npm version patch              # 0.x.y → bump; also creates a git commit + tag
$EDITOR CHANGELOG.md           # add the new version's entry
git commit -am "letterpress-markdown $(jq -r .version package.json) changelog"

# publish to both registries
npx vsce login rsomani95       # first time only; paste the PAT
npm run publish                # vsce publish (runs tsc via vscode:prepublish, packages, uploads)
npx ovsx publish dist-vsix/letterpress-markdown-$(jq -r .version package.json).vsix -p <ovsx-token>

# mirror the source to the public repo
git -C ~/.config/home-manager subtree push --prefix=vscode-themes/letterpress-markdown lp main
```

A few minutes later it's live at
<https://marketplace.visualstudio.com/items?itemName=rsomani95.letterpress-markdown> and
<https://open-vsx.org/extension/rsomani95/letterpress-markdown>.

### Pre-release versions

`npx vsce publish --pre-release` for experimental drops. They show up in a separate
marketplace slot; users opt in via "Switch to Pre-Release Version" on the extension page.

### Deployment model (the author's own machines)

Now that it's on the marketplace, the author's machines install from there, **not** from a
side-loaded vsix:

- **macOS** — VS Code auto-updates from the marketplace.
- **Linux GPU servers (Remote-SSH)** — add to the user `settings.json`:
  ```json
  "remote.SSH.defaultExtensions": ["rsomani95.letterpress-markdown"]
  ```
  VS Code auto-installs on connect, and pulls the `bierner.markdown-checkbox` pack member
  along with it.

The `home.activation.installLetterpressMarkdown*` hooks, the staged vsix
(`home.file.".local/share/hms-extensions/..."`), and the `hms-push` repackage step predate
the marketplace listing. They were the side-load channel built *because* the extension
wasn't published; they are being retired now that the marketplace path is canonical. Keep
them for one or two releases as an idempotent safety net, confirm marketplace install lands
on `mnot`/`frank`, then remove them and stop committing the `.vsix`.

### Optional: GitHub Actions release pipeline (on the mirror repo)

The mirror has the extension at its root, so no `working-directory` is needed:

```yaml
name: Publish Extension
on:
  push:
    tags: ["v*"]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
      - run: npx ovsx publish -p ${{ secrets.OVSX_PAT }}
```

Store the tokens as the repo secrets `VSCE_PAT` and `OVSX_PAT`. A tag like `v0.11.0` on the
mirror triggers a publish to both registries.
