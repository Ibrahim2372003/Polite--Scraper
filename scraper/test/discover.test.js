import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toAbsoluteUrl } from '../src/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');

let cheerio = null;
try {
  cheerio = await import('cheerio');
} catch {
  cheerio = null;
}
const maybeTest = cheerio ? test : test.skip;

maybeTest('finds every book link and the next link on a listing page', () => {
  const base = 'https://books.toscrape.com/catalogue/page-1.html';
  const $ = cheerio.load(fixture('listing-page.html'));

  const links = $('article.product_pod h3 a')
    .map((_, el) => toAbsoluteUrl($(el).attr('href'), base))
    .get();

  assert.equal(links.length, 2);
  assert.equal(links[0], 'https://books.toscrape.com/catalogue/book-one_1/index.html');
  assert.equal(links[1], 'https://books.toscrape.com/catalogue/book-two_2/index.html');

  const next = toAbsoluteUrl($('li.next a').attr('href'), base);
  assert.equal(next, 'https://books.toscrape.com/catalogue/page-2.html');
});
