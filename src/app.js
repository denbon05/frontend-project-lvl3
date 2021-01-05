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
  const channel = rssElement.querySelector('channel');
  const title = channel.querySelector('title');
  const description = channel.querySelector('description');
  return {
    title: title.textContent,
    description: description.textContent,
  };
};

const getPosts = (rssElement, feedId) => {
  const items = rssElement.getElementsByTagName('item');
  return Object.values(items)
    .map((item) => {
      const link = item.querySelector('link');
      const title = item.querySelector('title');
      const description = item.querySelector('description');
      return {
        link: link.textContent,
        title: title.textContent,
        description: description.textContent,
        feedId,
      };
    });
};

const getRSS = (uri) => axios.get(uri)
  .then((response) => {
    const { data } = response;
    const parser = new DOMParser();
    const parsedData = parser.parseFromString(data, 'application/xml');
    const rssElement = parsedData.querySelector('rss');
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

export default () => {
  const state = {
    feeds: [],
    posts: [],
    error: null,
    form: {
      status: 'filling',
      field: {
        name: {
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
      watched.form.field.name = { error, valid: false };
      return;
    }
    watched.form.field.name = { error: null, valid: true };
    watched.status = 'loading';
    getRSS(uri).then(({ err, rssElement }) => {
      if (err) {
        watched.form.status = 'failed';
        watched.error = err;
      } else {
        const id = _.uniqueId();
        watched.feeds.push({ ...getTitleInfo(rssElement), link: uri, id });
        watched.posts.push(getPosts(rssElement, id));
        console.log('state=>', state);
        watched.form.status = 'filling';
      }
    });
  });
};
