# myhexoblog

基于 Hexo 的中英双语个人博客。代码公开托管在 GitHub，真实内容只保存在本地，构建后通过 `rsync` 发布到阿里云 ECS。

## 项目特点

- 双语单站点：中文在 `/`，英文在 `/en/`
- 技术、生活、相册三个内容频道，另有分类、标签与归档
- 自研主题 `ops724-white`：纯白背景、居中排版、方形头像
- 公开代码 + 本地私有内容：真实文章不进仓库
- 本地构建 + `rsync` 发布，支持原子切换与一键回滚

## 环境要求

- Node.js 20 或更高（开发时使用 Node 26）
- Git
- 部署到 ECS 时需要本机有 `rsync` 与 SSH 免密登录

## 快速开始

```bash
npm install
npm run content:init   # 首次使用：把 examples/ 里的示例内容复制到本地内容目录
npm run server         # 打开 http://localhost:4000
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run server` | 本地预览 `http://localhost:4000` |
| `npm run build` | 生成静态站点到 `public/` |
| `npm run clean` | 清理生成缓存 |
| `npm run content:init` | 初始化本地示例内容（只补缺失文件，不覆盖已有文件；删除示例后请勿重复执行） |
| `npm run deploy` | 构建并发布到 ECS |
| `npm run deploy:list` | 查看服务器上的版本与当前指向 |
| `npm run deploy:rollback` | 回滚到上一个版本 |

## 写一篇文章

```bash
npx hexo new post "文章标题"   # 生成到 source/_posts/，再移动到 zh/ 或 en/ 目录
```

文章 front-matter 使用这套内容模型：

| 字段 | 说明 |
| --- | --- |
| `lang` | 内容语言：`zh-CN` 或 `en` |
| `section` | 频道：`tech`（技术）或 `life`（生活） |
| `permalink` | 文章地址：中文 `/posts/<slug>/`，英文 `/en/posts/<slug>/` |
| `translation_key` | 中英译文配对标识，两边写同一个值即可互相跳转 |
| `categories` / `tags` | 分类与标签 |

文章图片放在与文章同名的目录里（例如 `source/_posts/zh/<文章目录>/cover.png`），正文里直接写 `![说明](cover.png)` 即可。

## 写一个相册

相册也是一篇文章，只是多了 `photos` 与 `captions` 两个字段：

```yaml
---
title: 城市夜景
date: 2026-09-09 09:00:00
lang: zh-CN
section: photos
layout: album
permalink: /photos/city-lights/
translation_key: city-lights
photos:
  - /images/albums/city-lights/20260101_bund.webp
captions:
  - 元旦，外滩的灯
---
```

照片有两种放法：放在与文章同名的目录里（构建时会复制到相册地址下），或者上传到 `source/images/albums/<相册名>/` 再用绝对路径引用。相册列表在 `/photos/` 与 `/en/photos/`，点开后照片平铺展示，点击可用灯箱查看，支持 Esc 关闭与左右方向键切换。

## 目录结构

```
source/               内容层：文章、页面、站点数据（个人内容被 Git 忽略）
scripts/              路由层：生成器、过滤器、helper
themes/ops724-white/  渲染层：模板、样式、界面文案
examples/             公开的示例内容模板
tools/                内容初始化与部署脚本
docs/                 架构、部署与提交索引
```

## 公开代码与私有内容

以下内容被 `.gitignore` 排除，只保存在本地：

- `source/_posts/zh/`、`source/_posts/en/`：真实文章
- `source/about/`、`source/en/about/`：关于页
- `source/images/`：头像、站点图标等个人图片
- `source/_data/profile.yml`、`source/_data/social.yml`：站点资料与社交链接
- `tools/deploy.local.sh`：服务器连接信息

公开的部分包括：框架、主题、文档、`examples/` 示例内容，以及作为站点结构的 `source/_data/navigation.yml`。

私有内容不在 Git 中，没有版本保护，请自行做好备份。

## 文档

- [PLAN.md](./PLAN.md)：方案书与分阶段 TODO
- [AGENTS.md](./AGENTS.md)：协作与提交约定
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)：项目结构与实现说明
- [docs/DEPLOY.md](./docs/DEPLOY.md)：ECS 部署说明
- [docs/COMMITS.md](./docs/COMMITS.md)：提交学习索引
