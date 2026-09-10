'use strict';

const { createPaginatedRoutes } = require('../lib/paginate');
const { localizedTaxonomies } = require('../lib/taxonomies');

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

const LANGS = ['zh-CN', 'en'];

function createRoutes(entry, layout, lang, perPage) {
  return createPaginatedRoutes({
    posts: entry.posts,
    base: entry.path,
    layout,
    perPage,
    data: {
      lang,
      title: entry.item.name,
      taxonomy: entry.item.name
    }
  });
}

function buildRoutes(collection, layout, perPage) {
  return LANGS.flatMap(lang => localizedTaxonomies(collection, lang)
    .flatMap(entry => createRoutes(entry, layout, lang, perPage)));
}

hexo.extend.generator.register('category', function localizedCategories(locals) {
  const perPage = (this.config.category_generator || {}).per_page || this.config.per_page || 10;

  return buildRoutes(locals.categories, ['category', 'list'], perPage);
});

hexo.extend.generator.register('tag', function localizedTags(locals) {
  const perPage = (this.config.tag_generator || {}).per_page || this.config.per_page || 10;

  return buildRoutes(locals.tags, ['tag', 'list'], perPage);
});
