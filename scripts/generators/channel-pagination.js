'use strict';

const { filterPosts, normalizeSection, sortPosts } = require('../lib/content');

/**
 * 频道分页生成器。
 *
 * 注册名 index 会覆盖官方 hexo-generator-index（站点脚本最后加载，同名覆盖），
 * 生成「语言 × 频道」四条列表路由：
 * - 技术：/ 与 /en/
 * - 生活：/life/ 与 /en/life/
 *
 * 分页规则：第 1 页是频道地址本身，第 N 页是 <频道>/page/N/。
 * 这里没有引入 hexo-pagination 依赖，自己切片生成路由，逻辑更直观。
 */

const CHANNELS = [
  { lang: 'zh-CN', section: 'tech', base: '', layout: ['index', 'list'], titleKey: 'ui.channel_tech' },
  { lang: 'en', section: 'tech', base: 'en/', layout: ['index', 'list'], titleKey: 'ui.channel_tech' },
  {
    lang: 'zh-CN',
    section: 'life',
    base: 'life/',
    layout: ['section', 'list'],
    titleKey: 'ui.channel_life',
    introKey: 'ui.channel_life_intro'
  },
  {
    lang: 'en',
    section: 'life',
    base: 'en/life/',
    layout: ['section', 'list'],
    titleKey: 'ui.channel_life',
    introKey: 'ui.channel_life_intro'
  }
];

/** 第 1 页是频道根地址，其余是 page/N/。 */
function pageUrl(base, pageNumber) {
  return pageNumber === 1 ? `/${base}` : `/${base}page/${pageNumber}/`;
}

function createPaginatedRoutes({ posts, base, layout, perPage, data }) {
  const total = Math.max(1, Math.ceil(posts.length / perPage));
  const routes = [];

  for (let current = 1; current <= total; current += 1) {
    const start = (current - 1) * perPage;

    routes.push({
      path: current === 1 ? base : `${base}page/${current}/`,
      layout,
      data: {
        ...data,
        posts: posts.slice(start, start + perPage),
        base,
        current,
        total,
        prev: current > 1 ? current - 1 : 0,
        next: current < total ? current + 1 : 0,
        prev_link: current > 1 ? pageUrl(base, current - 1) : '',
        next_link: current < total ? pageUrl(base, current + 1) : ''
      }
    });
  }

  return routes;
}

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
