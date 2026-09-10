/**
 * 相册灯箱：点击照片全屏查看，支持键盘操作。
 *
 * - Esc 关闭，左右方向键切换照片，点击大图切到下一张
 * - 打开时把焦点移到关闭按钮，关闭后焦点回到原来的照片
 * - 关闭按钮的文案由模板通过 data-close-label 传入，跟随站点语言
 */
(function () {
  'use strict';

  const grid = document.querySelector('[data-photo-grid]');
  if (!grid) return;

  const links = Array.from(grid.querySelectorAll('.photo-open'));
  if (!links.length) return;

  const closeLabel = grid.getAttribute('data-close-label') || 'Close';
  const overlay = document.createElement('div');
  overlay.className = 'photo-lightbox';
  overlay.hidden = true;
  overlay.innerHTML =
    '<button type="button" class="photo-lightbox-close" aria-label="' + closeLabel + '">&times;</button>' +
    '<figure class="photo-lightbox-figure">' +
    '<img alt="" src="">' +
    '<figcaption></figcaption>' +
    '</figure>';

  const image = overlay.querySelector('img');
  const caption = overlay.querySelector('figcaption');
  const closeButton = overlay.querySelector('.photo-lightbox-close');
  let index = -1;

  document.body.appendChild(overlay);

  function show(link) {
    const position = links.indexOf(link);
    if (position === -1) return;

    index = position;
    image.src = link.href;
    image.alt = link.getAttribute('data-caption') || '';
    caption.textContent = link.getAttribute('data-caption') || '';
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }

  function hide() {
    overlay.hidden = true;
    image.removeAttribute('src');
    image.alt = '';
    caption.textContent = '';
    document.body.style.overflow = '';

    if (index !== -1) {
      links[index].focus();
      index = -1;
    }
  }

  function step(offset) {
    if (index === -1) return;

    const next = (index + offset + links.length) % links.length;
    show(links[next]);
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      show(link);
    });
  });

  closeButton.addEventListener('click', hide);

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) hide();
  });

  image.addEventListener('click', function () {
    step(1);
  });

  document.addEventListener('keydown', function (event) {
    if (overlay.hidden) return;

    if (event.key === 'Escape') {
      hide();
      return;
    }

    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  });
})();
