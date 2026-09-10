'use strict';

const { normalizeLang } = require('../lib/content');

/**
 * 在文章渲染前统一 lang 字段。
 *
 * 内容模型允许写 zh / cn 这类简写，缺失时回退到默认语言；
 * 先在这里归一化，后面的过滤与路由逻辑就不必各自做兼容。
 */
hexo.extend.filter.register('before_post_render', function normalizePostLang(data) {
  data.lang = normalizeLang(data.lang);

  return data;
});
