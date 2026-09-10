'use strict';

/**
 * 列表分页的公共实现，频道列表与分类/标签详情页共用。
 *
 * 约定：第 1 页就是列表根地址，第 N 页是 <根地址>page/N/。
 * 没有引入 hexo-pagination 依赖，直接切片生成路由，逻辑更直观。
 */

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

module.exports = {
  createPaginatedRoutes,
  pageUrl
};
