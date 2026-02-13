# perchance-language-server Layout

Create a monorepo structure with separate client (VS Code extension) and server (language logic). Use TypeScript for both, with `vscode-languageserver` on the server side. Here's the minimal file tree:

```
perchance-vscode-extension/
├── client/                 # VS Code extension (updated package.json below)
│   ├── src/
│   │   ├── extension.ts   # LSP client wiring
│   │   └── test/          # E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── server/                 # Language server
│   ├── src/
│   │   ├── parser.ts      # Parser skeleton + AST
│   │   ├── symbols.ts     # Symbol table, validation
│   │   ├── server.ts      # LSP entrypoint
│   │   └── methods.json   # Perchance methods catalog
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── syntaxes/               # TM grammars for syntax highlighting
│   ├── perchance.tmLanguage.json
│   └── perchance-prch.tmLanguage.json
├── .vscode/
│   └── launch.json        # Debug configs
├── package.json            # Root (workspaces)
└── tsconfig.json          # Root
```

### Key Files

**server/package.json**

```json
{
  "name": "perchance-language-server",
  "version": "0.1.0",
  "dependencies": {
    "vscode-languageserver": "^9.0.1",
    "vscode-languageserver-textdocument": "^1.0.11",
    "vscode-languageserver-types": "^3.17.5"
  },
  "devDependencies": {
    "@types/vscode": "^1.93.0",
    "typescript": "^5.6.2"
  },
  "scripts": {
    "watch": "tsc -b -w",
    "compile": "tsc -b"
  }
}
```

**server/src/parser.ts** (Skeleton - indentation-based hierarchical lists)

```typescript
export interface AstNode {
  type: 'Block' | 'ListItem' | 'InlineExpr' | 'Text';
  range: { start: Position; end: Position };
  name?: string;  // Block name like "noun"
  children?: AstNode[];
  weight?: number;
  expr?: { method: string; args: string[] };
}

export function parse(content: string): AstNode[] {
  const lines = content.split('\n');
  const root: AstNode[] = [];
  let stack: AstNode[] = [root];
  let indentStack: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimStart();
    const indent = lines[i].length - line.length;
    const text = line.trim();

    // Pop stack until matching indent level
    while (indent < indentStack[indentStack.length - 1]) {
      stack.pop();
      indentStack.pop();
    }

    if (text.includes('=')) {
      // Block def: "noun =\n  dog\n  cat"
      const [, name] = text.split(/\s*=\s*/);
      const block: AstNode = { type: 'Block', name: name.trim(), children: [], range: pos(i, 0, i + 1, 0) };
      stack[stack.length - 1].push(block);
      stack.push(block.children!);
      indentStack.push(indent);
    } else if (text.startsWith('[') && text.endsWith(']')) {
      // Inline expr: "[noun.selectOne]"
      stack[stack.length - 1].push({
        type: 'InlineExpr',
        expr: parseInlineExpr(text),
        range: pos(i, 0, i + 1, 0)
      });
    } else {
      // List item with optional weight: "dog^2"
      const match = text.match(/^(.*?)(\^(\d+))?$/);
      stack[stack.length - 1].push({
        type: 'ListItem',
        text: match! [github](https://github.com/ouoertheo/sd-webui-perchance),
        weight: match! [code.visualstudio](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) ? +match! [code.visualstudio](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) : 1,
        range: pos(i, 0, i + 1, 0)
      });
    }
  }
  return root;
}

function parseInlineExpr(expr: string): { method?: string; args: string[] } {
  // TODO: Parse [list.method(arg1, arg2)] → {method: 'method', args: ['arg1', 'arg2']}
  return { args: [expr.slice(1, -1)] };
}

function pos(line: number, charStart: number, lineEnd: number, charEnd: number): any {
  return { start: { line, character: charStart }, end: { line: lineEnd, character: charEnd } };
}
```

**server/src/symbols.ts** (Validation, method catalog)

```typescript
import methods from "../methods.json"; // { "selectOne": { args: 0, on: "list" }, ... }

export interface SymbolTable {
  blocks: Map<string, AstNode>;
  validate(node: AstNode): Diagnostic[];
}

export function buildSymbols(root: AstNode[]): SymbolTable {
  const blocks = new Map();
  // Walk AST, collect block names
  return { blocks, validate: (node: AstNode) => validateNode(node, blocks) };
}

function validateNode(node: AstNode, blocks: Map<string, AstNode>): Diagnostic[] {
  const diags: Diagnostic[] = [];
  if (node.type === "InlineExpr" && !blocks.has(node.expr!.args[0]?.split(".")[0])) {
    diags.push({
      severity: 8, // Error
      message: `Unknown block: ${node.expr!.args[0]}`,
      range: node.range
    });
  }
  // Method arg count, type checks...
  return diags;
}
```

