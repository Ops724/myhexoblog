# 部署配置模板：复制为 tools/deploy.local.sh 后填写自己的服务器信息。
# tools/deploy.local.sh 已被 .gitignore 排除，不会进入仓库。
#
#   cp tools/deploy.local.example.sh tools/deploy.local.sh
#
# 服务器目录建议结构（脚本会自动创建 releases 子目录）：
#   /var/www/myhexoblog/
#   ├── releases/20260910-153000/
#   └── current -> releases/20260910-153000

# SSH 连接目标，格式为 用户@地址
DEPLOY_HOST="deploy@your-ecs-ip"

# 站点在服务器上的根目录（Nginx 的 root 指向它的 current 软链）
DEPLOY_DIR="/var/www/myhexoblog"

# SSH 端口，默认 22
DEPLOY_SSH_PORT="22"

# 服务器上保留多少个历史版本用于回滚；设为 0 表示不清理
KEEP_RELEASES="5"
