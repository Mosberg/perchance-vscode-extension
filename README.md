# Perchance for VSCode

Perchance language support plus a command to help choose and insert plugin snippets.

## Features

- Perchance language registration with comment and bracket support.
- Formatter and diagnostics for common Perchance pitfalls.
- Snippets for lists, imports, preprocessors, and $meta.
- Commands: `Perchance: Manage Plugins`, `Perchance: Create Generator`, `Perchance: Toggle Wrap`, `Perchance: Fold All Lists`, `Perchance: Unfold All Lists`.
- Plugin catalog loaded from [data/plugins.json](data/plugins.json).
- Generator templates loaded from [data/templates.json](data/templates.json).
- Template generator links loaded from [data/template_generators.json](data/template_generators.json).

## Usage

1. Run the `Perchance: Manage Plugins` command to insert plugin imports.
2. Run the `Perchance: Create Generator` command to start from a template or download an existing generator.
3. Use `Perchance: Toggle Wrap` to mirror the editor wrap/unwrap behavior.
4. Use `Perchance: Fold All Lists` and `Perchance: Unfold All Lists` for list folding.
5. Use `Format Document` to normalize indentation.
6. Check diagnostics for warnings about indentation, dynamic odds, and unescaped equals.

## Commands

- `Perchance: Manage Plugins` inserts a plugin import snippet and can open the plugin page.
- `Perchance: Create Generator` opens a template, downloads a generator, or opens a template generator link.
- `Perchance: Toggle Wrap` toggles word wrap.
- `Perchance: Fold All Lists` collapses top-level lists.
- `Perchance: Unfold All Lists` expands top-level lists.

## Requirements

None.

## Extension Settings

None.

## Known Issues

- The plugin list is not synced automatically. Keep [data/plugins.json](data/plugins.json) up to date.
- Template generator links are static. Update [data/template_generators.json](data/template_generators.json) to keep them current.

## Development

- `npm run lint` to run ESLint.
- `npm run lint:full` to lint all JavaScript files with a higher heap limit.
- `npm run data:check` to validate data file schemas.
- `npm run data:sort` to sort data files by label/id.
- `npm test` to run extension tests.

## Diagnostics Notes

- Warns on single `=` inside `[...] ? ... : ...` conditions.
- Warns on duplicate top-level list names.
- Warns when a top-level list name matches an HTML `id` attribute.
- Warns if square blocks span multiple lines.

## Copilot Guidance

This repo includes targeted guidance for VS Code Copilot to keep Perchance answers accurate, minimal, and linked to official examples.
See [ .github/copilot-instructions.md ](.github/copilot-instructions.md) for the behavior rules and index usage.

## Quick Reference (Query -> Link)

- Dice example -> https://perchance.org/selectmany-sumitems-example
- Consumable list -> https://perchance.org/consumable-list-with-dynamic-odds-example#edit
- Random image -> https://perchance.org/simple-random-images-example#edit
- Tap randomize -> https://perchance.org/tap-image-to-randomize#edit
- Hide output -> https://perchance.org/hide-output-until-click-example#edit
- Seed from URL -> https://perchance.org/seed-from-url-example#edit

Respect privacy: all AI features should be clearly marked and toggleable in settings, with a configurable endpoint.

---

## 6. Completions, snippets, and hover support

Leverage the method and block catalog heavily here. [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)

