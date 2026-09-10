'use strict';

const { toArray } = require('../lib/content');

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
