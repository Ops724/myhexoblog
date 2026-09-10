'use strict';

const { normalizeLang } = require('../lib/content');

/** 去掉 index.html 与首尾斜杠，便于比较页面路径。 */
function normalizePath(value) {
  return String(value || '')
    .replace(/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '');
}

/** 频道类导航项：目标路径 → 对应的 section。 */
const CHANNEL_TARGETS = {
  '': 'tech',
  en: 'tech',
  life: 'life',
  'en/life': 'life',
  photos: 'photos',
  'en/photos': 'photos'
};

/**
 * 判断导航项是否对应当前页面，用于页头高亮。
 *
 * 频道类导航项比较特殊：它们不只包含频道页本身，还包含属于该频道的文章，
 * 所以文章要按 section 加语言来判断，而不是只比路径。
 */
hexo.extend.helper.register('is_nav_active', function isNavActiveHelper(page, targetPath) {
  const current = normalizePath(page && page.path);
  const target = normalizePath(targetPath);
  const lang = normalizeLang(page && page.lang);
  const isPost = Boolean(page && (page.__post || page.layout === 'post'));

  if (current === target) {
    return true;
  }

  // 频道页与归属于它的文章
  const channel = CHANNEL_TARGETS[target];
  if (channel && isPost && page.section === channel) {
    return lang === (target.startsWith('en') ? 'en' : 'zh-CN');
  }

  // 子页面（分类详情、标签详情等）
  if (target !== '' && current.startsWith(`${target}/`)) {
    return true;
  }

  return false;
});
