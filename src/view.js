// @ts-check

import i18next from 'i18next';
import onChange from 'on-change';

const renderTemplateText = () => {
  const mainTitleEl = document.querySelector('.main-title');
  const leadEl = document.querySelector('.lead');
  const buttonAddEl = document.getElementById('buttonAdd');
  const exampleEl = document.getElementById('urlExample');
  const feedTitleEl = document.getElementById('feedsTitle');
  mainTitleEl.textContent = i18next.t('form.mainTitle');
  leadEl.textContent = i18next.t('form.formLead');
  buttonAddEl.textContent = i18next.t('form.buttonAdd');
  exampleEl.textContent = i18next.t('form.example');
  if (feedTitleEl) {
    feedTitleEl.textContent = i18next.t('feedsTitle');
    document.getElementById('postsTitle').textContent = i18next.t('postsTitle');
    Object.values(document.getElementsByClassName('btn-modal'))
      .forEach((btnEl) => {
        btnEl.textContent = i18next.t('postsButtonPreview');
      });
  }
};

const switchLanguage = (lng) => {
  i18next.changeLanguage(lng);

  const btnAdd = document.getElementById('buttonAdd');
  const lngButtons = document.getElementsByClassName('lng-btn');
  // @ts-ignore
  btnAdd.value = i18next.t('form.buttonAdd');
  Object.values(lngButtons).forEach((btnEl) => {
    btnEl.className = 'btn lng-btn';
    if (lng === btnEl.id) btnEl.classList.add('btn-secondary');
    else btnEl.classList.add('btn-outline-secondary');
  });
  renderTemplateText();
};

const renderResponse = ({ error, valid = false }, { responseRss, inputRss }) => {
  inputRss.className = 'form-control form-control-lg w-80';
  responseRss.className = '';
  responseRss.textContent = '';
  if (error) {
    responseRss.classList.add('text-danger');
    responseRss.textContent = error;
  }
  if (!valid) inputRss.classList.add('is-invalid');
  if (!error && valid) {
    inputRss.classList.add('is-valid');
    responseRss.textContent = i18next.t('succesText');
    responseRss.classList.add('text-success');
  }
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
  document.body.appendChild(bgFadeEl).className = 'modal-backdrop fade show';
};

const renderClickedLinks = (ids) => {
  if (!ids) return;
  // console.log('ids=>>>', ids);
  ids.forEach((id) => {
    const aEl = document.querySelector(`[data-id="${id}"]`);
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
  document.querySelector('.btn-close-modal').textContent = i18next.t(
    'modal.closeModalButton',
  );
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
    // @ts-ignore
    if (e.target.id === 'modal') closeBtn(modalEl, bgFadeEl);
  });
};

const makePostsEvents = (posts) => {
  const postsListContainer = document.getElementById('posts-list');
  postsListContainer.addEventListener('click', (e) => {
    // @ts-ignore
    const { id: btnId } = e.target.dataset;
    if (!btnId) return;
    const { title, description, link } = posts.find(({ id }) => id === btnId);
    showModal(title, description, link);
    // @ts-ignore
    e.target.classList.remove('font-weight-bold');
    // @ts-ignore
    e.target.classList.add('font-weight-normal');
  });
};

const renderFeeds = (feeds, feedsContainer) => {
  const feedsCol = feedsContainer.firstElementChild;
  feedsCol.innerHTML = [
    `<h2 id="feedsTitle">${i18next.t('feedsTitle')}</h2>`,
    '<ul class="list-group mb-5">',
    `${feeds
      .map(({ title, description }) => [
        '<li class="list-group-item">',
        `<h3>${title}</h3>`,
        `<p>${description}</p></li>`,
      ].join(''))
      .join('')}`,
    '</ul >',
  ].join('');
};

const renderPosts = (posts, clickedPosts, postsContainer) => {
  const postsCol = postsContainer.firstElementChild;
  postsCol.innerHTML = [
    `<h2 id="postsTitle">${i18next.t('postsTitle')}</h2>`,
    '<ul class="list-group mb-5" id="posts-list">',
    `${posts
      .map(({ title, link, id }) => [
        '<li class="list-group-item d-flex justify-content-between align-items-start">',
        `<a role="link" href="${link}" target="_blank" data-id="${id}" data-testid="post-link" rel="Post title" class="post-link font-weight-bold">${title}</a>`,
        `<button role="button" type="button" class="btn btn-primary btn-small btn-modal" data-id="${id}" data-testid="preview" data-toggle="modal" data-target="#modal">${i18next.t('postsButtonPreview')}</button>`,
        '</li>',
      ].join(''))
      .join('')}`,
    '</ul>',
  ].join('');
  makePostsEvents(posts);
  renderClickedLinks(clickedPosts);
};

const changeForm = ({ status, error }, { buttonRss, inputRss, responseRss }) => {
  switch (status) {
    case 'idle':
      inputRss.removeAttribute('readonly');
      inputRss.value = '';
      buttonRss.disabled = false;
      return;
    case 'loading':
      responseRss.classList.remove('text-danger');
      inputRss.setAttribute('readonly', true);
      buttonRss.disabled = true;
      responseRss.textContent = '';
      return;
    case 'failed':
      inputRss.removeAttribute('readonly');
      buttonRss.disabled = false;
      if (error) renderResponse({ error }, { inputRss, responseRss });
      return;
    default:
      throw Error(`Unknow form status: "${status}"`);
  }
};

export default (state, elements) => {
  elements.inputRss.focus();

  // ! Controllers
  const mapping = {
    form: (value) => renderResponse(value, elements),
    feeds: (feeds) => renderFeeds(feeds, elements.feedsContainer),
    posts: (posts) => renderPosts(posts, state.clickedPosts, elements.postsContainer),
    lng: (language) => switchLanguage(language),
    clickedPostIds: (ids) => renderClickedLinks(ids),
    loadingData: (loadingInfo) => changeForm(loadingInfo, elements),
  };

  const watchedState = onChange(state, (path, value) => {
    // console.log('path=>>', path);
    // console.log('value=>>', value);
    if (!mapping[path]) return;
    mapping[path](value);
  });

  return watchedState;
};
