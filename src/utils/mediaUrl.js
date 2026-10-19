/**
 * Normalizes image & media URLs so they load reliably in the browser.
 * Handles:
 * - Local filesystem paths: /Users/... or file:///Users/...
 * - Artifact media paths: e.g. .gemini/antigravity-ide/brain/...
 * - Public media paths: /media/...
 * - Base64 Data URLs: data:image/...
 * - External Web URLs: https://...
 */
export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already a web URL, base64 data URI, or blob URI
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    // If it's a localhost URL pointing to a /Users path, clean it
    if (trimmed.includes('localhost:') && trimmed.includes('/Users/')) {
      const match = trimmed.match(/\/Users\/.*$/);
      if (match) {
        return `/@local-media?path=${encodeURIComponent(match[0])}`;
      }
    }
    return trimmed;
  }

  // Strip file:// prefix
  let cleanPath = trimmed.replace(/^file:\/\//, '');

  // If already relative to public/media
  if (cleanPath.startsWith('/media/') || cleanPath.startsWith('./media/')) {
    return cleanPath.startsWith('.') ? cleanPath.substring(1) : cleanPath;
  }

  // Extract basename to check for /public/media fallback
  const filename = cleanPath.split('/').pop()?.split('?')[0];
  if (filename && filename.includes('_') && (filename.endsWith('.png') || filename.endsWith('.webp') || filename.endsWith('.jpg'))) {
    // Try public media first for known project recordings/screenshots
    return `/media/${filename}`;
  }

  // If it's an absolute local path on macOS/Linux
  if (cleanPath.startsWith('/Users/') || cleanPath.startsWith('/tmp/') || cleanPath.startsWith('/var/')) {
    return `/@local-media?path=${encodeURIComponent(cleanPath)}`;
  }

  return cleanPath;
};
