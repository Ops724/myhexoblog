'use strict';

const { absoluteUrl, normalizeRoutePath } = require('../lib/paths');
const { buildSummary } = require('../lib/summary');

/** 站内路径的绝对地址，供 canonical 与 og:url 使用。 */
hexo.extend.helper.register('absolute_url', function absoluteUrlHelper(value) {
  const path = value == null ? (this.page && this.page.path) : value;

  return absoluteUrl(this.config, path || '');
});

/**
 * 页面描述，按优先级取值：
 * 1. front-matter 的 description
 * 2. 文章与相册的正文摘要
 * 3. 列表页的频道说明（intro_key）
 * 4. 页面正文摘要（例如关于页）
 * 5. 站点描述
 */
hexo.extend.helper.register('page_description', function pageDescriptionHelper(page) {
  if (page && page.description) {
    return String(page.description);
  }

  const isPost = Boolean(page && (page.__post || page.layout === 'post' || page.layout === 'album'));

  if (isPost) {
    const summary = buildSummary(page);
    if (summary) return summary;
  }

  if (page && page.intro_key && this.__) {
    const intro = this.__(page.intro_key);
    if (intro) return intro;
  }

  const summary = buildSummary(page || {});
  if (summary) return summary;

  return this.config.description || '';
});

/** 分享图：front-matter 的 image 优先，其次用站点资料里的头像。 */
hexo.extend.helper.register('page_image', function pageImageHelper(page) {
  const custom = page && page.image ? page.image : '';
  const fallback = this.profile_value ? this.profile_value('avatar') : '';
  const image = custom || fallback;

  return image ? absoluteUrl(this.config, image) : '';
});

/** 判断某条路由是否真实存在，用于只在确实有对应语言版本时才输出 hreflang。 */
hexo.extend.helper.register('route_exists', function routeExistsHelper(value) {
  const path = normalizeRoutePath(value);

  if (!path) {
    return Boolean(hexo.route.get('index.html'));
  }

  return Boolean(
    hexo.route.get(`${path}/index.html`) ||
    hexo.route.get(`${path}.html`) ||
    hexo.route.get(path)
  );
});
