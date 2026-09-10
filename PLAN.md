# 博客重构方案书（v1.0 · 已确认）

> 本文档是开工前的设计基线，用来回答三件事：做什么、怎么做、按什么顺序做。
> 方案已确认，执行从「阶段 0」开始。过程中如需调整方案，先改本文档，再改代码，保证文档与实现一致。

---

## 0. 一句话目标

在 `/Users/chen/vibecoding/myhexoblog` 从零搭建一个 Hexo 双语博客：自主开发主题（外观与交互沿用旧站 `ops724blog`）、采用单站点 + 语言前缀路由、本地构建后通过 `rsync` 发布到阿里云 ECS；整个过程按功能分阶段推进，用详细的中文 commit 备注作为学习与复盘的节点。

---

## 1. 背景与目标

### 1.1 背景

旧站 `ops724blog` 的架构是被「GitHub Pages 部署」这个前提塑造的：`main` 存源码、`gh-pages` 存产物、公开层与本地私有层分离、发布靠 `git push`。现在部署目标改为阿里云 ECS，这些约定大多失去意义，因此在全新目录里从零重构，而不是在旧结构上打补丁。

### 1.2 目标

- 产品目标：一个安静、克制、以阅读为中心的个人博客，支持中英双语、技术/生活等多个内容频道。
- 学习目标：通过亲手搭建一遍，理解 Hexo 的架构分层、主题开发方式、Git 仓库与分支管理，并能在日后自行维护。
- 工程目标：结构清晰、每一阶段可独立验收、可随时回退，文档与代码同步。

### 1.3 非目标（本版明确不做）

- 不再考虑 GitHub Pages：不创建 `gh-pages` 分支，不写 Pages 相关部署逻辑。
- 不把主题打包成发布到 npm 的通用主题（但目录结构上保留可复用性）。
- V1 不做评论、站内搜索、RSS、站点统计等增值功能（可列为后续可选）。

---

## 2. 已确认约束

| 编号 | 约束 | 说明 |
| --- | --- | --- |
| 1 | 双语单站点 | 中英双语，单次构建；默认语言中文（`/`），英文走 `/en/` 前缀 |
| 2 | 内容策略 | 先搭框架与主题，用示例内容跑通；真实内容迁移后续单独评估 |
| 3 | 部署方式 | 阿里云 ECS，已有域名与备案、已装 Nginx；本地构建 + `rsync` 上传 |
| 4 | 协作方式 | 由 AI 编码开发；提交前 commit 备注用中文写详细，说明改了什么、为什么、每个文件的目的 |
| 5 | 主题风格 | 外观与交互沿用旧站风格，但代码全部重新编写，遵循第 4 条的提交规范 |
| 6 | 仓库策略 | 代码推送到 GitHub 公开管理；真实内容不公开，仅保存在本地并用于 ECS 部署 |

---

## 3. 当前状态（开工前）

- `hexo init` 已完成，Hexo 版本 `8.1.2`。
- 默认主题为 npm 安装的 `hexo-theme-landscape`，`source/_posts/hello-world.md` 为默认示例文章。
- `.github/dependabot.yml` 为 `hexo init` 自带模板，`.github` 目录暂无实际用途。
- `public/`、`db.json` 已生成过一次，属于可再生成产物。
- **当前目录没有 Git 仓库**（`hexo init` 后原有空仓库已不存在），因此「阶段 0」第一件事是重新 `git init`。

---

## 4. 架构设计

### 4.1 Hexo 的三层结构

| 层 | 位置 | 职责 |
| --- | --- | --- |
| 内容 / 数据层 | `source/`（文章、独立页面、`_data/*.yml`） | 站点里有什么内容，内容带哪些元数据 |
| 生成 / 路由层 | 根 `_config.yml`、`scripts/`、npm 插件 | 生成哪些 URL，每个 URL 放什么数据 |
| 渲染层 | `themes/<主题>/` | 拿到数据后渲染成 HTML，决定外观与交互 |

关键机制（已核对 Hexo 源码）：

- Hexo 会同时加载 `themes/<主题>/scripts/` 与项目根 `scripts/`。
- 生成器按名字注册，**同名会覆盖**；加载顺序为「npm 插件 → 主题脚本 → 项目脚本」，后注册者生效。
- 因此「首页只显示技术文章」这类需求，可以通过自定义生成器覆盖官方 `index` 生成器实现。

