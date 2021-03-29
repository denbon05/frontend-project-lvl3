// @ts-check

import onChange from 'on-change';
import initLng from './init';

const i18n = initLng();

export const renderTemplateText = () => {
  const mainTitleEl = document.querySelector('.main-title');
  const leadEl = document.querySelector('.lead');
  const buttonAddEl = document.getElementById('buttonAdd');
  const exampleEl = document.getElementById('urlExample');
  const feedTitleEl = document.getElementById('feedsTitle');
  mainTitleEl.textContent = i18n.t('form.mainTitle');
  leadEl.textContent = i18n.t('form.formLead');
  buttonAddEl.textContent = i18n.t('form.buttonAdd');
  exampleEl.textContent = i18n.t('form.example');
  if (feedTitleEl) {
    feedTitleEl.textContent = i18n.t('feedsTitle');
    document.getElementById('postsTitle').textContent = i18n.t('postsTitle');
    Object.values(document.getElementsByClassName('btn-modal'))
      .forEach((btnEl) => {
        btnEl.textContent = i18n.t('postsButtonPreview');
      });
  }
};

const switchLanguage = (lng) => {
  i18n.changeLanguage(lng);
  const btnAdd = document.getElementById('buttonAdd');
  const lngButtons = document.getElementsByClassName('lng-btn');
  // @ts-ignore
  btnAdd.value = i18n.t('form.buttonAdd');
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
    responseRss.textContent = i18n.t('succesText');
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
  document.querySelector('.btn-close-modal').textContent = i18n.t(
    'modal.closeModalButton',
  );
  fullArticleButtonEl.textContent = i18n.t('modal.oppenLinkButton');
  modalTitleEl.textContent = title;
  modalBodyEl.innerHTML = '';
  const pElement = document.createElement('p');
  pElement.textContent = body;
  modalBodyEl.appendChild(pElement);
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
  feedsCol.innerHTML = '';
  const feedsTitleEl = document.createElement('h2');
  const ulEl = document.createElement('ul');
  feedsTitleEl.textContent = i18n.t('feedsTitle');
  feedsTitleEl.id = 'feedsTitle';
  ulEl.className = 'list-group mb-5';
  feeds.forEach(({ title, description }) => {
    const liEl = document.createElement('li');
    liEl.className = 'list-group-item';
    const feedTitleEl = document.createElement('h3');
    feedTitleEl.textContent = title;
    const descriptionPEl = document.createElement('p');
    descriptionPEl.textContent = description;
    liEl.appendChild(feedTitleEl);
    liEl.appendChild(descriptionPEl);
    ulEl.appendChild(liEl);
  });
  feedsCol.appendChild(feedsTitleEl);
  feedsCol.appendChild(ulEl);
};

const renderPosts = (posts, clickedPostIds, postsContainer) => {
  const postsCol = postsContainer.firstElementChild;
  const postsTitleEl = document.createElement('h2');
  const postsUlEl = document.createElement('ul');
  postsTitleEl.id = 'postsTitle';
  postsTitleEl.textContent = i18n.t('postsTitle');
  postsUlEl.className = 'list-group mb-5';
  postsUlEl.id = 'posts-list';
  postsCol.appendChild(postsTitleEl);
  postsCol.appendChild(postsUlEl);
  posts.forEach(({ title, link, id }) => {
    const liEl = document.createElement('li');
    liEl.className = 'list-group-item d-flex justify-content-between align-items-start';
    const aEl = document.createElement('a');
    aEl.setAttribute('role', 'link');
    aEl.setAttribute('href', link);
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'Post title');
    aEl.dataset.id = id;
    aEl.dataset.testid = 'post-link';
    const fontWeight = clickedPostIds.includes(id) ? 'font-weight-normal' : 'font-weight-bold';
    aEl.className = `post-link ${fontWeight}`;
    aEl.textContent = title;
    const modalBtnEl = document.createElement('button');
    modalBtnEl.setAttribute('role', 'button');
    modalBtnEl.setAttribute('type', 'button');
    modalBtnEl.dataset.id = id;
    modalBtnEl.dataset.testid = 'preview';
    modalBtnEl.dataset.target = '#modal';
    modalBtnEl.dataset.toggle = 'modal';
    modalBtnEl.textContent = i18n.t('postsButtonPreview');
    modalBtnEl.className = 'btn btn-primary btn-small btn-modal';
    liEl.appendChild(aEl);
    liEl.appendChild(modalBtnEl);
    postsUlEl.appendChild(liEl);
  });
  makePostsEvents(posts);
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
    posts: (posts) => renderPosts(posts, state.clickedPostIds, elements.postsContainer),
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
