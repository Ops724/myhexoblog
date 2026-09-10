#!/usr/bin/env node
/**
 * 把 examples/ 中的示例内容复制到本地内容目录 source/。
 *
 * 设计要点：
 * - 只复制、不覆盖：目标文件已存在时直接跳过，避免冲掉真实内容。
 * - 私有内容路径由 .gitignore 排除，所以复制结果不会进入公开仓库。
 * - 可以重复执行，命令为 `npm run content:init`。
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const exampleRoot = join(projectRoot, 'examples', 'source');
const contentRoot = join(projectRoot, 'source');

if (!existsSync(exampleRoot)) {
  console.error('未找到 examples/source 目录，无法初始化示例内容。');
  process.exit(1);
}

let created = 0;
let skipped = 0;

function copyDirectory(from, to) {
  for (const entry of readdirSync(from)) {
    const fromPath = join(from, entry);
    const toPath = join(to, entry);

    if (statSync(fromPath).isDirectory()) {
      mkdirSync(toPath, { recursive: true });
      copyDirectory(fromPath, toPath);
      continue;
    }

    if (existsSync(toPath)) {
      skipped += 1;
      continue;
    }

    mkdirSync(dirname(toPath), { recursive: true });
    cpSync(fromPath, toPath);
    created += 1;
    console.log(`已复制 ${relative(projectRoot, toPath)}`);
  }
}

copyDirectory(exampleRoot, contentRoot);

console.log(`\n示例内容初始化完成：新增 ${created} 个文件，跳过 ${skipped} 个已存在文件。`);
if (skipped > 0) {
  console.log('提示：跳过的文件表示本地已有同名文件，脚本不会覆盖它们。');
}
