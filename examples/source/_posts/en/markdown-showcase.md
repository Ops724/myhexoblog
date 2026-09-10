---
title: Markdown Showcase
date: 2026-09-07 21:00:00
lang: en
section: tech
permalink: /en/posts/markdown-showcase/
translation_key: markdown-showcase
categories:
  - Tools
tags:
  - Markdown
  - Typography
---

This sample exists to check article typography: images, quotes, lists, inline code and code blocks.

![Sample image](sample.svg)

## Code blocks

Code blocks use a light grey background and scroll horizontally when a line is long:

```bash
npm run clean && npm run build && rsync -az --delete public/ user@example.com:/var/www/blog/ --exclude '*.map' --exclude 'node_modules'
```

Inline code looks like this: `npm run content:init`.

## Quotes and lists

> Quiet, restrained, and comfortable to keep for years.

- Images are centred and span the full content width
- Code blocks favour readability
- List spacing stays consistent

| Item | Note |
| --- | --- |
| Languages | Chinese and English |
| Channels | Tech, Life |
