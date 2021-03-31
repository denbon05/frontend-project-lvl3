// @ts-check

import { uniqueId, differenceBy } from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales';
import initView, { switchLanguage } from './view';
import validate from './validator';
import parseData from './parser';

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
  return axios.get(urlWithProxy.toString()).catch(() => { throw Error('errors.net'); });
};

const autoupdateState = (state, updateThrough = 5000) => {
  state.feeds.forEach(({ link, id }) => {
    getData(link)
      .then(({ data }) => {
        const { postsData } = parseData(data);
        const newPosts = differenceBy(postsData, state.posts, 'title');
        if (newPosts.length === 0) return;
        const normalizedPosts = newPosts.map((post) => ({ ...post, feedId: id, id: uniqueId() }));
        state.posts = [...normalizedPosts, ...state.posts];
      })
      .catch((err) => { state.loadingData = { status: 'failed', error: err.message }; })
      .finally(() => {
        setTimeout(() => {
          autoupdateState(state);
        }, updateThrough);
      });
  });
};

const initLng = (lng) => {
  const i18n = i18next.createInstance();
  i18n.init({
    lng,
    resources,
  });
  return Promise.resolve(i18n);
};

const app = (lng = 'ru') => {
  const elements = {
    inputRss: document.getElementById('rssInput'),
    buttonRss: document.getElementById('buttonAdd'),
    formRss: document.querySelector('.rss-form'),
    responseRss: document.getElementById('response'),
    rssContainer: document.getElementById('rssContainer'),
    feedsContainer: document.getElementById('feedsContainer'),
    postsContainer: document.getElementById('postsContainer'),
    lngConatiner: document.getElementById('switchLng'),
  };

  const state = {
    feeds: [],
    posts: [],
    clickedPostIds: [],
    loadingData: {
      status: 'idle',
      error: null,
    },
    form: {
      valid: true,
      error: null,
    },
  };

  initLng(lng)
    .then((i18n) => {
      const watched = initView(state, elements, i18n);

      const lngButtonsContainer = document.getElementById('switchLng');
      lngButtonsContainer.addEventListener('click', (e) => {
        // @ts-ignore
        const newLng = e.target.id;
        // console.log('newLng->', newLng);
        i18n.changeLanguage(newLng);
        switchLanguage(newLng, i18n);
      });

      elements.formRss.addEventListener('submit', (e) => {
        e.preventDefault();
        watched.loadingData = { status: 'loading', error: null };
        const formData = new FormData(e.target);
        const url = formData.get('url');
        const error = validate(url, state.feeds);
        if (error) {
          watched.form = { error: i18n.t(error.message), valid: false };
          watched.loadingData = { status: 'failed', error: null };
          return;
        }
        getData(url)
          .then(
            ({ data }) => {
              const feedId = uniqueId();
              const { feedData, postsData } = parseData(data);
              const posts = postsData.map((post) => ({ ...post, feedId, id: uniqueId() }));
              watched.feeds.push({
                ...feedData,
                link: url,
                id: feedId,
              });
              watched.posts = [...posts, ...watched.posts];
              watched.form = { error: null, valid: true };
              watched.loadingData = { status: 'idle', error: null };
              makePostsEvents(watched.clickedPostIds);
              return autoupdateState(watched);
            },
          )
          .catch((err) => {
            // console.log('MAIN-err-message->', err.message);
            watched.loadingData = { status: 'failed', error: i18n.t(err.message) };
          });
      });
    });
};

export default app;
