/**
 * 站内搜索：按当前语言取索引 JSON，做大小写不敏感的子串匹配。
 *
 * 为什么用子串匹配而不是分词搜索：中文没有天然词边界，依赖分词器的方案
 * 一旦切分不准就完全搜不到；子串匹配不需要分词，中文一定命中。
 * 代价是没有词干还原、同义词与模糊匹配。
 *
 * 索引由生成器产出（/search-index.json 与 /en/search-index.json），
 * 只在搜索页按需加载。
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-search]');
  if (!root) return;

  const input = root.querySelector('.search-input');
  const status = root.querySelector('[data-search-status]');
  const list = root.querySelector('[data-search-results]');
  const indexPath = root.getAttribute('data-index');
  const labels = JSON.parse(root.getAttribute('data-labels') || '{}');
  const maxResults = 10;
  const excerptRadius = 70;
  let indexPromise = null;
  let timer = null;

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

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(indexPath)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => data.entries || [])
        .catch(error => {
          indexPromise = null;
          throw error;
        });
    }

    return indexPromise;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** 用 <mark> 包住命中片段；先转义再高亮，避免正文里的 HTML 破坏结构。 */
  function highlight(text, term) {
    const escaped = escapeHtml(text);
    const pattern = escapeRegExp(escapeHtml(term));

    return escaped.replace(new RegExp(pattern, 'gi'), match => `<mark>${match}</mark>`);
  }

  function countOccurrences(text, term) {
    let count = 0;
    let position = text.indexOf(term);

    while (position !== -1 && count < 100) {
      count += 1;
      position = text.indexOf(term, position + term.length);
    }

    return count;
  }

  function matchEntry(entry, term) {
    const title = String(entry.title || '').toLowerCase();
    const text = String(entry.text || '').toLowerCase();
    const position = text.indexOf(term);
    const titleHit = title.includes(term);

    if (position === -1 && !titleHit) return null;

    const occurrences = countOccurrences(text, term);

    return {
      entry,
      position,
      score: (titleHit ? 30 : 0) + Math.min(occurrences, 20) * 2 + (position !== -1 ? 5 : 0)
    };
  }

  function buildExcerpt(entry, term, position) {
    const text = String(entry.text || '');

    if (position === -1) {
      return highlight(entry.title || '', term);
    }

    const start = Math.max(0, position - excerptRadius);
    const end = Math.min(text.length, position + term.length + excerptRadius);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';

    return `${prefix}${highlight(text.slice(start, end), term)}${suffix}`;
  }

  function buildResult(match, term) {
    const item = document.createElement('li');
    item.className = 'search-result';

    const link = document.createElement('a');
    link.className = 'search-result-link';
    link.href = match.entry.url;

    const title = document.createElement('h2');
    title.className = 'search-result-title';
    title.innerHTML = highlight(match.entry.title || match.entry.url, term);

    const excerpt = document.createElement('p');
    excerpt.className = 'search-result-excerpt';
    excerpt.innerHTML = buildExcerpt(match.entry, term, match.position);

    link.appendChild(title);
    item.appendChild(link);
    item.appendChild(excerpt);

    return item;
  }

  async function runSearch(term) {
    list.innerHTML = '';

    if (!term) {
      setStatus('');
      return;
    }

    setStatus(labels.loading);

    const normalized = term.toLowerCase();

    try {
      const entries = await loadIndex();
      const matches = entries
        .map(entry => matchEntry(entry, normalized))
        .filter(Boolean)
        .sort((left, right) => right.score - left.score)
        .slice(0, maxResults);

      list.innerHTML = '';

      if (!matches.length) {
        setStatus(labels.empty);
        return;
      }

      setStatus('');
      matches.forEach(match => list.appendChild(buildResult(match, term)));
    } catch (error) {
      setStatus(labels.error);
    }
  }

  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => runSearch(input.value.trim()), 200);
  });
})();
