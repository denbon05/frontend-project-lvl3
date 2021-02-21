// @ts-check

import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import {
  screen, waitFor, getByText, findByText,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import axios from 'axios';
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

// const proxyurl = 'https://cors-anywhere.herokuapp.com/';
// axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(baseURL)}`);
const proxyurl = 'https://hexlet-allorigins.herokuapp.com/';

const { en, ru } = resources;
const rss1Data = readFile('1.rss');
const rss2Data = readFile('2.rss');
const rssLink1 = 'https://news.rambler.ru/rss/photo/';
const rssLink2 = 'http://feeds.linuxportal.pl/LinuxPortalpl-news';
const nonRssLink = 'https://google.com';
const elements = {};

const applyNock = (url, responseData, statusCode = 200) => {
  nock(proxyurl)
    .persist()
    .get('/get')
    .query({ url, disableCache: true })
    .reply(statusCode, { contents: responseData });
};

beforeEach(async () => {
  const pathToHtml = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(pathToHtml, 'utf-8');
  document.body.innerHTML = html;

  elements.input = screen.getByRole('textbox', { name: 'url' });
  elements.submit = screen.getByRole('button', { name: 'add' });
  elements.responseEl = screen.getByRole('doc-noteref');
  elements.resContainer = document.getElementById('response');

  app();
});

describe('Show errors in form', () => {
  const { errors } = ru.translation;

  test('Validation: URL', async () => {
    userEvent.type(elements.input, 'not_url');
    userEvent.click(elements.submit);
    await waitFor(() => expect(
      screen.getByText(new RegExp(errors.validURL, 'i')),
    ).toBeInTheDocument());
  });

  test('Validation: incorect RSS link', async () => {
    applyNock(nonRssLink, 'invalid');

    userEvent.type(elements.input, nonRssLink);
    userEvent.click(elements.submit);
    await waitFor(() => expect(
      getByText(elements.responseEl, new RegExp(errors.sourceWithoutRss, 'i')),
    ).toBeInTheDocument());
  });

  test('Validation: RSS feed already exist & check disable button', async () => {
    applyNock(rssLink1, rss1Data);

    userEvent.type(elements.input, rssLink1);
    expect(elements.submit).toBeEnabled();
    userEvent.click(elements.submit);
    expect(elements.submit).toBeDisabled();

    await waitFor(() => expect(elements.submit).toBeEnabled());
    expect(elements.input.value).toBe('');
    userEvent.type(elements.input, rssLink1);
    userEvent.click(elements.submit);
    expect(
      await findByText(elements.resContainer, errors.existRss.split(':')[0], {
        exact: false,
      }),
    ).toBeVisible();
    expect(elements.input.value).toBe(rssLink1);
  });
});

describe('Positive cases', () => {
  test('RSS feeds add', async () => {
    const { translation } = ru;
    applyNock(rssLink1, rss1Data);
    applyNock(rssLink2, rss2Data);

    userEvent.type(elements.input, rssLink1);
    userEvent.click(elements.submit);
    expect(elements.input).toHaveAttribute('readonly');

    expect(await screen.findByText(translation.succesText)).toBeInTheDocument();
    expect(
      await screen.findByText(/Фото — Рамблер\/новости/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/В аэропорту Йемена прогремел мощный взрыв/i),
    ).toBeInTheDocument();

    userEvent.type(elements.input, rssLink2);
    userEvent.click(elements.submit);
    expect(
      await screen.findByText(/www\.cire\.pl - Wiadomości - kraj/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/CIRE\.pl - Centrum Informacji o Rynku Energii/i),
    ).toBeInTheDocument();
  });

  test('Clicked links or buttons && Show modal', async () => {
    applyNock(rssLink2, rss2Data);
    const { translation } = ru;

    userEvent.type(elements.input, rssLink2);
    userEvent.click(elements.submit);

    const postLinks = await screen.findAllByTestId('post-link');
    const previewBtns = await screen.findAllByTestId('preview');
    expect(postLinks[2]).toHaveClass('font-weight-bold');
    userEvent.click(postLinks[2]);
    userEvent.click(previewBtns[4]);
    const updatedPostLinks = await screen.findAllByTestId('post-link');
    expect(updatedPostLinks[2]).not.toHaveClass('font-weight-bold');
    expect(updatedPostLinks[4]).not.toHaveClass('font-weight-bold');
    expect(updatedPostLinks[4]).toHaveClass('font-weight-normal');
    expect(updatedPostLinks[2]).toHaveClass('font-weight-normal');
    expect(updatedPostLinks[3]).toHaveClass('post-link font-weight-bold');
    expect(await screen.findByText(translation.modal.oppenLinkButton)).toBeVisible();
    const closeBtn = screen.getByText(translation.modal.closeModalButton);
    userEvent.click(closeBtn);
    expect(await screen.findByText(translation.modal.oppenLinkButton)).not.toBeVisible();
  });
});

test('Switch language to English', async () => {
  applyNock(rssLink1, rss1Data);

  const btnsContainer = document.getElementById('switchLng');
  const enBtn = await findByText(btnsContainer, 'en');
  expect(enBtn).toBeInTheDocument();
  userEvent.click(enBtn);
  const { translation } = en;
  expect(
    await screen.findByText(translation.form.mainTitle),
  ).toBeInTheDocument();
  // expect(
  //   await screen.findByText(translation.form.buttonAdd),
  // ).toBeInTheDocument();
  // userEvent.type(elements.input, rssLink1);
  // userEvent.click(elements.submit);
  // expect(await screen.findByText(translation.succesText)).toBeInTheDocument();
});
