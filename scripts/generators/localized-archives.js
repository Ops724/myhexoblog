'use strict';

const { filterPosts, sortPosts } = require('../lib/content');

/**
 * 双语归档页生成器。
 *
 * 注册名 archive 会覆盖官方 hexo-generator-archive（同名覆盖），只生成两条路由：
 * - 中文：/archives/
 * - 英文：/en/archives/
 *
 * 每条路由只收录当前语言的文章，分组交给模板里的 archive_groups helper。
 * 官方生成器还会额外产出 /archives/2026/、/archives/2026/09/ 这类子页面，
 * 本方案把时间线收在一个页面里，因此不再生成这些子路由。
 */

const ARCHIVE_LANGS = ['zh-CN', 'en'];

function archiveDir(config, lang) {
  const dir = String(config.archive_dir || 'archives').replace(/^\/+|\/+$/g, '');

  return lang === 'en' ? `en/${dir}` : dir;
}

hexo.extend.generator.register('archive', function localizedArchives(locals) {
  const config = this.config;

  return ARCHIVE_LANGS.map(lang => ({
    path: `${archiveDir(config, lang)}/`,
    layout: ['archives', 'page', 'list'],
    data: {
      lang,
      posts: sortPosts(filterPosts(locals.posts, lang))
    }
  }));
});
