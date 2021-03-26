// @ts-check

import { uniqueId } from 'lodash';
import axios from 'axios';
import initView from './view';
import validate from './validator';
import parseData from './parser';
import initLng from './init';

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
  state.feeds.forEach(({ link, id }) => {
    getData(link)
      .then(({ data }) => {
        const { postsData } = parseData(data);
        const newPosts = postsData
          .filter((oldPost) => postsData.some((post) => post.title !== oldPost.title));
        if (newPosts.length === 0) return;
        state.posts.concat([{ ...newPosts, feedId: id, id: uniqueId() }]);
      })
      .catch((err) => { state.loadingData = { status: 'failed', error: err.message }; })
      .finally(() => {
        setTimeout(() => {
          autoupdateState(state);
        }, updateThrough);
      });
  });
};

export default () => {
  const i18n = initLng();
  // console.log('i18n=>', i18n);
  const state = {
    lng: i18n.language,
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

  const watched = initView(state, elements);

  const lngButtonsContainer = document.getElementById('switchLng');
  lngButtonsContainer.addEventListener('click', (e) => {
    // @ts-ignore
    watched.lng = e.target.id;
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
        if (err.message.includes('Network')) {
          watched.loadingData = { status: 'failed', error: i18n.t('errors.net') };
        } else watched.form = { error: i18n.t(err.message), valid: false };
      });
  });
};
