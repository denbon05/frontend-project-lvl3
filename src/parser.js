// @ts-check

import i18next from 'i18next';
import { uniqueId } from 'lodash';


const parseRSSItem = (rssItem) => ({
  link: rssItem.querySelector('link').textContent,
  title: rssItem.querySelector('title').textContent,
  description: rssItem.querySelector('description').textContent,
});

export default (data, feedId) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data.contents, 'application/xml');
  const rssElement = parsedData.querySelector('rss');
  if (!rssElement) throw Error(i18next.t('errors.sourceWithoutRss'));
  const feedData = parseRSSItem(rssElement);
  const items = rssElement.getElementsByTagName('item');
  const posts =  Object.values(items).map((item) => ({
    ...parseRSSItem(item),
    id: uniqueId(),
    feedId,
  }));
  return { feedData, posts };
};
