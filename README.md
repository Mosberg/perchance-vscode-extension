# Perchance for VSCode

Perchance language support plus a command to help choose and insert plugin snippets.

## Features

- Perchance language registration with comment and bracket support.
- Formatter and diagnostics for common Perchance pitfalls.
- Snippets for lists, imports, preprocessors, and $meta.
- Commands: `Perchance: Manage Plugins`, `Perchance: Create Generator`, `Perchance: Toggle Wrap`, `Perchance: Fold All Lists`, `Perchance: Unfold All Lists`.
- Plugin catalog loaded from [data/plugins.json](data/plugins.json).
- Generator templates loaded from [data/templates.json](data/templates.json).

## Usage

1. Run the `Perchance: Manage Plugins` command to insert plugin imports.
2. Run the `Perchance: Create Generator` command to start from a template or download an existing generator.
3. Use `Perchance: Toggle Wrap` to mirror the editor wrap/unwrap behavior.
4. Use `Perchance: Fold All Lists` and `Perchance: Unfold All Lists` for list folding.
5. Use `Format Document` to normalize indentation.
6. Check diagnostics for warnings about indentation, dynamic odds, and unescaped equals.

## Requirements

None.

## Extension Settings

None.

## Known Issues

- The plugin list is not synced automatically. Keep [data/plugins.json](data/plugins.json) up to date.

## Diagnostics Notes

- Warns on single `=` inside `[...] ? ... : ...` conditions.
- Warns on duplicate top-level list names.
- Warns when a top-level list name matches an HTML `id` attribute.
- Warns if square blocks span multiple lines.
