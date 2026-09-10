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

## 订阅

站点提供中英两个 Atom 订阅源：

| 语言 | 地址 |
| --- | --- |
| 中文 | `/atom.xml` |
| 英文 | `/en/atom.xml` |

每个源只包含对应语言的文章，最多 20 条，按发布时间倒序，正文用摘要代替全文（相册这类没有正文的条目用照片说明兜底）。页面 `<head>` 里有自动发现链接，阅读器可以直接识别；页脚的 RSS 入口指向当前语言的源。

订阅源里的链接是绝对地址，取自 `_config.yml` 的 `url`，部署前需要把它改成真实域名。

## 搜索引擎与分享

- `/sitemap.xml`：站点地图，列出所有希望被收录的页面；中英对照的页面互相标注 hreflang，分页地址不收录
- `/robots.txt`：允许抓取，并指向上面的站点地图
- 每个页面都输出 `canonical`（规范地址）以及 Open Graph / Twitter 分享卡片信息

上线后可以把 `https://你的域名/sitemap.xml` 提交到 Google Search Console 或百度站长平台，收录会更快。把链接分享到微信、Slack 等平台时，卡片会显示页面标题、描述与分享图。

页面描述按优先级取值：front-matter 的 `description` → 文章正文前 140 字摘要 → 频道的说明文案 → 正文摘要 → 站点描述。分享图默认使用 `profile.yml` 里的头像，文章可以用 front-matter 的 `image` 覆盖。

## 站内搜索

搜索页在 `/search/` 与 `/en/search/`，索引由生成器在构建时产出（`/search-index.json` 与 `/en/search-index.json`），前端做子串匹配，不需要后端服务，也没有额外依赖或构建步骤。

- 检索方式：大小写不敏感的子串匹配；标题命中优先，其余按命中次数排序，最多显示 10 条，命中片段高亮
- 索引范围：文章、相册，以及有正文的独立页面（例如关于页）；相册这类没有正文的用照片说明兜底
- 语言隔离：中英各一份索引，中文页只搜中文内容
- 中文不需要分词，所以中文关键词一定搜得到
- 索引只在搜索页按需加载，其它页面没有额外开销

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
