/**
 * 站内搜索：调用 Pagefind 的浏览器 API，自己渲染结果。
 *
 * 为什么不用 Pagefind 自带的界面：主题是克制的白底排版，自带界面样式差异较大；
 * 这里只需要「输入、结果列表、空状态」三件事，自己渲染反而更少代码也更好控制。
 *
 * 语言隔离：索引只有一份，页面在 body 上标了 data-pagefind-filter="language[lang]"，
 * 搜索时按当前语言传过滤条件，中文页不会搜出英文内容（反之亦然）。
 *
 * 索引由构建流程生成（npm run search:index）：本地 hexo server 不会自动建索引，
 * 需要先跑一次 npm run build:full。
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-search]');
  if (!root) return;

  const input = root.querySelector('.search-input');
  const status = root.querySelector('[data-search-status]');
  const list = root.querySelector('[data-search-results]');
  const language = root.getAttribute('data-language') || 'zh-cn';
  const labels = JSON.parse(root.getAttribute('data-labels') || '{}');
  const maxResults = 10;
  let pagefind = null;
  let timer = null;
  let requestId = 0;

  function setStatus(message) {
    if (!status) return;

    if (!message) {
      status.hidden = true;
      status.textContent = '';
      return;
    }

    status.hidden = false;
    status.textContent = message;
  }

  async function loadPagefind() {
    if (!pagefind) {
      pagefind = await import('/pagefind/pagefind.js');
    }

    return pagefind;
  }

  function buildResult(result) {
    const item = document.createElement('li');
    item.className = 'search-result';

    const link = document.createElement('a');
    link.className = 'search-result-link';
    link.href = result.url;

    const title = document.createElement('h2');
    title.className = 'search-result-title';
    title.textContent = (result.meta && result.meta.title) || result.url;
    link.appendChild(title);

    const excerpt = document.createElement('p');
    excerpt.className = 'search-result-excerpt';
    excerpt.innerHTML = result.excerpt || '';

    item.appendChild(link);
    item.appendChild(excerpt);

    return item;
  }

  async function runSearch(term) {
    const current = ++requestId;
    list.innerHTML = '';

    if (!term) {
      setStatus('');
      return;
    }

    setStatus(labels.loading);

    try {
      const pf = await loadPagefind();
      const search = await pf.search(term, { filters: { language } });
      const results = await Promise.all(
        search.results.slice(0, maxResults).map(result => result.data())
      );

      if (current !== requestId) return;

      list.innerHTML = '';

      if (!results.length) {
        setStatus(labels.empty);
        return;
      }

      setStatus('');
      results.forEach(result => list.appendChild(buildResult(result)));
    } catch (error) {
      if (current !== requestId) return;
      setStatus(labels.error);
    }
  }

  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => runSearch(input.value.trim()), 200);
  });
})();
