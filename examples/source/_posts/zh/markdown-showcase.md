---
title: 排版示例
date: 2026-09-07 21:00:00
lang: zh-CN
section: tech
permalink: /posts/markdown-showcase/
translation_key: markdown-showcase
sample: true
categories:
  - 工具
tags:
  - Markdown
  - 排版
---

这篇示例用来检查文章排版：图片、引用、列表、行内代码与代码块。

![示例图片](sample.svg)

## 代码块

代码块使用浅灰背景，长行可以横向滚动：

```bash
npm run clean && npm run build && rsync -az --delete public/ user@example.com:/var/www/blog/ --exclude '*.map' --exclude 'node_modules'
```

行内代码长这样：`npm run content:init`。

## 引用与列表

> 安静、克制、可以长期使用。

- 图片默认居中并撑满正文宽度
- 代码块优先保证可读性
- 列表之间的间距保持一致

| 项目 | 说明 |
| --- | --- |
| 语言 | 中文与英文 |
| 频道 | 技术、生活 |
