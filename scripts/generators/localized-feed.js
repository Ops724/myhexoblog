'use strict';

const { filterPosts, normalizeLang, sortPosts, toArray } = require('../lib/content');
const { readProfileText } = require('../lib/site-data');
const { buildSummary } = require('../lib/summary');

/**
 * 双语 Atom 订阅源生成器。
 *
 * 产出两个源：
 * - 中文：/atom.xml
 * - 英文：/en/atom.xml
 *
 * 为什么不直接用 hexo-generator-feed：官方插件一次只产出一个源，
 * 会把中英文章混在一起，和站点的双语结构冲突；这里自己生成 XML，
 * 可以直接复用现有的语言过滤与排序，也不用新增依赖。
 *
 * 注意：绝对地址来自 _config.yml 的 url，配置成真实域名后才会输出正确链接。
 */

/** 订阅源里最多保留多少条，避免文章多起来后文件过大 */
const FEED_LIMIT = 20;

const FEEDS = [
  { lang: 'zh-CN', path: 'atom.xml', homePath: '/' },
  { lang: 'en', path: 'en/atom.xml', homePath: '/en/' }
];

function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 把站内路径拼成绝对地址；站点部署在域名根目录下。 */
function absoluteUrl(config, path) {
  const base = String(config.url || '').replace(/\/+$/, '');
  const normalized = String(path || '').replace(/^\/+/, '');

  return normalized ? `${base}/${normalized}` : `${base}/`;
}

function readProfile(locals) {
  const data = (locals && locals.data) || hexo.locals.get('data') || {};

  return data.profile || {};
}

/**
 * 订阅条目里的摘要：正文优先；相册这类没有正文的文章，
 * 用照片说明兜底，避免出现空摘要。
 */
function buildPostSummary(post) {
  const summary = buildSummary(post);

  if (summary) {
    return summary;
  }

  const captions = toArray(post.captions).filter(Boolean);

  return captions.length ? buildSummary({ content: captions.join(' · ') }) : '';
}

function buildEntries(posts, config) {
  return posts.map(post => {
    const url = absoluteUrl(config, post.path);
    const updated = (post.updated || post.date).toISOString();
    const summary = buildPostSummary(post);
    const categories = toArray(post.categories)
      .map(category => `    <category term="${escapeXml(category.name)}"/>`)
      .join('\n');

    return [
      '  <entry>',
      `    <title>${escapeXml(post.title)}</title>`,
      `    <link href="${escapeXml(url)}"/>`,
      `    <id>${escapeXml(url)}</id>`,
      `    <updated>${updated}</updated>`,
      `    <published>${post.date.toISOString()}</published>`,
      categories,
      summary ? `    <summary type="text">${escapeXml(summary)}</summary>` : '',
      '  </entry>'
    ].filter(Boolean).join('\n');
  }).join('\n');
}

function buildFeed({ config, profile, lang, feed }) {
  const posts = sortPosts(filterPosts(hexo.locals.get('posts'), lang)).slice(0, FEED_LIMIT);
  const siteName = readProfileText(profile, 'site_name', lang) || config.title;
  const description = readProfileText(profile, 'tagline', lang) || config.description || '';
  const homeUrl = absoluteUrl(config, feed.homePath);
  const feedUrl = absoluteUrl(config, feed.path);
  const updated = posts.length
    ? (posts[0].updated || posts[0].date).toISOString()
    : new Date().toISOString();

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteName)}</title>
  <subtitle>${escapeXml(description)}</subtitle>
  <link href="${escapeXml(feedUrl)}" rel="self"/>
  <link href="${escapeXml(homeUrl)}"/>
  <updated>${updated}</updated>
  <id>${escapeXml(homeUrl)}</id>
  <author><name>${escapeXml(config.author || siteName)}</name></author>
  <generator uri="https://hexo.io/">Hexo</generator>
${buildEntries(posts, config)}
</feed>
`;
}

hexo.extend.generator.register('feed', function localizedFeeds(locals) {
  const config = this.config;
  const profile = readProfile(locals);

  return FEEDS.map(feed => ({
    path: feed.path,
    data: buildFeed({
      config,
      profile,
      lang: normalizeLang(feed.lang),
      feed
    })
  }));
});
