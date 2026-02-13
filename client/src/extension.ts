import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

const PLUGINS_FILE = "data/plugins.json";
const TEMPLATES_FILE = "data/templates.json";
const TEMPLATE_GENERATORS_FILE = "data/template_generators.json";

interface PluginRecord {
  label?: string;
  description?: string;
  detail?: string;
  snippet?: string;
  url?: string;
}

interface TemplateRecord {
  id?: string;
  label: string;
  description?: string;
  content?: string;
}

interface TemplateGeneratorRecord {
  label: string;
  description?: string;
  url: string;
  edit_url?: string;
}

interface PluginPickItem extends vscode.QuickPickItem {
  plugin: PluginRecord;
}

interface TemplatePickItem extends vscode.QuickPickItem {
  template: TemplateRecord;
}

interface TemplateGeneratorPickItem extends vscode.QuickPickItem {
  action: "template";
  template: TemplateGeneratorRecord;
}

interface DownloadPickItem extends vscode.QuickPickItem {
  action: "download";
}

type GeneratorPickItem = TemplatePickItem | TemplateGeneratorPickItem | DownloadPickItem;

type DiagnosticData = {
  line?: number;
  name?: string;
};

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection("perchance");
  context.subscriptions.push(diagnostics);

  registerFormatter(context);
  registerDiagnostics(context, diagnostics);
  registerCodeActions(context);
  registerFoldingProvider(context);
  registerCommands(context);

  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === "perchance") {
      diagnostics.set(document.uri, analyzeDocument(document));
    }
  });

  const serverModule = context.asAbsolutePath(path.join("..", "server", "out", "server.js"));
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
      fileEvents: [
        vscode.workspace.createFileSystemWatcher("**/*.perchance"),
        vscode.workspace.createFileSystemWatcher("**/*.prch")
      ]
    }
  };

  client = new LanguageClient("perchance", "Perchance LSP", serverOptions, clientOptions);
  client.start();
  context.subscriptions.push({
    dispose: () => {
      void client?.stop();
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}

function registerCommands(context: vscode.ExtensionContext): void {
  const managePluginsId = "perchance-for-vscode.managePlugins";
  const managePlugins = vscode.commands.registerCommand(managePluginsId, async () => {
    const plugins = loadPlugins(context);
    if (!plugins.length) {
      const choice = await vscode.window.showWarningMessage(
        "No plugins found in data/plugins.json.",
        "Open plugin index"
      );
      if (choice) {
        await vscode.env.openExternal(vscode.Uri.parse("https://perchance.org/plugins"));
      }
      return;
    }

    const items: PluginPickItem[] = plugins.map((plugin) => ({
      label: plugin.label || plugin.url || "Plugin",
      description: plugin.description || plugin.url || "",
      detail: plugin.detail || "",
      plugin
    }));

    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a Perchance plugin",
      matchOnDescription: true
    });
    if (!pick) {
      return;
    }

    const snippet = pick.plugin.snippet || pick.plugin.url || pick.label;
    const snippetText = snippet ? snippet.trim() : "";
    if (!snippetText) {
      vscode.window.showWarningMessage("Selected plugin has no snippet or url.");
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, snippetText);
      });
    } else {
      await vscode.env.clipboard.writeText(snippetText);
      vscode.window.showInformationMessage("No active editor. Plugin text copied to clipboard.");
    }

    if (pick.plugin.url) {
      const open = await vscode.window.showInformationMessage(
        "Open plugin page in browser?",
        "Open"
      );
      if (open) {
        await vscode.env.openExternal(vscode.Uri.parse(pick.plugin.url));
      }
    }
  });

  const createGeneratorId = "perchance-for-vscode.createGenerator";
  const createGenerator = vscode.commands.registerCommand(createGeneratorId, async () => {
    const templates = loadTemplates(context);
    const templateGenerators = loadTemplateGenerators(context);
    const templateItems: TemplatePickItem[] = templates.map((template) => ({
      label: template.label,
      description: template.description || "",
      template
    }));
    const templateGeneratorItems: TemplateGeneratorPickItem[] = templateGenerators.map(
      (template) => ({
        label: template.label,
        description: template.description || "",
        action: "template",
        template
      })
    );

    const items: GeneratorPickItem[] = [
      ...templateItems,
      ...templateGeneratorItems,
      {
        label: "From existing generator...",
        description: "Download from perchance.org",
        action: "download"
      }
    ];

    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: "Create a Perchance generator"
    });
    if (!pick) {
      return;
    }

    if ("action" in pick && pick.action === "download") {
      await createFromExistingGenerator();
      return;
    }

    if ("action" in pick && pick.action === "template") {
      await openTemplateGenerator(pick.template);
      return;
    }

    await openGeneratorDocument(pick.template.content || "");
  });

  const toggleWrapId = "perchance-for-vscode.toggleWrap";
  const toggleWrap = vscode.commands.registerCommand(toggleWrapId, async () => {
    await vscode.commands.executeCommand("editor.action.toggleWordWrap");
  });

  const foldAllListsId = "perchance-for-vscode.foldAllLists";
  const foldAllLists = vscode.commands.registerCommand(foldAllListsId, async () => {
    await vscode.commands.executeCommand("editor.foldAll");
  });

  const unfoldAllListsId = "perchance-for-vscode.unfoldAllLists";
  const unfoldAllLists = vscode.commands.registerCommand(unfoldAllListsId, async () => {
    await vscode.commands.executeCommand("editor.unfoldAll");
  });

  context.subscriptions.push(
    managePlugins,
    createGenerator,
    toggleWrap,
    foldAllLists,
    unfoldAllLists
  );
}

