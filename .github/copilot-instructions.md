# GitHub Copilot – Perchance Knowledge Integration

## Purpose

Enhance Copilot’s ability to assist with Perchance.org development by providing a structured reference index of tutorials, examples, plugins, and Moss generators.

## How Copilot Should Use This Index

- When the user asks about a Perchance feature, mechanic, plugin, or example, Copilot should search this index for the closest match.
- When generating Perchance code, Copilot should reference relevant examples from the index.
- When the user asks “how do I…”, Copilot should map the request to:
  - a category (lists, images, UI, math, etc.)
  - a specific example link if available
- Copilot should prefer official Perchance examples when suggesting patterns.

## Behavior Guidelines

- Provide concise explanations with links to relevant examples.
- When multiple examples match, list the top 3.
- When no example matches, fall back to Perchance documentation links.
- Avoid hallucinating nonexistent Perchance features; rely on the index.

## Index

[Remote Index](remote-index/remote-index.md)
[Knowledge Base](remote-index/knowledge-base.json)
[Semantic tags](remote-index/semantic-tags.yml)
[Plugin Index](remote-index/plugin-index.json)
