'use strict';

/**
 * 频道定义：语言 × 频道的列表路由。
 *
 * 频道分页生成器与站点地图生成器共用这一份配置，
 * 避免站点地图里出现实际不存在的地址。
 */
const CHANNELS = [
  { lang: 'zh-CN', section: 'tech', base: '', layout: ['index', 'list'], titleKey: 'ui.channel_tech' },
  { lang: 'en', section: 'tech', base: 'en/', layout: ['index', 'list'], titleKey: 'ui.channel_tech' },
  {
    lang: 'zh-CN',
    section: 'life',
    base: 'life/',
    layout: ['section', 'list'],
    titleKey: 'ui.channel_life',
    introKey: 'ui.channel_life_intro'
  },
  {
    lang: 'en',
    section: 'life',
    base: 'en/life/',
    layout: ['section', 'list'],
    titleKey: 'ui.channel_life',
    introKey: 'ui.channel_life_intro'
  },
  {
    lang: 'zh-CN',
    section: 'photos',
    base: 'photos/',
    layout: ['photos', 'list'],
    titleKey: 'ui.channel_photos',
    introKey: 'ui.channel_photos_intro'
  },
  {
    lang: 'en',
    section: 'photos',
    base: 'en/photos/',
    layout: ['photos', 'list'],
    titleKey: 'ui.channel_photos',
    introKey: 'ui.channel_photos_intro'
  }
];

module.exports = {
  CHANNELS
};
