import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';
import initView from './view';

const wasAdded = (feeds, link) => feeds
  .some((item) => item.link === link);

const validate = (uri, feeds) => {
  if (wasAdded(feeds, uri)) return 'Rss already exists';
  const schema = yup
    .string().url()
    .trim()
    .required();

  try {
    schema.validateSync(uri);
    return null;
  } catch (err) {
    return err.message;
  }
};

const getTitleInfo = (rssElement) => {
  const channelElement = rssElement.querySelector('channel');
  const titleElement = channelElement.querySelector('title');
  const descriptionElement = channelElement.querySelector('description');
  return {
    title: titleElement.textContent,
    description: descriptionElement.textContent,
  };
};

const getPosts = (rssElement, feedId) => {
  const items = rssElement.getElementsByTagName('item');
  return Object.values(items)
    .reduce((acc, item) => {
      const linkElement = item.querySelector('link');
      const titleElement = item.querySelector('title');
      const descriptionElement = item.querySelector('description');
      const id = _.uniqueId();
      acc.byId[id] = {
        link: linkElement.textContent,
        title: titleElement.textContent,
        description: descriptionElement.textContent,
        id,
        feedId,
      };
      acc.allIds.push(id);
      return acc;
    }, { byId: {}, allIds: [] });
};

const getRSS = (uri) => {
  const proxyurl = 'https://cors-anywhere.herokuapp.com/';
  const requestUrl = `${proxyurl}${uri}`;
  return axios.get(requestUrl)
    .then((response) => {
      const { data } = response;
      const parser = new DOMParser();
      const parsedData = parser.parseFromString(data, 'application/xml');
      const rssElement = parsedData.querySelector('rss');
      // console.log('rssElement=>', rssElement);
      if (rssElement) {
        // console.log('rssElement=>', rssElement);
        return { err: null, rssElement };
      }
      return { err: "This source doesn't contain valid rss" };
    })
    .catch((err) => {
      console.log('err.message=>', err.message);
      return { err: err.message };
    });
};

export default () => {
  const state = {
    feeds: [],
    posts: { byId: {}, allIds: [] },
    form: {
      status: 'filling',
      field: {
        url: {
          valid: true,
          error: null,
        },
      },
    },
  };

  const elements = {
    inputRss: document.getElementById('rssInput'),
    buttonRss: document.getElementById('buttonAdd'),
    formRss: document.querySelector('.rss-form'),
  };

  const watched = initView(state, elements);

  elements.formRss.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const uri = formData.get('uri');
    const error = validate(uri, state.feeds);
    if (error) {
      console.log('error_validate=>', error);
      watched.form.field.url = { error, valid: false };
      return;
    }
    watched.form.field.url = { error: null, valid: true };
    watched.form.status = 'loading';
    getRSS(uri).then(({ err, rssElement }) => {
      if (err) {
        watched.form.status = 'failed';
        watched.form.field.url = { error: err, valid: false };
      } else {
        const id = _.uniqueId();
        watched.feeds.push({ ...getTitleInfo(rssElement), link: uri, id });
        watched.posts = { ...state.posts, ...getPosts(rssElement, id) };
        console.log('end_state=>', state);
        watched.form.status = 'filling';
      }
    });
  });
};
