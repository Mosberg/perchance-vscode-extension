import type { Diagnostic } from "vscode-languageserver-types";
import methods from "./methods.json";
import type { AstNode } from "./parser";

export interface SymbolTable {
  blocks: Map<string, AstNode>;
  validate(node: AstNode): Diagnostic[];
}

export function buildSymbols(root: AstNode[]): SymbolTable {
  const blocks = new Map<string, AstNode>();
  for (const node of root) {
    collectBlocks(node, blocks);
  }
  return { blocks, validate: (node: AstNode) => validateNode(node, blocks) };
}

function collectBlocks(node: AstNode, blocks: Map<string, AstNode>): void {
  if (node.type === "Block" && node.name && !blocks.has(node.name)) {
    blocks.set(node.name, node);
  }
  if (node.children) {
    for (const child of node.children) {
      collectBlocks(child, blocks);
    }
  }
}

function validateNode(node: AstNode, blocks: Map<string, AstNode>): Diagnostic[] {
  const diags: Diagnostic[] = [];
  if (node.type === "InlineExpr" && node.expr?.args[0]) {
    const name = node.expr.args[0].split(".")[0].trim();
    if (name && !blocks.has(name)) {
      diags.push({
        severity: 1,
        message: `Unknown block: ${name}`,
        range: node.range
      });
    }
  }
  if (node.type === "InlineExpr" && node.expr?.method) {
    const method = (methods as Record<string, { args: number }>)[node.expr.method];
    if (!method) {
      diags.push({
        severity: 2,
        message: `Unknown method: ${node.expr.method}`,
        range: node.range
      });
    }
  }
  return diags;
}
