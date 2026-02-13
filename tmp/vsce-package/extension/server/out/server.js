"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const node_1 = require("vscode-languageserver/node");
const parser_1 = require("./parser");
const symbols_1 = require("./symbols");
const connection = (0, node_1.createConnection)();
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize(() => ({
    capabilities: {
        textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
        completionProvider: { triggerCharacters: [".", "["] },
        hoverProvider: true
    }
}));
documents.onDidChangeContent((change) => {
    const doc = documents.get(change.document.uri);
    if (!doc) {
        return;
    }
    const ast = (0, parser_1.parse)(doc.getText());
    const symbols = (0, symbols_1.buildSymbols)(ast);
    const diagnostics = ast.flatMap((node) => symbols.validate(node));
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});
connection.onCompletion(() => {
    return [
        { label: "selectOne", kind: 3 },
        { label: "selectMany", kind: 3 },
        { label: "joinItems", kind: 3 }
    ];
});
connection.onHover(() => {
    return { contents: "Perchance block or method" };
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map