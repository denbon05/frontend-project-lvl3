import * as yup from 'yup';

const validate = (url, feeds) => {
  yup.setLocale({
    mixed: {
      required: () => 'errors.required',
    },
    string: {
      url: () => 'errors.validURL',
    },
  });

  const links = feeds.map((feed) => feed.link);

  const schema = yup
    .string()
    .url()
    .trim()
    .required()
    .notOneOf(links, () => 'errors.existRss');

  try {
    schema.validateSync(url);
  } catch (error) {
    return error;
  }
  return null;
};

export default validate;
