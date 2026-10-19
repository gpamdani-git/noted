import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

async function generateIcons() {
  const rootDir = process.cwd();
  const buildDir = path.join(rootDir, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const svgPath = path.join(rootDir, 'public', 'favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  console.log('Rendering 512x512 icon from SVG using Playwright...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 2
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 110px;
            overflow: hidden;
          }
          svg {
            width: 380px;
            height: 380px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);
  const png512Path = path.join(buildDir, 'icon.png');
  await page.screenshot({ path: png512Path, omitBackground: false });
  await browser.close();
  console.log('Created build/icon.png (512x512)');

  // Generate macOS .icns using iconutil
  try {
    const iconsetDir = path.join(buildDir, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir, { recursive: true });
    }

    const sizes = [16, 32, 64, 128, 256, 512];
    for (const size of sizes) {
      execSync(`sips -z ${size} ${size} "${png512Path}" --out "${iconsetDir}/icon_${size}x${size}.png"`, { stdio: 'ignore' });
      if (size <= 256) {
        execSync(`sips -z ${size * 2} ${size * 2} "${png512Path}" --out "${iconsetDir}/icon_${size}x${size}@2x.png"`, { stdio: 'ignore' });
      }
    }
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, 'icon.icns')}"`, { stdio: 'ignore' });
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    console.log('Created build/icon.icns');
  } catch (err) {
    console.warn('macOS iconutil warning:', err.message);
  }

  // Generate Windows .ico
  try {
    const icoPath = path.join(buildDir, 'icon.ico');
    execSync(`sips -s format bmp "${png512Path}" --out "${buildDir}/temp.bmp" && sips -s format ico "${buildDir}/temp.bmp" --out "${icoPath}" || cp "${png512Path}" "${icoPath}"`, { stdio: 'ignore' });
    if (fs.existsSync(path.join(buildDir, 'temp.bmp'))) {
      fs.unlinkSync(path.join(buildDir, 'temp.bmp'));
    }
    console.log('Created build/icon.ico');
  } catch (err) {
    // Fallback: copy png
    fs.copyFileSync(png512Path, path.join(buildDir, 'icon.ico'));
    console.log('Fallback: Created build/icon.ico from png');
  }

  console.log('All desktop icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
