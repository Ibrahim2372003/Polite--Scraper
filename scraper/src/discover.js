import * as cheerio from 'cheerio';
import { politeFetch } from './fetcher.js';
import { CATALOGUE_START_URL, MAX_CATALOGUE_PAGES } from './config.js';
import { toAbsoluteUrl } from './utils.js';

/**
 * Walk the catalogue by following the site's own "next" link, starting
 * at page 1 and stopping after MAX_CATALOGUE_PAGES — we don't hardcode
 * the 60 book links, we let the pages tell us what's on them and cap how
 * far we follow "next" ourselves.
 *
 * Returns:
 *   catalogue_pages  - how many catalogue pages we actually fetched
 *   discovered       - raw count of book links seen (before de-duping)
 *   unique_count      - how many distinct book URLs came out of that
 *   books             - [{ url, source_page }], de-duped by absolute URL
 *   page_results      - per-page fetch outcomes, for the report
 */
export async function discoverCatalogue() {
  const seen = new Map(); // absolute book URL -> catalogue page it was found on
  let discoveredCount = 0;
  const pageResults = [];

  let nextUrl = CATALOGUE_START_URL;
  let pageNum = 1;

  while (nextUrl && pageNum <= MAX_CATALOGUE_PAGES) {
    const cacheKey = `catalogue-page-${pageNum}`;
    const result = await politeFetch(nextUrl, cacheKey);
    pageResults.push({
      url: nextUrl,
      ok: result.ok,
      status: result.status,
      fromCache: result.fromCache,
    });

    if (!result.ok) {
      // A broken catalogue page stops discovery here, but it's reported,
      // not thrown — whatever books we already found still get processed.
      break;
    }

    const $ = cheerio.load(result.html);
    const currentPageUrl = nextUrl;

    $('article.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      discoveredCount += 1;
      const absolute = toAbsoluteUrl(href, currentPageUrl);
      if (!seen.has(absolute)) {
        seen.set(absolute, currentPageUrl);
      }
    });

    const nextHref = $('li.next a').attr('href');
    nextUrl = nextHref ? toAbsoluteUrl(nextHref, currentPageUrl) : null;
    pageNum += 1;
  }

  const books = Array.from(seen.entries()).map(([url, source_page]) => ({
    url,
    source_page,
  }));

  return {
    catalogue_pages: pageResults.length,
    discovered: discoveredCount,
    unique_count: books.length,
    books,
    page_results: pageResults,
  };
}
