# 部署说明（阿里云 ECS）

本项目采用「本地构建 + rsync 上传」的方式发布：站点在本地生成静态文件，再整体同步到服务器。服务器上不需要安装 Node.js，也不需要跑任何运行时。

## 服务器目录结构

```
/var/www/myhexoblog/
├── releases/
│   ├── 20260910-153000/
│   └── 20260910-161500/
└── current -> releases/20260910-161500
```

Nginx 的 `root` 指向 `current` 软链。发布时先把文件全部上传到新的 `releases` 目录，上传完成后再切换软链，所以访问者不会看到上传到一半的站点；回滚也只是把软链指回上一个版本。

## 一、准备本地配置

```bash
cp tools/deploy.local.example.sh tools/deploy.local.sh
```

然后填写 `tools/deploy.local.sh`：

```bash
DEPLOY_HOST="deploy@your-ecs-ip"     # SSH 用户与地址
DEPLOY_DIR="/var/www/myhexoblog"     # 服务器上的站点根目录
DEPLOY_SSH_PORT="22"
KEEP_RELEASES="5"                    # 保留多少个历史版本用于回滚
```

这个文件已被 `.gitignore` 排除，不会进入公开仓库。

## 二、服务器准备

1. 建好目录并交给部署用户：

```bash
sudo mkdir -p /var/www/myhexoblog/releases
sudo chown -R deploy:deploy /var/www/myhexoblog
```

2. 配好 SSH 免密登录（在本地执行一次）：

```bash
ssh-copy-id deploy@your-ecs-ip
```

3. 放置 Nginx 配置：参考 `tools/nginx/myhexoblog.conf`，放到 `/etc/nginx/conf.d/`，把 `server_name` 换成你的域名，然后：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

4. 申请 HTTPS 证书（可选但推荐）：

```bash
sudo certbot --nginx -d your-domain.example.com
```

## 三、日常发布

```bash
npm run deploy
```

这条命令会依次做四件事：

1. 检查是否还有标记为示例的内容（见下）；
2. 清理并重新构建站点；
3. 在构建产物上建立站内搜索索引（Pagefind）；
4. 把 `public/` 同步到服务器的新版本目录；
5. 切换 `current` 软链，并按 `KEEP_RELEASES` 清理旧版本。

### 示例内容保护

仓库里的示例文章都带 `sample: true`。如果这些内容还在 `source/` 里，发布会被中止并列出文件——这是为了避免把演示内容当成真实内容发布。

替换成自己的文章后检查会自动通过。确实需要发布演示内容时，可以临时跳过：

```bash
DEPLOY_ALLOW_SAMPLES=1 npm run deploy
```

## 四、查看版本与回滚

```bash
npm run deploy:list                              # 查看服务器上的版本与当前指向
npm run deploy:rollback                          # 回滚到上一个版本
bash tools/deploy.sh rollback 20260910-153000    # 回滚到指定版本
```

## 五、常见问题

- **连不上服务器**：先确认 `ssh deploy@your-ecs-ip` 能直接登录，再检查 `DEPLOY_SSH_PORT`。
- **页面 404**：确认 Nginx 的 `root` 指向 `.../myhexoblog/current`，并且该软链存在。
- **更新后仍是旧内容**：HTML 没有设置缓存，通常是浏览器缓存，强刷一次即可。
- **想换域名**：改 Nginx 的 `server_name` 并重新申请证书。
