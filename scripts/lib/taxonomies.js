'use strict';

const { filterPosts, normalizeLang, sortPosts, toArray } = require('./content');

/** 给分类/标签路径加上语言前缀。 */
function localizedTaxonomyBasePath(item, lang) {
  const base = String((item && item.path) || '').replace(/^\/+|\/+$/g, '');

  if (normalizeLang(lang) !== 'en') {
    return base;
  }

  return base ? `en/${base}` : 'en';
}

/**
 * 取出某种语言下真正有文章的分类/标签。
 * 详情页生成器与站点地图生成器共用这条规则，
 * 保证站点地图里的分类标签地址都真实存在。
 */
function localizedTaxonomies(collection, lang) {
  return toArray(collection)
    .map(item => ({
      item,
      path: `${localizedTaxonomyBasePath(item, lang)}/`,
      posts: sortPosts(filterPosts(item.posts, lang))
    }))
    .filter(entry => entry.posts.length > 0);
}

module.exports = {
  localizedTaxonomies,
  localizedTaxonomyBasePath
};