### 4.2 主题层与站点层的边界（已确认）

**建议方案：主题负责渲染，站点负责路由与内容规则。**

| 归属 | 内容 |
| --- | --- |
| 主题 `themes/<主题>/` | 布局与组件（EJS）、样式与设计令牌、界面文案 i18n、主题配置项、浏览器端交互脚本 |
| 站点（根 `_config.yml`、`scripts/`、`source/`） | 频道与语言路由生成器、内容过滤、permalink 规则、站点数据文件、部署脚本 |

理由：

- 双语频道、语言前缀、`translation_key` 配对是**这个站点的信息架构**，不是通用主题能力。
- 把路由逻辑放在站点层，主题可以保持干净，日后换主题或复用主题都更容易。
- 对学习更有利：能直观看到「内容 → 路由 → 渲染」三层各自在哪。

备选方案：像旧站那样把生成器和 helper 全部放进主题（`themes/ops724-white/scripts/`）。上手路径更短，但主题与站点绑死，且不利于理解 Hexo 的分层。

> 已确认（2026-09-10）：采用建议方案，路由与内容规则放站点层，主题只负责渲染。

### 4.3 目标目录结构

```text
myhexoblog/
├── _config.yml                 # 站点配置（语言、permalink、插件）
├── package.json                # 依赖与 npm 脚本
├── PLAN.md                     # 本文档
├── README.md                   # 使用说明（阶段 10 补齐）
├── AGENTS.md                   # 协作约定（含中文提交规范，阶段 0 建立）
├── scaffolds/                  # 新建文章模板
├── source/                     # 内容与数据（个人内容被 .gitignore 排除）
│   ├── _data/                  # navigation.yml（公开）；profile.yml / social.yml（私有）
│   ├── _posts/zh/              # 中文文章（私有）
│   ├── _posts/en/              # 英文文章（私有）
│   ├── about/  en/about/       # 关于页（私有）
│   ├── categories/ en/categories/
│   ├── tags/ en/tags/
│   └── images/                 # 个人图片（私有）
├── examples/                   # 示例内容（公开），用于初始化本地私有内容
├── scripts/                    # 站点级：生成器 / 过滤器 / helper
│   ├── generators/
│   ├── filters/
│   └── helpers/
├── themes/
│   └── ops724-white/
│       ├── _config.yml         # 主题配置项
│       ├── layout/             # EJS 模板与 partials
│       ├── languages/          # 界面文案 i18n
│       └── source/             # css / js / 静态资源
├── docs/                       # 架构、部署、提交学习索引
└── tools/
    ├── content-init.mjs        # 把 examples/ 初始化为本地私有内容
    └── deploy.sh               # 本地构建 + rsync 发布到 ECS
```

### 4.4 内容模型

文章 front-matter 约定：

| 字段 | 必填 | 取值 | 作用 |
| --- | --- | --- | --- |
| `title` | 是 | 字符串 | 标题 |
| `date` | 是 | 日期 | 发布时间 |
| `lang` | 是 | `zh-CN` / `en` | 内容语言，决定归属与过滤 |
| `section` | 是 | `tech` / `life` / `photos` | 一级频道，决定进入哪个列表 |
| `permalink` | 是 | `/posts/x/` 或 `/en/posts/x/` | 路由，语言前缀在此体现 |
| `translation_key` | 否 | 字符串 | 中英译文配对标识 |
| `categories` | 否 | 列表 | 分类 |
| `tags` | 否 | 列表 | 标签 |

### 4.5 路由表

| 页面 | 中文路由 | 英文路由 |
| --- | --- | --- |
| 首页（技术频道） | `/` | `/en/` |
| 生活频道 | `/life/` | `/en/life/` |
| 相册频道（V1 之外） | `/photos/` | `/en/photos/` |
| 文章详情 | `/posts/:slug/` | `/en/posts/:slug/` |
| 关于 | `/about/` | `/en/about/` |
| 分类总览 | `/categories/` | `/en/categories/` |
| 分类详情 | `/categories/:name/` | `/en/categories/:name/` |
| 标签总览 | `/tags/` | `/en/tags/` |
| 标签详情 | `/tags/:name/` | `/en/tags/:name/` |
| 归档 | `/archives/` | `/en/archives/` |
| 分页 | `/page/:n/` | `/en/page/:n/`（各频道同理） |

