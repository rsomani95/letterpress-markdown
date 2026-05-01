# Changelog

## 0.2.1

- `extensionKind` set to `["workspace"]` only. Previously `["ui", "workspace"]` caused the local install to be preferred over the remote when both were present, which broke `markdown.previewStyles` for files on Remote-SSH hosts (CSS lived on the local machine, but the preview is rendered by the remote vscode-server). Workspace-only ensures the extension runs wherever the file lives.

## 0.2.0

- Renamed package from `rocinante-markdown` to `letterpress-markdown`. New extension ID: `rsomani95.letterpress-markdown` (publisher unchanged).
- Width preferences saved under the previous `rocinante.width.*` localStorage keys are migrated on first preview load — no manual reset.

## 0.1.1

- Width slider at the top of the preview. Drag to resize the prose column live (480–1280px, default 720). Faded by default, brightens on hover.
- Width preference is remembered per-document via `localStorage`. New documents inherit the last-used width.
- Reset button restores the default 720px column.

## 0.1.0

Initial release.

- Centered, typographically refined markdown preview (720px column, Inter for body, Instrument Serif italic for headings, JetBrains Mono for code).
- Theme-agnostic styling via `color-mix()` against the active VS Code theme's editor foreground.
- Heading fold/collapse interactivity in preview.
- Word counter status bar item, with selection-aware count and markdown-syntax stripping.
- Plaintext-feeling editor defaults for `[markdown]` (word wrap at 80, no line numbers, no minimap, no autocomplete).
