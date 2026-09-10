'use strict';

const { normalizeLang } = require('./content');

/**
 * 读取站点资料里的文本值，兼容两种写法：
 * - 双语对象：site_name: { zh-CN: ..., en: ... }
 * - 纯字符串：tagline: 一句话
 *
 * 模板 helper 与订阅源生成器共用，避免两处各写一套回退规则。
 */
function readLocalizedValue(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const target = normalizeLang(lang);

    return value[target] || value['zh-CN'] || value['en'] || '';
  }

  return value == null ? '' : String(value);
}

function readProfileText(profile, key, lang) {
  return readLocalizedValue(profile && profile[key], lang);
}

module.exports = {
  readLocalizedValue,
  readProfileText
};