### 4.6 双语实现机制

Hexo 只原生提供「界面文案 i18n」与「URL 前缀识别语言」，内容双语要自己实现。本项目拆成四件事：

1. **界面文案**：主题 `languages/zh-CN.yml`、`languages/en.yml`，模板用 `__()` 取文案；`_config.yml` 中 `language: [zh-CN, en]`，第一项为回退语言。
2. **语言识别**：整站统一使用 `lang` 字段与 URL 前缀；提供归一化过滤器，允许简写（如 `zh`、`cn`）并补默认值。
3. **路由与过滤**：自定义生成器按「语言 × 频道」生成分页路由，只收录对应 `lang` 且 `section` 匹配的文章。
4. **语言切换**：文章页依赖 `translation_key` 找到译文；静态页面按路由表映射；找不到译文时回退到对应语言的首页。

### 4.7 与旧站的关键差异

| 主题 | 旧站做法 | 新站做法 |
| --- | --- | --- |
| 部署 | GitHub Pages（`gh-pages` 分支） | 本地构建 + `rsync` 到 ECS + Nginx |
| 仓库 | 公开框架 + 本地私有内容层，构建前合并 | 公开代码仓库 + 本地私有内容（被忽略），无需合并机制 |
| 逻辑落点 | 生成器/helper 全在主题内 | 已确认：路由与内容规则放站点 `scripts/`，主题只负责渲染 |
| 构建产物 | 推送到 `gh-pages` | 上传到服务器目录，本地可回滚 |
| 主题代码 | `ops724-white` | 重新编写，外观与交互对齐旧站 |

### 4.8 代码公开 + 内容私有的实现方式（已确认）

新仓库推送到 GitHub 公开管理代码，真实内容不进仓库，但仍要能本地构建并部署到 ECS。做法：

1. 公开内容：框架、主题、文档、示例内容（统一放在 `examples/`）。
2. 私有内容：真实文章、个人图片、关于页、`profile.yml`、`social.yml` 等，放在 `source/` 的正常路径下，由 `.gitignore` 排除。
3. 首次克隆后执行 `npm run content:init`，把 `examples/` 中的示例内容复制到本地真实路径，保证开箱可运行。
4. 部署仍走「本地构建 + rsync」，直接使用本地工作目录，**不需要旧站那种临时工作区合并机制**。
5. 示例内容统一带 `sample: true` 标记，部署脚本构建前检查，发现示例内容仍在场就中止并提示，避免把示例内容当成真实内容发布。

需要留意的代价：

- 私有内容不在 Git 中，没有版本保护，必须另行备份（Time Machine + 至少一份异地副本）。
- 被忽略的目录不会出现在新克隆里，目录结构依赖 `content:init` 脚本维护。
- 每次提交前用 `git status` 确认没有把私有文件加入暂存区；`examples/` 中只允许放示例内容。

---

## 5. 产品需求

### 5.1 设计语言（沿用旧站）

设计令牌（来自旧站 `tokens.css`）：

| 名称 | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#ffffff` | 页面背景（纯白） |
| `--text` | `#1a1a1a` | 正文文字 |
| `--muted` | `#6f6f6f` | 次要信息 |
| `--line` / `--line-strong` | `#ececec` / `#dcdcdc` | 分隔线 |
| `--content-width` | `720px` | 正文与列表宽度 |
| `--header-width` | `960px` | 页头宽度 |
| `--space-1..7` | `0.5rem` → `6rem` | 间距梯度 |
| `--font-serif` | Source Serif 4 / Noto Serif SC | 正文 |
| `--font-mono` | SFMono-Regular / Menlo | 代码 |
| `--font-sans` | Helvetica Neue / Arial | 界面 |

视觉与交互规则：

- 纯白背景，居中排版，左右留白充足；不使用侧边栏。
- 方形头像，不做圆角、不加厚重阴影。
- 文章列表采用「日期 + 分类 → 标题 → 摘要 → 阅读更多」的克制排版。
- 链接与导航使用低调的下划线/颜色反馈，不用大面积色块。
- 图片默认居中并撑满正文宽度，图注居中。
- 代码块优先保证可读性：语法高亮、舒适行高、浅灰背景、支持横向滚动。
- 移动端保持同样的阅读节奏，导航自然折行，不引入汉堡菜单等复杂交互（除非阶段 8 认为必要）。

