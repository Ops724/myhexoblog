'use strict';

/**
 * 404 页面生成器。
 *
 * 产出 `/404.html`，由服务器在找不到页面时返回（Nginx 里配置 `error_page 404 /404.html`）。
 *
 * 为什么页面做成中英双语而且不依赖 JavaScript：同一个文件会服务所有路径，
 * 包括 `/en/` 下面的错误地址，服务器端并不知道访客习惯哪种语言，
 * 所以两种语言都给出，读者各取所需。
 */
hexo.extend.generator.register('not-found', function notFoundPage() {
  return {
    path: '404.html',
    layout: ['404'],
    data: {
      title: '404'
    }
  };
});