function registerFormatter(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document) {
      if (document.languageId !== "perchance") {
        return [];
      }

      const formattedText = formatDocument(document);
      if (formattedText === document.getText()) {
        return [];
      }

      const lastLine = document.lineAt(document.lineCount - 1);
      const fullRange = new vscode.Range(0, 0, document.lineCount - 1, lastLine.text.length);
      return [vscode.TextEdit.replace(fullRange, formattedText)];
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("perchance", provider)
  );
}

function registerDiagnostics(
  context: vscode.ExtensionContext,
  diagnostics: vscode.DiagnosticCollection
): void {
  const update = (document: vscode.TextDocument) => {
    if (document.languageId !== "perchance") {
      return;
    }
    diagnostics.set(document.uri, analyzeDocument(document));
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(update),
    vscode.workspace.onDidChangeTextDocument((event) => update(event.document)),
    vscode.workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri))
  );
}

function registerCodeActions(context: vscode.ExtensionContext): void {
  const provider: vscode.CodeActionProvider = {
    provideCodeActions(document, _range, contextInfo) {
      if (document.languageId !== "perchance") {
        return [];
      }

      const actions: vscode.CodeAction[] = [];
      for (const diagnostic of contextInfo.diagnostics) {
        if (diagnostic.code === "perchance.ifElseSingleEquals") {
          const fix = createIfElseEqualsFix(document, diagnostic);
          if (fix) {
            actions.push(fix);
          }
        }

        if (diagnostic.code === "perchance.duplicateListName") {
          const fix = createRenameListFix(document, diagnostic, "_2");
          if (fix) {
            actions.push(fix);
          }
        }

        if (diagnostic.code === "perchance.listNameIdConflict") {
          const fix = createRenameListFix(document, diagnostic, "_list");
          if (fix) {
            actions.push(fix);
          }
        }
      }

      return actions;
    }
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("perchance", provider, {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    })
  );
}

function registerFoldingProvider(context: vscode.ExtensionContext): void {
  const provider: vscode.FoldingRangeProvider = {
    provideFoldingRanges(document) {
      if (document.languageId !== "perchance") {
        return [];
      }

      const lines = document.getText().split(/\r?\n/);
      const htmlStart = findHtmlStart(lines);
      const listStarts: number[] = [];

      for (let index = 0; index < htmlStart; index += 1) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) {
          continue;
        }

        if (!/^[\t ]/.test(line)) {
          listStarts.push(index);
        }
      }

      const ranges: vscode.FoldingRange[] = [];
      for (let i = 0; i < listStarts.length; i += 1) {
        const start = listStarts[i];
        const nextStart = i + 1 < listStarts.length ? listStarts[i + 1] : htmlStart;
        const end = nextStart - 1;
        if (end > start) {
          ranges.push(new vscode.FoldingRange(start, end));
        }
      }

      return ranges;
    }
  };

  context.subscriptions.push(vscode.languages.registerFoldingRangeProvider("perchance", provider));
}

function formatDocument(document: vscode.TextDocument): string {
  const eol = document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
  const lines = document.getText().split(/\r?\n/);
  let inHtmlSection = false;
  let sawBlank = false;

  const formatted = lines.map((line) => {
    const trimmed = line.trim();
    if (!inHtmlSection && sawBlank && looksLikeHtmlStart(line)) {
      inHtmlSection = true;
    }

    if (trimmed === "") {
      sawBlank = true;
      return "";
    }

    sawBlank = false;
    if (inHtmlSection) {
      return line.replace(/[\t ]+$/, "");
    }

    return formatIndentation(line);
  });

  return formatted.join(eol);
}

