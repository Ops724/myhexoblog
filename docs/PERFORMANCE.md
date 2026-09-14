# 性能说明与优化记录

这份文档记录站点的性能基线、已经做过的优化，以及由使用者手工完成的待办。测量时间：2026-09-14。

## 一、体积基线（图片压缩前）

构建产物 `public/` 合计约 17 MB、134 个文件：

| 类型 | 体积 | 说明 |
| --- | --- | --- |
| PNG（26 个） | 12.8 MB | 文章截图与头像，主要来源 |
| WebP（52 个） | 4.2 MB | 相册照片，已经是较优格式 |
| HTML（41 个页面） | 341 KB | 全站合计 |
| CSS（6 个） | 20 KB | 全站合计 |
| JS（2 个） | 7.5 KB | 相册灯箱与站内搜索，按页加载 |
| 搜索索引 JSON | 34 KB | 只在搜索页加载 |
| favicon.ico | 72 KB | 偏大，可优化 |

单页重量（HTML + CSS + 该页图片）：

| 页面 | 图片 | 合计 |
| --- | --- | --- |
| 首页 | 0 | ≈ 31 KB |
| VMware NAT 那篇 | 5.36 MB | ≈ 5.4 MB |
| Linux VLAN 那篇 | 4.86 MB | ≈ 4.9 MB |
| 代理那篇 | 1.64 MB | ≈ 1.7 MB |

结论：**代码总量不到 400 KB，性能问题几乎全部来自图片。**

## 二、图片压缩结果（2026-09-14 完成）

文章截图已由使用者手动压缩：25 张 PNG 转成 WebP，**图片像素尺寸一张未改**，文章里的引用同步更新。

| 项目 | 压缩前 | 压缩后 |
| --- | --- | --- |
| 构建产物总量 | 17 MB | 6.6 MB（-61%） |
| VMware NAT 那篇 | 5.4 MB | 553 KB（-90%） |
| Linux VLAN 那篇 | 4.9 MB | 498 KB |
| 代理那篇 | 1.7 MB | 228 KB |
| Go 并发那篇 | 367 KB | 40 KB |

验证方式：压缩前已备份原图；用 `file` 逐个确认新图格式为 WebP 且像素尺寸与原图一致；重新构建后检查全部图片与 CSS 引用的目标文件是否存在（78 个被引用资源，0 缺失）；确认正文懒加载仍对新图生效。

仍然偏大的三处：

| 文件 / 目录 | 体积 | 说明 |
| --- | --- | --- |
| ~~`source/images/avatar.png`~~ | ~~524.7 KB~~ → **9.9 KB** | 已缩到 96×96（M2-10） |
| `source/images/share.jpg` | 97.3 KB | 新增的分享卡片图（1200×630），只在社交平台抓取时使用，不进入页面加载 |
| `source/images/favicon.ico` | 72.5 KB | 建议用 32×32 或 48×48 重新导出 |
| `source/images/albums/` | 约 4.3 MB | 相册照片，已经是 WebP（单张最大 179 KB），按需再压 |

## 三、已经做过的优化

- 正文图片懒加载：第一张立即加载，其余 `loading="lazy"` 与 `decoding="async"`（`scripts/filters/lazy-images.js`）
- 相册照片懒加载：列表封面与相册照片在模板里就带了 `loading="lazy"`
- 相册照片使用 WebP 格式
- 全站不引入网络字体，使用系统字体栈
- 相册灯箱与站内搜索脚本按页加载，普通页面不加载
- 搜索索引只在搜索页加载
- Nginx 侧：gzip、静态资源 7 天缓存

## 四、手工待办：图片压缩（由使用者完成）

现状：**文章截图已完成**（见第二节）。**头像已在 M2-10 处理**（缩到 96×96，并拆出专门分享图）。**只剩站点图标（favicon.ico）待处理**。

优先处理三处：

1. ~~文章截图~~：已完成（PNG → WebP）
2. ~~头像~~：已完成（缩到 96×96，分享图另存为 `source/images/share.png`）
3. **站点图标 `favicon.ico`**：见下一节

### 站点图标重做步骤（保持 .ico 格式）

现状：`source/images/favicon.ico` 有 72.5 KB，里面塞了 7 个尺寸，其中 256×256 那一张就占 45 KB。**实际只需要 16/32/48 三个尺寸**，做完约 6 KB。

本机没有 ImageMagick、Pillow 等工具，`sips` 又不能写 `.ico`，所以有三个做法，任选一个：

**做法一：在线生成器（最省事）**

1. 打开 favicon.io 或 realfavicongenerator.net
2. 上传 `source/images/avatar.png`（或先用下面的命令导出 256×256 的图标源图）
3. 下载生成好的 `.ico`，覆盖 `source/images/favicon.ico`

注意：这会把图标上传到第三方网站，介意的话用做法二或三。

**做法二：本地安装 ImageMagick**

```bash
brew install imagemagick
magick 'source/images/favicon.ico[6]' -resize 256x256 /tmp/favicon-256.png   # 取出最大的那一帧
magick /tmp/favicon-256.png -define icon:auto-resize=48,32,16 source/images/favicon.ico
```

**做法三：只用系统自带命令**

macOS 的 `sips` 读不出多尺寸 `ico`，但可以导出其中的 256×256 帧：

```bash
sips -s format png source/images/favicon.ico --out /tmp/favicon-256.png
```

再用任意能写 `.ico` 的工具（在线生成器、你自己顺手的软件）把这张 PNG 转成只含 16/32/48 的 `.ico`。

**做完后验证**

```bash
python3 - <<'PY'
import struct
data = open('source/images/favicon.ico','rb').read()
count = struct.unpack('<HHH', data[:6])[2]
print(f'图标个数 {count}，体积 {len(data)/1024:.1f} KB')
for i in range(count):
    w, h, _, _, _, bpp, size, _ = struct.unpack('<BBBBHHII', data[6+i*16:22+i*16])
    print(f'  {(w or 256)}x{(h or 256)}  {size/1024:.1f} KB')
PY
```

期望结果：3 个尺寸（16/32/48）、总体积 10 KB 以内。

压缩完成后验证（原图备份在 `~/Pictures/myhexoblog-originals/`）：

```bash
npm run clean && npm run build
du -sh public
find public -type f -exec stat -f '%z %N' {} + | sort -rn | head -10
```

确认体积下降之后，本地预览看一眼图片清晰度是否可接受。

## 五、以后可选

- **图片 CDN**（阿里云）：对图片分发收益最大，但有成本与配置复杂度
- **为图片写入 width/height**：减少加载时的页面跳动（CLS），需要在构建时读取图片尺寸
- **Brotli 压缩**：需要额外的 Nginx 模块，收益一般
- **CSS/JS 压缩合并**：总量只有 27 KB，收益极小，不建议
