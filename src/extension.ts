import * as vscode from 'vscode';
import { activateWordCounter } from './wordCounter';

const MD_LANGS = new Set(['markdown', 'skill']);

export function activate(context: vscode.ExtensionContext) {
  activateWordCounter(context, MD_LANGS);
}

export function deactivate() {}
