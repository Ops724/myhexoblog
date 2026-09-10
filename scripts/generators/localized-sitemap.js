'use strict';

const { CHANNELS } = require('../lib/channels');
const { filterPosts, normalizeLang, sortPosts, toArray } = require('../lib/content');
const { absoluteUrl, normalizeRoutePath, toUrlPath, toggleLanguagePath } = require('../lib/paths');
const { localizedTaxonomies } = require('../lib/taxonomies');
const { escapeXml } = require('../lib/xml');

/**
 * 站点地图与 robots.txt 生成器。
 *
 * - sitemap.xml 列出所有希望被搜索引擎收录的页面，并给中英对照页面互相标注 hreflang，
 *   避免同一篇内容被当成两份重复内容。
 * - robots.txt 只有几行，但里面的 sitemap 地址依赖 _config.yml 的 url，
 *   所以这里一并生成，避免把域名写死在静态文件里、改域名时要改两处。
 *
 * 只收录真实存在的页面：频道列表、文章与相册、有文章的分类与标签、归档与独立页面；
 * 分页（page/N）不进站点地图，它是列表页的翻页，不是独立内容。
 */

const LANGS = ['zh-CN', 'en'];

function isEnglish(pathname) {
  const path = normalizeRoutePath(pathname);

  return path === 'en' || path.startsWith('en/');
}

function newestPost(posts) {
  return posts.length ? (posts[0].updated || posts[0].date) : null;
}

function collectEntries(locals) {
  const entries = new Map();
  const pairs = new Map();

  function add(pathname, lastmod) {
    const urlPath = toUrlPath(pathname);

    if (!entries.has(urlPath)) {
      entries.set(urlPath, { urlPath, lastmod: lastmod || null });
    }
  }

  // 频道列表：技术、生活、相册
  CHANNELS.forEach(channel => {
    const posts = sortPosts(filterPosts(locals.posts, channel.lang, channel.section));
    add(channel.base, newestPost(posts));
  });

  // 文章与相册
  const posts = toArray(locals.posts);
  posts.forEach(post => add(post.path, post.updated || post.date));

  // 用 translation_key 建立中英对照关系；两个版本路径不同也能正确配对
  const byTranslationKey = new Map();

  posts.forEach(post => {
    if (!post.translation_key) return;

    const list = byTranslationKey.get(post.translation_key) || [];
    list.push(post);
    byTranslationKey.set(post.translation_key, list);
  });

  byTranslationKey.forEach(list => {
    const zhPost = list.find(post => normalizeLang(post.lang) === 'zh-CN');
    const enPost = list.find(post => normalizeLang(post.lang) === 'en');

    if (!zhPost || !enPost) return;

    const zhPath = toUrlPath(zhPost.path);
    const enPath = toUrlPath(enPost.path);

    pairs.set(zhPath, enPath);
    pairs.set(enPath, zhPath);
  });

  // 分类与标签详情：只收录该语言下确实有文章的
  LANGS.forEach(lang => {
    localizedTaxonomies(locals.categories, lang).forEach(entry => add(entry.path, newestPost(entry.posts)));
    localizedTaxonomies(locals.tags, lang).forEach(entry => add(entry.path, newestPost(entry.posts)));
  });

  // 归档页
  LANGS.forEach(lang => {
    const posts = sortPosts(filterPosts(locals.posts, lang));
    add(lang === 'en' ? 'en/archives/' : 'archives/', newestPost(posts));
  });

  // 独立页面：关于、分类与标签总览等
  toArray(locals.pages).forEach(page => add(page.path, page.updated || page.date));

  return { entries, pairs };
}

function buildUrlEntry(config, entries, pairs, entry) {
  const url = absoluteUrl(config, entry.urlPath);
  const selfLang = isEnglish(entry.urlPath) ? 'en' : 'zh-CN';
  const counterpartPath = pairs.get(entry.urlPath) || toUrlPath(toggleLanguagePath(entry.urlPath));
  const counterpart = entries.get(counterpartPath);
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod.toISOString()}</lastmod>` : '';
  let alternates = '';

  if (counterpart) {
    const zhUrl = selfLang === 'zh-CN' ? url : absoluteUrl(config, counterpart.urlPath);
    const enUrl = selfLang === 'en' ? url : absoluteUrl(config, counterpart.urlPath);

    alternates = [
      `\n    <xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(zhUrl)}"/>`,
      `\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}"/>`,
      `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(zhUrl)}"/>`
    ].join('');
  }

  return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmod}${alternates}\n  </url>`;
}

function buildSitemap(config, entries, pairs) {
  const urls = [...entries.values()]
    .sort((left, right) => left.urlPath.localeCompare(right.urlPath))
    .map(entry => buildUrlEntry(config, entries, pairs, entry))
    .join('\n');

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    '</urlset>',
    ''
  ].join('\n');
}

function buildRobots(config) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl(config, 'sitemap.xml')}\n`;
}

hexo.extend.generator.register('sitemap', function localizedSitemap(locals) {
  const config = this.config;
  const { entries, pairs } = collectEntries(locals);

  return [
    { path: 'sitemap.xml', data: buildSitemap(config, entries, pairs) },
    { path: 'robots.txt', data: buildRobots(config) }
  ];
});
