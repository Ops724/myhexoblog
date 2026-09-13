'use strict';

/**
 * 自建 Umami 统计的配置读取。
 *
 * 规则：
 * - 只有同时配置了脚本地址与站点 ID 才注入脚本；
 * - 本地 `hexo server` 预览默认不注入，避免把开发时的访问算进统计；
 * - 需要本地验证脚本时，在 analytics.yml 里打开 track_preview。
 */
hexo.extend.helper.register('umami_config', function umamiConfigHelper() {
  const data = this.site && this.site.data ? this.site.data : {};
  const umami = (data.analytics || {}).umami || {};
  const scriptUrl = umami.script_url;
  const websiteId = umami.website_id;

  if (!scriptUrl || !websiteId) {
    return null;
  }

  const isPreview = Boolean(hexo.env && hexo.env.cmd === 'server');

  if (isPreview && umami.track_preview !== true) {
    return null;
  }

  return {
    scriptUrl,
    websiteId
  };
});
