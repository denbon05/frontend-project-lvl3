// @ts-check
/* eslint import/no-extraneous-dependencies: 0  */

import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import {
  screen, waitFor,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import run from '../src/app';

const pathToIndex = path.join(__dirname, '..', '__fixtures__', 'index.html');
const initialHtml = fs.readFileSync(pathToIndex, 'utf-8');
const elements = {};

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
  document.body.innerHTML = initialHtml;
  run();

  elements.submit = screen.getByRole('button');
  elements.input = screen.getByRole('textbox');
  // elements.todosBox = screen.getByRole('list');
});

test('form is disabled while submitting', async () => {
  const uri = 'http://lorem-rss.herokuapp.com/feed';
  const scope = nock('http://localhost');

  userEvent.type(elements.input, uri);
  expect(elements.submit).not.toBeDisabled();
  userEvent.click(elements.submit);
  expect(elements.submit).toBeDisabled();

  await waitFor(() => {
    expect(elements.submit).not.toBeDisabled();
  });

  // await waitFor(() => {
  //   expect(screen.getByRole('list')).toHaveTextContent('Posts');
  // });

  scope.done();
});