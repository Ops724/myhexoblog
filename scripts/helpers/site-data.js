'use strict';

const { readProfileText } = require('../lib/site-data');

/** 读取站点的 source/_data/profile.yml，没有配置时返回空对象。 */
function profileData(locals) {
  const data = locals && locals.site && locals.site.data ? locals.site.data : {};

  return data.profile || {};
}

hexo.extend.helper.register('profile_text', function profileTextHelper(key, lang) {
  return readProfileText(profileData(this), key, lang);
});

/** 取站点资料里的原始值：头像、图标、背景色这类不需要翻译的字段。 */
hexo.extend.helper.register('profile_value', function profileValueHelper(key) {
  const value = profileData(this)[key];

  return value == null ? '' : value;
});

/** 站点名：优先用站点资料，没配置时退回根配置里的 title。 */
hexo.extend.helper.register('site_title', function siteTitleHelper(page) {
  const profile = profileData(this);

  if (!profile.site_name) {
    return this.config.title;
  }

  const lang = this.page_lang ? this.page_lang(page) : 'zh-CN';

  return readProfileText(profile, 'site_name', lang) || this.config.title;
});
