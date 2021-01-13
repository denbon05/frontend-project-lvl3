// @ts-check
/* eslint import/no-extraneous-dependencies: 0  */
/* eslint-disable */ 

import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import axios from 'axios';
import { nodeName } from 'jquery';
import resources from '../src/locales';
import app from '../src/app';

// If you are using jsdom, axios will default to using the XHR adapter which
// can't be intercepted by nock. So, configure axios to use the node adapter.
//
// References:
// https://github.com/nock/nock/issues/699#issuecomment-272708264
// https://github.com/axios/axios/issues/305
axios.defaults.adapter = require('axios/lib/adapters/http');

const getPath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filename) => fs.readFileSync(getPath(filename), 'utf-8');
nock.disableNetConnect();

const proxyurl = 'https://cors-anywhere.herokuapp.com/';
const { en, pl } = resources;
const rss1 = readFile('1.rss');
const rss2 = readFile('2.rss');
const rssLink1 = 'https://news.rambler.ru/rss/photo/';
const rssLink2 = 'http://lorem-rss.herokuapp.com/feed';
const nonRssLink = 'https://google.com';
const elements = {};

const getTranslationByLng = (lng = en) => lng.translation;

const applyNock = (url, response) => {
  nock(proxyurl).get(`/${url}`).reply(200, { contents: response });
};

beforeEach(async () => {
  const pathToHtml = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(pathToHtml, 'utf-8');
  document.body.innerHTML = html;

  elements.input = screen.getByTestId('rssInput');
  elements.submit = screen.getByTestId('buttonAdd');

  app();
});

describe('Show errors in form', () => {
  const hasContent = (content, node) => {
    console.log('node.textContent==>>>', node.textContent);
    console.log('content=>', content);
    return node.textContent.trim() === content.trim();
  };

  test('Validation: URL', async () => {
    userEvent.type(elements.input, 'not_url');
    userEvent.click(elements.submit);
    const { errors } = getTranslationByLng(en);
    expect(screen.getByText(new RegExp(errors.validURL, 'i'))).toBeInTheDocument();
  });

  // test('Validation: incorect RSS link', async () => {
  // 	applyNock(nonRssLink, 'invalid');

  // 	userEvent.type(elements.input, nonRssLink);
  // 	userEvent.click(elements.submit);
  // 	const { errors } = getTranslationByLng(en);
  // 	expect(await screen.findByText(errors.sourceWithoutRss)).toBeInTheDocument();
  // });

  test('Validation: RSS feed already exist', async () => {
    applyNock(rssLink1, rss1);

    // const { erros } = getTranslationByLng(en);

    userEvent.type(elements.input, rssLink1);
    expect(elements.submit).not.toBeDisabled();
    userEvent.click(elements.submit);
    expect(elements.submit).toBeDisabled();

    await waitFor(() => expect(elements.submit).not.toBeDisabled());
    await waitFor(() => expect(elements.input.value).toBe(''));

    // userEvent.type(elements.input, rssLink1);
    // expect(await screen.findByText(new RegExp(erros.existRss, 'i'))).toBeInTheDocument();
  });
});
