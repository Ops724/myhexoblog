'use strict';

const { DEFAULT_LANG, normalizeLang, toArray } = require('../lib/content');

/** 去掉首尾斜杠，并把首页路径里的 index.html 归一成空字符串。 */
function normalizePath(value) {
  return String(value || '')
    .replace(/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '');
}

/** 判断页面属于哪种语言：先看 front-matter 的 lang，再看 URL 前缀。 */
function resolvePageLang(page) {
  if (page && (page.lang || page.language)) {
    return normalizeLang(page.lang || page.language);
  }

  const path = normalizePath(page && page.path);

  return path === 'en' || path.startsWith('en/') ? 'en' : DEFAULT_LANG;
}

/** 按目标语言给路径加上或去掉 en 前缀，并补上首尾斜杠。 */
function localizePath(pathname, lang) {
  const path = normalizePath(pathname).replace(/^en(\/|$)/, '');
  const localized = normalizeLang(lang) === 'en'
    ? (path ? `en/${path}` : 'en')
    : path;

  return localized ? `/${localized}/` : '/';
}

/** 在全部文章里查找同一 translation_key 的另一种语言版本。 */
function findTranslation(page, targetLang) {
  if (!page || !page.translation_key) {
    return null;
  }

  const target = normalizeLang(targetLang);

  return toArray(hexo.locals.get('posts')).find(post => {
    return post.translation_key === page.translation_key
      && normalizeLang(post.lang) === target;
  }) || null;
}

hexo.extend.helper.register('page_lang', function pageLangHelper(page) {
  return resolvePageLang(page);
});

/**
 * 计算某个页面在目标语言下的地址，页头的中英切换用它。
 *
 * 三种情况：
 * 1. 文章有对应译文 → 跳到译文；
 * 2. 文章声明了 translation_key 但译文不存在 → 回退到目标语言首页，避免死链；
 * 3. 其他页面（首页、关于页、列表页）→ 按语言前缀直接映射。
 */
hexo.extend.helper.register('localized_page_url', function localizedPageUrlHelper(page, targetLang) {
  const target = normalizeLang(targetLang);
  const sibling = findTranslation(page, target);

  if (sibling) {
    return localizePath(sibling.path, target);
  }

  if (page && page.translation_key) {
    return localizePath('', target);
  }

  return localizePath(page && page.path, target);
});
