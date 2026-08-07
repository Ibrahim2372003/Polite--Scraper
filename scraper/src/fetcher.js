import fs from 'node:fs';
import path from 'node:path';
import {
  CACHE_DIR,
  USER_AGENT,
  TIMEOUT_MS,
  DELAY_MS,
  RETRY_BASE_DELAY_MS,
} from './config.js';
import { slugForCache, sleep } from './utils.js';

// Simple run-scoped counters so index.js can put honest numbers in the
// run report without threading state through every function call.
let requestCount = 0;
let cacheHitCount = 0;

export function resetFetchStats() {
  requestCount = 0;
  cacheHitCount = 0;
}

export function getFetchStats() {
  return { requestCount, cacheHitCount };
}

function cachePathFor(cacheKey) {
  return path.join(CACHE_DIR, `${cacheKey}.html`);
}

async function rawFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    const text = await res.text();
    return { status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a page politely, or read it from cache if we already have it.
 *
 * - Cache hits never touch the network and never wait.
 * - Real requests always send an identifying User-Agent, always have a
 *   timeout, always wait DELAY_MS before returning (so the next request,
 *   whenever it happens, is naturally spaced out), and are only cached
 *   on a real 200.
 * - 404 and 403 are terminal — they are never retried.
 * - A timeout or a 5xx gets exactly one retry after a short backoff.
 *
 * Returns { ok, status, html, fromCache, error? }. Never throws — a
 * broken page is reported back to the caller, not raised as an exception,
 * so one bad page can never take the whole run down.
 */
export async function politeFetch(url, cacheKey) {
  requestCount += 1;
  const cachePath = cachePathFor(cacheKey);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf-8');
    cacheHitCount += 1;
    console.log(`CACHE HIT ${url} bytes=${Buffer.byteLength(html)}`);
    return { ok: true, status: 200, html, fromCache: true };
  }

  const maxAttempts = 2; // one try + one retry, and only for timeout/5xx
  let attempt = 0;

  while (true) {
    attempt += 1;
    let result;

    try {
      result = await rawFetch(url);
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'timeout' : err.message || 'network_error';
      if (attempt < maxAttempts) {
        console.log(`RETRY ${url} reason=${reason} attempt=${attempt}`);
        await sleep(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      console.log(`FAIL ${url} reason=${reason}`);
      return { ok: false, status: null, html: null, fromCache: false, error: reason };
    }

    const { status, text } = result;

    if (status === 200) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, text, 'utf-8');
      console.log(`FETCH ${url} status=200 bytes=${Buffer.byteLength(text)}`);
      await sleep(DELAY_MS);
      return { ok: true, status: 200, html: text, fromCache: false };
    }

    if (status === 404 || status === 403) {
      // Not retried on purpose: 404 won't exist on a second try, and
      // retrying a 403 is how a polite robot turns into a pest.
      console.log(`FETCH ${url} status=${status} (terminal, not retried)`);
      await sleep(DELAY_MS);
      return { ok: false, status, html: null, fromCache: false, error: `HTTP ${status}` };
    }

    if (status >= 500 && attempt < maxAttempts) {
      console.log(`RETRY ${url} status=${status} attempt=${attempt}`);
      await sleep(RETRY_BASE_DELAY_MS * attempt);
      continue;
    }

    console.log(`FETCH ${url} status=${status} (giving up)`);
    await sleep(DELAY_MS);
    return { ok: false, status, html: null, fromCache: false, error: `HTTP ${status}` };
  }
}

export function cacheKeyForUrl(url, prefix) {
  return `${prefix}-${slugForCache(url)}`;
}
