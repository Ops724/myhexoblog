'use strict';

/**
 * 正文图片懒加载。
 *
 * 给 markdown 渲染出来的 `<img>` 补上 `loading="lazy"` 与 `decoding="async"`：
 * - 第一张图保持立即加载：它可能落在首屏，懒加载会拖慢首屏最大内容（LCP）
 * - 已经写了 `loading` 属性的图片不动
 * - 相册照片由模板负责（本来就带懒加载），这里不涉及
 *
 * 挂在 `after_post_render`：Hexo 对文章与页面都会执行这个时机，所以一次覆盖两者。
 */

const LAZY_ATTRIBUTES = 'loading="lazy" decoding="async"';

function withLazyLoading(html) {
  let index = 0;

  return String(html).replace(/<img\b[^>]*>/gi, tag => {
    index += 1;

    if (index === 1 || /\bloading\s*=/i.test(tag)) {
      return tag;
    }

    return tag.replace(/<img\b/i, `<img ${LAZY_ATTRIBUTES}`);
  });
}

hexo.extend.filter.register('after_post_render', function lazyContentImages(data) {
  if (typeof data.content === 'string') {
    data.content = withLazyLoading(data.content);
  }

  return data;
});