- **Completions**
  - Block names wherever an identifier is expected inside `[...]`.
  - Child names when `list.getChildNames()` or hierarchical references are used. [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
  - Methods with signature hints and short descriptions from the community docs (`consumableList`, `createClone`, `selectAll`, `evaluateItem`, etc.). [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
  - Common dice patterns like `Dice 3d6` in brackets, as seen in tutorial-style examples. [youtube](https://www.youtube.com/watch?v=2DRSuHDPU6I)

- **Snippets**
  - “Basic generator” snippet with `output` and a sample list block.
  - “Hierarchical list” snippet following typical structure from examples. [youtube](https://www.youtube.com/watch?v=2DRSuHDPU6I)
  - “Method usage” snippet for each common method (e.g. `selectMany` + `joinItems`, `pastTense`/`pluralForm` transformations). [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
  - HTML utility snippets (`<br>`, `<b>`, etc.) used inside outputs. [youtube](https://www.youtube.com/watch?v=2DRSuHDPU6I)

- **Hover tooltips**
  - On block names: show where the block is defined, list length (using `getLength` semantics), and a truncated preview of items. [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
  - On methods: show a short definition, argument list, simple example, and edge-case warnings (e.g. `consumableList` gets depleted). [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
  - On inline variables (`x` in `[x = noun.selectOne]`), show inferred “type” (text, list element, etc.) and where it is assigned. [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)

Hovers are a low-friction way to embed Perchance best practices right in the editor.

---

## 7. Configuration surface

Given your preference for schema-driven workflows, define a JSON schema for your extension configuration and then expose that in `package.json` so users get auto-completion in `settings.json`.

Potential settings:

- **Language / parsing**
  - `perchance.language.strictMode` (enable stricter semantics and style linting).
  - `perchance.language.tabSize` / `insertSpaces`.
  - `perchance.language.maxListPreviewItems` (affects hovers).

- **Diagnostics**
  - `perchance.lints.enabledRules` and `perchance.lints.ruleSeverity.<ruleId>`.
  - Flags for “experimental” rules that codify evolving community best practices.

- **Formatting**
  - `perchance.format.enable`.
  - `perchance.format.wrapColumn`.
  - `perchance.format.inlineExpressionSpacing`.

- **AI & networking**
  - `perchance.ai.enable`.
  - `perchance.ai.endpoint`, `perchance.ai.apiKeySettingId`.
  - `perchance.ai.safetyLevel` for output filtering.

- **Snippets / completions**
  - `perchance.suggestions.methods.enable`.
  - `perchance.suggestions.htmlTags.enable`.
  - `perchance.suggestions.snippets.scope` (basic vs advanced set, where advanced includes method-heavy patterns from the methods list). [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)

---

## 8. Testing and validation strategy

For a language-oriented extension, a strong test suite pays off quickly:

- **Corpus-based tests**
  - Collect a set of public Perchance generators and tutorial examples (or synthetic ones using methods list). [youtube](https://www.youtube.com/watch?v=2DRSuHDPU6I)
  - Ensure “no false positive errors” when parsing known-good code.
  - Add fixtures that intentionally violate rules to test each diagnostic and quick fix.

- **Golden-format tests**
  - Given an input Perchance file, assert that formatting output matches a golden file.
  - Include variations using different indentation settings.

- **LSP integration tests**
  - Exercise completion, hover, code actions against sample documents to ensure stable behavior as your parser evolves.

---

## 9. Alignment with Perchance.org best practices

While the official tutorials you linked export a lot of UI scaffolding HTML rather than clean language docs, you can still align with platform behavior and culture by:

- Encouraging **hierarchical lists** and **methods** for composition instead of huge flat lists, mirroring how advanced examples use functions like `selectMany`, `joinItems`, and tense/number transformations. [youtube](https://www.youtube.com/watch?v=2DRSuHDPU6I)
- Surfacing warnings that would help users avoid runtime surprises, such as how `consumableList` depletes over time or how `evaluateItem` may change evaluation order. [perchance.fandom](https://perchance.fandom.com/wiki/Perchance_Methods)
- Reflecting Perchance’s emphasis on “playful, forgiving” scripting: provide helpful messages, not just raw errors; word diagnostics in a friendly tone similar to Perchance’s own UI text. [youtube](https://www.youtube.com/watch?v=fCaEGQVonGE)

This keeps your extension feeling native to the ecosystem rather than a generic syntax highlighter.

---\*\*\*---
