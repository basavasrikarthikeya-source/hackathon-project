#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageFilter, ImageDraw
from collections import deque

def main():
    source_path = 'frontend/public/logo-source.png'
    if not os.path.exists(source_path):
        source_path = 'public/logo-source.png'
    
    print(f"Loading source logo: {source_path}")
    src = Image.open(source_path).convert('RGB')
    w, h = src.size
    pix = src.load()

    # Step 1a: Remove exterior background using floodfill and feathered alpha
    mask = Image.new('L', (w, h), 255)
    mask_pix = mask.load()

    visited = bytearray(w * h)
    q = deque()

    # Floodfill from borders to detect exterior dark background
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b = pix[x, y]
            if max(r, g, b) < 30:
                visited[y * w + x] = 1
                mask_pix[x, y] = 0
                q.append((x, y))

    for y in range(h):
        for x in [0, w - 1]:
            if not visited[y * w + x]:
                r, g, b = pix[x, y]
                if max(r, g, b) < 30:
                    visited[y * w + x] = 1
                    mask_pix[x, y] = 0
                    q.append((x, y))

    while q:
        cx, cy = q.popleft()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
                r, g, b = pix[nx, ny]
                if max(r, g, b) < 30:
                    visited[ny * w + nx] = 1
                    mask_pix[nx, ny] = 0
                    q.append((nx, ny))

    # Feather the edge with 1.2px Gaussian blur for soft anti-aliased perimeter
    feathered_mask = mask.filter(ImageFilter.GaussianBlur(1.2))

    cutout = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    cutout.paste(src, (0, 0))
    cutout.putalpha(feathered_mask)

    cutout_path = 'frontend/public/logo-cutout.png'
    cutout.save(cutout_path, format='PNG')
    print(f"Saved: {cutout_path}")

    # Step 1b: Trim transparent padding and add 4% uniform padding
    bbox = cutout.getbbox()
    trimmed = cutout.crop(bbox)
    tw, th = trimmed.size

    pad = int(max(tw, th) * 0.04)
    padded_w = tw + 2 * pad
    padded_h = th + 2 * pad

    padded = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
    padded.paste(trimmed, (pad, pad))

    logo_path = 'frontend/public/logo.png'
    padded.save(logo_path, format='PNG')
    print(f"Saved: {logo_path} ({padded_w}x{padded_h})")

    # Helper function to place image centered inside a square of size S
    def make_square(img, size, fill=(0, 0, 0, 0)):
        res = Image.new('RGBA', (size, size), fill)
        # Compute scale to fit inside (size * 0.92) to leave slight margin, or full size
        iw, ih = img.size
        scale = min((size * 0.92) / iw, (size * 0.92) / ih)
        nw = max(1, int(iw * scale))
        nh = max(1, int(ih * scale))
        scaled = img.resize((nw, nh), Image.LANCZOS)
        ox = (size - nw) // 2
        oy = (size - nh) // 2
        res.paste(scaled, (ox, oy), scaled)
        return res

    # Step 1c: Export logo-512.png, logo-256.png, logo-128.png, logo-192.png
    out_dir = 'frontend/public'
    for sz in [512, 256, 192, 128]:
        sq = make_square(padded, sz)
        p = os.path.join(out_dir, f'logo-{sz}.png')
        sq.save(p, format='PNG')
        print(f"Saved: {p}")

    # Favicon sizes: 16, 32, 48
    fav_images = []
    for sz in [16, 32, 48]:
        fav = make_square(padded, sz)
        p = os.path.join(out_dir, f'favicon-{sz}.png')
        fav.save(p, format='PNG')
        fav_images.append(fav)
        print(f"Saved: {p}")

    # Favicon.ico containing 16, 32, 48
    ico_path = os.path.join(out_dir, 'favicon.ico')
    fav_images[0].save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=fav_images[1:])
    print(f"Saved: {ico_path}")

    # Apple Touch Icon: 180x180 on #05070F rounded tile at 22% radius
    ati_size = 180
    ati = Image.new('RGBA', (ati_size, ati_size), (0, 0, 0, 0))
    ati_draw = ImageDraw.Draw(ati)
    radius = int(ati_size * 0.22) # ~40px
    ati_draw.rounded_rectangle([0, 0, ati_size - 1, ati_size - 1], radius=radius, fill=(5, 7, 15, 255))
    
    # Place logo inside apple touch icon
    logo_ati_size = int(ati_size * 0.72) # ~130px
    ati_logo = make_square(padded, logo_ati_size)
    ati_offset = (ati_size - logo_ati_size) // 2
    ati.paste(ati_logo, (ati_offset, ati_offset), ati_logo)
    ati_path = os.path.join(out_dir, 'apple-touch-icon.png')
    ati.save(ati_path, format='PNG')
    print(f"Saved: {ati_path}")

    # OG-Image: 1200x630 with logo centered on #05070F
    og = Image.new('RGBA', (1200, 630), (5, 7, 15, 255))
    og_draw = ImageDraw.Draw(og)
    # Centered logo, height ~320px
    og_logo_h = 320
    og_scale = og_logo_h / padded.size[1]
    og_logo_w = int(padded.size[0] * og_scale)
    og_scaled = padded.resize((og_logo_w, og_logo_h), Image.LANCZOS)
    og.paste(og_scaled, ((1200 - og_logo_w) // 2, (630 - og_logo_h) // 2 - 30), og_scaled)
    og_path = os.path.join(out_dir, 'og-image.png')
    og.save(og_path, format='PNG')
    print(f"Saved: {og_path}")

    print("All logo assets created successfully!")

if __name__ == '__main__':
    main()
