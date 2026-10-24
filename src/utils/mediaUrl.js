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

/**
 * Compresses an image File or Blob to a JPEG/WebP data URL using an offscreen canvas.
 * Reduces 5-15MB uncompressed retina screenshots down to ~100-300KB.
 */
export const compressImageFile = (file, maxWidth = 1600, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined') {
      resolve('');
      return;
    }
    // If SVG or small gif, don't recompress
    if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 200 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      resolve(canvas.toDataURL(mime, quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
};
