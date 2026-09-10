'use strict';

const { toArray } = require('../lib/content');

/**
 * 模板里统一把文章集合转成数组。
 * 生成器可能传 Hexo 的 Query 对象，也可能传普通数组，模板不必关心区别。
 */
hexo.extend.helper.register('as_list', function asListHelper(collection) {
  return toArray(collection);
});
