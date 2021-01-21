// @ts-check

import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import { screen, waitFor, getByText, findByText } from '@testing-library/dom';
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

const getPath = (filename) =>
	path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filename) => fs.readFileSync(getPath(filename), 'utf-8');
nock.disableNetConnect();

// const proxyurl = 'https://cors-anywhere.herokuapp.com/';
// axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(baseURL)}`);
const proxyurl = 'https://hexlet-allorigins.herokuapp.com';
const { en, pl } = resources;
const rss1 = readFile('1.rss');
const rss2 = readFile('2.rss');
const rssLink1 = 'https://news.rambler.ru/rss/photo/';
const rssLink2 = 'https://www.cire.pl/rss/kraj.xml';
const nonRssLink = 'https://google.com';
const elements = {};

const getTranslationByLng = (lng = en) => lng.translation;

const applyNock = (url, response, statusCode = 200) => {
	nock(proxyurl).persist().get(`/${url}`).reply(statusCode, response);
};

beforeEach(async () => {
	const pathToHtml = path.resolve(__dirname, '..', 'index.html');
	const html = fs.readFileSync(pathToHtml, 'utf-8');
	document.body.innerHTML = html;

	elements.input = screen.getByRole('textbox', { name: 'url' });
	elements.submit = screen.getByRole('button', { name: 'add' });
	elements.responseEl = screen.getByRole('doc-noteref');

	app();
});

describe('Show errors in form', () => {
	const { errors } = getTranslationByLng(en);

	test('Validation: URL', async () => {
		userEvent.type(elements.input, 'not_url');
		userEvent.click(elements.submit);
		await waitFor(() =>
			expect(
				screen.getByText(new RegExp(errors.validURL, 'i'))
			).toBeInTheDocument()
		);
	});

	test('Validation: incorect RSS link', async () => {
		applyNock(nonRssLink, 'invalid');

		userEvent.type(elements.input, nonRssLink);
		userEvent.click(elements.submit);
		await waitFor(() =>
			expect(
				getByText(elements.responseEl, new RegExp(errors.sourceWithoutRss, 'i'))
			).toBeInTheDocument()
		);
	});

	test('Validation: RSS feed already exist & check disable button', async () => {
		applyNock(rssLink1, rss1);

		userEvent.type(elements.input, rssLink1);
		expect(elements.submit).toBeEnabled();
		userEvent.click(elements.submit);
		expect(elements.submit).toBeDisabled();

		await waitFor(() => expect(elements.submit).toBeEnabled());
		expect(elements.input.value).toBe('');

		userEvent.type(elements.input, rssLink1);
		userEvent.click(elements.submit);
		expect(elements.submit).toBeDisabled();
		await waitFor(() => expect(elements.submit).toBeEnabled());
		const container = document.getElementById('response');
		expect(
			await findByText(container, errors.existRss.split(':')[0], {
				exact: false,
			})
		).toBeVisible();
	});

	test('RSS feeds add', async () => {
		applyNock(rssLink1, rss1);
		applyNock(rssLink2, rss2);

		userEvent.type(elements.input, rssLink1);
		userEvent.click(elements.submit);
		expect(elements.input).toHaveAttribute('readonly');

		expect(await screen.findByText(/Rss has been loaded/i)).toBeInTheDocument();
		expect(
			await screen.findByText(/Фото — Рамблер\/новости/i)
		).toBeInTheDocument();
		expect(
			await screen.findByText(/В аэропорту Йемена прогремел мощный взрыв/i)
		).toBeInTheDocument();

		userEvent.type(elements.input, rssLink2);
		userEvent.click(elements.submit);
		expect(
			await screen.findByText(/www\.cire\.pl - Wiadomości - kraj/i)
		).toBeInTheDocument();
		expect(
			await screen.findByText(/CIRE\.pl - Centrum Informacji o Rynku Energii/i)
		).toBeInTheDocument();
	});

	test('Clicked links', async () => {
		applyNock(rssLink2, rss2);

		userEvent.type(elements.input, rssLink2);
		userEvent.click(elements.submit);

		const postLinks = await screen.findAllByTestId('post-link');
		expect(postLinks[2]).toHaveClass('font-weight-bold');
		userEvent.click(postLinks[2]);
		const updatedPostLinks = await screen.findAllByTestId('post-link');
		expect(updatedPostLinks[2]).not.toHaveClass('font-weight-bold');
		expect(updatedPostLinks[2]).toHaveClass('font-weight-normal');
		expect(updatedPostLinks[1]).toHaveClass('post-link font-weight-bold');
	});
});

test('Switch language to Poland', async () => {
	applyNock(rssLink1, rss1);
	const btnsContainer = document.getElementById('switchLng');
	const plBtn = await findByText(btnsContainer, 'pl');
	expect(plBtn).toBeInTheDocument();
	userEvent.click(plBtn);
	const translation = getTranslationByLng(pl);
	expect(
		await screen.findByText(translation.form.mainTitle)
	).toBeInTheDocument();
	expect(
		await screen.findByText(translation.form.formLead)
	).toBeInTheDocument();
	userEvent.type(elements.input, rssLink1);
	userEvent.click(elements.submit);
	expect(await screen.findByText(translation.succesText)).toBeInTheDocument();
});

test('Show modal', async () => {
	applyNock(rssLink2, rss2);
	userEvent.type(elements.input, rssLink2);
	userEvent.click(elements.submit);
	const previewBtns = await screen.findAllByRole('button', {
		name: /preview/i,
	});
	expect(
		screen.getByRole('link', { name: /Sigma z rekordowym wzrostem sprzedaży/i })
	).toHaveClass('font-weight-bold');
	userEvent.click(previewBtns[1]);
	expect(await screen.findByText('Full article')).toBeVisible();
	const closeBtn = screen.getByText('Close');
	userEvent.click(closeBtn);
	expect(await screen.findByText('Full article')).not.toBeVisible();
});
