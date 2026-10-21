// Update check against the published GitHub releases.
//
// The app does not download or install updates on its own. The check reports
// whether a newer release exists and links to the download page, so the menu
// entry reflects a real state instead of always claiming to be up to date.

const RELEASES_ENDPOINT = 'https://api.github.com/repos/gpamdani-git/noted/releases/latest';

export const parseVersion = (value) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(value || '').trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};

export const isNewerVersion = (candidate, current) => {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  if (!a || !b) return false;
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
};

/**
 * Resolves the running version. The desktop app reads it from the main
 * process, the web build falls back to the build time value.
 */
export const getCurrentVersion = async () => {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.getInfo) {
      const info = await window.electronAPI.getInfo();
      if (info?.version) return info.version;
    }
  } catch {
    // The main process is not reachable, fall through to the build value
  }
  return import.meta.env?.VITE_APP_VERSION || '1.0.0';
};

/**
 * Checks the release feed.
 * @returns {Promise<{status: 'available'|'current'|'error', message?: string, latest?: string, current?: string, url?: string}>}
 */
export const checkForUpdates = async ({ currentVersion, endpoint = RELEASES_ENDPOINT } = {}) => {
  const current = currentVersion || (await getCurrentVersion());

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) {
      return { status: 'error', current, message: `The update check failed (HTTP ${response.status}).` };
    }

    const release = await response.json();
    const latest = release?.tag_name || release?.name || '';

    if (!latest) {
      return { status: 'error', current, message: 'The release feed returned no version information.' };
    }

    if (isNewerVersion(latest, current)) {
      return {
        status: 'available',
        current,
        latest,
        url: release.html_url || 'https://github.com/gpamdani-git/noted/releases/latest'
      };
    }

    return { status: 'current', current, latest };
  } catch (err) {
    return { status: 'error', current, message: err.message || 'The update check could not reach the release feed.' };
  }
};
