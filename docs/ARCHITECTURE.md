# 项目结构与实现说明

这份文档回答「项目是怎么搭起来的」，面向需要改代码的人。日常使用看 [README](../README.md)，发布看 [DEPLOY.md](./DEPLOY.md)。

## 一、三层结构

Hexo 站点由三层组成，改代码前先判断改动属于哪一层：

| 层 | 位置 | 职责 |
| --- | --- | --- |
| 内容层 | `source/` | 文章、页面、站点数据（`_data/`） |
| 路由层 | 根 `_config.yml`、`scripts/` | 生成哪些 URL、每个 URL 放哪些数据 |
| 渲染层 | `themes/ops724-white/` | 模板、样式、界面文案、浏览器端交互 |

关键机制：

- Hexo 会同时加载 `themes/<主题>/scripts/` 与项目根 `scripts/`。
- 生成器按名字注册，**同名会覆盖**；加载顺序是「npm 插件 → 主题脚本 → 站点脚本」，后注册者生效。
- 每个页面视图默认会被主题的 `layout/layout.ejs` 包住（路由 locals 里 `layout = 'layout'`），所以 `index.ejs`、`post.ejs` 只写内容区。
- 文章的 `before_post_render` 过滤器对**页面也会执行**，需要区分时用 `slug`（文章特有）或 `__post` / `__page` 判断。

## 二、主题与站点的边界

本项目刻意把「站点信息架构」与「主题渲染」分开：

| 归属 | 内容 |
| --- | --- |
| 站点 `scripts/` | 频道与语言路由、内容过滤、相邻文章、译文查找、导航高亮判断 |
| 主题 `themes/ops724-white/` | 布局与组件、样式、界面文案、模板内的展示逻辑 |

这样做的好处是主题保持干净：换主题不会丢路由逻辑，改路由也不会动到模板结构。

## 三、目录结构

```
myhexoblog/
├── _config.yml              站点配置：语言、permalink、高亮、分页
├── source/                  内容层
│   ├── _data/               navigation.yml（公开）、profile.yml / social.yml（私有）
│   ├── _posts/zh|en/        文章（私有）
│   ├── about/ en/about/     关于页（私有）
│   ├── categories/ tags/    分类与标签总览页
│   └── en/categories|tags/  英文对应页面
├── scripts/                 路由层
│   ├── lib/                 共享逻辑
│   ├── filters/             渲染前的内容归一化
│   ├── generators/          路由生成
│   └── helpers/             模板里可调用的函数
├── themes/ops724-white/
│   ├── layout/              页面模板与 partials
│   ├── languages/           界面文案（zh-CN / en）
│   └── source/css/          样式
├── examples/                示例内容模板（公开）
├── tools/                   content-init.mjs、deploy.sh、nginx 配置示例
└── docs/                    本目录
```

## 四、路由表

| 页面 | 中文 | 英文 |
| --- | --- | --- |
| 技术频道（首页） | `/` | `/en/` |
| 生活频道 | `/life/` | `/en/life/` |
| 列表分页 | `/page/2/` | `/en/page/2/` |
| 文章详情 | `/posts/:slug/` | `/en/posts/:slug/` |
| 分类总览 / 详情 | `/categories/`、`/categories/:name/` | `/en/categories/`、`/en/categories/:name/` |
| 标签总览 / 详情 | `/tags/`、`/tags/:name/` | `/en/tags/`、`/en/tags/:name/` |
| 归档 | `/archives/` | `/en/archives/` |
| 关于 | `/about/` | `/en/about/` |

## 五、内容模型

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题 |
| `date` | 是 | 发布时间 |
| `lang` | 是 | `zh-CN` 或 `en`，允许写 `zh`、`cn` 等简写 |
| `section` | 是 | `tech` 或 `life`，缺失时归到 `tech` |
| `permalink` | 建议 | 中文 `/posts/<slug>/`，英文 `/en/posts/<slug>/` |
| `translation_key` | 否 | 中英译文配对标识 |
| `sample` | 否 | 标记为示例内容，发布前检查会拦截 |

## 六、双语是怎么实现的

Hexo 只提供「界面文案 i18n」与「按 URL 前缀识别语言」，内容双语要自己实现，本项目拆成四件事：

