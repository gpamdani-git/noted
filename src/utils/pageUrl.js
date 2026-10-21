// Page addressing for the web build.
//
// The desktop app addresses a page with the noted://open?pageId=... deep link.
// The web build uses a regular query parameter instead, so a copied link opens
// the same page in the browser.

export const readPageIdFromUrl = () => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('pageId') || null;
  } catch {
    return null;
  }
};

export const writePageIdToUrl = (pageId) => {
  if (typeof window === 'undefined' || !pageId) return;
  // The packaged desktop app is loaded from a local file, where a query
  // parameter has no meaning.
  if (window.location.protocol === 'file:') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('pageId', pageId);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // History is unavailable, the address bar simply stays unchanged
  }
};

/**
 * Builds a link that reopens the given page.
 * The desktop app uses its own protocol, the web build a query parameter.
 */
export const buildShareablePageUrl = (pageId) => {
  if (typeof window === 'undefined' || !pageId) return '';
  if (window.electronAPI?.isElectron) {
    return `noted://open?pageId=${encodeURIComponent(pageId)}`;
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('pageId', pageId);
    return url.toString();
  } catch {
    return window.location.href;
  }
};