### 5.2 页面需求清单

| 页面 | 需求要点 | 优先级 |
| --- | --- | --- |
| 首页 `/` | 头像、站点名、简介、技术文章列表、分页；只显示当前语言的技术文章 | P0 |
| 生活频道 | 频道标题与简介、生活文章列表、分页 | P0 |
| 文章详情 | 标题、日期、分类、标签、译文入口、正文、上一篇/下一篇 | P0 |
| 关于 | 作者介绍式内容，中英各一份 | P0 |
| 分类总览 / 详情 | 按语言过滤、显示数量、详情页分页 | P1 |
| 标签总览 / 详情 | 轻量列表，不做拥挤标签云 | P1 |
| 归档 | 按年/月分组，只显示当前语言 | P1 |
| 相册 | 相册列表与照片浏览交互 | V1 之外（见第 7 节末） |
| 语言切换 | 页头提供「中 / EN」，文章页可跳译文 | P0 |

### 5.3 组件清单

`head`、`header`（头像 + 站点名 + 导航 + 语言切换）、`footer`、`post-list`、`post-meta`、`list-pagination`、文章页 `pagination`（上一篇/下一篇）、`archive-groups`、`taxonomy-list`、`empty-state`。

### 5.4 站点数据文件

| 文件 | 内容 |
| --- | --- |
| `source/_data/profile.yml` | 站点名、副标题、头像、邮箱、所在地、页头/主体背景色 |
| `source/_data/navigation.yml` | 导航项及其双语路径 |
| `source/_data/social.yml` | 社交链接（旧站未接入，新站可选接上） |

其中 `profile.yml`、`social.yml` 属于私有数据（被 Git 忽略），仓库只在 `examples/` 里保留同名模板；`navigation.yml` 是站点结构，随代码公开。

副标题、所在地等需要双语的字段使用 `{ zh-CN: ..., en: ... }` 结构，与旧站保持一致。

### 5.5 主题配置项（主题 `_config.yml`）

首版计划暴露：`show_language_switcher`（是否显示语言切换）、`accent_color`（可选强调色）、`show_reading_time`（可选）。具体字段在阶段 1 定稿并写入文档。

---

## 6. 工程与协作规范

### 6.1 仓库与分支

- `main`：始终保持可构建、可部署。
- 每个阶段开一条短生命周期分支，命名用英文小写短横线（例如 `feat/theme-skeleton`），原因是兼容性最好；**提交信息一律中文**。
- 阶段完成后用 `--no-ff` 合并回 `main`，保留「一个阶段一个合并节点」的历史形状，便于复盘。
- 不打 `git tag` 之前，不删除已合并分支；如需清理，阶段 10 统一处理。

### 6.2 提交信息规范

每次提交使用如下结构（中文）：

```text
<类型>: <一句话说明本阶段目标>

背景
- 为什么做这一步，解决什么问题。

改动
- 文件路径：这个文件新增/修改了什么，目的和思路是什么。
- 文件路径：...

验证
- 用什么命令、检查了哪些页面或行为，结果如何。

后续
- 下一步要做什么，有哪些已知限制。
```

类型用中文：`初始化`、`新增`、`重构`、`修复`、`样式`、`文档`、`构建`。

同时维护 `docs/COMMITS.md` 提交学习索引：每完成一个阶段，追加一行「commit 标题 → 阶段 → 涉及概念 → 学习要点」，让整份历史可以直接当教材读。

### 6.3 每阶段的验收方式

- 本地执行 `npm run server`（或 `hexo s`），访问 `http://localhost:4000/` 与 `/en/` 检查页面。
- 每个阶段结束前执行一次 `hexo clean && hexo generate`，确认无报错、无控制台警告。
- 关键页面用截图或清单形式记录验收结果，写进阶段提交说明。

---

## 7. 分阶段 TODO

> 每个阶段都可独立验收，对应一条分支与至少一次提交。阶段顺序经过依赖排序：先地基，再页面，最后部署与迁移。

### 阶段 0：仓库与工程基线

