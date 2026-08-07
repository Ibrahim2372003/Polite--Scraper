/**
 * Resolve a (possibly relative) href against the page it was found on.
 * Always use this instead of string-gluing — relative URLs on this site
 * ("../book/index.html", "page-2.html") only resolve correctly relative
 * to the exact page that contained them.
 */
export function toAbsoluteUrl(href, baseUrl) {
  return new URL(href, baseUrl).toString();
}

/** Turn a URL into a filesystem-safe cache key (no slashes, no protocol). */
export function slugForCache(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
