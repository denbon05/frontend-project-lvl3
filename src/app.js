import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import initView from './view';
import resources from './locales';
import validate from './validator';

const defaulLanguage = 'en';

const getTitleInfo = (rssElement) => {
	const channelElement = rssElement.querySelector('channel');
	const titleElement = channelElement.querySelector('title');
	const descriptionElement = channelElement.querySelector('description');
	return {
		title: titleElement.textContent,
		description: descriptionElement.textContent,
	};
};

const parseRSSItem = (rssItem) => ({
	link: rssItem.querySelector('link').textContent,
	title: rssItem.querySelector('title').textContent,
	description: rssItem.querySelector('description').textContent,
});

const makePosts = (items, feedId) =>
	items.reduce(
		(acc, item) => {
			const id = _.uniqueId();
			acc.byId[id] = {
				...parseRSSItem(item),
				id,
				feedId,
			};
			acc.allIds.push(id);
			return acc;
		},
		{ byId: {}, allIds: [] }
	);

const getNewPosts = (oldPosts, rssElement, feedId) => {
	const { allIds, byId } = oldPosts;
	const rssItems = rssElement.getElementsByTagName('item');
	const newPosts = Object.values(rssItems).filter((item) => {
		const { title, description } = parseRSSItem(item);
		return !allIds.some(
			(id) => byId[id].title === title && byId[id].description === description
		);
	});
	if (newPosts.length === 0) return null;
	return makePosts(newPosts, feedId);
};

const getPosts = (rssElement, feedId) => {
	const items = rssElement.getElementsByTagName('item');
	return makePosts(Object.values(items), feedId);
};

const parseRss = (data) => {
	const parser = new DOMParser();
	const parsedData = parser.parseFromString(data.contents, 'application/xml');
	const rssElement = parsedData.querySelector('rss');
	if (rssElement) return Promise.resolve(rssElement);
	throw Error(i18next.t('errors.sourceWithoutRss'));
};

const getRSS = (baseURL) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(baseURL)}`);

const makePostsEvents = (clickedIds) => {
	const postsLinksEl = document.getElementsByClassName('post-link');
	Object.values(postsLinksEl).forEach((linkEl) => {
		linkEl.addEventListener('mouseup', (e) => {
			const clickedElId = e.target.dataset.id;
			clickedIds.push(clickedElId);
		});
	});
};

const autoupdateState = (state, updateThrough = 5000) => {
	const { form, posts, clickedPosts } = state;
	const links = state.feeds.map(({ link, id }) => ({ link, id }));
	links.forEach(({ link, id }) => {
		getRSS(link).then((response) =>
			parseRss(response.data).then(
				(rssElement) => {
					const newPosts = getNewPosts(posts, rssElement, id);
					if (newPosts) {
						state.posts = {
							allIds: newPosts.allIds.concat(posts.allIds),
							byId: { ...posts.byId, ...newPosts.byId },
						};
						makePostsEvents(clickedPosts);
					}
					form.status = 'filling';
				},
				(error) => {
					form.fields.url = { valid: true, error };
					return Promise.reject(error);
				}
			)
		);
	});
	setTimeout(() => {
		autoupdateState(state);
	}, updateThrough);
};

export default () => {
	i18next.init({
		lng: defaulLanguage,
		// debug: true,
		resources,
	});

	const state = {
		lng: i18next.language,
		feeds: [],
		value: '',
		posts: { byId: {}, allIds: [] },
		clickedPosts: [],
		form: {
			status: 'filling',
			fields: {
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
		responseRss: document.getElementById('response'),
		rssContainer: document.getElementById('rssContainer'),
		feedsContainer: document.getElementById('feedsContainer'),
		postsContainer: document.getElementById('postsContainer'),
	};

	const watched = initView(state, elements);

	elements.inputRss.addEventListener('input', ({ target: { value } }) => {
		watched.value = value;
	});

	const lngButtons = document.getElementsByClassName('lng-btn');
	Object.values(lngButtons).forEach((btnEl) => {
		btnEl.addEventListener('click', (e) => {
			e.preventDefault();
			watched.lng = e.target.id;
		});
	});

	elements.formRss.addEventListener('submit', (e) => {
		e.preventDefault();
		watched.form.status = 'loading';
		const formData = new FormData(e.target);
		const url = formData.get('url');
		const { fields } = watched.form;
		validate(url, state.feeds)
			.then(
				() => getRSS(url),
				(err) => Promise.reject(err)
			)
			.then(
				(response) => {
					const { data } = response;
					return parseRss(data);
				},
				(err) => Promise.reject(err)
			)
			.then(
				(rssElement) => {
					fields.url = { error: null, valid: true };
					// console.log('rssElement=>>>', rssElement);
					const id = _.uniqueId();
					watched.feeds.push({
						...getTitleInfo(rssElement),
						link: url,
						id,
					});
					const newPosts = getPosts(rssElement, id);
					watched.posts = {
						allIds: newPosts.allIds.concat(state.posts.allIds),
						byId: { ...newPosts.byId, ...state.posts.byId },
					};
					watched.form.status = 'filling';
					fields.url = { error: null, valid: true };
					makePostsEvents(watched.clickedPosts);
					return autoupdateState(watched);
				},
				(err) => Promise.reject(err)
			)
			.catch((err) => {
				// console.log('MAIN-err-message->', err.message);
				fields.url = { error: err.message, valid: false };
				watched.form.status = 'failed';
			});
	});
};
