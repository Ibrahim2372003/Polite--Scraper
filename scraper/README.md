# The polite scraper

FlyRank Internship · Backend Track · Week 5 · Assignment A9

A small pipeline that downloads the first three catalogue pages of
[Books to Scrape](https://books.toscrape.com/), visits all 60 book pages,
turns the messy HTML into clean, schema-checked JSON, survives one broken
page without crashing, and ends every run with an honest report.

```
fetch → extract → normalize → validate → store → report
```

## 1 · Target classification (Stage 0)

- **Site:** [books.toscrape.com](https://books.toscrape.com/) — the
  site's own front page describes it as a sandbox built specifically for
  people to practise web scraping on. That sentence is the permission
  this project relies on. **This is the only kind of site this
  assignment touches.**
- **`robots.txt` result:** requesting `https://books.toscrape.com/robots.txt`
  returns **HTTP 404 — no robots file found.** A missing file is not a
  green light by itself, so this project still behaves as if it were
  welcome but limited: it identifies itself, goes slowly, and only takes
  what it needs (see Politeness rules below).
- **Scope:** the first **3 catalogue pages only** (`page-1.html` through
  whatever "next" leads to, capped at 3), which is exactly 60 books.
- **Data collected:** per book — title, price, availability text, star
  rating, description (when present), and where/when each fact was
  fetched from. No account data, no images, no pages outside the
  catalogue and its book pages.
- **Why this is appropriate here:** the site exists for exactly this
  purpose, publishes no crawl restrictions, and this project reads only
  the small, clearly public slice of it that the assignment scopes out.

> I will not reuse this code on another site without checking its rules
> and terms first.

## 2 · Lane

**JavaScript** — Node.js 20+, built-in `fetch`, Cheerio for HTML parsing,
Zod for schema validation, the built-in `fs`/`json` for output.

## 3 · Setup & run (copy-pasteable)

```bash
cd scraper
npm install
npm start
```

That's the whole thing. On a clean checkout this:

1. Fetches catalogue pages 1–3 (caching each one to `cache/`),
2. discovers and visits all 60 book detail pages,
3. normalizes and schema-validates every record,
4. writes `output/books.json`, `output/errors.json`, and
   `output/run-report.json`.

Run it again and it reads everything from `cache/` instead of the site —
you'll see `CACHE HIT` lines instead of `FETCH` lines, and
`output/books.json` still comes out to exactly 60 records.

To prove Stage 5 (one broken page can't kill the run), run:

```bash
npm run start:with-broken-url
```

This adds one URL that is guaranteed to 404 to the list of books before
processing. The run still finishes, `books.json` still has 60 good
records, and `run-report.json` shows `failed_pages: 1`.

To run the parser tests:

```bash
npm test
```

(A handful of these need `cheerio` installed to run — they're written to
skip cleanly, not fail, if you run `node --test` before `npm install`.)

## 4 · Record schema

Every record in `output/books.json` has this shape, checked with Zod
before it's ever written to disk:

| Field                | Type              | Notes                                              |
|-----------------------|-------------------|-----------------------------------------------------|
| `title`               | string            | required, non-empty                                |
| `product_url`         | string (URL)      | absolute, `https://` — this is the record's canonical identity |
| `price_text`          | string            | the raw text, e.g. `"£51.77"` — kept alongside the clean value |
| `price_gbp`            | number            | parsed from `price_text`, e.g. `51.77`             |
| `availability_text`   | string            | whitespace-collapsed, e.g. `"In stock (22 available)"` |
| `rating_text`         | string or `null`  | e.g. `"Three"`                                     |
| `description`         | string or `null`  | `null` when the book genuinely has none — never invented |
| `source_page`         | string (URL)      | which catalogue page this book was discovered on   |
| `fetched_at`           | string (ISO 8601) | when the detail page was fetched                   |

A record that fails any of these checks is written to `output/errors.json`
with a reason instead of `books.json`.

## 5 · Politeness rules

- **Identifies itself:** every real request sends
  `User-Agent: FlyRankInternshipA9/1.0 (+link-to-repo)` (see
  `src/config.js` — replace the link with your own repo before
  publishing).
- **Times out:** every request gives up after 8 seconds instead of
  hanging forever.
- **Goes slowly:** at least 500ms between real requests to the site.
  Cached pages add no delay — they never leave the machine.
- **Checks the status code:** only `200` is treated as "here is your
  page." `404`/`403` are terminal and never retried; a timeout or `5xx`
  gets exactly one retry after a short backoff.
- **Caches while developing:** every fetched page is saved to `cache/`
  (gitignored) and read from there on the next run, so the site is only
  asked once per page across an entire development session.

## 6 · Sample run report

From a full run (see `output/run-report.sample.json` for the illustrative
version committed with this repo — **replace this with your own real
`output/run-report.json` after you run the pipeline**):

```json
{
  "started_at": "2026-08-06T10:00:00.000Z",
  "finished_at": "2026-08-06T10:01:12.000Z",
  "duration_ms": 72000,
  "catalogue_pages_fetched": 3,
  "book_pages_attempted": 60,
  "pages_fetched": 63,
  "cache_hits": 0,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

**Why this needed no browser:** every field this project collects is
already present in the HTML the server sends for a plain GET request —
there's no client-side JavaScript building the catalogue or the book
pages. Reaching for Playwright here would only add startup cost and
memory for zero extra data.

## 7 · Ethics note

- Prefer an official API over scraping whenever one exists.
- Never bypass a login, a paywall, or an explicit block — a 403 is the
  site saying no, and asking again is how a polite robot becomes a pest.
- Collect only the fields actually needed for the task, and only from
  pages the site itself links to.
- Treat every scraped value as **untrusted input**: nothing gets stored
  until it passes the schema, whether or not the source "looks fine."

## 8 · Known limitation

Retry logic is intentionally simple (one retry, fixed backoff) rather
than full exponential backoff with `Retry-After` support — the brief for
this assignment says explicitly not to gold-plate Stage 5, since next
week's assignment (A16) builds the production version of exactly this.

## 9 · Project layout

```
scraper/
├── src/
│   ├── config.js      constants: target, politeness settings, paths
│   ├── utils.js        URL resolution, cache-key slugging, sleep()
│   ├── fetcher.js       Stage 1: politeFetch() — cache, UA, timeout, retry
│   ├── discover.js      Stage 2: walk pages 1-3, collect unique book URLs
│   ├── extract.js       Stage 3: parse one book page into 8 raw fields
│   ├── normalize.js     Stage 4a: price_text -> price_gbp
│   ├── schema.js         Stage 4b: the Zod schema + validateRecord()
│   ├── report.js         Stage 5: writeRunReport()
│   └── index.js          orchestrates all of the above
├── test/
│   ├── normalize.test.js  price/URL/dedup tests (no deps — always run)
│   ├── extract.test.js    selector tests against fixtures (needs cheerio)
│   ├── discover.test.js    listing-page selector tests (needs cheerio)
│   └── fixtures/           small saved HTML files used by the tests above
├── cache/                 gitignored — saved copies of fetched pages
├── output/
│   ├── books.json          (generated) the 60 validated records
│   ├── errors.json          (generated) records/pages that failed
│   ├── run-report.json       (generated) counts, failures, duration
│   └── *.sample.json         illustrative examples committed with the repo
└── ai-version/             Bonus Stage B — intentionally left for you
```

## 10 · Bonus stage

`ai-version/README.md` explains why the AI-rematch bonus is left
unfilled here rather than faked — it only teaches anything if you write
the prompt yourself, from memory, before regenerating.
