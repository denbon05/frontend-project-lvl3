// @ts-check

import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import initView from './view';
import resources from './locales';
import validate from './validator';

const defaultLanguage = 'ru';

const parseRSSItem = (rssItem) => ({
  link: rssItem.querySelector('link').textContent,
  title: rssItem.querySelector('title').textContent,
  description: rssItem.querySelector('description').textContent,
});

const getPosts = (rssElement, feedId) => {
  const items = rssElement.getElementsByTagName('item');
  return Object.values(items).map((item) => ({
    ...parseRSSItem(item),
    id: _.uniqueId(),
    feedId,
  }));
};

const parseRss = (data, feedId) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data.contents, 'application/xml');
  const rssElement = parsedData.querySelector('rss');
  if (!rssElement) throw Error(i18next.t('errors.sourceWithoutRss'));
  const feedData = parseRSSItem(rssElement);
  const posts = getPosts(rssElement, feedId);
  return { feedData, posts };
};

const makePostsEvents = (clickedPostIds) => {
  const postsContainerEl = document.getElementById('postsContainer');
  postsContainerEl.addEventListener('mouseup', (e) => {
    // @ts-ignore
    const clickedElId = e.target.dataset.id;
    if (!clickedElId) return;
    clickedPostIds.push(clickedElId);
  });
};

const getData = (baseURL) => {
  const urlWithProxy = new URL(
    '/get',
    'https://hexlet-allorigins.herokuapp.com',
  );
  urlWithProxy.searchParams.set('disableCache', 'true');
  urlWithProxy.searchParams.set('url', baseURL);
  return axios.get(urlWithProxy.toString());
};

const autoupdateState = (state, updateThrough = 5000) => {
  state.feeds.forEach(({ link }) => {
    getData(link)
      .then(({ data }) => {
        const { posts } = parseRss(data);
        const newPosts = posts
          .filter((oldPost) => posts.some((post) => post.title !== oldPost.title));
        state.posts.concat(newPosts);
      },
      (err) => {
        state.form.error = err.message;
      })
      .then(() => {
        setTimeout(() => {
          autoupdateState(state);
        }, updateThrough);
      });
  });
};

export default () => {
  const state = {
    lng: defaultLanguage,
    feeds: [],
    posts: [],
    clickedPostIds: [],
    loadingData: 'waiting',
    form: {
      valid: true,
      error: null,
    },
  };

  i18next.init({
    lng: state.lng,
    // debug: true,
    resources,
  });

  const elements = {
    inputRss: document.getElementById('rssInput'),
    buttonRss: document.getElementById('buttonAdd'),
    formRss: document.querySelector('.rss-form'),
    responseRss: document.getElementById('response'),
    rssContainer: document.getElementById('rssContainer'),
    feedsContainer: document.getElementById('feedsContainer'),
    postsContainer: document.getElementById('postsContainer'),
  };

  const watched = initView(state, elements);

  const lngButtons = document.getElementsByClassName('lng-btn');
  Object.values(lngButtons).forEach((btnEl) => {
    btnEl.addEventListener('click', (e) => {
      e.preventDefault();
      watched.lng = e.target.id;
    });
  });

  elements.formRss.addEventListener('submit', (e) => {
    e.preventDefault();
    watched.stateSubmitProcess = 'loading';
    const formData = new FormData(e.target);
    const url = formData.get('url');
    try {
      validate(url, state.feeds);
    } catch (err) {
      watched.form = { error: err.message, valid: false };
      watched.stateSubmitProcess = 'failed';
      return;
    }
    getData(url)
      .then(
        ({ data }) => {
          const feedId = _.uniqueId();
          const { feedData, posts } = parseRss(data, feedId);
          watched.feeds.push({
            ...feedData,
            link: url,
            id: feedId,
          });
          watched.posts = [...posts, ...watched.posts];
          watched.form = { error: null, valid: true };
          watched.stateSubmitProcess = 'waiting';
          makePostsEvents(watched.clickedPostIds);
          return autoupdateState(watched);
        },
      )
      .catch((err) => {
        // console.log('MAIN-err-message->', err.message);
        if (err.message.includes('Network')) {
          watched.form = { error: i18next.t('errors.net'), valid: false };
        } else watched.form = { error: err.message, valid: false };
        watched.stateSubmitProcess = 'failed';
      });
  });
};
