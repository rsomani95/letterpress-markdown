# Changelog

## 0.7.2

- Added `s` as a hotkey to flip the rail to the other margin (left ⇄ right) — the keyboard equivalent of the `⇄` control. Active while the rail is showing.

## 0.7.1

- Moved the breadcrumb's switch-to-rail (`≡`) control to the far left of the bar, ahead of the heading path — it was too easy to miss tucked at the right edge.

## 0.7.0

Made TOC mode as reliable as the width and rail-side controls by taking it off VS Code settings entirely.

- **TOC mode is now a preview-local preference.** Toggle rail ⇄ breadcrumb with `t`, or the `≡` control in the rail header / breadcrumb bar. Saved in `localStorage`, so it persists across documents and projects. Rail stays the default.
- **Removed all the settings/extension-host machinery** that made the setting flaky: the `letterpress.toc.defaultMode` setting, the `markdown.markdownItPlugins` contribution + `extendMarkdownIt` injection, the config-change refresh, and the `Letterpress: Settings` command. The extension host is back to just the word counter. A setting can't be reliably pushed into the preview webview (VS Code owns it); `localStorage` is the native, dependable channel — the same one the column width and rail side already use.

If you still have `letterpress.toc.defaultMode` or `letterpress.toc.railSide` in your `settings.json`, they're now unused — safe to delete.

## 0.6.0

Simplified the TOC controls so each preference has exactly one home:

- **TOC mode is now settings-only.** Removed the in-preview mode switches (the "Switch to Rail view" footer in the breadcrumb dropdown and the "← Breadcrumb" button in the rail header). Rail vs breadcrumb is chosen solely by `letterpress.toc.defaultMode`. No more per-browser override to get out of sync with the setting.
- **Rail side is now flip-only.** Removed the `letterpress.toc.railSide` setting. The `⇄` control in the rail header is the only way to switch sides, and the choice persists across documents and projects via `localStorage` — same as the column width.
- Cleaned up the now-unused `localStorage` keys from the ≤0.5.x mode toggle and settings-reconciliation on load.

## 0.5.1

- **Fix: settings weren't reaching the preview.** `extendMarkdownIt` is only invoked when the extension declares `"markdown.markdownItPlugins": true` in `contributes` — that declaration was missing, so `letterpress.toc.*` never got injected and the rail always fell back to the right, regardless of `railSide`.
- **Fix: changing a setting now overrides a stale in-preview toggle.** A live mode/side switch is remembered per browser, but it was shadowing the setting permanently — so setting `defaultMode` to `rail` did nothing if you'd ever switched to breadcrumb. Now the preview tracks the last-applied setting value; when the setting changes, the stale override is cleared and the new default wins. A live toggle still sticks until you next change the setting.

## 0.5.0

- **Settings.** Two settings, reachable from the command palette via `Letterpress: Settings` (or Preferences → search "letterpress"):
  - `letterpress.toc.defaultMode` — `rail` (default) or `breadcrumb`; the starting TOC style for new previews.
  - `letterpress.toc.railSide` — `right` (default) or `left`; which margin the rail occupies.
  These are defaults; the in-preview controls still override them per browser. Settings reach the preview via `extendMarkdownIt` (injected as a hidden data span) and a refresh-on-change, since the built-in preview webview can't be messaged from the extension host.
- **Left rail.** The TOC rail can now sit in the left margin, not just the right. Set it via `letterpress.toc.railSide`, or flip it live with the new `⇄` control in the rail header. The width slider's cap already reserves room symmetrically, so the left rail needs no extra space handling.
- **Width slider is summoned, not always shown.** It no longer occupies a faint strip at the top of every preview. Press `w` to bring it up as a floating control, `w` or `Esc` to dismiss. Per-document width and persistence are unchanged — the width still applies while the slider is hidden; this only removes the always-present chrome.

## 0.4.5

- Clicks on TOC items (rail, breadcrumb dropdown, overlay) now jump to the heading instantly instead of smooth-scrolling.
- Added `scroll-margin-top` on headings so jumps land cleanly below the breadcrumb (when active) instead of behind it.

## 0.4.4

- Rail is preserved when widening: instead of swapping to Breadcrumb once the prose column gets too wide for the rail, the width slider's max is clipped to whatever still leaves room for the rail. The user can't drag past it, and if they had a previously-saved width that no longer fits, it's clamped down. Breadcrumb fallback now only kicks in when the viewport is genuinely too narrow for the rail at any content width.

## 0.4.3

- Rail now correctly falls back to Breadcrumb when the content column is too wide to leave it room (previously it would overlap the prose). The threshold is dynamic on the current preview width, so widening or narrowing via the slider swaps modes in real time.

## 0.4.2

- Default TOC mode is now Rail (was Breadcrumb). Narrower windows still fall back to Breadcrumb automatically.
- Breadcrumb dropdown now opens from the left edge instead of centered — keeps the eye in one column rather than jumping across the bar.
- Capitalised the mode names in the in-UI switch labels: "Switch to Rail view" / "← Breadcrumb".

## 0.4.1

- Breadcrumb is now persistently visible at the top of the preview instead of sliding in once you've scrolled past the first heading. Sits just above the width slider so neither obscures the other.
- Removed the `☰ all` pill from the right side of the breadcrumb. Expanding the TOC now happens by clicking anywhere on the bar — a small `▾` chevron next to the current heading marks it as expandable and rotates when the dropdown is open. Ancestor segments still jump to their heading on click.
- Dropdown opens centered below the breadcrumb (was right-anchored).

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
