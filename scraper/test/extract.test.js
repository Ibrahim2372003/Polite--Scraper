import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');

// cheerio is a real dependency of the project but isn't installed in every
// environment these tests might run in before `npm install` has been done.
// Skip (not fail) instead of crashing the whole test file when it's absent.
let cheerio = null;
try {
  cheerio = await import('cheerio');
} catch {
  cheerio = null;
}
const maybeTest = cheerio ? test : test.skip;

maybeTest('extracts the description when the book has one', () => {
  const $ = cheerio.load(fixture('detail-page-with-description.html'));
  const desc = $('#product_description').next('p').text().trim();
  assert.equal(desc, 'A short description for testing.');
});

maybeTest('finds no description node when the book has none, instead of guessing', () => {
  const $ = cheerio.load(fixture('detail-page-no-description.html'));
  const node = $('#product_description').next('p');
  assert.equal(node.length, 0);
});

maybeTest('collapses the multi-line availability text into one clean string', () => {
  const $ = cheerio.load(fixture('detail-page-with-description.html'));
  const availability = $('p.instock.availability').text().replace(/\s+/g, ' ').trim();
  assert.equal(availability, 'In stock (22 available)');
});

maybeTest('reads the rating word out of the star-rating class list', () => {
  const $ = cheerio.load(fixture('detail-page-with-description.html'));
  const ratingClass = $('div.product_main p.star-rating').attr('class') || '';
  const word = ratingClass.replace('star-rating', '').trim();
  assert.equal(word, 'Three');
});

maybeTest('a malformed page yields empty fields instead of throwing', () => {
  const $ = cheerio.load(fixture('detail-page-malformed.html'));
  const main = $('div.product_main');
  assert.equal(main.find('h1').text().trim(), '');
  assert.equal(main.find('p.price_color').first().text().trim(), '');
});