- 目标：建立干净的 Git 仓库与项目约定，清掉 `hexo init` 残留。
- 任务：
  - [ ] `git init`，确认默认分支为 `main`。
  - [ ] 完善 `.gitignore`：`node_modules/`、`public/`、`db.json`、`*.log`、`.DS_Store`、本地部署配置，以及第 4.8 节列出的私有内容路径。
  - [ ] 建立 `examples/` 示例内容目录与 `tools/content-init.mjs`（对应 `npm run content:init`）。
  - [ ] 新建 `AGENTS.md`，写入协作约定（中文提交规范、阶段流程、风格要求、提交前私有内容检查）。
  - [ ] 新建 `README.md` 骨架与 `docs/` 目录（`docs/COMMITS.md` 索引模板）。
  - [ ] 删除 `source/_posts/hello-world.md` 与 `_config.landscape.yml`；`hexo-theme-landscape` 依赖留到阶段 1 随主题切换一并移除，避免阶段 0 无法构建。
  - [ ] 保留 `.github/dependabot.yml`，它用于公开仓库的依赖更新提醒。
- 涉及文件：`.gitignore`、`AGENTS.md`、`README.md`、`package.json`、`docs/COMMITS.md`、`examples/`、`tools/content-init.mjs`。
- 验收：`npm install && npm run server` 可启动；仓库首次提交完成。
- 建议分支：`chore/project-baseline`
- 建议提交：`初始化: 建立仓库基线与项目约定`

### 阶段 1：主题骨架与设计系统

- 目标：搭出主题目录结构与全局布局，让页面有「白色 + 居中 + 留白」的骨架。
- 任务：
  - [ ] 在 `themes/ops724-white/` 下创建主题目录与 `_config.yml`。
  - [ ] 实现 `layout/layout.ejs`、`partials/head.ejs`、`partials/header.ejs`、`partials/footer.ejs`。
  - [ ] 落地 `tokens.css`、`base.css`、`layout.css`，把 5.1 的设计令牌写成 CSS 变量。
  - [ ] 建立 `languages/zh-CN.yml` 与 `languages/en.yml` 骨架。
  - [ ] 根 `_config.yml` 指向新主题，移除 landscape 相关配置。
- 涉及文件：`themes/ops724-white/**`、`_config.yml`。
- 验收：首页出现页头（头像占位、站点名、导航占位）、内容容器与页脚；纯白背景与留白符合设计令牌。
- 建议分支：`feat/theme-skeleton`
- 建议提交：`新增: 建立主题骨架与设计令牌`

完整 commit 备注示例（作为后续提交的模板）：

```text
新增: 建立主题骨架与设计令牌

背景
- 项目此前使用 hexo init 自带的 landscape 主题，与目标风格无关。
- 第一阶段需要先有一个能渲染、能承载后续组件的主题外壳，
  否则双语路由与页面组件没有地方落地。

改动
- themes/ops724-white/layout/layout.ejs：新增全局 HTML 骨架，定义 body 容器
  与 header/main/footer 的挂载点，是所有页面最终套用的外层结构。
- themes/ops724-white/layout/partials/head.ejs：集中输出 meta 信息与样式引用，
  避免每个页面重复写资源引入。
- themes/ops724-white/layout/partials/header.ejs：实现页头骨架，包含头像占位、
  站点名与导航区域，为阶段 7 接入真实数据留出结构。
- themes/ops724-white/source/css/tokens.css：把设计令牌（颜色、宽度、间距、字体）
  定义为 CSS 变量，后续样式只引用变量，便于整体调整。
- themes/ops724-white/source/css/base.css：重置默认样式，统一排版基础规则。
- themes/ops724-white/source/css/layout.css：实现页面居中容器与留白节奏。
- _config.yml：将 theme 指向新主题，确保生成结果使用新骨架。

验证
- 执行 hexo clean && hexo generate，无报错。
- 执行 npm run server，访问 / 与 /en/，确认页头、内容区、页脚顺序正确，
  页面为纯白背景且内容居中。

后续
- 下一阶段实现双语内容模型与语言前缀路由，导航与头像数据暂为占位。
```

### 阶段 2：双语内容模型与语言路由地基

