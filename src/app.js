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
  return Object.values(items)
    .map((item) => ({
      ...parseRSSItem(item),
      id: _.uniqueId(),
      feedId,
    }));
};

const getNewPosts = (rssElement, feedId, oldPosts) => {
  const newPosts = getPosts(rssElement, feedId);
  return oldPosts
    .filter((oldPost) => !newPosts.some((post) => post.title === oldPost.title));
};

const parseRss = (data) => {
  // console.log('data=>', data);
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data.contents, 'application/xml');
  const rssElement = parsedData.querySelector('rss');
  if (rssElement) return rssElement;
  throw Error(i18next.t('errors.sourceWithoutRss'));
};

const makePostsEvents = (clickedPostIds) => {
  const postsLinksEl = document.getElementsByClassName('post-link');
  const postsBtnsEl = document.getElementsByClassName('btn-modal');
  [postsLinksEl, postsBtnsEl].forEach((el) => {
    Object.values(el).forEach((linkEl) => {
      linkEl.addEventListener('mouseup', (e) => {
        const clickedElId = e.target.dataset.id;
        clickedPostIds.push(clickedElId);
      });
    });
  });
};

const getData = (baseURL) => {
  const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
  urlWithProxy.searchParams.set('disableCache', 'true');
  urlWithProxy.searchParams.set('url', baseURL);
  return axios.get(urlWithProxy.toString());
};

const autoupdateState = (state, updateThrough = 5000) => {
  state.feeds.forEach(({ link, id }) => {
    getData(link).then(({ data }) => {
      const rssElement = parseRss(data);
      state.posts.concat(getNewPosts(rssElement, id, state.posts));
    }, (err) => { state.form.url.error = err.message; });
  });
  setTimeout(() => {
    autoupdateState(state);
  }, updateThrough);
};

export default () => {
  const state = {
    lng: defaultLanguage,
    feeds: [],
    posts: [],
    clickedPostIds: [],
    stateSubmitProcess: 'processed',
    form: {
      url: {
        valid: true,
        error: null,
      },
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
    try { validate(url, state.feeds); } catch (err) {
      watched.form.url = { error: err.message, valid: false };
      watched.stateSubmitProcess = 'invalid';
      return;
    }
    getData(url)
      .then(
        ({ data }) => {
          const rssElement = parseRss(data);
          const feedId = _.uniqueId();
          watched.feeds.push({
            ...parseRSSItem(rssElement),
            link: url,
            id: feedId,
          });
          watched.posts = [...getPosts(rssElement, feedId), ...watched.posts];
          watched.form.url = { error: null, valid: true };
          watched.stateSubmitProcess = 'processed';
          makePostsEvents(watched.clickedPostIds);
          return autoupdateState(watched);
        },
        (err) => Promise.reject(err),
      )
      .catch((err) => {
        // console.log('MAIN-err-message->', err.message);
        if (err.message.includes('Network')) {
          watched.form.url = { error: i18next.t('errors.net'), valid: false };
        } else watched.form.url = { error: err.message, valid: false };
        watched.stateSubmitProcess = 'invalid';
      });
  });
};
