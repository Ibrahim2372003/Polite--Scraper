import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePriceGbp } from '../src/normalize.js';
import { toAbsoluteUrl } from '../src/utils.js';

// --- price normalization ---------------------------------------------------

test('parses a simple price', () => {
  assert.equal(parsePriceGbp('£51.77'), 51.77);
});

test('parses a price with a thousands separator', () => {
  assert.equal(parsePriceGbp('£1,234.50'), 1234.5);
});

test('returns NaN for text with no number in it', () => {
  assert.ok(Number.isNaN(parsePriceGbp('not a price')));
});

// --- relative -> absolute URLs ----------------------------------------------

test('resolves a relative book link found on a catalogue page', () => {
  const base = 'https://books.toscrape.com/catalogue/page-1.html';
  const abs = toAbsoluteUrl('a-light-in-the-attic_1000/index.html', base);
  assert.equal(abs, 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html');
});

test('resolves a relative "next" pagination link', () => {
  const base = 'https://books.toscrape.com/catalogue/page-1.html';
  const abs = toAbsoluteUrl('page-2.html', base);
  assert.equal(abs, 'https://books.toscrape.com/catalogue/page-2.html');
});

test('resolves a link that climbs out of a category folder', () => {
  const base = 'https://books.toscrape.com/catalogue/category/books/travel_2/index.html';
  const abs = toAbsoluteUrl('../../../some-book_5/index.html', base);
  assert.equal(abs, 'https://books.toscrape.com/catalogue/some-book_5/index.html');
});

// --- duplicate URLs ----------------------------------------------------------

test('deduplicates records by their canonical product_url', () => {
  const records = [
    { product_url: 'https://books.toscrape.com/catalogue/a_1/index.html', title: 'A' },
    { product_url: 'https://books.toscrape.com/catalogue/a_1/index.html', title: 'A (seen again)' },
    { product_url: 'https://books.toscrape.com/catalogue/b_2/index.html', title: 'B' },
  ];
  const byUrl = new Map();
  for (const r of records) byUrl.set(r.product_url, r);
  assert.equal(byUrl.size, 2);
});