- 目标：让中英文内容各有归属，路由前缀与语言识别跑通。
- 任务：
  - [ ] 站点 `_config.yml` 设置 `language: [zh-CN, en]`、`permalink`、`i18n_dir`。
  - [ ] 实现语言归一化过滤器（允许 `zh`/`cn` 等简写，缺失时补默认值）。
  - [ ] 实现路由 helper：给定页面与目标语言，算出对应 URL。
  - [ ] 实现最小的语言首页生成器：`/` 只出中文文章，`/en/` 只出英文文章（阶段 3 再扩展成频道与分页）。
  - [ ] 在 `examples/` 中提供示例内容（中英各一篇技术文章、一篇生活文章、一篇关于页），由 `npm run content:init` 复制到本地私有路径。
  - [ ] 更新 `scaffolds/post.md`、`scaffolds/page.md`，固化内容模型字段。
  - [ ] 页头语言切换基础版（纯链接）。
- 涉及文件：`_config.yml`、`scripts/lib/*`、`scripts/filters/*`、`scripts/helpers/*`、`scripts/generators/localized-index.js`、`source/_posts/**`、`source/*/about/**`、`scaffolds/*`、主题 `layout/page.ejs` 与 `partials/language-switcher.ejs`。
- 验收：`/`、`/en/`、`/about/`、`/en/about/` 均可访问；同一篇内容切换语言的链接指向正确；界面文案随语言变化。
- 建议分支：`feat/i18n-foundation`
- 建议提交：`新增: 搭建双语内容模型与语言路由基础`

### 阶段 3：首页与频道分页

- 目标：首页只显示当前语言的技术文章，生活频道独立成页，均支持分页。
- 任务：
  - [ ] 实现频道分页生成器，覆盖官方 `index` 生成器，按「语言 × 频道」产出路由。
  - [ ] 分页自己切片实现，第 1 页是频道地址、第 N 页是 `page/N/`，不新增依赖。
  - [ ] 实现 `post-list`、`post-meta`、`list-pagination` 组件。
  - [ ] 实现 `index.ejs`、`list.ejs`、`section.ejs` 模板。
  - [ ] 生成器自带筛选逻辑，确保列表不含其他语言与其他频道的文章。
- 涉及文件：`scripts/generators/*`、`scripts/lib/*`、主题 `layout/index.ejs`、`layout/list.ejs`、`layout/section.ejs`、`layout/partials/post-list.ejs` 等。
- 验收：`/` 与 `/en/` 只出现各自语言的技术文章；`/life/` 与 `/en/life/` 只出现生活文章；文章数量足够时出现分页且翻页正常。
- 建议分支：`feat/channels`
- 建议提交：`新增: 实现首页与生活频道分页`

### 阶段 4：文章详情页与内容排版

- 目标：文章页达到与旧站一致的阅读体验。
- 任务：
  - [ ] 实现 `post.ejs` 与 `post-meta` 组件（标题、日期、分类、标签）。
  - [ ] 实现上一篇/下一篇导航组件。
  - [ ] 实现基于 `translation_key` 的译文入口。
  - [ ] 相邻文章只在「同语言 + 同频道」内查找，并对两种 path 写法做归一化。
  - [ ] 编写 `content.css`：标题、段落、引用、列表、图片、图注、行内代码、代码块。
  - [ ] 配置 `prismjs` 语法高亮（浅灰背景、行高舒适、横向滚动）。
  - [ ] 图片默认居中并撑满正文宽度。
- 涉及文件：主题 `layout/post.ejs`、`layout/partials/pagination.ejs`、`source/css/content.css`；站点 helper；`_config.yml` 高亮配置。
- 验收：示例文章包含代码块、长代码行、图片、引用；渲染效果与旧站一致；有无译文两种情况语言入口都正确。
- 建议分支：`feat/post-page`
- 建议提交：`新增: 实现文章详情页与内容排版`

### 阶段 5：分类与标签

- 目标：分类、标签的中英文总览页与详情页可用，并按语言过滤与分页。
- 任务：
  - [ ] 实现本地化分类/标签生成器（总量、详情、分页）。
  - [ ] 把分页逻辑抽到 `scripts/lib/paginate.js`，与频道生成器共用。
  - [ ] 实现 `categories.ejs`、`tags.ejs`、`category.ejs`、`tag.ejs`。
  - [ ] 实现计数与路由 helper，保证只统计当前语言内容。
  - [ ] 创建中英文分类、标签总览页面。
