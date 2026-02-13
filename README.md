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

Do a deep analysis of these two pages:
[Perchance Tutorial](https://perchance.org/tutorial) and [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial).

Based on that, perform comprehensive research on how to improve my Perchance VS Code extension so that it:

- Follows best practices for Perchance.org
- Provides full `*.perchance` and `*.prch` language support in Visual Studio Code

The extension should support:

- **Coding assistance:** linting, formatting, fixing all auto-fixable problems
- **Perchance-specific features:** validation, grammar checks, snippets, code generation
- **Editor integration:** quick suggestions, AI-powered code actions, proper indentation
- **Language features:** syntax highlighting, syntax support, auto-completion, hover support
- **Configuration:** a wide range of extension settings for customization
