'use strict';

const { filterPosts, normalizeLang, sortPosts, toArray } = require('../lib/content');
const { createPaginatedRoutes } = require('../lib/paginate');

/**
 * 分类与标签的详情页生成器。
 *
 * 注册名 category / tag 会覆盖官方 hexo-generator-category 与 hexo-generator-tag，
 * 让详情页按语言拆开：
 * - 中文：/categories/<名称>/、/tags/<名称>/
 * - 英文：/en/categories/<名称>/、/en/tags/<名称>/
 *
 * 只收录对应语言的文章；某个分类在某种语言下没有文章时，不会生成该语言的页面。
 */

/** 给分类/标签的路径加上语言前缀。 */
function localizedBasePath(item, lang) {
  const base = String(item.path || '').replace(/^\/+|\/+$/g, '');

  if (normalizeLang(lang) !== 'en') {
    return base;
  }

  return base ? `en/${base}` : 'en';
}

function createRoutes(item, layout, lang, perPage) {
  const posts = sortPosts(filterPosts(item.posts, lang));

  if (!posts.length) {
    return [];
  }

  return createPaginatedRoutes({
    posts,
    base: `${localizedBasePath(item, lang)}/`,
    layout,
    perPage,
    data: {
      lang,
      title: item.name,
      taxonomy: item.name
    }
  });
}

hexo.extend.generator.register('category', function localizedCategories(locals) {
  const perPage = (this.config.category_generator || {}).per_page || this.config.per_page || 10;

  return toArray(locals.categories).flatMap(category => [
    ...createRoutes(category, ['category', 'list'], 'zh-CN', perPage),
    ...createRoutes(category, ['category', 'list'], 'en', perPage)
  ]);
});

hexo.extend.generator.register('tag', function localizedTags(locals) {
  const perPage = (this.config.tag_generator || {}).per_page || this.config.per_page || 10;

  return toArray(locals.tags).flatMap(tag => [
    ...createRoutes(tag, ['tag', 'list'], 'zh-CN', perPage),
    ...createRoutes(tag, ['tag', 'list'], 'en', perPage)
  ]);
});
