import * as cheerio from 'cheerio';
import { politeFetch, cacheKeyForUrl } from './fetcher.js';

/**
 * Fetch and parse one book detail page into the raw 8-field record the
 * assignment specifies. Selectors are aimed at the product area
 * (div.product_main) rather than "the first price on the page" — this
 * page happens to have only one price today, but aiming narrow means it
 * won't quietly break the day that changes.
 *
 * Returns { ok: true, raw } on success, or { ok: false, url, error } if
 * the page itself could not be fetched — this function never throws, so
 * one bad page can't crash the run.
 */
export async function extractBookRecord(bookUrl, sourcePage) {
  const cacheKey = cacheKeyForUrl(bookUrl, 'book');
  const result = await politeFetch(bookUrl, cacheKey);

  if (!result.ok) {
    return { ok: false, url: bookUrl, error: result.error || `HTTP ${result.status}` };
  }

  const $ = cheerio.load(result.html);
  const main = $('div.product_main');

  const title = main.find('h1').text().trim();
  const price_text = main.find('p.price_color').first().text().trim();
  const availability_text = main
    .find('p.instock.availability')
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  const ratingClass = main.find('p.star-rating').attr('class') || '';
  const ratingWord = ratingClass.replace('star-rating', '').trim();
  const rating_text = ratingWord || null;

  // The description, when present, is the single <p> right after the
  // #product_description heading block. Some books genuinely have none —
  // store null rather than inventing text that was never on the page.
  const descriptionParagraph = $('#product_description').next('p');
  const description = descriptionParagraph.length ? descriptionParagraph.text().trim() : null;

  const raw = {
    title,
    product_url: bookUrl,
    price_text,
    availability_text,
    rating_text,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };

  return { ok: true, raw };
}
