#!/usr/bin/env bash
#
# 本地构建 + rsync 发布到 ECS，并支持回滚。
#
# 用法：
#   bash tools/deploy.sh deploy              构建并发布新版本，成功后切换 current 软链
#   bash tools/deploy.sh list                查看服务器上的版本与当前指向
#   bash tools/deploy.sh rollback [版本名]    回滚到上一个版本，或指定版本
#
# 也可以走 npm 脚本：npm run deploy / npm run deploy:list / npm run deploy:rollback
#
# 服务器信息放在 tools/deploy.local.sh（不进入 Git，模板见 tools/deploy.local.example.sh）。
# 发布前会检查是否还有标记为示例的内容，必要时可用 DEPLOY_ALLOW_SAMPLES=1 跳过。

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_CONFIG="$PROJECT_ROOT/tools/deploy.local.sh"
HEXO_BIN="$PROJECT_ROOT/node_modules/.bin/hexo"
PAGEFIND_BIN="$PROJECT_ROOT/node_modules/.bin/pagefind"

info() { printf '\033[36m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

load_config() {
  [[ -f "$LOCAL_CONFIG" ]] || fail "缺少 ${LOCAL_CONFIG}，请先复制 tools/deploy.local.example.sh 并填写服务器信息。"

  # shellcheck source=/dev/null
  source "$LOCAL_CONFIG"

  : "${DEPLOY_HOST:?请在 tools/deploy.local.sh 中设置 DEPLOY_HOST}"
  : "${DEPLOY_DIR:?请在 tools/deploy.local.sh 中设置 DEPLOY_DIR}"

  DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
  KEEP_RELEASES="${KEEP_RELEASES:-5}"
  REMOTE_DIR="${DEPLOY_DIR%/}"
  SSH_ARGS=(-p "$DEPLOY_SSH_PORT" -o ConnectTimeout=10)
  RSYNC_SSH="ssh -p $DEPLOY_SSH_PORT -o ConnectTimeout=10"
}

run_remote() {
  ssh "${SSH_ARGS[@]}" "$DEPLOY_HOST" "$1"
}

# 示例内容检查：示例文章都带 sample: true，避免误把演示内容发布上线
check_samples() {
  if [[ "${DEPLOY_ALLOW_SAMPLES:-0}" == "1" ]]; then
    info "已按要求跳过示例内容检查（DEPLOY_ALLOW_SAMPLES=1）"
    return
  fi

  local found
  found="$(grep -rlE '^sample:[[:space:]]*true[[:space:]]*$' "$PROJECT_ROOT/source" --include='*.md' || true)"

  if [[ -n "$found" ]]; then
    printf '%s\n' "$found" | sed "s|$PROJECT_ROOT/||" >&2
    fail "以上文件仍标记为示例内容。请替换或删除它们，或设置 DEPLOY_ALLOW_SAMPLES=1 强制发布。"
  fi

  info "示例内容检查通过"
}

build_site() {
  [[ -x "$HEXO_BIN" ]] || fail "找不到 $HEXO_BIN，请先执行 npm install。"

  info "清理并构建静态站点"
  (cd "$PROJECT_ROOT" && "$HEXO_BIN" clean && "$HEXO_BIN" generate)

  # 搜索索引必须在站点生成之后建立，否则线上搜索页没有数据
  if [[ -x "$PAGEFIND_BIN" ]]; then
    info "建立站内搜索索引"
    (cd "$PROJECT_ROOT" && "$PAGEFIND_BIN" --site public -q)
  else
    fail "找不到 $PAGEFIND_BIN，请先执行 npm install。"
  fi
}

deploy_site() {
  local release
  release="$(date +%Y%m%d-%H%M%S)"

  info "发布版本 $release 到 $DEPLOY_HOST:$REMOTE_DIR/releases/$release"
  run_remote "mkdir -p '$REMOTE_DIR/releases/$release'"

  rsync -az --delete \
    --exclude '.DS_Store' \
    -e "$RSYNC_SSH" \
    "$PROJECT_ROOT/public/" "$DEPLOY_HOST:$REMOTE_DIR/releases/$release/"

  # 先传完再切换软链，访问者不会看到半成品站点
  run_remote "ln -sfn 'releases/$release' '$REMOTE_DIR/current'"
  info "已切换到 $release"

  if [[ "$KEEP_RELEASES" != "0" ]]; then
    info "清理旧版本，保留最近 $KEEP_RELEASES 个"
    run_remote "cd '$REMOTE_DIR/releases' && ls -1dt */ | tail -n +$((KEEP_RELEASES + 1)) | while read -r dir; do rm -rf -- \"\$dir\"; done"
  fi
}

list_releases() {
  info "服务器上的版本（新到旧）"
  run_remote "ls -1dt '$REMOTE_DIR/releases'/*/ 2>/dev/null || true"
  info "current 指向"
  run_remote "readlink '$REMOTE_DIR/current' 2>/dev/null || echo '(还没有 current 软链)'"
}

rollback_site() {
  local target="${1:-}"

  if [[ -z "$target" ]]; then
    target="$(run_remote "cd '$REMOTE_DIR/releases' && ls -1dt */ | sed -n 2p")"
    target="${target%/}"
    [[ -n "$target" ]] || fail "服务器上只有一个版本，无法回滚。"
  fi

  run_remote "test -d '$REMOTE_DIR/releases/$target'" || fail "服务器上没有版本 $target。"
  run_remote "ln -sfn 'releases/$target' '$REMOTE_DIR/current'"
  info "已回滚到 $target"
}

command="${1:-deploy}"

case "$command" in
  deploy)
    load_config
    check_samples
    build_site
    deploy_site
    ;;
  list)
    load_config
    list_releases
    ;;
  rollback)
    load_config
    rollback_site "${2:-}"
    ;;
  *)
    fail "未知命令：${command}（可用：deploy / list / rollback）"
    ;;
esac
