'use strict';

const { filterPosts, normalizeLang, toArray } = require('../lib/content');

/**
 * 分类/标签详情页地址：
 * 中文 /categories/<名称>/，英文 /en/categories/<名称>/。
 */
function taxonomyUrl(item, lang) {
  const base = String(item && item.path ? item.path : '').replace(/^\/+|\/+$/g, '');
  const localized = normalizeLang(lang) === 'en' ? (base ? `en/${base}` : 'en') : base;

  return localized ? `/${localized}/` : '/';
}

hexo.extend.helper.register('taxonomy_url', taxonomyUrl);

/**
 * 总览页用的分类/标签列表：
 * 只统计当前语言的文章，只保留真正用过的项，并按名称排序。
 */
hexo.extend.helper.register('taxonomy_items', function taxonomyItemsHelper(kind, lang) {
  const collection = kind === 'tags' ? hexo.locals.get('tags') : hexo.locals.get('categories');
  const target = normalizeLang(lang);

  return toArray(collection)
    .map(item => ({
      name: item.name,
      count: filterPosts(item.posts, target).length,
      url: taxonomyUrl(item, target)
    }))
    .filter(item => item.count > 0)
    .sort((left, right) => left.name.localeCompare(right.name));
});