function formatIndentation(line: string): string {
  const trimmed = line.replace(/[\t ]+$/, "");
  const indentMatch = trimmed.match(/^[\t ]+/);
  if (!indentMatch) {
    return trimmed;
  }

  const indent = indentMatch[0];
  const content = trimmed.slice(indent.length);
  const indentLevel = countIndentLevel(indent);
  const normalizedIndent = " ".repeat(indentLevel * 2);
  return normalizedIndent + content.trimStart();
}

function countIndentLevel(indent: string): number {
  let level = 0;
  let spaces = 0;
  for (const char of indent) {
    if (char === "\t") {
      level += 1;
    } else if (char === " ") {
      spaces += 1;
      if (spaces === 2) {
        level += 1;
        spaces = 0;
      }
    }
  }
  return level;
}

function analyzeDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const lines = document.getText().split(/\r?\n/);
  const htmlStart = findHtmlStart(lines);
  const listNameIndex = new Map<string, number>();
  const listNames: { name: string; line: number }[] = [];
  const htmlIds = new Set<string>();
  let functionIndentLevel: number | null = null;

  for (let index = htmlStart; index < lines.length; index += 1) {
    const line = lines[index];
    const idPattern = /id\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null = null;
    while ((match = idPattern.exec(line)) !== null) {
      htmlIds.add(match[1]);
    }
  }

  for (let index = 0; index < htmlStart; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      continue;
    }

    if (trimmed.startsWith("//")) {
      continue;
    }

    const indentMatch = line.match(/^[\t ]+/);
    const indent = indentMatch ? indentMatch[0] : "";
    const indentLevel = countIndentLevel(indent);
    const content = line.slice(indent.length);
    const commentFree = stripComment(content);
    const commentFreeTrimmed = commentFree.trim();

    if (trimmed && functionIndentLevel !== null && indentLevel <= functionIndentLevel) {
      functionIndentLevel = null;
    }
    if (isFunctionListStart(commentFreeTrimmed)) {
      functionIndentLevel = indentLevel;
    }

    if (!indent && trimmed) {
      const listName = parseListName(commentFreeTrimmed);
      if (listName) {
        if (listNameIndex.has(listName)) {
          diagnostics.push(
            createDiagnostic(
              index,
              0,
              listName.length,
              "Duplicate top-level list name.",
              "perchance.duplicateListName",
              { name: listName }
            )
          );
        } else {
          listNameIndex.set(listName, index);
          listNames.push({ name: listName, line: index });
        }
      }
    }

    if (indent.includes("\t") && indent.includes(" ")) {
      diagnostics.push(
        createDiagnostic(index, 0, indent.length, "Mixed tabs and spaces in indentation.")
      );
    }

    if (indent.includes(" ")) {
      const spaceCount = indent.replace(/\t/g, "").length;
      if (spaceCount % 2 !== 0) {
        diagnostics.push(
          createDiagnostic(
            index,
            0,
            indent.length,
            "Indentation should use tabs or multiples of two spaces."
          )
        );
      }
    }

    const skipPerchanceBlocks = functionIndentLevel !== null && indentLevel > functionIndentLevel;

    if (!skipPerchanceBlocks) {
      const oddsWarnings = findDynamicOddsWithSingleEquals(commentFree);
      oddsWarnings.forEach((warning) => {
        diagnostics.push(
          createDiagnostic(
            index,
            indent.length + warning.start,
            indent.length + warning.end,
            "Dynamic odds comparisons should use == instead of =."
          )
        );
      });

      const ifElseWarnings = findIfElseSingleEquals(commentFree);
      ifElseWarnings.forEach((warning) => {
        diagnostics.push(
          createDiagnostic(
            index,
            indent.length + warning.start,
            indent.length + warning.end,
            "If/else conditions should use == instead of =.",
            "perchance.ifElseSingleEquals",
            { line: index }
          )
        );
      });
    }
  }

  listNames.forEach((entry) => {
    if (htmlIds.has(entry.name)) {
      diagnostics.push(
        createDiagnostic(
          entry.line,
          0,
          entry.name.length,
          "Top-level list name conflicts with an HTML id.",
          "perchance.listNameIdConflict",
          { name: entry.name }
        )
      );
    }
  });

  return diagnostics;
}

