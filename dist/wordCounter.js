"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateWordCounter = activateWordCounter;
const vscode = __importStar(require("vscode"));
function countWords(text) {
    const cleaned = text
        .replace(/```[\s\S]*?```/g, '') // fenced code blocks
        .replace(/`[^`]+`/g, '') // inline code
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images → keep link text
        .replace(/^#{1,6}\s+/gm, '') // heading markers
        .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
        .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers
        .replace(/^\s*>\s+/gm, '') // blockquote markers
        .replace(/[*_~]+/g, '') // emphasis/strikethrough markers
        .replace(/^\s*---+\s*$/gm, '') // horizontal rules
        .replace(/^\s*\|.*\|\s*$/gm, (line) => // table rows → keep cell text
     line.replace(/\|/g, ' ').replace(/-{2,}/g, ''))
        .trim();
    if (cleaned.length === 0)
        return 0;
    return cleaned.split(/\s+/).filter(w => w.length > 0).length;
}
function activateWordCounter(context, mdLangs) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
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
        }
        else {
            const fullText = editor.document.getText();
            const n = countWords(fullText);
            statusBarItem.text = `$(book) ${n.toLocaleString()} word${n === 1 ? '' : 's'}`;
        }
        statusBarItem.show();
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.window.onDidChangeTextEditorSelection(update), vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor?.document === e.document) {
            update();
        }
    }), statusBarItem);
    update();
}
//# sourceMappingURL=wordCounter.js.map