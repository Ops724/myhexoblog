'use strict';

const { normalizeLang, normalizeSection } = require('../lib/content');

/**
 * 在文章渲染前统一内容模型字段。
 *
 * - lang：允许写 zh / cn 这类简写，缺失时回退到默认语言；
 * - section：只认 tech / life，缺失或写错时归到 tech。
 *
 * 先在这里归一化，后面的过滤、路由与模板就不必各自做兼容。
 */
hexo.extend.filter.register('before_post_render', function normalizePostContent(data) {
  data.lang = normalizeLang(data.lang);
  data.section = normalizeSection(data.section);

  return data;
});
