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
    .map((item) => {
      const linkElement = item.querySelector('link');
      const titleElement = item.querySelector('title');
      const descriptionElement = item.querySelector('description');
      return {
        link: linkElement.textContent,
        title: titleElement.textContent,
        description: descriptionElement.textContent,
        feedId,
        id: _.uniqueId(),
      };
    });
};

const getRSS = (uri) => {
  const proxyurl = 'https://cors-anywhere.herokuapp.com/';
  return axios.get(`${proxyurl}${uri}`)
    .then((response) => {
      const { data } = response;
      const parser = new DOMParser();
      const parsedData = parser.parseFromString(data, 'application/xml');
      const rssElement = parsedData.querySelector('rss');
      console.log('rssElement=>', rssElement);
      if (rssElement) {
        console.log('rssElement=>', rssElement);
        return { err: null, rssElement };
      }
      return { err: "This source doesn't contain valid rss" };
    })
    .catch((err) => {
      console.log('err.message=>', err.message);
      return { err: err.message };
    });
};

// const makePostsEvents = (posts) => {
//   posts.forEach(({ title, id, link, description }) => {
//   const postEl =
//   });
// };

export default () => {
  const state = {
    feeds: [],
    posts: [],
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
        watched.posts.push(...getPosts(rssElement, id));
        console.log('end_state=>', state);
        watched.form.status = 'filling';
        // makePostsEvents(state.posts);
      }
    });
  });
};
