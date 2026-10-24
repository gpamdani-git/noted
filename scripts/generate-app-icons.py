#!/usr/bin/env python3
import os
import shutil
import struct
import subprocess

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SOURCE_IMG = os.path.join(PROJECT_ROOT, 'public', 'noted-brand-logo.png')
TMP_DIR = '/tmp/noted_icon_build'

def run(cmd):
    subprocess.check_call(cmd, shell=True)

def sips_resize(src, dst, size):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    run(f'sips -z {size} {size} "{src}" --out "{dst}" > /dev/null')

def sips_pad(src, dst, inner_size, outer_size, pad_hex='000000'):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp_resized = f'/tmp/noted_tmp_resize_{inner_size}.png'
    run(f'sips -z {inner_size} {inner_size} "{src}" --out "{tmp_resized}" > /dev/null')
    run(f'sips -p {outer_size} {outer_size} --padColor {pad_hex} "{tmp_resized}" --out "{dst}" > /dev/null')
    if os.path.exists(tmp_resized):
        os.remove(tmp_resized)

def build_ico(png_files, out_ico):
    images = []
    for path in png_files:
        with open(path, 'rb') as f:
            images.append((path, f.read()))
    
    count = len(images)
    header = struct.pack('<HHH', 0, 1, count)
    offset = 6 + count * 16
    entries = []
    
    for path, data in images:
        dim_out = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path]).decode()
        w = int([l.split(':')[1] for l in dim_out.splitlines() if 'pixelWidth' in l][0])
        h = int([l.split(':')[1] for l in dim_out.splitlines() if 'pixelHeight' in l][0])
        w_byte = 0 if w >= 256 else w
        h_byte = 0 if h >= 256 else h
        entry = struct.pack('<BBBBHHII', w_byte, h_byte, 0, 0, 1, 32, len(data), offset)
        entries.append(entry)
        offset += len(data)
        
    os.makedirs(os.path.dirname(out_ico), exist_ok=True)
    with open(out_ico, 'wb') as f:
        f.write(header)
        for e in entries:
            f.write(e)
        for _, d in images:
            f.write(d)
    print(f'Generated ICO: {out_ico}')

def main():
    if not os.path.exists(SOURCE_IMG):
        raise FileNotFoundError(f"Source image not found: {SOURCE_IMG}")
    
    if os.path.exists(TMP_DIR):
        shutil.rmtree(TMP_DIR)
    os.makedirs(TMP_DIR, exist_ok=True)
    
    print("1. Generating Electron & Web Icons...")
    # 512x512 master PNG
    public_icon_png = os.path.join(PROJECT_ROOT, 'public', 'icon.png')
    sips_resize(SOURCE_IMG, public_icon_png, 512)
    
    # apple-touch-icon
    apple_touch_icon = os.path.join(PROJECT_ROOT, 'public', 'apple-touch-icon.png')
    sips_resize(SOURCE_IMG, apple_touch_icon, 180)
    
    # favicon.png
    favicon_png = os.path.join(PROJECT_ROOT, 'public', 'favicon.png')
    sips_resize(SOURCE_IMG, favicon_png, 64)
    
    # macOS .icns via iconutil
    iconset_dir = os.path.join(TMP_DIR, 'Noted.iconset')
    os.makedirs(iconset_dir, exist_ok=True)
    icns_sizes = [
        ('icon_16x16.png', 16),
        ('icon_16x16@2x.png', 32),
        ('icon_32x32.png', 32),
        ('icon_32x32@2x.png', 64),
        ('icon_128x128.png', 128),
        ('icon_128x128@2x.png', 256),
        ('icon_256x256.png', 256),
        ('icon_256x256@2x.png', 512),
        ('icon_512x512.png', 512),
        ('icon_512x512@2x.png', 1024),
    ]
    for filename, sz in icns_sizes:
        sips_resize(SOURCE_IMG, os.path.join(iconset_dir, filename), sz)
    
    public_icon_icns = os.path.join(PROJECT_ROOT, 'public', 'icon.icns')
    run(f'iconutil -c icns "{iconset_dir}" --output "{public_icon_icns}"')
    print(f'Generated ICNS: {public_icon_icns}')
    
    # Windows .ico (multi-resolution)
    ico_pngs = []
    for sz in [16, 32, 48, 64, 128, 256]:
        tmp_ico_png = os.path.join(TMP_DIR, f'ico_{sz}.png')
        sips_resize(SOURCE_IMG, tmp_ico_png, sz)
        ico_pngs.append(tmp_ico_png)
    
    public_icon_ico = os.path.join(PROJECT_ROOT, 'public', 'icon.ico')
    build_ico(ico_pngs, public_icon_ico)
    
    # Web favicon.ico
    public_favicon_ico = os.path.join(PROJECT_ROOT, 'public', 'favicon.ico')
    build_ico([p for p in ico_pngs if any(f'_{s}.png' in p for s in [16, 32, 48])], public_favicon_ico)

    print("2. Generating Android Mipmap Icons...")
    # Update ic_launcher_background.xml to black
    bg_xml_path = os.path.join(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'ic_launcher_background.xml')
    if os.path.exists(bg_xml_path):
        with open(bg_xml_path, 'w', encoding='utf-8') as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#000000</color>\n</resources>\n')
        print(f"Updated: {bg_xml_path} (#000000)")

    android_res_dir = os.path.join(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res')
    android_densities = [
        ('mipmap-mdpi', 48, 108, 72),
        ('mipmap-hdpi', 72, 162, 108),
        ('mipmap-xhdpi', 96, 216, 144),
        ('mipmap-xxhdpi', 144, 324, 216),
        ('mipmap-xxxhdpi', 192, 432, 288),
    ]

    for folder, legacy_size, fg_size, safe_size in android_densities:
        target_dir = os.path.join(android_res_dir, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        # ic_launcher.png (legacy full icon)
        legacy_icon = os.path.join(target_dir, 'ic_launcher.png')
        sips_resize(SOURCE_IMG, legacy_icon, legacy_size)
        
        # ic_launcher_round.png
        round_icon = os.path.join(target_dir, 'ic_launcher_round.png')
        sips_resize(SOURCE_IMG, round_icon, legacy_size)
        
        # ic_launcher_foreground.png (padded to safe zone inside 108dp canvas)
        fg_icon = os.path.join(target_dir, 'ic_launcher_foreground.png')
        sips_pad(SOURCE_IMG, fg_icon, safe_size, fg_size, '000000')
        print(f"Generated Android {folder}: legacy={legacy_size}px, fg={fg_size}px (safe={safe_size}px)")

    # Clean up temp
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    print("\nAll icons generated successfully!")

if __name__ == '__main__':
    main()

