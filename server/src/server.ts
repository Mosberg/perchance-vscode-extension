import { TextDocument } from "vscode-languageserver-textdocument";
import {
  createConnection,
  InitializeResult,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver/node";
import { parse } from "./parser";
import { buildSymbols } from "./symbols";

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

connection.onInitialize(
  (): InitializeResult => ({
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { triggerCharacters: [".", "["] },
      hoverProvider: true
    }
  })
);

documents.onDidChangeContent((change) => {
  const doc = documents.get(change.document.uri);
  if (!doc) {
    return;
  }
  const ast = parse(doc.getText());
  const symbols = buildSymbols(ast);
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
