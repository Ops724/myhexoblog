'use strict';

const { toArray } = require('../lib/content');

/**
 * 把文章按年、月分组，供归档页渲染。
 *
 * 返回 [{ key, year, month, posts }]，分组顺序与传入文章的顺序一致，
 * 因此生成器只要先按时间倒序排好，页面上的分组与组内顺序就都是最新的在前。
 */
hexo.extend.helper.register('archive_groups', function archiveGroupsHelper(collection) {
  const groups = [];
  const index = new Map();

  toArray(collection).forEach(post => {
    const year = post.date.format('YYYY');
    const month = post.date.format('MM');
    const key = `${year}-${month}`;

    if (!index.has(key)) {
      const group = { key, year, month, posts: [] };
      index.set(key, group);
      groups.push(group);
    }

    index.get(key).posts.push(post);
  });

  return groups;
});
