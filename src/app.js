import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import initView from './view';
import resources from './locales';

const defaulLanguage = 'en';

const validate = (url, feeds) => {
	yup.setLocale({
		string: {
			url: i18next.t('errors.validURL'),
			required: i18next.t('errors.required'),
		},
	});

	const links = feeds.map((feed) => feed.link);

	const schema = yup
		.string()
		.url()
		.trim()
		.required()
		.notOneOf(links, () => i18next.t('errors.existRss', { url }));

	try {
		schema.validateSync(url);
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

const getRSS = (url) => {
	// https://api.allorigins.win/raw?url=https://example.org/
	const proxyurl = 'https://cors-anywhere.herokuapp.com/';
	const requestUrl = `${proxyurl}${url}`;
	// console.log('requestUrl+>', requestUrl);
	// const requestUrl = url;
	return axios
		.get(requestUrl)
		.then((response) => {
			// console.log('response=>', response);
			const { data } = response;
			// console.log('data=>', data);
			const parser = new DOMParser();
			const parsedData = parser.parseFromString(data, 'application/xml');
			// console.log('parsedData=>', JSON.stringify(parsedData, null, 2));
			const rssElement = parsedData.querySelector('rss');
			if (rssElement) {
				return { err: null, rssElement };
			}
			return { err: i18next.t('errors.sourceWithoutRss') };
		})
		.catch((err) => {
			console.log('err.message=>', err.message);
			return { err: err.message };
		});
};

const makePostsEvents = (clickedIds) => {
	const postsLinksEl = document.getElementsByClassName('post-link');
	Object.values(postsLinksEl).forEach((linkEl) => {
		linkEl.addEventListener('mouseup', (e) => {
			const clickedElId = e.target.dataset.id;
			clickedIds.push(clickedElId);
		});
	});
};

const autoupdateState = (state) => {
	const { form, posts, clickedPosts } = state;
	const links = state.feeds.map(({ link, id }) => ({ link, id }));
	links.forEach(({ link, id }) => {
		getRSS(link).then(({ err, rssElement }) => {
			if (err) {
				state.netError = err;
			} else {
				const newPosts = getNewPosts(posts, rssElement, id);
				if (newPosts) {
					state.posts = {
						allIds: newPosts.allIds.concat(posts.allIds),
						byId: { ...posts.byId, ...newPosts.byId },
					};
					makePostsEvents(clickedPosts);
				}
				form.status = 'filling';
			}
		});
	});
	setTimeout(() => {
		autoupdateState(state);
	}, 5000);
};

export default () => {
	i18next.init({
		lng: defaulLanguage,
		debug: true,
		resources,
	});

	const state = {
		lng: i18next.language,
		feeds: [],
		posts: { byId: {}, allIds: [] },
		clickedPosts: [],
		netError: null,
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

	const lngButtons = document.getElementsByClassName('lng-btn');
	Object.values(lngButtons).forEach((btnEl) => {
		btnEl.addEventListener('click', (e) => {
			e.preventDefault();
			watched.lng = e.target.id;
		});
	});

	elements.formRss.addEventListener('submit', (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const url = formData.get('url');
		const error = validate(url, state.feeds);
		if (error) {
			console.log('error_validate=>', error, ' |URL is=>', url);
			watched.form.field.url = { error, valid: false };
			return;
		}
		watched.form.field.url = { error: null, valid: true };
		watched.form.status = 'loading';
		getRSS(url).then(({ err, rssElement }) => {
			if (err) {
				watched.form.status = 'failed';
				watched.form.field.url = { error: err, valid: false };
			} else {
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
				autoupdateState(watched);
				makePostsEvents(watched.clickedPosts);
			}
		});
	});
};
