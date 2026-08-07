/**
 * Turn "£51.77" (or "£1,234.50") into 51.77 / 1234.5 — a real number a
 * program can sort and compare. Returns NaN for anything that doesn't
 * contain a recognizable number, so the schema step can reject it
 * instead of silently storing garbage.
 */
export function parsePriceGbp(priceText) {
  const match = String(priceText).match(/[\d,]+\.?\d*/);
  if (!match) return NaN;
  return parseFloat(match[0].replace(/,/g, ''));
}

/**
 * Attach the clean numeric price next to the original text. The raw
 * value and the clean value live side by side — normalizing never
 * throws away the source text.
 */
export function normalizeRecord(raw) {
  return {
    ...raw,
    price_gbp: parsePriceGbp(raw.price_text),
  };
}
