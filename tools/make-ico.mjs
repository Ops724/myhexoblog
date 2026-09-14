/**
 * 把若干 PNG 打包成一个多尺寸 .ico。
 *
 * 用法：
 *   node tools/make-ico.mjs <输出.ico> <尺寸:png路径> ...
 *   例如：node tools/make-ico.mjs source/images/favicon.ico 16:/tmp/icon-16.png 32:/tmp/icon-32.png
 *
 * 为什么自己写：ICO 的容器格式很简单（6 字节文件头 + 每个尺寸 16 字节目录项 + 负载），
 * 系统自带的 sips 能取帧和缩放但不能写 .ico；为一个图标安装 ImageMagick 不划算。
 * 负载直接使用 PNG（Vista 之后的通用做法），浏览器都支持。
 */

import { readFileSync, writeFileSync } from 'node:fs';

const [output, ...entries] = process.argv.slice(2);

if (!output || !entries.length) {
  console.error('用法: node tools/make-ico.mjs <输出.ico> <尺寸:png路径> ...');
  process.exit(1);
}

const images = entries.map(entry => {
  const [size, path] = entry.split(':');
  return { size: Number(size), data: readFileSync(path) };
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const directory = [];
const payloads = [];

for (const image of images) {
  const entry = Buffer.alloc(16);
  const dimension = image.size >= 256 ? 0 : image.size; // 256 用 0 表示

  entry.writeUInt8(dimension, 0); // 宽
  entry.writeUInt8(dimension, 1); // 高
  entry.writeUInt8(0, 2); // 调色板颜色数
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // 颜色平面
  entry.writeUInt16LE(32, 6); // 位深
  entry.writeUInt32LE(image.data.length, 8); // 负载大小
  entry.writeUInt32LE(offset, 12); // 负载偏移

  offset += image.data.length;
  directory.push(entry);
  payloads.push(image.data);
}

writeFileSync(output, Buffer.concat([header, ...directory, ...payloads]));
console.log(`已生成 ${output}：${images.length} 个尺寸，${(offset / 1024).toFixed(1)} KB`);
