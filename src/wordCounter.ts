import * as vscode from 'vscode';

function countWords(text: string): number {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')              // fenced code blocks
    .replace(/`[^`]+`/g, '')                      // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')    // links/images → keep link text
    .replace(/^#{1,6}\s+/gm, '')                  // heading markers
    .replace(/^\s*[-*+]\s+/gm, '')                // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, '')                // ordered list markers
    .replace(/^\s*>\s+/gm, '')                    // blockquote markers
    .replace(/[*_~]+/g, '')                        // emphasis/strikethrough markers
    .replace(/^\s*---+\s*$/gm, '')                // horizontal rules
    .replace(/^\s*\|.*\|\s*$/gm, (line) =>        // table rows → keep cell text
      line.replace(/\|/g, ' ').replace(/-{2,}/g, ''))
    .trim();

  if (cleaned.length === 0) return 0;
  return cleaned.split(/\s+/).filter(w => w.length > 0).length;
}

export function activateWordCounter(
  context: vscode.ExtensionContext,
  mdLangs: Set<string>
): void {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  function update() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !mdLangs.has(editor.document.languageId)) {
      statusBarItem.hide();
      return;
    }

    const selection = editor.selection;
    if (!selection.isEmpty) {
      const selectedText = editor.document.getText(selection);
      const n = countWords(selectedText);
      statusBarItem.text = `$(pencil) ${n.toLocaleString()} word${n === 1 ? '' : 's'} selected`;
    } else {
      const fullText = editor.document.getText();
      const n = countWords(fullText);
      statusBarItem.text = `$(book) ${n.toLocaleString()} word${n === 1 ? '' : 's'}`;
    }

    statusBarItem.show();
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.window.onDidChangeTextEditorSelection(update),
    vscode.workspace.onDidChangeTextDocument(e => {
      if (vscode.window.activeTextEditor?.document === e.document) {
        update();
      }
    }),
    statusBarItem
  );

  update();
}
