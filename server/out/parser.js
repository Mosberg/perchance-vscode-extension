"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
function parse(content) {
    const lines = content.split("\n");
    const root = [];
    const stack = [root];
    const indentStack = [0];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart();
        const indent = lines[i].length - line.length;
        const text = line.trim();
        if (!text || text.startsWith("//")) {
            continue;
        }
        while (indent < indentStack[indentStack.length - 1]) {
            stack.pop();
            indentStack.pop();
        }
        if (text.endsWith("=")) {
            const name = text.split(/\s*=\s*/)[0];
            const block = {
                type: "Block",
                name: name.trim(),
                children: [],
                range: pos(i, 0, i + 1, 0)
            };
            stack[stack.length - 1].push(block);
            stack.push(block.children);
            indentStack.push(indent);
            continue;
        }
        if (text.startsWith("[") && text.endsWith("]")) {
            stack[stack.length - 1].push({
                type: "InlineExpr",
                expr: parseInlineExpr(text),
                range: pos(i, 0, i + 1, 0)
            });
            continue;
        }
        const match = text.match(/^(.*?)(\^(\d+))?$/);
        stack[stack.length - 1].push({
            type: "ListItem",
            text: match ? match[1].trim() : text,
            weight: match && match[3] ? Number(match[3]) : 1,
            range: pos(i, 0, i + 1, 0)
        });
    }
    return root;
}
function parseInlineExpr(expr) {
    const body = expr.slice(1, -1).trim();
    if (!body) {
        return { args: [] };
    }
    const methodMatch = body.match(/\.(\w+)\s*\(/);
    return {
        method: methodMatch ? methodMatch[1] : undefined,
        args: [body]
    };
}
function pos(line, charStart, lineEnd, charEnd) {
    return { start: { line, character: charStart }, end: { line: lineEnd, character: charEnd } };
}
//# sourceMappingURL=parser.js.map