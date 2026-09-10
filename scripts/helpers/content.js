'use strict';

const { filterPosts, findTranslation, normalizeLang, sortPosts, toArray } = require('../lib/content');

/**
 * 模板里统一把文章集合转成数组。
 * 生成器可能传 Hexo 的 Query 对象，也可能传普通数组，模板不必关心区别。
 */
hexo.extend.helper.register('as_list', function asListHelper(collection) {
  return toArray(collection);
});

/**
 * 列表页的摘要：优先用 more 标记之前的 excerpt，否则退到正文，
 * 去掉 HTML 标签后截断，避免列表里出现大段代码或未闭合标签。
 */
hexo.extend.helper.register('post_summary', function postSummaryHelper(post) {
  const source = post.excerpt || post.content || '';
  const plain = String(source)
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) {
    return '';
  }

  return plain.length <= 140 ? plain : `${plain.slice(0, 140).trim()}...`;
});

/** 去掉首尾斜杠与 index.html，用来比较「路由路径」和「permalink」两种写法。 */
function normalizePath(value) {
  return String(value || '')
    .replace(/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '');
}

/**
 * 同一语言、同一频道内的上一篇与下一篇。
 * 文章页拿到的 page.path 是路由路径（可能带 index.html），
 * 而文章集合里的 path 是 permalink，两者先归一化再比较。
 */
hexo.extend.helper.register('post_neighbors', function postNeighborsHelper(page) {
  if (!page || !page.path) {
    return { prev: null, next: null };
  }

  const posts = sortPosts(filterPosts(hexo.locals.get('posts'), page.lang, page.section));
  const currentPath = normalizePath(page.path);
  const index = posts.findIndex(post => normalizePath(post.path) === currentPath);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null
  };
});

/** 当前文章的另一语言版本，用于文章页的译文入口。 */
hexo.extend.helper.register('other_translation', function otherTranslationHelper(page) {
  if (!page) {
    return null;
  }

  const target = normalizeLang(page.lang) === 'en' ? 'zh-CN' : 'en';

  return findTranslation(hexo.locals.get('posts'), page.translation_key, target);
});
