/* eslint-disable */ 

import { resolve, join } from 'path';
import fs from 'fs';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import nock from 'nock';
import initApp from '@hexlet/code';
import locales from '../src/locales/en';
import { BASE_URL, ENDPOINT } from '../src/libs/api';

// If you are using jsdom, axios will default to using the XHR adapter which
// can't be intercepted by nock. So, configure axios to use the node adapter.
//
// References:
// https://github.com/nock/nock/issues/699#issuecomment-272708264
// https://github.com/axios/axios/issues/305
axios.defaults.adapter = require('axios/lib/adapters/http');

const getFixturePath = (filename) => join(__dirname, '__fixtures__', filename);
const readFile = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');
nock.disableNetConnect();
const { translation: texts } = locales;
const rss1 = readFile('1.rss');
const rss2 = readFile('2.rss');
const rssLink1 = 'https://news.rambler.ru/rss/world';
const rssLink2 = 'https://ru.hexlet.io/lessons.rss';
const nonRssLink = 'https://google.com';
const elements = {};

const applyNock = (url, response) => {
  nock(BASE_URL).get(ENDPOINT).query({ url }).reply(200, { contents: response });
};

beforeEach(async () => {
  const pathToHtml = resolve(__dirname, '../index.html');
  const html = fs.readFileSync(pathToHtml, 'utf8');
  document.body.innerHTML = html;

  elements.input = screen.getByRole('textbox', { name: 'url' });
  elements.submit = screen.getByTestId('submit');

  await initApp();
});

test('Validation: URL', async () => {
  userEvent.type(elements.input, 'not_url');
  expect(screen.getByText(new RegExp(texts.invalidURL, 'i'))).toBeInTheDocument();
});

test('Validation: incorrect RSS link', async () => {
  applyNock(nonRssLink, 'invalid');

  userEvent.type(elements.input, nonRssLink);
  userEvent.click(elements.submit);
  expect(await screen.findByText(new RegExp(texts.invalidRSS, 'i'))).toBeInTheDocument();
});

test('Validation: RSS feed already exists', async () => {
  applyNock(rssLink1, rss1);

  userEvent.type(elements.input, rssLink1);
  userEvent.click(elements.submit);
  expect(await screen.findByText(new RegExp(texts.sucessRSSLoad, 'i'))).toBeInTheDocument();
  expect(elements.input.value).toBe('');

  userEvent.type(elements.input, rssLink1);
  expect(await screen.findByText(new RegExp(texts.RSSExists, 'i'))).toBeInTheDocument();
});

test('Request sending form disabled', async () => {
  applyNock(rssLink1, rss1);

  userEvent.type(elements.input, rssLink1);
  userEvent.click(elements.submit);
  expect(elements.submit).toBeDisabled();
  expect(elements.input).toHaveAttribute('readonly');

  expect(await screen.findByText(new RegExp(texts.sucessRSSLoad, 'i'))).toBeInTheDocument();

  expect(elements.submit).toBeEnabled();
  expect(elements.input).not.toHaveAttribute('readonly');
});

test('Network error message', async () => {
  nock(BASE_URL).get(ENDPOINT).query({ url: rssLink1 }).reply(500);
  userEvent.type(elements.input, rssLink1);
  userEvent.click(elements.submit);
  expect(await screen.findByText(new RegExp(texts.networkProblems, 'i'))).toBeInTheDocument();
});

test('RSS feeds add', async () => {
  applyNock(rssLink1, rss1);
  applyNock(rssLink2, rss2);

  userEvent.type(elements.input, rssLink1);
  userEvent.click(elements.submit);
  expect(await screen.findByText(/В мире — Рамблер\/новости/i)).toBeInTheDocument();
  expect(await screen.findByText(/Все последние новости мира сегодня, аналитика событий в мире, мировые новости дня/i)).toBeInTheDocument();
  expect(await screen.findByText(/Россия создает армию в Крыму/i)).toBeInTheDocument();
  expect(await screen.findByText(/РФ обвинила Лукашенко в утрате связи с реальностью/i)).toBeInTheDocument();
  expect(await screen.findByText(/Украина отказалась от «Спутника V»/i)).toBeInTheDocument();

  userEvent.type(elements.input, rssLink2);
  userEvent.click(elements.submit);
  expect(await screen.findByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  expect(await screen.findByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  expect(await screen.findByText(/Стили текста \/ Основы вёрстки контента/i)).toBeInTheDocument();
  expect(await screen.findByText(/Сборщики \(Builders\) \/ JS: Объектно-ориентированный дизайн/i)).toBeInTheDocument();
  expect(await screen.findByText(/Комплексное состояние \/ JS: Архитектура фронтенда/i)).toBeInTheDocument();

  expect((await screen.findAllByText(new RegExp(texts.posts, 'i'))).length).toBe(1);
  const postLinks = await screen.findAllByTestId('post-link');
  expect(postLinks[0]).toHaveTextContent('Объекты-Сущности, Объекты-Значения и внедренные объекты / PHP: Объектно-ориентированный дизайн');
});

test('Preview news in modal', async () => {
  applyNock(rssLink2, rss2);

  userEvent.type(elements.input, rssLink2);
  userEvent.click(elements.submit);

  const previewBtns = await screen.findAllByTestId('preview');
  const postLinks = await screen.findAllByTestId('post-link');

  expect(postLinks[2]).toHaveClass('font-weight-bold');
  userEvent.click(previewBtns[2]);
  const updatedPostLinks = await screen.findAllByTestId('post-link');
  expect(updatedPostLinks[2]).not.toHaveClass('font-weight-bold');
  expect(updatedPostLinks[1]).toHaveClass('font-weight-bold');
  expect(await screen.findByText('Цель: Узнать о способах подключения и выбора шрифтов на странице. Научиться управлять размерами, оформлением и интервалами внутри текста. Изучить обобщённое свойство font')).toBeVisible();
});
