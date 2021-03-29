// @ts-check

const parseRSSItem = (rssItem) => ({
  link: rssItem.querySelector('link').textContent,
  title: rssItem.querySelector('title').textContent,
  description: rssItem.querySelector('description').textContent,
});

export default (data) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data.contents, 'application/xml');
  const errorElement = parsedData.querySelector('parsererror');
  if (errorElement) throw Error('errors.sourceWithoutRss');
  const rssElement = parsedData.querySelector('rss');
  const feedData = parseRSSItem(rssElement);
  const items = rssElement.getElementsByTagName('item');
  const postsData = Object.values(items).map((item) => ({
    ...parseRSSItem(item),
  }));
  return { feedData, postsData };
};
