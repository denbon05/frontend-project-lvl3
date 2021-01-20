import i18next from 'i18next';
import onChange from 'on-change';
import resources from './locales';

const typing = ({ inputRss, responseRss }) => {
	inputRss.className = 'form-control form-control-lg w-80';
	responseRss.textContent = '';
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

const rederForm = (status, { buttonRss, inputRss, responseRss }) => {
	switch (status) {
		case 'filling':
			inputRss.readOnly = false;
			inputRss.value = '';
			buttonRss.disabled = false;
			return;
		case 'loading':
			inputRss.readOnly = true;
			buttonRss.disabled = true;
			responseRss.textContent = '';
			return;
		case 'failed':
			inputRss.readOnly = false;
			buttonRss.disabled = false;
			return;
		default:
			throw Error(`Unknow form status: "${status}"`);
	}
};

const renderResponse = ({ error, valid }, { responseRss, inputRss }) => {
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
	document.querySelector('.btn-close-modal').textContent = i18next.t(
		'modal.closeModalButton'
	);
	fullArticleButtonEl.textContent = i18next.t('modal.oppenLinkButton');
	modalTitleEl.textContent = title;
	modalBodyEl.innerHTML = `<p>${body}</p>`;
	fullArticleButtonEl.setAttribute('href', link);
	fullArticleButtonEl.setAttribute('target', '_blank');
	Object.values(closeModalBtns).forEach((closeBtnEl) =>
		closeBtnEl.addEventListener('click', (e) => {
			e.preventDefault();
			closeBtn(modalEl, bgFadeEl);
		})
	);
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

const renderFeeds = (feedsColl, feedsContainer) => {
	const feedsCol = feedsContainer.firstElementChild;
	feedsCol.innerHTML = [
		`<h2>${i18next.t('feedsTitle')}</h2>`,
		'<ul class="list-group mb-5">',
		`${feedsColl
			.map(({ title, description }) =>
				[
					'<li class="list-group-item">',
					`<h3>${title}</h3>`,
					`<p>${description}</p></li>`,
				].join('')
			)
			.join('')}`,
		'</ul >',
	].join('');
};

const renderPosts = (postsColl, clickedPosts, postsContainer) => {
	const { allIds, byId } = postsColl;
	const postsCol = postsContainer.firstElementChild;
	postsCol.innerHTML = [
		`<h2>${i18next.t('postsTitle')}</h2>`,
		'<ul class="list-group mb-5">',
		`${allIds
			.map((id) => {
				const { title, link } = byId[id];
				return [
					'<li class="list-group-item d-flex justify-content-between align-items-start">',
					`<a href="${link}" target="_blank" data-id="${id}" data-testid="post-link" rel="Post title" class="post-link font-weight-bold">${title}</a>`,
					`<button type="button" class="btn btn-primary btn-small btn-modal" data-id="${id}" data-testid="prewiew" data-toggle="modal" data-target="#modal">${i18next.t(
						'postsButtonPreview'
					)}</button>`,
					'</li>',
				].join('');
			})
			.join('')}`,
		'</ul>',
	].join('');
	makePostsEvents(postsColl);
	renderClickedLinks(clickedPosts);
};

export default (state, elements) => {
	elements.inputRss.focus();

	const mapping = {
		value: () => typing(elements),
		'form.status': (status) => rederForm(status, elements),
		'form.fields.url': (value) => renderResponse(value, elements),
		feeds: (feedsColl) => renderFeeds(feedsColl, elements.feedsContainer),
		posts: (postsColl) =>
			renderPosts(postsColl, state.clickedPosts, elements.postsContainer),
		lng: (language) => renderSwitchLngButton(language),
		clickedPosts: (ids) => renderClickedLinks(ids),
	};

	const watchedState = onChange(state, (path, value) => {
		// console.log('path=>', path);
		// console.log('value=>', value);
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
