'use strict';

/**
 * 从文章内容里提取纯文本摘要。
 * 列表页的 post_summary helper 与 Atom 订阅源生成器共用这段逻辑，
 * 保证两处的摘要长度与截断规则完全一致。
 */

const SUMMARY_LENGTH = 140;

/** 取出正文纯文本（去标签、压空白），列表摘要与搜索索引共用。 */
function toPlainText(post) {
  const source = (post && (post.excerpt || post.content)) || '';

  return String(source)
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSummary(post, maxLength = SUMMARY_LENGTH) {
  const plain = toPlainText(post);

  if (!plain) {
    return '';
  }

  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trim()}...`;
}

module.exports = {
  SUMMARY_LENGTH,
  buildSummary,
  toPlainText
};