- 涉及文件：`scripts/generators/localized-taxonomies.js`、`scripts/helpers/*`、主题对应模板、`source/categories`、`source/tags` 及英文目录。
- 验收：中英文总览只列出本语言使用过的分类/标签；详情页列表与分页正确。
- 建议分支：`feat/taxonomies`
- 建议提交：`新增: 实现双语分类与标签页面`

### 阶段 6：归档页

- 目标：中英文归档按年/月分组展示。
- 任务：
  - [ ] 实现本地化归档生成器。
  - [ ] 归档只保留 `/archives/` 与 `/en/archives/` 两个入口，不再生成按年月的子路由。
  - [ ] 实现 `archives.ejs` 与年月分组 helper。
  - [ ] 创建中英文归档页面入口。
- 涉及文件：`scripts/generators/localized-archives.js`、`scripts/helpers/archive-groups.js`、主题 `layout/archives.ejs`、`source` 下页面。
- 验收：`/archives/` 与 `/en/archives/` 分组正确，只含当前语言文章。
- 建议分支：`feat/archives`
- 建议提交：`新增: 实现双语归档页面`

### 阶段 7：站点资料与关于页

- 目标：站点从「能跑」变成「像自己的站点」。
- 任务：
  - [ ] 建立 `profile.yml`、`navigation.yml`、`social.yml` 并接入主题。
  - [ ] 导航改为读取 `navigation.yml`，页头站点名、副标题、头像改为读取 `profile.yml`。
  - [ ] 页头支持头像、站点名、副标题与双语导航。
  - [ ] 实现中英文关于页模板与内容。
  - [ ] 支持 favicon、页头背景色、主体背景色配置。
  - [ ] （可选）接入社交链接展示。
- 涉及文件：`source/_data/*.yml`、`source/about/**`、主题 `partials/header.ejs`、`layout/page.ejs`、`source/css/*`。
- 验收：修改 `profile.yml` 后站点名、头像、颜色随之变化；关于页中英文可切换。
- 建议分支：`feat/site-data`
- 建议提交：`新增: 接入站点资料与关于页`

### 阶段 8：交互细节与响应式打磨

- 目标：把细节体验补齐到「可以长期使用」。
- 任务：
  - [ ] 导航当前项高亮（`aria-current`）、链接悬停/聚焦反馈。
  - [ ] 高亮逻辑单独放在 `scripts/helpers/navigation.js`，频道文章按 `section` 归属。
  - [ ] 移动端断点适配，检查长标题、长代码、宽图片。
  - [ ] 无障碍基础项：语义标签、图片替代文本、跳转到正文链接。
  - [ ] 空状态与边界情况（无文章、无译文、无分类）。
- 涉及文件：主题 `source/css/*`、`source/js/*`、`layout/partials/*`。
- 验收：桌面与移动尺寸下页面无横向溢出；键盘可完成主要操作。
- 建议分支：`style/polish`
- 建议提交：`样式: 完善交互反馈与移动端表现`

### 阶段 9：ECS 部署链路

- 目标：一条命令完成「本地构建 → 上传 ECS → 服务器生效」。
- 任务：
  - [ ] 编写部署脚本（`hexo clean && hexo generate` + `rsync -az --delete`）。
  - [ ] 在构建前检查是否还有 `sample: true` 的示例内容，存在则中止发布并提示。
  - [ ] 本地部署配置（服务器地址、用户、目录）放在不入库的文件中，并加入 `.gitignore`。
  - [ ] 整理 Nginx 站点配置示例（根目录、gzip、静态资源缓存、HTTPS）。
  - [ ] 设计回滚方式（保留上一版本或版本目录切换）。
  - [ ] 编写 `docs/DEPLOY.md`。
- 涉及文件：`tools/deploy.sh`、`tools/nginx/*.conf`、`.gitignore`、`package.json`、`docs/DEPLOY.md`。
- 验收：首次部署后，通过域名访问看到新站；重复部署不产生脏数据；回滚步骤验证可用。
- 建议分支：`chore/deploy-ecs`
- 建议提交：`构建: 建立 ECS 部署与发布流程`

### 阶段 10：文档与提交学习索引

- 目标：让项目对「未来的自己」友好。
- 任务：
  - [ ] 完善 `README.md`（安装、开发、写作、部署）。
  - [ ] 编写 `docs/ARCHITECTURE.md`（三层结构、主题与站点边界、路由与内容模型）。
  - [ ] 完成 `docs/COMMITS.md` 索引，把每个阶段与提交节点、学习要点对应起来。
  - [ ] 清理无用分支与临时文件。