function createDiagnostic(
  line: number,
  start: number,
  end: number,
  message: string,
  code?: string,
  data?: DiagnosticData
): vscode.Diagnostic {
  const range = new vscode.Range(line, start, line, Math.max(start + 1, end));
  const diagnostic = new vscode.Diagnostic(
    range,
    message,
    vscode.DiagnosticSeverity.Warning
  ) as vscode.Diagnostic & { data?: DiagnosticData };
  if (code) {
    diagnostic.code = code;
  }
  if (data) {
    diagnostic.data = data;
  }
  return diagnostic;
}

function stripComment(text: string): string {
  const index = text.indexOf("//");
  if (index === -1) {
    return text;
  }
  return text.slice(0, index);
}

function looksLikeHtmlStart(line: string): boolean {
  const trimmed = line.trimStart();
  if (!trimmed.startsWith("<")) {
    return false;
  }
  if (trimmed.startsWith("<<<<<")) {
    return false;
  }
  return /<\/?[a-zA-Z]/.test(trimmed);
}

function findHtmlStart(lines: string[]): number {
  let sawBlank = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed === "") {
      sawBlank = true;
      continue;
    }
    if (sawBlank && looksLikeHtmlStart(line)) {
      return index;
    }
    sawBlank = false;
  }
  return lines.length;
}

function parseListName(trimmedLine: string): string | null {
  let line = trimmedLine;
  if (line.startsWith("async ")) {
    line = line.slice("async ".length).trimStart();
  }
  const match = line.match(/^[A-Za-z0-9_$][\w$-]*/);
  if (!match) {
    return null;
  }
  return match[0];
}

function isFunctionListStart(trimmedLine: string): boolean {
  if (!trimmedLine) {
    return false;
  }
  return /\b=>\s*$/.test(trimmedLine);
}

function findDynamicOddsWithSingleEquals(text: string): { start: number; end: number }[] {
  const warnings: { start: number; end: number }[] = [];
  const pattern = /\^\s*\[([^\]]*)\]/g;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const content = match[1];
    if (hasSingleEquals(content)) {
      warnings.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  return warnings;
}

function findIfElseSingleEquals(text: string): { start: number; end: number }[] {
  const warnings: { start: number; end: number }[] = [];
  const pattern = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const content = match[1];
    const questionIndex = content.indexOf("?");
    const colonIndex = content.indexOf(":");
    if (questionIndex === -1 || colonIndex === -1) {
      continue;
    }
    const condition = content.slice(0, questionIndex);
    if (hasSingleEquals(condition)) {
      warnings.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  return warnings;
}

function hasSingleEquals(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "=") {
      continue;
    }
    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";
    if (prev === "=" || next === "=") {
      continue;
    }
    if (prev === "!" || prev === ">" || prev === "<") {
      continue;
    }
    if (next === ">") {
      continue;
    }
    return true;
  }
  return false;
}

function createIfElseEqualsFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic & { data?: DiagnosticData }
): vscode.CodeAction | null {
  const line = diagnostic.data?.line ?? diagnostic.range.start.line;
  const lineText = document.lineAt(line).text;
  const updated = replaceSingleEqualsInIfElse(lineText);
  if (!updated || updated === lineText) {
    return null;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(line, 0, line, lineText.length), updated);

  const fix = new vscode.CodeAction(
    "Replace = with == in if/else condition",
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = edit;
  fix.diagnostics = [diagnostic];
  return fix;
}

function replaceSingleEqualsInIfElse(lineText: string): string | null {
  const match = lineText.match(/\[([^\]]+\?[^\]]+:[^\]]+)\]/);
  if (!match) {
    return null;
  }
  const block = match[1];
  const questionIndex = block.indexOf("?");
  if (questionIndex === -1) {
    return null;
  }
  const condition = block.slice(0, questionIndex);
  const conditionFixed = replaceFirstSingleEquals(condition, "==");
  if (!conditionFixed) {
    return null;
  }
  const fixedBlock = conditionFixed + block.slice(questionIndex);
  return lineText.replace(match[0], `[${fixedBlock}]`);
}

function replaceFirstSingleEquals(text: string, replacement: string): string | null {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "=") {
      continue;
    }
    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";
    if (prev === "=" || next === "=") {
      continue;
    }
    if (prev === "!" || prev === ">" || prev === "<") {
      continue;
    }
    if (next === ">") {
      continue;
    }
    return text.slice(0, i) + replacement + text.slice(i + 1);
  }
  return null;
}

function createRenameListFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic & { data?: DiagnosticData },
  suffix: string
): vscode.CodeAction | null {
  const name = diagnostic.data?.name;
  if (!name) {
    return null;
  }

  const line = diagnostic.range.start.line;
  const lineText = document.lineAt(line).text;
  const index = lineText.indexOf(name);
  if (index === -1) {
    return null;
  }

  const newName = `${name}${suffix}`;
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(line, index, line, index + name.length), newName);

  const fix = new vscode.CodeAction(`Rename list to ${newName}`, vscode.CodeActionKind.QuickFix);
  fix.edit = edit;
  fix.diagnostics = [diagnostic];
  return fix;
}

function loadPlugins(context: vscode.ExtensionContext): PluginRecord[] {
  const data = loadJsonFile<{ plugins: PluginRecord[] }>(context, PLUGINS_FILE);
  if (!data || !Array.isArray(data.plugins)) {
    return [];
  }
  return data.plugins;
}

function loadTemplates(context: vscode.ExtensionContext): TemplateRecord[] {
  const data = loadJsonFile<{ templates: TemplateRecord[] }>(context, TEMPLATES_FILE);
  if (!data || !Array.isArray(data.templates)) {
    return [];
  }
  return data.templates;
}

function loadTemplateGenerators(context: vscode.ExtensionContext): TemplateGeneratorRecord[] {
  const data = loadJsonFile<{ templates_generators: TemplateGeneratorRecord[] }>(
    context,
    TEMPLATE_GENERATORS_FILE
  );
  if (!data || !Array.isArray(data.templates_generators)) {
    return [];
  }
  return data.templates_generators;
}

function loadJsonFile<T>(context: vscode.ExtensionContext, relativePath: string): T | null {
  const filePath = path.join(context.extensionPath, relativePath);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to load ${relativePath}:`, error);
    return null;
  }
}

async function downloadGeneratorByName(
  generatorName: string,
  mode: "lists" | "full"
): Promise<string> {
  const url =
    mode === "lists"
      ? `https://perchance.org/api/downloadGenerator?generatorName=${encodeURIComponent(
          generatorName
        )}&listsOnly=true`
      : `https://perchance.org/api/downloadGenerator?generatorName=${encodeURIComponent(
          generatorName
        )}`;

  if (typeof fetch !== "function") {
    throw new Error("Fetch API is unavailable in this extension host.");
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading Perchance generator"
    },
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      return response.text();
    }
  );
}

async function createFromExistingGenerator(): Promise<void> {
  const generatorName = await vscode.window.showInputBox({
    title: "Perchance generator name",
    prompt: "Enter the generator name from perchance.org/<name>",
    validateInput: (value) => (value && value.trim() ? undefined : "Generator name is required.")
  });
  if (!generatorName) {
    return;
  }

  const modeChoices = [
    {
      label: "Lists only",
      description: "Download just the lists code",
      value: "lists" as const
    },
    {
      label: "Full generator",
      description: "Download lists and HTML",
      value: "full" as const
    }
  ];

  const mode = await vscode.window.showQuickPick(modeChoices, {
    placeHolder: "Select download type"
  });
  if (!mode) {
    return;
  }

  let content = "";
  try {
    content = await downloadGeneratorByName(generatorName.trim(), mode.value);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to download generator: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }

  await openGeneratorDocument(content);
}

async function openTemplateGenerator(template: TemplateGeneratorRecord): Promise<void> {
  const generatorName = extractGeneratorName(template.url);
  const openUrl = template.edit_url || template.url;
  if (!generatorName) {
    if (openUrl) {
      await vscode.env.openExternal(vscode.Uri.parse(openUrl));
    }
    return;
  }

  const choice = await vscode.window.showQuickPick(
    [
      { label: "Open template in browser", value: "open" },
      { label: "Download as generator", value: "download" }
    ],
    { placeHolder: "Use template" }
  );
  if (!choice) {
    return;
  }

  if (choice.value === "open") {
    await vscode.env.openExternal(vscode.Uri.parse(openUrl));
    return;
  }

  let content = "";
  try {
    content = await downloadGeneratorByName(generatorName, "full");
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to download template: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }
  await openGeneratorDocument(content);
}

function extractGeneratorName(url: string): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("perchance.org")) {
      return null;
    }
    const pathName = parsed.pathname.replace(/^\//, "").trim();
    return pathName ? pathName : null;
  } catch {
    return null;
  }
}

async function openGeneratorDocument(content: string): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    language: "perchance",
    content
  });
  await vscode.window.showTextDocument(document, { preview: false });
}
