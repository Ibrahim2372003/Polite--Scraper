import fs from 'node:fs';
import path from 'node:path';
import { discoverCatalogue } from './discover.js';
import { extractBookRecord } from './extract.js';
import { normalizeRecord } from './normalize.js';
import { validateRecord } from './schema.js';
import { writeRunReport } from './report.js';
import { resetFetchStats, getFetchStats } from './fetcher.js';
import { OUTPUT_DIR, DELIBERATELY_BROKEN_URL } from './config.js';

async function main() {
  const startedAt = new Date();
  resetFetchStats();
  console.log(`Run started ${startedAt.toISOString()}`);

  // --- Stage 2: discover -------------------------------------------------
  const discovery = await discoverCatalogue();
  console.log(
    `catalogue_pages=${discovery.catalogue_pages} discovered=${discovery.discovered} unique_urls=${discovery.unique_count}`
  );

  const targets = [...discovery.books];

  // Stage 5 checkpoint: add one URL that can never succeed, on purpose,
  // to prove a broken page is logged and skipped instead of crashing the
  // run. This never touches the real site any harder than usual — it's a
  // single extra 404, not a stress test.
  if (process.env.INCLUDE_BROKEN_URL === '1') {
    targets.push({ url: DELIBERATELY_BROKEN_URL, source_page: 'manual-test' });
    console.log('Injected one deliberately broken URL to verify Stage 5.');
  }

  // --- Stage 3 + 4: extract, normalize, validate --------------------------
  const validRecords = [];
  const errorRecords = [];
  let failedPages = 0;

  for (const { url, source_page } of targets) {
    const extraction = await extractBookRecord(url, source_page);

    if (!extraction.ok) {
      failedPages += 1;
      errorRecords.push({ url, reason: extraction.error, stage: 'fetch' });
      continue;
    }

    const normalized = normalizeRecord(extraction.raw);
    const validation = validateRecord(normalized);

    if (!validation.ok) {
      errorRecords.push({ url, reason: validation.reason, stage: 'validate' });
      continue;
    }

    validRecords.push(validation.data);
  }

  // --- Stage 4: store, idempotently ---------------------------------------
  // product_url is each record's canonical identity. Deduping here (on
  // top of discover.js already deduping by URL) is a second, cheap
  // guarantee that a rerun can never produce 120 records instead of 60 —
  // we always write a full fresh snapshot, never append to the old one.
  const byUrl = new Map();
  for (const record of validRecords) {
    byUrl.set(record.product_url, record);
  }
  const uniqueRecords = Array.from(byUrl.values());

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(uniqueRecords, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errorRecords, null, 2));

  // --- Stage 5 + 7: report -------------------------------------------------
  const finishedAt = new Date();
  const stats = getFetchStats();

  const report = {
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    catalogue_pages_fetched: discovery.catalogue_pages,
    book_pages_attempted: targets.length,
    pages_fetched: stats.requestCount,
    cache_hits: stats.cacheHitCount,
    valid_records: uniqueRecords.length,
    invalid_records: errorRecords.length,
    failed_pages: failedPages,
  };

  writeRunReport(report);

  console.log(
    `Done. valid=${uniqueRecords.length} invalid=${errorRecords.length} failed_pages=${failedPages} cache_hits=${stats.cacheHitCount}/${stats.requestCount}`
  );
}

main().catch((err) => {
  // A crash here means something outside the per-page handling broke —
  // report it plainly instead of a silent hang or a swallowed error.
  console.error('Fatal error:', err);
  process.exit(1);
});
