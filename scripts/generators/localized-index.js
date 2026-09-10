'use strict';

const { SUPPORTED_LANGS, postsByLang, sortPosts } = require('../lib/content');

/**
 * 语言首页生成器。
 *
 * 它注册的名字是 index，会覆盖官方 hexo-generator-index 的同名生成器
 * （Hexo 的加载顺序是「npm 插件 → 主题脚本 → 站点脚本」，同名后者生效），
 * 目的是让首页不再把两种语言混在一起：
 * - zh-CN → /
 * - en    → /en/
 *
 * 阶段 3 会在此基础上加入「技术 / 生活」频道与分页。
 */
function buildIndexRoute(lang, locals) {
  return {
    path: lang === 'en' ? 'en/' : '',
    layout: ['index'],
    data: {
      lang,
      posts: sortPosts(postsByLang(locals.posts, lang))
    }
  };
}

hexo.extend.generator.register('index', function localizedIndex(locals) {
  return SUPPORTED_LANGS.map(lang => buildIndexRoute(lang, locals));
});
