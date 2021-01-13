import i18next from 'i18next';
import onChange from 'on-change';
import resources from './locales';

const renderDivErr = (error) => {
  const containerInputEl = document.getElementById('containerInput');
  const divErrEl = document.createElement('div');
  divErrEl.id = 'err';
  divErrEl.dataset.testid = 'err';
  divErrEl.textContent = error;
  divErrEl.className = 'text-danger';
  containerInputEl.appendChild(divErrEl);
};

const onError = (error = null) => {
  const inputEl = document.getElementById('rssInput');
  const errEl = document.getElementById('err');
  if (!error) inputEl.classList.remove('is-invalid');
  if (errEl) errEl.remove();
  if (error) {
    inputEl.classList.add('is-invalid');
    renderDivErr(error);
  }
};

const renderNetError = (err) => {
  renderDivErr(err);
};

const renderTemplateText = () => {
  const mainTitleEl = document.querySelector('.main-title');
  const leadEl = document.querySelector('.lead');
  const buttonAddEl = document.getElementById('buttonAdd');
  const exampleEl = document.getElementById('urlExample');
  mainTitleEl.textContent = i18next.t('form.mainTitle');
  leadEl.textContent = i18next.t('form.formLead');
  buttonAddEl.textContent = i18next.t('form.buttonAdd');
  exampleEl.textContent = i18next.t('form.example');
};

const renderSwitchLngButton = (lng = 'en') => {
  i18next.init({
    lng,
    debug: true,
    resources,
  });
  const lngButtons = document.getElementsByClassName('lng-btn');
  Object.values(lngButtons).forEach((btnEl) => {
    btnEl.className = 'btn lng-btn';
    if (lng === btnEl.id) btnEl.classList.add('btn-secondary');
    else btnEl.classList.add('btn-outline-secondary');
  });
  renderTemplateText();
};

const rederForm = (status) => {
  const buttonEl = document.getElementById('buttonAdd');
  const inputEl = document.getElementById('rssInput');
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

const closeBtn = (modalEl, bgEl) => {
  modalEl.classList.remove('show');
  bgEl.remove();
  modalEl.setAttribute('aria-hiden', 'true');
  modalEl.setAttribute('style', 'display:none');
  modalEl.removeAttribute('aria-modal');
};

const addAttributes = (modalEl, bgFadeEl) => {
  modalEl.classList.add('show');
  modalEl.removeAttribute('aria-hiden');
  modalEl.setAttribute('style', 'display: block; padding-right: 15px;');
  modalEl.setAttribute('aria-modal', 'true');
  // bgFadeEl.className = 'modal-backdrop fade show';
  document.body.appendChild(bgFadeEl).className = 'modal-backdrop fade show';
};

const renderClickedLinks = (ids) => {
  ids.forEach((id) => {
    const aEl = document.querySelector(`a[data-id="${id}"]`);
    aEl.classList.remove('font-weight-bold');
    aEl.classList.add('font-weight-normal');
  });
};

const showModal = (title, body, link) => {
  const modalEl = document.querySelector('.modal');
  const modalTitleEl = document.querySelector('.modal-title');
  const modalBodyEl = document.querySelector('.modal-body');
  const fullArticleButtonEl = document.querySelector('.full-article');
  const closeModalBtns = document.getElementsByClassName('close-modal');
  const bgFadeEl = document.createElement('div');
  addAttributes(modalEl, bgFadeEl);
  document.querySelector('.btn-close-modal').textContent = i18next.t('modal.closeModalButton');
  fullArticleButtonEl.textContent = i18next.t('modal.oppenLinkButton');
  modalTitleEl.textContent = title;
  modalBodyEl.innerHTML = `<p>${body}</p>`;
  fullArticleButtonEl.setAttribute('href', link);
  fullArticleButtonEl.setAttribute('target', '_blank');
  Object.values(closeModalBtns).forEach((closeBtnEl) => closeBtnEl.addEventListener('click', (e) => {
    e.preventDefault();
    closeBtn(modalEl, bgFadeEl);
  }));
  document.addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeBtn(modalEl, bgFadeEl);
  });
};

const makePostsEvents = ({ byId }) => {
  const btnsModal = document.getElementsByClassName('btn-modal');
  Object.values(btnsModal).forEach((btnEl) => {
    const { id } = btnEl.dataset;
    const { title, description, link } = byId[id];
    btnEl.addEventListener('click', (e) => {
      e.preventDefault();
      showModal(title, description, link);
    });
  });
};

const renderFeeds = (feedsColl) => {
  const rssContainer = document.getElementById('rssContainer');
  const feedsEl = document.getElementById('feedsRow');
  if (feedsEl) feedsEl.remove();
  const feedsRow = document.createElement('div');
  feedsRow.id = 'feedsRow';
  feedsRow.className = 'row';
  const feedsCol = document.createElement('div');
  feedsCol.className = 'col-md-10 col-lg-8 mx-auto feeds';
  feedsCol.innerHTML = `<h2>${i18next.t('feedsTitle')}</h2>`;
  const feedsList = document.createElement('ul');
  feedsList.className = 'list-group mb-5';
  rssContainer.appendChild(feedsRow);
  feedsRow.appendChild(feedsCol);
  feedsCol.appendChild(feedsList);
  feedsList.innerHTML = feedsColl
    .map(({ title, description }) => (
      `<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`
    )).join('');
};

const renderPosts = (postsColl, clickedPosts) => {
  const { allIds, byId } = postsColl;
  const rssContainer = document.getElementById('rssContainer');
  const postsEl = document.getElementById('postsRow');
  if (postsEl) postsEl.remove();
  const postsRow = document.createElement('div');
  postsRow.className = 'row';
  postsRow.id = 'postsRow';
  const postsCol = document.createElement('div');
  postsCol.className = 'col-md-10 col-lg-8 mx-auto posts';
  postsCol.innerHTML = `<h2>${i18next.t('postsTitle')}</h2>`;
  const postsList = document.createElement('ul');
  postsList.className = 'list-group mb-5';
  rssContainer.appendChild(postsRow).appendChild(postsCol).appendChild(postsList);
  postsList.innerHTML = allIds.map((id) => {
    const { title, link } = byId[id];
    return [
      '<li class="list-group-item d-flex justify-content-between align-items-start">',
      `<a href="${link}" target="_blank" data-id="${id}" rel="Post title" class="post-link font-weight-bold">${title}</a >`,
      `<button type="button" class="btn btn-primary btn-small btn-modal" data-id="${id}" data-toggle="modal" data-target="#modal">${i18next.t('postsButtonPreview')}</button>`,
      '</li>',
    ].join('');
  }).join('');
  makePostsEvents(postsColl);
  renderClickedLinks(clickedPosts);
};

export default (state, elements) => {
  elements.inputRss.focus();

  const mapping = {
    'form.status': (status) => rederForm(status),
    'form.field.url': (value) => renderError(value),
    netError: (err) => renderNetError(err),
    feeds: (feedsColl) => renderFeeds(feedsColl),
    posts: (postsColl) => renderPosts(postsColl, state.clickedPosts),
    lng: (language) => renderSwitchLngButton(language),
    clickedPosts: (ids) => renderClickedLinks(ids),
  };

  const watchedState = onChange(state, (path, value) => {
    console.log('path=>', path);
    console.log('value=>', value);
    if (mapping[path]) {
      mapping[path](value);
    }
    if (path === 'lng' && document.getElementById('feedsRow')) {
      mapping.feeds(state.feeds);
      mapping.posts(state.posts);
    }
  });

  return watchedState;
};
