import type { Position } from "vscode-languageserver-types";
export interface AstNode {
    type: "Block" | "ListItem" | "InlineExpr" | "Text";
    range: {
        start: Position;
        end: Position;
    };
    name?: string;
    text?: string;
    children?: AstNode[];
    weight?: number;
    expr?: {
        method?: string;
        args: string[];
    };
}
export declare function parse(content: string): AstNode[];
