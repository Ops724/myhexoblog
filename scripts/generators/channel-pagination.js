'use strict';

const { filterPosts, normalizeSection, sortPosts } = require('../lib/content');
const { CHANNELS } = require('../lib/channels');
const { createPaginatedRoutes } = require('../lib/paginate');

/**
 * 频道分页生成器。
 *
 * 注册名 index 会覆盖官方 hexo-generator-index（站点脚本最后加载，同名覆盖），
 * 生成「语言 × 频道」四条列表路由：
 * - 技术：/ 与 /en/
 * - 生活：/life/ 与 /en/life/
 * - 相册：/photos/ 与 /en/photos/
 *
 * 分页规则与实现见 scripts/lib/paginate.js，与分类、标签详情页共用。
 */

hexo.extend.generator.register('index', function channelPagination(locals) {
  const perPage = this.config.index_generator.per_page || this.config.per_page || 10;

  return CHANNELS.flatMap(channel => {
    const section = normalizeSection(channel.section);
    const posts = sortPosts(filterPosts(locals.posts, channel.lang, section));

    return createPaginatedRoutes({
      posts,
      base: channel.base,
      layout: channel.layout,
      perPage,
      data: {
        lang: channel.lang,
        section,
        title_key: channel.titleKey,
        intro_key: channel.introKey
      }
    });
  });
});
