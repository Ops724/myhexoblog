'use strict';

const { normalizeLang } = require('../lib/content');

/** 去掉 index.html 与首尾斜杠，便于比较页面路径。 */
function normalizePath(value) {
  return String(value || '')
    .replace(/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '');
}

/**
 * 判断导航项是否对应当前页面，用于页头高亮。
 *
 * 首页与生活频道比较特殊：它们不只包含频道页本身，还包含属于该频道的文章，
 * 所以文章要按 section 加语言来判断，而不是只比路径。
 */
hexo.extend.helper.register('is_nav_active', function isNavActiveHelper(page, targetPath) {
  const current = normalizePath(page && page.path);
  const target = normalizePath(targetPath);
  const lang = normalizeLang(page && page.lang);
  const isPost = Boolean(page && (page.__post || page.layout === 'post'));

  // 首页 / 技术频道
  if (target === '' || target === 'en') {
    if (current === target) {
      return true;
    }

    return isPost && page.section === 'tech' && lang === (target === 'en' ? 'en' : 'zh-CN');
  }

  if (current === target || current.startsWith(`${target}/`)) {
    return true;
  }

  // 生活频道的文章同样高亮生活入口
  if (isPost && page.section === 'life' && (target === 'life' || target === 'en/life')) {
    return lang === (target === 'en/life' ? 'en' : 'zh-CN');
  }

  return false;
});
