# myhexoblog

一个基于 Hexo 的中英双语个人博客。代码公开托管在 GitHub，真实内容只保存在本地，构建后通过 `rsync` 发布到阿里云 ECS。

> 项目正在从零重构中，设计与进度见 [PLAN.md](./PLAN.md)。

## 快速开始

```bash
npm install
npm run content:init   # 首次使用：把 examples/ 中的示例内容复制到本地内容目录
npm run server         # 打开 http://localhost:4000
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run server` | 本地预览 |
| `npm run build` | 生成静态站点到 `public/` |
| `npm run clean` | 清理生成缓存 |
| `npm run content:init` | 初始化本地示例内容（只复制，不覆盖已有文件） |

## 目录说明

- `source/`：内容层；个人内容被 Git 忽略，仅保存在本地
- `scripts/`：站点级路由与内容规则
- `themes/ops724-white/`：主题
- `examples/`：公开的示例内容模板
- `docs/`：架构、部署与提交索引
- `tools/`：内容初始化与部署脚本

## 文档

- [PLAN.md](./PLAN.md)：方案书与分阶段 TODO
- [AGENTS.md](./AGENTS.md)：协作与提交约定
- [docs/COMMITS.md](./docs/COMMITS.md)：提交学习索引
