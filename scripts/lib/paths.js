'use strict';

/**
 * 站内路径工具：站点地图、订阅源与 SEO 相关的 helper 共用。
 *
 * 约定：站内路径统一用「不带首尾斜杠、不带 index.html」的形式（如 posts/x、en/posts/x），
 * 需要拼成 URL 时再补上斜杠。
 */

/** 去掉 index.html 与首尾斜杠。 */
function normalizeRoutePath(value) {
  return String(value || '')
    .replace(/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '');
}

/** 转成 URL 形式：带首尾斜杠；首页是空字符串。 */
function toUrlPath(value) {
  const path = normalizeRoutePath(value);

  return path ? `${path}/` : '';
}

/** 在中英两种路径之间互转：'' 与 'en'、posts/x 与 en/posts/x。 */
function toggleLanguagePath(value) {
  const path = normalizeRoutePath(value);

  if (!path) return 'en';
  if (path === 'en') return '';

  return path.startsWith('en/') ? path.slice(3) : `en/${path}`;
}

/**
 * 拼出绝对地址；站点部署在域名根目录下，所以直接用 _config.yml 的 url 加路径。
 * 带扩展名的按文件处理，不补目录斜杠。
 */
function absoluteUrl(config, value = '') {
  const base = String((config && config.url) || '').replace(/\/+$/, '');
  const path = normalizeRoutePath(value);

  if (!path) return `${base}/`;
  if (/\.[a-z0-9]+$/i.test(path)) return `${base}/${path}`;

  return `${base}/${path}/`;
}

module.exports = {
  absoluteUrl,
  normalizeRoutePath,
  toUrlPath,
  toggleLanguagePath
};
