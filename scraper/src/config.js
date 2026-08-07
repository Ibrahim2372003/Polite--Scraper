import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Target -----------------------------------------------------------
export const BASE_URL = 'https://books.toscrape.com/';
export const CATALOGUE_START_URL = 'https://books.toscrape.com/catalogue/page-1.html';
export const MAX_CATALOGUE_PAGES = 3; // scope for this assignment: pages 1-3 only

// --- Politeness ---------------------------------------------------------
// A polite robot names itself. Replace the link with your own repo before
// you publish — a site owner who sees this in their logs should be able
// to find out who you are and why you visited.
export const USER_AGENT = 'FlyRankInternshipA9/1.0 (+https://github.com/YOUR_USERNAME/YOUR_REPO)';
export const TIMEOUT_MS = 8000; // give up rather than hang forever
export const DELAY_MS = 600; // >= 500ms between real (non-cached) requests
export const RETRY_BASE_DELAY_MS = 1000; // backoff before a single retry

// --- Paths ----------------------------------------------------------------
export const CACHE_DIR = path.join(__dirname, '..', 'cache');
export const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// A URL that will never exist on the real site — used only to prove Stage 5
// (one broken page must not kill the run) without ever hammering the real
// server with intentionally bad requests.
export const DELIBERATELY_BROKEN_URL =
  'https://books.toscrape.com/catalogue/this-book-does-not-exist_99999/index.html';
