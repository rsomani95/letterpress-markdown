# Changelog

## 0.4.0

- Table of contents in preview. Two modes:
  - **Breadcrumb** (default): a slim sticky bar at the top showing the current heading path (`Section › Subsection › Current`). Appears once you've scrolled past the first heading. The right edge has a `☰ all` button that opens a dropdown of every heading.
  - **Rail**: a faded vertical list in the right margin. Brightens on hover. Activates only when the window is wide enough (≥1080px) — narrower windows fall back to the breadcrumb.
- Mode is persisted per browser via `localStorage` and switchable from inside each mode (the dropdown footer in breadcrumb, the rail header link in rail).
- `/` opens a fuzzy-filterable overlay listing all headings; arrow keys + Enter to jump, Esc to dismiss. Available regardless of mode.
- Heading text in all three surfaces uses the same typographic hierarchy as the document (H1 in italic serif, H2/H3/H4 in inter with descending weight).

## 0.3.1

- Color swatches now only trigger for 6-digit hex codes (`#rrggbb`). Previously 3/4/8-digit forms were also matched, but the 3-digit form misfired on common references like `#109` (issue numbers).

## 0.3.0

- Color swatches in preview. Inline `` `#hex` `` codes (3/4/6/8-digit) get a small filled circle prefix showing the actual color, like the editor's built-in color decorator. Block code (fenced ``` blocks) is left alone — those are usually CSS being read as code, not standalone references.

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
