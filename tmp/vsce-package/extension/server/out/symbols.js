"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSymbols = buildSymbols;
const methods_json_1 = __importDefault(require("./methods.json"));
function buildSymbols(root) {
    const blocks = new Map();
    for (const node of root) {
        collectBlocks(node, blocks);
    }
    return { blocks, validate: (node) => validateNode(node, blocks) };
}
function collectBlocks(node, blocks) {
    if (node.type === "Block" && node.name && !blocks.has(node.name)) {
        blocks.set(node.name, node);
    }
    if (node.children) {
        for (const child of node.children) {
            collectBlocks(child, blocks);
        }
    }
}
function validateNode(node, blocks) {
    const diags = [];
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
        const method = methods_json_1.default[node.expr.method];
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
//# sourceMappingURL=symbols.js.map