#!/usr/bin/env python3
"""
Generate high-fidelity branding icons and Chrome Web Store promotional assets
for WebSocket Test Client extension.
"""
import os
import math
import io
import matplotlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import resvg_py

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_DIR = os.path.dirname(SCRIPT_DIR)
RES_DIR = os.path.join(CLIENT_DIR, "resources")
ASSETS_DIR = SCRIPT_DIR

os.makedirs(RES_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Locate DejaVu fonts from matplotlib
font_dir = os.path.join(os.path.dirname(matplotlib.__file__), "mpl-data", "fonts", "ttf")
font_bold_path = os.path.join(font_dir, "DejaVuSans-Bold.ttf")
font_reg_path = os.path.join(font_dir, "DejaVuSans.ttf")
font_mono_path = os.path.join(font_dir, "DejaVuSansMono.ttf")

SVG_ICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14" />
      <stop offset="45%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35" />
      <stop offset="45%" stop-color="#10b981" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="emGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="40%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <linearGradient id="cyGrad" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="40%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.85" />
    </filter>
  </defs>

  <!-- Base Squircle -->
  <rect x="28" y="28" width="456" height="456" rx="112" fill="url(#bgGrad)" filter="url(#shadow)" />
  <rect x="28" y="28" width="456" height="456" rx="112" fill="url(#halo)" />
  <rect x="31" y="31" width="450" height="450" rx="109" fill="none" stroke="rgba(56, 189, 248, 0.28)" stroke-width="4" />

  <!-- Center Dark Plate -->
  <circle cx="256" cy="256" r="176" fill="rgba(15, 23, 42, 0.82)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="4" />

  <!-- Precision Technical Dash Orbit -->
  <circle cx="256" cy="256" r="146" fill="none" stroke="rgba(148, 163, 184, 0.18)" stroke-width="6" stroke-dasharray="14 16" />

  <!-- Upper Duplex Arrow: Outgoing / Transmit (Emerald) -->
  <g>
    <path d="M 140 280 C 140 188, 190 178, 305 178" fill="none" stroke="url(#emGrad)" stroke-width="46" stroke-linecap="round" />
    <polygon points="380,178 296,126 296,230" fill="#34d399" />
    <circle cx="140" cy="280" r="15" fill="#FFFFFF" />
  </g>

  <!-- Lower Duplex Arrow: Incoming / Receive (Cyan) -->
  <g>
    <path d="M 372 232 C 372 324, 322 334, 207 334" fill="none" stroke="url(#cyGrad)" stroke-width="46" stroke-linecap="round" />
    <polygon points="132,334 216,282 216,386" fill="#38bdf8" />
    <circle cx="372" cy="232" r="15" fill="#FFFFFF" />
  </g>
</svg>"""

def build_icons():
    print("Building icons...")
    with open(os.path.join(RES_DIR, "icon.svg"), "w") as f:
        f.write(SVG_ICON)
    with open(os.path.join(ASSETS_DIR, "icon.svg"), "w") as f:
        f.write(SVG_ICON)

    master_bytes = resvg_py.svg_to_bytes(SVG_ICON)
    master_icon = Image.open(io.BytesIO(master_bytes))

    for size, fname in [(16, "icon_016.png"), (32, "icon_032.png"), (48, "icon_048.png"), (128, "icon_128.png")]:
        thumb = master_icon.resize((size, size), Image.Resampling.LANCZOS)
        thumb.save(os.path.join(RES_DIR, fname))
    print("Saved icon_016.png, icon_032.png, icon_048.png, icon_128.png")

def build_screenshot():
    print("Building screenshot-1280x800.png...")
    canvas_w, canvas_h = 1280, 800
    img = Image.new("RGBA", (canvas_w, canvas_h), (6, 10, 19, 255))
    draw = ImageDraw.Draw(img)

    # Background radial glow
    cx, cy = canvas_w // 2, 220
    for y in range(canvas_h):
        for x in range(0, canvas_w, 4):
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            factor = max(0.0, 1.0 - dist / 760.0)
            r = int(6 + 8 * factor)
            g = int(10 + 16 * factor)
            b = int(19 + 32 * factor)
            draw.rectangle([x, y, min(x+3, canvas_w-1), y], fill=(r, g, b, 255))

    # Clean technical dot grid
    for gx in range(24, canvas_w, 32):
        for gy in range(24, canvas_h, 32):
            draw.point((gx, gy), fill=(100, 116, 139, 45))

    f_badge = ImageFont.truetype(font_bold_path, 11)
    f_title = ImageFont.truetype(font_bold_path, 30)
    f_sub = ImageFont.truetype(font_reg_path, 15)
    f_cap = ImageFont.truetype(font_bold_path, 12)
    f_desc = ImageFont.truetype(font_reg_path, 11)

    # Top Badge
    b_text = "WEBSOCKET TEST CLIENT  •  REAL-TIME DEBUGGER"
    bbox = draw.textbbox((0, 0), b_text, font=f_badge)
    bw = bbox[2] - bbox[0]
    bx, by = (canvas_w - bw - 28) // 2, 34
    draw.rounded_rectangle([bx, by, bx + bw + 28, by + 26], radius=13, fill=(15, 23, 42, 240), outline=(56, 189, 248, 140), width=1)
    draw.text((bx + 14, by + 6), b_text, font=f_badge, fill=(56, 189, 248, 255))

    # Title
    t_text = "Test & Debug WebSockets in Real-Time"
    tbox = draw.textbbox((0, 0), t_text, font=f_title)
    tw = tbox[2] - tbox[0]
    draw.text(((canvas_w - tw) // 2, 74), t_text, font=f_title, fill=(255, 255, 255, 255))

    # Subtitle
    s_text = "Send payloads, inspect bi-directional frames, and verify endpoints with zero configuration."
    sbox = draw.textbbox((0, 0), s_text, font=f_sub)
    sw = sbox[2] - sbox[0]
    draw.text(((canvas_w - sw) // 2, 122), s_text, font=f_sub, fill=(148, 163, 184, 255))

    # Mockup Window
    win_w, win_h = 1060, 530
    win_x = (canvas_w - win_w) // 2
    win_y = 170

    # Shadow
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([win_x - 6, win_y + 12, win_x + win_w + 6, win_y + win_h + 16], radius=20, fill=(0, 0, 0, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    img.paste(shadow, (0, 0), shadow)

    # Window Surface
    win = Image.new("RGBA", (win_w, win_h), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(win)

    tb_h = 42
    wdraw.rounded_rectangle([0, 0, win_w, win_h], radius=14, fill=(250, 250, 250, 255), outline=(71, 85, 105, 200), width=1)
    wdraw.rounded_rectangle([0, 0, win_w, tb_h + 14], radius=14, fill=(15, 23, 42, 255))
    wdraw.rectangle([0, tb_h, win_w, win_h], fill=(250, 250, 250, 255))
    wdraw.line([(0, tb_h), (win_w, tb_h)], fill=(51, 65, 85, 255), width=1)

    # Traffic lights
    wdraw.ellipse([18, 15, 28, 25], fill=(239, 68, 68, 255))
    wdraw.ellipse([36, 15, 46, 25], fill=(245, 158, 11, 255))
    wdraw.ellipse([54, 15, 64, 25], fill=(16, 185, 129, 255))

    # Session Pill
    wdraw.rounded_rectangle([win_w//2 - 210, 7, win_w//2 + 210, tb_h - 7], radius=8, fill=(30, 41, 59, 240), outline=(71, 85, 105, 180), width=1)
    wdraw.ellipse([win_w//2 - 190, 16, win_w//2 - 182, 24], fill=(52, 211, 153, 255))
    wdraw.text((win_w//2 - 170, 13), "wss://echo.websocket.org/", font=ImageFont.truetype(font_reg_path, 12), fill=(241, 245, 249, 255))
    wdraw.text((win_w//2 + 80, 13), "OPENED", font=ImageFont.truetype(font_bold_path, 12), fill=(52, 211, 153, 255))

    # Paste UI Screenshot
    raw_ui = Image.open("/home/node/Downloads/ss_2026-09-22_18-05-25.png")
    cropped = raw_ui.crop((12, 12, 1260, 580))
    body_w, body_h = win_w - 14, win_h - tb_h - 8
    scale = min(body_w / cropped.width, body_h / cropped.height)
    new_w, new_h = int(cropped.width * scale), int(cropped.height * scale)
    scaled_ui = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    win.paste(scaled_ui, ((win_w - new_w) // 2, tb_h + 4))

    img.paste(win, (win_x, win_y), win)

    # Bottom feature chips with standard supported typography
    chips = [
        ("● Instant Handshake", "Connect to ws:// & wss:// endpoints instantly"),
        ("⇄ Bi-Directional Frames", "Color-coded sent & received message logs"),
        ("✔ 100% Client-Side", "Completely local, private & zero tracking")
    ]
    chip_y = 724
    start_cx = (canvas_w - (330 * 3 + 20 * 2)) // 2
    for i, (head, desc) in enumerate(chips):
        cx = start_cx + i * 350
        draw.rounded_rectangle([cx, chip_y, cx + 330, chip_y + 46], radius=10, fill=(15, 23, 42, 210), outline=(51, 65, 85, 180), width=1)
        draw.text((cx + 14, chip_y + 8), head, font=f_cap, fill=(56, 189, 248, 255))
        draw.text((cx + 14, chip_y + 25), desc, font=f_desc, fill=(148, 163, 184, 255))

    target_ss = os.path.join(ASSETS_DIR, "screenshot-1280x800.png")
    img.save(target_ss)
    print("Saved screenshot-1280x800.png")

def build_marquee():
    print("Building marquee-promo-1400x560.png...")
    w, h = 1400, 560
    base = Image.new("RGBA", (w, h), (6, 10, 19, 255))

    # Background art
    orig_art_path = os.path.join(ASSETS_DIR, "promo-banner-original.jpg")
    art = Image.open(orig_art_path).convert("RGBA")
    art_ratio = art.width / art.height
    art_h = 560
    art_w = int(art_h * art_ratio)
    scaled_art = art.resize((art_w, art_h), Image.Resampling.LANCZOS)

    # Smooth horizontal mask
    mask = Image.new("L", (art_w, art_h), 0)
    mdraw = ImageDraw.Draw(mask)
    for x in range(art_w):
        if x < 150:
            val = 0
        elif x < 520:
            val = int(255 * ((x - 150) / 370.0))
        else:
            val = 255
        mdraw.line([(x, 0), (x, art_h)], fill=val)

    art_x = w - art_w + 100
    base.paste(scaled_art, (art_x, 0), mask)

    draw = ImageDraw.Draw(base)

    f_badge = ImageFont.truetype(font_bold_path, 12)
    f_title = ImageFont.truetype(font_bold_path, 44)
    f_sub = ImageFont.truetype(font_reg_path, 17)
    f_chip = ImageFont.truetype(font_bold_path, 13)
    f_mono = ImageFont.truetype(font_mono_path, 12)
    f_mono_bold = ImageFont.truetype(font_bold_path, 12)

    # App Icon (96x96)
    icon = Image.open(os.path.join(RES_DIR, "icon_128.png")).resize((96, 96), Image.Resampling.LANCZOS)
    base.paste(icon, (80, 55), icon)

    # Eyebrow Pill
    eyebrow = "CHROME EXTENSION  •  DEVELOPER TOOL"
    draw.rounded_rectangle([196, 58, 510, 86], radius=14, fill=(15, 23, 42, 230), outline=(56, 189, 248, 140), width=1)
    draw.text((210, 65), eyebrow, font=f_badge, fill=(56, 189, 248, 255))

    # Title
    draw.text((196, 98), "WebSocket Test Client", font=f_title, fill=(255, 255, 255, 255))

    # Subtitle
    draw.text((80, 178), "Lightweight, real-time WebSocket debugging and frame inspection.", font=f_sub, fill=(203, 213, 225, 255))
    draw.text((80, 206), "Connect instantly, send test payloads, and inspect live full-duplex traffic.", font=f_sub, fill=(148, 163, 184, 255))

    # Feature checklist pills
    features = [
        "● WSS & WS Protocol Support",
        "⇄ Full-Duplex Live Streaming",
        "› Session History & Reconnect",
        "✔ 100% Local & Privacy-First"
    ]
    for i, feat in enumerate(features):
        row = i // 2
        col = i % 2
        fx = 80 + col * 285
        fy = 262 + row * 44
        draw.rounded_rectangle([fx, fy, fx + 270, fy + 34], radius=9, fill=(15, 23, 42, 220), outline=(51, 65, 85, 180), width=1)
        draw.text((fx + 12, fy + 8), feat, font=f_chip, fill=(226, 232, 240, 255))

    # Connection status indicator pill at bottom left
    draw.rounded_rectangle([80, 385, 470, 432], radius=12, fill=(15, 23, 42, 240), outline=(16, 185, 129, 140), width=1)
    draw.ellipse([98, 403, 108, 413], fill=(52, 211, 153, 255))
    draw.text((120, 399), "wss://echo.websocket.org/", font=f_mono, fill=(241, 245, 249, 255))
    draw.text((380, 399), "OPENED", font=f_mono_bold, fill=(52, 211, 153, 255))

    # Floating Terminal Preview Card on right
    card_w, card_h = 510, 420
    card_x, card_y = 810, 70

    # Card shadow
    cshadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    csdraw = ImageDraw.Draw(cshadow)
    csdraw.rounded_rectangle([card_x - 6, card_y + 12, card_x + card_w + 6, card_y + card_h + 16], radius=20, fill=(0, 0, 0, 230))
    cshadow = cshadow.filter(ImageFilter.GaussianBlur(28))
    base.paste(cshadow, (0, 0), cshadow)

    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card)

    cdraw.rounded_rectangle([0, 0, card_w, card_h], radius=16, fill=(11, 17, 33, 235), outline=(56, 189, 248, 120), width=1)
    cdraw.rounded_rectangle([0, 0, card_w, 42], radius=16, fill=(15, 23, 42, 255))
    cdraw.rectangle([0, 26, card_w, 42], fill=(15, 23, 42, 255))
    cdraw.line([(0, 42), (card_w, 42)], fill=(51, 65, 85, 200), width=1)

    # Traffic lights
    cdraw.ellipse([16, 16, 26, 26], fill=(239, 68, 68, 255))
    cdraw.ellipse([34, 16, 44, 26], fill=(245, 158, 11, 255))
    cdraw.ellipse([52, 16, 62, 26], fill=(16, 185, 129, 255))
    cdraw.text((76, 14), "Live WebSocket Session", font=f_mono_bold, fill=(203, 213, 225, 255))
    cdraw.text((380, 14), "● 12ms ping", font=f_mono, fill=(52, 211, 153, 255))

    logs = [
        ("→ CONNECT", "wss://echo.websocket.org/", (148, 163, 184, 255)),
        ("✔ UPGRADE", "101 Switching Protocols", (52, 211, 153, 255)),
        ("▲ SEND", '{"action": "ping", "t": 172700}', (251, 146, 60, 255)),
        ("▼ RECV", '{"action": "pong", "t": 172700}', (56, 189, 248, 255)),
        ("▲ SEND", '"hello server"', (251, 146, 60, 255)),
        ("▼ RECV", '"hello server"', (255, 255, 255, 255)),
        ("▲ SEND", '"welcome"', (251, 146, 60, 255)),
        ("▼ RECV", '"welcome"', (255, 255, 255, 255)),
        ("› STATUS", "Connection active • 0 dropped frames", (148, 163, 184, 255))
    ]

    ly = 54
    for tag, msg, col in logs:
        cdraw.text((18, ly), tag, font=f_mono_bold, fill=col)
        cdraw.text((130, ly), msg, font=f_mono, fill=(241, 245, 249, 255) if col == (255,255,255,255) else col)
        ly += 39

    base.paste(card, (card_x, card_y), card)
    base.save(os.path.join(ASSETS_DIR, "marquee-promo-1400x560.png"))
    print("Saved marquee-promo-1400x560.png")

def build_small_promo():
    print("Building small-promo-440x280.png...")
    w, h = 440, 280
    base = Image.new("RGBA", (w, h), (6, 10, 19, 255))

    draw = ImageDraw.Draw(base)
    cx, cy = w // 2, 75
    for y in range(h):
        for x in range(0, w, 2):
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            factor = max(0.0, 1.0 - dist / 220.0)
            r = int(6 + 12 * factor)
            g = int(10 + 26 * factor)
            b = int(19 + 50 * factor)
            draw.rectangle([x, y, x+1, y], fill=(r, g, b, 255))

    draw.rounded_rectangle([1, 1, w - 2, h - 2], radius=12, fill=None, outline=(56, 189, 248, 60), width=1)

    f_title = ImageFont.truetype(font_bold_path, 21)
    f_tag = ImageFont.truetype(font_bold_path, 13)
    f_badge = ImageFont.truetype(font_reg_path, 11)

    # Centered App Icon (80x80)
    icon = Image.open(os.path.join(RES_DIR, "icon_128.png")).resize((80, 80), Image.Resampling.LANCZOS)
    icon_x = (w - 80) // 2
    icon_y = 26
    base.paste(icon, (icon_x, icon_y), icon)

    # Title
    t_text = "WebSocket Test Client"
    tbox = draw.textbbox((0, 0), t_text, font=f_title)
    tw = tbox[2] - tbox[0]
    draw.text(((w - tw) // 2, 122), t_text, font=f_title, fill=(255, 255, 255, 255))

    # Tagline
    tag_text = "Real-Time WebSocket Debugger"
    tagbox = draw.textbbox((0, 0), tag_text, font=f_tag)
    tagw = tagbox[2] - tagbox[0]
    draw.text(((w - tagw) // 2, 154), tag_text, font=f_tag, fill=(56, 189, 248, 255))

    # Bottom Pill
    b_text = "⇄ Full-Duplex  •  WS & WSS  •  Zero Setup"
    bbox = draw.textbbox((0, 0), b_text, font=f_badge)
    bw = bbox[2] - bbox[0]
    bx, by = (w - bw - 24) // 2, 194
    draw.rounded_rectangle([bx, by, bx + bw + 24, by + 26], radius=13, fill=(15, 23, 42, 230), outline=(71, 85, 105, 180), width=1)
    draw.text((bx + 12, by + 5), b_text, font=f_badge, fill=(203, 213, 225, 255))

    # Mini indicator
    draw.text(((w - 150) // 2, 236), "● 100% Client-Side & Local", font=ImageFont.truetype(font_reg_path, 10), fill=(52, 211, 153, 220))

    base.save(os.path.join(ASSETS_DIR, "small-promo-440x280.png"))
    print("Saved small-promo-440x280.png")

if __name__ == "__main__":
    build_icons()
    build_screenshot()
    build_marquee()
    build_small_promo()
    print("All assets successfully built!")
