const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function (context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );
  
  // On Windows/Linux, the app is in a different location
  if (process.platform === 'win32') {
    return;
  }
  if (process.platform === 'linux') {
    return;
  }
  
  try {
    await flipFuses(appPath, {
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
      [FuseV1Options.EnableWebAssemblyTrapHandlers]: true,
    });
    console.log('✅ Electron fuses configured successfully');

    // Re-sign with ad-hoc signature so flipFuses byte modification doesn't invalidate code signature
    try {
      execSync(`codesign --force --deep -s - "${appPath}"`);
      console.log('✅ Re-signed application with ad-hoc signature');
    } catch (signErr) {
      console.warn('⚠️ Ad-hoc re-signing warning:', signErr.message);
    }
  } catch (error) {
    console.error('❌ Failed to configure Electron fuses:', error);
  }
};