- 涉及文件：`README.md`、`docs/*.md`。
- 验收：新环境按 README 可跑起来；文档与代码一致。
- 建议分支：`docs/handbook`
- 建议提交：`文档: 补齐项目文档与提交学习索引`

### 阶段 11：旧站内容迁移（后续单独评估）

- 目标：把旧站真实内容迁到新站，安全切换。
- 任务：
  - [ ] 盘点旧站内容（文章、关于页、图片、分类标签、相册）。
  - [ ] 决定迁移方式（手动 / 脚本批量），编写迁移与校验方案。
  - [ ] 迁移后逐项校验路由、图片、代码块、译文配对。
  - [ ] 制定切换与回滚步骤，旧站保留一段时间可回退。
- 建议分支：`feat/content-migration`
- 建议提交：`新增: 迁移旧站内容并完成校验`

### V1 之外（后续可选）

以下内容已明确不进入 V1，待主体站点稳定后单独评估，届时各补一份小方案：

- 相册频道：复用「文章 + 频道 + 布局」模型实现——新增 `section: photos`、`layout: album`、`photos`/`captions` 字段，以及 `photos.ejs`、`album.ejs`、`photos.css`、`photos.js`；`/photos/`、`/en/photos/` 由频道生成器顺带产出。
- 评论、站内搜索、RSS、站点统计。

---

## 8. 阶段 × commit 节点总览

| 阶段 | 分支 | 提交标题（中文） |
| --- | --- | --- |
| 0 | `chore/project-baseline` | 初始化: 建立仓库基线与项目约定 |
| 1 | `feat/theme-skeleton` | 新增: 建立主题骨架与设计令牌 |
| 2 | `feat/i18n-foundation` | 新增: 搭建双语内容模型与语言路由基础 |
| 3 | `feat/channels` | 新增: 实现首页与生活频道分页 |
| 4 | `feat/post-page` | 新增: 实现文章详情页与内容排版 |
| 5 | `feat/taxonomies` | 新增: 实现双语分类与标签页面 |
| 6 | `feat/archives` | 新增: 实现双语归档页面 |
| 7 | `feat/site-data` | 新增: 接入站点资料与关于页 |
| 8 | `style/polish` | 样式: 完善交互反馈与移动端表现 |
| 9 | `chore/deploy-ecs` | 构建: 建立 ECS 部署与发布流程 |
| 10 | `docs/handbook` | 文档: 补齐项目文档与提交学习索引 |
| 11 | `feat/content-migration` | 新增: 迁移旧站内容并完成校验 |

---

## 9. 风险与待决事项

| 事项 | 说明 | 建议 |
| --- | --- | --- |
| 主题名 | 新主题叫什么名字 | 已确认：沿用 `ops724-white` |
| 逻辑落点 | 路由生成器放主题还是站点 | 已确认：放站点 `scripts/`（见 4.2） |
| 相册频道 | 是否纳入 V1 | 已确认：不纳入 V1，归入「V1 之外」清单 |
| 私有内容层 | 公开仓库如何承载私有内容 | 已确认：公开代码 + `examples/` 示例 + `.gitignore` 排除真实内容（见 4.8），旧式双层方案已否决 |
| 仓库归属 | 新仓库是否推到远程、是否公开 | 已确认：推送到 GitHub 公开管理代码，内容不公开 |
| 私有内容备份 | 内容不在 Git 中，存在丢失风险 | 上线前落实备份方案（Time Machine + 异地副本） |
| ECS 细节 | SSH 用户、目标目录、是否与旧站共存 | 待确认；阶段 9 之前提供即可 |
| 旧站切换 | 新旧站切换与回滚策略 | 建议新站搭完、验收通过后再切换，旧站保留一段时间 |
| 增值功能 | 评论、搜索、RSS、统计 | V1 不做，阶段 10 后按需评估 |

---

## 10. 下一步

1. 方案已定稿：主题名 `ops724-white`；路由逻辑放站点 `scripts/`；相册不纳入 V1；代码公开、内容私有。
2. 从「阶段 0」开始执行：先建仓库与工程约定，再进入主题开发。
3. 每个阶段开始前，先说明这一阶段要学的概念和代码思路；结束后给出中文提交与复盘说明。
