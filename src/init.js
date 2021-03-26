// @ts-check

import i18next from 'i18next';
import resources from './locales';

export default (lng = 'ru') => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng,
    resources,
  });
  return i18nextInstance;
};
