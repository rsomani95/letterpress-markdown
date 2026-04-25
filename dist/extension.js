"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const wordCounter_1 = require("./wordCounter");
const MD_LANGS = new Set(['markdown', 'skill']);
function activate(context) {
    (0, wordCounter_1.activateWordCounter)(context, MD_LANGS);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map