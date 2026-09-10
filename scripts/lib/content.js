'use strict';

/**
 * 内容模型的共享逻辑：语言归一化与文章筛选。
 * 过滤器、helper、生成器都从这里引用，避免同一条规则被写好几遍。
 */

const DEFAULT_LANG = 'zh-CN';
const SUPPORTED_LANGS = ['zh-CN', 'en'];

/**
 * 把各种写法的语言值归一化成 zh-CN 或 en：
 * - zh / cn / zh-cn / zh-Hans ... → zh-CN
 * - en / en-US / EN ... → en
 * 无法识别或缺失时回退到默认语言。
 */
function normalizeLang(value) {
  if (typeof value !== 'string') {
    return DEFAULT_LANG;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  if (normalized === 'zh' || normalized === 'cn' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }

  return DEFAULT_LANG;
}

/** 把 Hexo 的 Query 对象或普通数组统一成数组，方便过滤与排序。 */
function toArray(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (typeof collection.toArray === 'function') return collection.toArray();
  return [];
}

/** 排序规则：置顶文章优先，其余按发布时间倒序。 */
function sortPosts(posts) {
  return posts.sort((left, right) => {
    const stickyDiff = (right.sticky || 0) - (left.sticky || 0);
    if (stickyDiff) return stickyDiff;
    return right.date.valueOf() - left.date.valueOf();
  });
}

/** 只保留指定语言的文章。 */
function normalizeSection(value) {
  return value === 'life' ? 'life' : 'tech';
}

/**
 * 按语言与频道筛选文章。
 * lang 必填；section 省略时表示不限频道。
 */
function filterPosts(collection, lang, section) {
  const target = normalizeLang(lang);
  const targetSection = section ? normalizeSection(section) : null;

  return toArray(collection).filter(post => {
    if (normalizeLang(post.lang) !== target) return false;
    if (targetSection && normalizeSection(post.section) !== targetSection) return false;
    return true;
  });
}

module.exports = {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  filterPosts,
  normalizeLang,
  normalizeSection,
  sortPosts,
  toArray
};
