/**
 * Platform Detection and Route Helper for Noted
 * Accurately detects client OS and resolves download target architectures.
 */

export const DEFAULT_PLATFORM = 'macArm';

export const PLATFORM_KEYS = {
  MAC_ARM: 'macArm',
  MAC_INTEL: 'macIntel',
  MAC_UNIVERSAL: 'macUniversal',
  WIN_EXE: 'winExe',
  WIN_PORTABLE: 'winPortable',
  ANDROID_APK: 'androidApk'
};

/**
 * Detect client operating system from navigator userAgent or platform
 * Returns appropriate release key ('macArm', 'winExe', 'androidApk')
 * Fallback to 'macArm' if unavailable or unknown.
 */
export function detectUserPlatform(nav = null) {
  const currentNav = nav || (typeof window !== 'undefined' ? window.navigator : null);
  if (!currentNav) return DEFAULT_PLATFORM;

  const ua = (currentNav.userAgent || '').toLowerCase();
  const platform = (currentNav.platform || '').toLowerCase();

  // 1. Android Detection
  if (ua.includes('android')) {
    return PLATFORM_KEYS.ANDROID_APK;
  }

  // 2. Windows Detection
  if (platform.includes('win') || ua.includes('windows')) {
    return PLATFORM_KEYS.WIN_EXE;
  }

  // 3. macOS Detection
  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os x')) {
    // If explicit Intel x86_64 architecture indicated in userAgent without arm
    if (ua.includes('intel') && !ua.includes('arm')) {
      // In web browsers modern Macs often show Intel for privacy, but macArm is preferred modern default
      return PLATFORM_KEYS.MAC_ARM;
    }
    return PLATFORM_KEYS.MAC_ARM;
  }

  // 4. Default Fallback
  return DEFAULT_PLATFORM;
}

