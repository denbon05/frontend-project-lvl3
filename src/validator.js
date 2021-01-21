import * as yup from 'yup';
import i18next from 'i18next';

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

	return schema.validate(url);
};

export default validate;