'use strict';

/**
 * 从文章内容里提取纯文本摘要。
 * 列表页的 post_summary helper 与 Atom 订阅源生成器共用这段逻辑，
 * 保证两处的摘要长度与截断规则完全一致。
 */

const SUMMARY_LENGTH = 140;

function buildSummary(post, maxLength = SUMMARY_LENGTH) {
  const source = (post && (post.excerpt || post.content)) || '';
  const plain = String(source)
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) {
    return '';
  }

  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trim()}...`;
}

module.exports = {
  SUMMARY_LENGTH,
  buildSummary
};
