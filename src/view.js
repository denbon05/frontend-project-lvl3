import onChange from 'on-change';

const renderFeeds = (feed, posts) => {

};

const initView = (state, elements) => {
	elements.inputRss.focus();

	const mapping = {
		'form.status': null,
	};
	
	const watchedState = onChange(state, (path, value) => {

	});

	return watchedState;
};

export default initView;
