import onChange from 'on-change';

const onError = (error = null) => {
  const inputEl = document.getElementById('rssInput');
  const containerInputEl = document.getElementById('containerInput');
  const errEl = document.getElementById('err');
  if (!error) inputEl.classList.remove('is-invalid');
  if (errEl) errEl.remove();
  if (error) {
    const divErrEl = document.createElement('div');
    divErrEl.id = 'err';
    inputEl.classList.add('is-invalid');
    divErrEl.textContent = error;
    divErrEl.className = 'text-danger';
    containerInputEl.appendChild(divErrEl);
  }
};

const rederForm = (status) => {
  const buttonEl = document.getElementById('buttonAdd');
  const inputEl = document.getElementById('rssInput');
  console.log('HELLO-FROM-RENDER-FORM=>', status);
  onError(false);
  switch (status) {
    case 'filling':
      buttonEl.disabled = false;
      inputEl.value = '';
      return;
    case 'loading':
      buttonEl.disabled = true;
      return;
    case 'failed':
      buttonEl.disabled = false;
      return;
    default:
      throw Error(`Unknow form status: "${status}"`);
  }
};

const renderError = ({ error, valid }) => {
  if (!valid) onError(error);
};
/* eslint-disable */
// const showModal = (title, body, link) => {
// 	const modalEl = document.querySelector('.modal');
// 	const modalTitleEl = document.querySelector('.modal-title');
// 	const modalBodyEl = document.querySelector('.modal-body');
// 	const fullArticleButtonEl = document.querySelector('.full-article');
// 	modalTitleEl.textContent = title;
// 	modalBodyEl.innerHTML = `<p>${body}</p>`;
// 	fullArticleButtonEl.setAttribute('a', link);
// 	modalEl.classList.add('show');
// };

const renderFeeds = (feedsColl) => {
  const rssContainer = document.getElementById('rssContainer');
  const feedsEl = document.getElementById('feedsRow');
  if (feedsEl) feedsEl.remove();
  const feedsRow = document.createElement('div');
  feedsRow.id = 'feedsRow';
  feedsRow.className = 'row';
  const feedsCol = document.createElement('div');
  feedsCol.className = 'col-md-10 col-lg-8 mx-auto feeds';
  feedsCol.innerHTML = '<h2>Feeds</h2>';
  const feedsList = document.createElement('ul');
  feedsList.className = 'list-group mb-5';
  rssContainer.appendChild(feedsRow);
  feedsRow.appendChild(feedsCol);
  feedsCol.appendChild(feedsList);
  feedsList.innerHTML = feedsColl
    .map(({ title, description }) => (
      `<li class="list-group-item">
				<h3>${title}</h3>
				<p>${description}</p>
			</li>`
    ));
};

const renderPosts = (postsColl) => {
  console.log('renderPosts-postsColl=>>', postsColl);
  const rssContainer = document.getElementById('rssContainer');
  const postsEl = document.getElementById('postsRow');
  if (postsEl) postsEl.remove();
  const postsRow = document.createElement('div');
  postsRow.className = 'row';
  postsRow.id = 'postsRow';
  const postsCol = document.createElement('div');
  postsCol.className = 'col-md-10 col-lg-8 mx-auto posts';
  postsCol.innerHTML = '<h2>Posts</h2>';
  const postsList = document.createElement('ul');
  postsList.className = 'list-group mb-5';
  rssContainer.appendChild(postsRow);
  postsRow.appendChild(postsCol);
  postsCol.appendChild(postsList);
  postsList.innerHTML = postsColl
    .map(({ title, id, link }) => [
      '<li class="list-group-item d-flex justify-content-between align-items-start">',
      `<a href="${link}" target="_blank" data-id="${id}" rel="Post title" class="font-weight-normal">${title}</a >`,
      `<button type="button" class="btn btn-primary btn-small" data-id="${id}" data-toggle="modal" data-target="#modal">Preview</button>`,
      '</li>',
    ].join('')).join('');
};

const initView = (state, elements) => {
  elements.inputRss.focus();

  const mapping = {
    'form.status': (status) => rederForm(status),
    'form.field.url': (value) => renderError(value),
    feeds: (feedsColl) => renderFeeds(feedsColl),
    posts: (postsColl) => renderPosts(postsColl),
  };

  const watchedState = onChange(state, (path, value) => {
    console.log('path=>', path);
    console.log('value=>', value);
    if (mapping[path]) {
      mapping[path](value);
    }
  });

  return watchedState;
};

export default initView;
