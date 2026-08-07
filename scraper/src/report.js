import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR } from './config.js';

// A scraper that reports nothing can fail silently for weeks — this is
// how a run proves, in a few honest numbers, that it did what it claims.
export function writeRunReport(report) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(report, null, 2));
}