1. **界面文案**：主题 `languages/zh-CN.yml`、`languages/en.yml`，模板里用 `__('key')` 取。
2. **语言识别**：`page_lang` helper 先看 front-matter 的 `lang`，再看 URL 前缀；缺失时回退到默认语言。
3. **内容过滤**：生成器用 `filterPosts(collection, lang, section)` 只取对应语言与频道的文章。
4. **语言切换**：文章优先通过 `translation_key` 找译文，其他页面按 `en` 前缀映射；没有译文时回退到目标语言首页。

## 七、站点脚本清单

### lib（共享逻辑）

| 文件 | 作用 |
| --- | --- |
| `lib/content.js` | 语言与频道归一化、按语言频道过滤、排序、查找译文 |
| `lib/paginate.js` | 分页路由生成：第 1 页是根地址，第 N 页是 `page/N/` |

### filters

| 文件 | 作用 |
| --- | --- |
| `filters/normalize-content.js` | 渲染前统一 `lang` 与 `section`（只对文章设置 `section`） |

### generators（注册名会覆盖同名官方生成器）

| 文件 | 覆盖谁 | 产出 |
| --- | --- | --- |
| `generators/channel-pagination.js` | `index` | `/`、`/en/`、`/life/`、`/en/life/` 及分页 |
| `generators/localized-taxonomies.js` | `category`、`tag` | 分类与标签的中英详情页及分页 |
| `generators/localized-archives.js` | `archive` | `/archives/`、`/en/archives/` |

### helpers（模板里可调用）

| 文件 | 提供的函数 |
| --- | --- |
| `helpers/language.js` | `page_lang`、`localized_page_url` |
| `helpers/content.js` | `as_list`、`post_summary`、`post_neighbors`、`other_translation` |
| `helpers/taxonomy.js` | `taxonomy_url`、`taxonomy_items` |
| `helpers/archive-groups.js` | `archive_groups` |
| `helpers/navigation.js` | `is_nav_active` |
| `helpers/site-data.js` | `profile_text`、`profile_value`、`site_title` |

## 八、主题结构

### 模板

| 文件 | 用途 |
| --- | --- |
| `layout/layout.ejs` | 全局骨架，套在所有页面外层 |
| `layout/index.ejs`、`section.ejs` | 首页与频道页，都复用 `list.ejs` |
| `layout/list.ejs` | 通用列表页：标题、简介、文章列表、分页 |
| `layout/category.ejs`、`tag.ejs` | 分类与标签详情页，同样复用 `list.ejs` |
| `layout/categories.ejs`、`tags.ejs` | 分类与标签总览页 |
| `layout/archives.ejs` | 归档页，按年月分组 |
| `layout/post.ejs` | 文章页 |
| `layout/page.ejs` | 普通页面（关于页等） |

### partials

`head`、`header`、`footer`、`language-switcher`、`post-list`、`post-meta`、`list-pagination`、`pagination`（上一篇/下一篇）、`translation-link`、`taxonomy-list`。

### 样式分层

| 文件 | 作用 |
| --- | --- |
| `tokens.css` | 设计令牌：颜色、宽度、间距、字体 |
| `base.css` | 最小重置、焦点样式、减少动效适配 |
| `layout.css` | 页面骨架：页头、正文容器、页脚、响应式断点 |
| `components.css` | 列表、分页、归档、分类标签、上一篇/下一篇等组件 |
| `content.css` | 文章排版、代码高亮配色、图片与引用 |

## 九、数据文件

| 文件 | 可见性 | 内容 |
| --- | --- | --- |
| `source/_data/navigation.yml` | 公开 | 主导航项与双语地址 |
| `source/_data/profile.yml` | 私有 | 站点名、副标题、头像、图标、背景色 |
| `source/_data/social.yml` | 私有 | 页脚社交链接 |

## 十、常见扩展

- **加一个频道**：在 `generators/channel-pagination.js` 的 `CHANNELS` 里加一条，并补上界面文案与导航项。
- **加一个界面文案**：在主题的 `languages/zh-CN.yml` 与 `en.yml` 同时加键，模板里用 `__('key')`。
- **加一个页面**：在 `source/` 下建目录与 `index.md`，front-matter 里用 `layout` 指定模板。
- **改配色或字体**：只改 `tokens.css`，组件样式都引用变量。
- **改站点信息**：编辑 `source/_data/profile.yml`，不需要动主题代码。
