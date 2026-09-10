'use strict';

const { filterPosts, normalizeLang, sortPosts, toArray } = require('../lib/content');
const { normalizeRoutePath, toUrlPath } = require('../lib/paths');
const { toPlainText } = require('../lib/summary');

/**
 * 站内搜索索引生成器。
 *
 * 产出两个 JSON：
 * - 中文：/search-index.json
 * - 英文：/en/search-index.json
 *
 * 为什么自己生成而不依赖第三方搜索库：中文没有天然的词边界，
 * 依赖分词器的方案一旦分词不准就搜不到（实测 Pagefind 的中文索引就是这种状况）；
 * 这里直接输出正文纯文本，前端做子串匹配，中文一定搜得到，而且可以本地验证。
 */

const INDEXES = [
  { lang: 'zh-CN', path: 'search-index.json' },
  { lang: 'en', path: 'en/search-index.json' }
];

/** 单条正文最多保留多少字符，避免文章特别长时索引文件过大 */
const MAX_TEXT_LENGTH = 6000;

function buildText(post) {
  const body = toPlainText(post);
  const captions = toArray(post.captions).join(' ');

  return [body, captions].filter(Boolean).join(' ').slice(0, MAX_TEXT_LENGTH);
}

function buildEntry(item) {
  return {
    title: item.title || '',
    url: `/${toUrlPath(item.path)}`,
    section: item.section || 'page',
    date: (item.updated || item.date || new Date()).toISOString(),
    text: buildText(item)
  };
}

/** 搜索页、分类总览这类工具页不进索引。 */
function isUtilityPage(page) {
  return /(^|\/)search$/.test(normalizeRoutePath(page.path));
}

function collectEntries(locals, lang) {
  const target = normalizeLang(lang);
  const posts = sortPosts(filterPosts(locals.posts, target)).map(buildEntry);

  // 独立页面里只收录「有正文」的，例如关于页；分类总览、标签总览没有正文，自然被排除
  const pages = toArray(locals.pages)
    .filter(page => normalizeLang(page.lang) === target)
    .filter(page => !isUtilityPage(page))
    .filter(page => buildText(page).length > 0)
    .map(buildEntry);

  return [...posts, ...pages];
}

hexo.extend.generator.register('search-index', function localizedSearchIndex(locals) {
  return INDEXES.map(index => {
    const entries = collectEntries(locals, index.lang);

    return {
      path: index.path,
      data: JSON.stringify({
        lang: index.lang,
        generated: new Date().toISOString(),
        entries
      })
    };
  });
});