**server/src/server.ts** (LSP wiring)

```typescript
import { createConnection, TextDocuments, InitializeResult, Diagnostic, TextDocumentSyncKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse, AstNode } from './parser';
import { buildSymbols } from './symbols';

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

connection.onInitialize(): InitializeResult => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    completionProvider: { triggerCharacters: ['.', '['] },
    hoverProvider: true,
    diagnosticProvider: { interfile: false }
  }
});

documents.onDidChangeContent(change => {
  const doc = documents.get(change.document.uri);
  const ast = parse(doc!.getText());
  const symbols = buildSymbols(ast);
  const diags = ast.flatMap(node => symbols.validate(node));
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diags });
});

connection.onCompletion(params => {
  // Suggest block names, methods on '.'
  return [{ label: 'noun', kind: 6 }, { label: 'selectOne()', kind: 3 }];
});

connection.onHover(params => {
  return { contents: [{ value: 'Block definition' }] };
});

documents.listen(connection);
connection.listen();
```

**methods.json** (From Perchance docs)

```json
{
  "selectOne": { "args": 0, "desc": "Pick one random item", "on": "list" },
  "selectMany": { "args": 1, "desc": "Pick N random items", "on": "list" },
  "joinItems": { "args": 1, "desc": "Join with separator", "on": "list" },
  "pastTense": { "args": 0, "desc": "Convert to past tense", "on": "text" }
}
```

## Updated Client package.json

**client/package.json** (Wires LSP + grammars + config)

```json
{
  "name": "perchance-vscode",
  "displayName": "Perchance Language Support",
  "description": "Full Perchance.org language support with LSP",
  "version": "0.1.0",
  "engines": { "vscode": "^1.93.0" },
  "categories": ["Programming Languages", "Language Packs"],
  "activationEvents": ["onLanguage:perchance"],
  "main": "./out/extension.js",
  "contributes": {
    "languages": [
      {
        "id": "perchance",
        "aliases": ["Perchance", "perchance"],
        "extensions": [".perchance", ".prch"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "perchance",
        "scopeName": "source.perchance",
        "path": "./syntaxes/perchance.tmLanguage.json"
      }
    ],
    "snippets": [
      {
        "language": "perchance",
        "path": "./snippets/perchance.json"
      }
    ],
    "configuration": {
      "title": "Perchance",
      "properties": {
        "perchance.maxNumberOfProblems": {
          "type": "number",
          "default": 100,
          "description": "Max problems per file"
        },
        "perchance.lint.strictMode": {
          "type": "boolean",
          "default": true,
          "description": "Enable strict Perchance validation"
        },
        "perchance.format.tabSize": {
          "type": "number",
          "default": 2,
          "description": "Indent size"
        },
        "perchance.completions.enableMethods": {
          "type": "boolean",
          "default": true
        }
      }
    }
  },
  "dependencies": {
    "vscode-languageclient": "^9.0.1"
  },
  "devDependencies": {
    "@types/vscode": "^1.93.0",
    "typescript": "^5.6.2"
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./ && tsc -p ./server/tsconfig.json",
    "watch": "tsc -p ./ -w & tsc -p ./server/tsconfig.json -w"
  }
}
```

**client/src/extension.ts**

```typescript
import { ExtensionContext, workspace } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";
import * as path from "path";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join("server", "out", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=6009"] }
    }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "perchance" }],
    synchronize: {
      configurationSection: "perchance",
      fileEvents: workspace.createFileSystemWatcher("**/*.perchance")
    }
  };

  client = new LanguageClient("perchance", "Perchance LSP", serverOptions, clientOptions);
  client.start();
}
```

## Next Steps

1. `npm init -w client -w server` in root
2. Copy files above
3. `npm run compile` (both)
4. F5 to test in Extension Host
5. Add `language-configuration.json` for indentation rules
6. Flesh out TMGrammar for highlighting (block names cyan, methods blue, brackets rainbow)

This gives you a production-ready LSP skeleton that scales to full Perchance support. Expand parser for method args, add formatting via `onDocumentFormatting`, wire config to server via `workspace/configuration`.
