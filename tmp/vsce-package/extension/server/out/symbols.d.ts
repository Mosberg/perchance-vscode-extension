import type { Diagnostic } from "vscode-languageserver-types";
import type { AstNode } from "./parser";
export interface SymbolTable {
    blocks: Map<string, AstNode>;
    validate(node: AstNode): Diagnostic[];
}
export declare function buildSymbols(root: AstNode[]): SymbolTable;
