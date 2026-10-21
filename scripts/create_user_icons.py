import fitz
import os
import shutil
import base64

src_logo = r"C:\Users\User_PC\.gemini\antigravity-ide\brain\24f5c73a-0130-4a35-b87a-33cb12c7e81d\.user_uploaded\media_1792117930026.png"
os.makedirs("public", exist_ok=True)
shutil.copy(src_logo, "public/logo.png")
print("Copied original logo to public/logo.png")

with open(src_logo, 'rb') as lf:
    l_b64 = base64.b64encode(lf.read()).decode('utf-8')

logo_doc = fitz.open(src_logo)
logo_pix = logo_doc[0].get_pixmap()

def create_app_icon(size, out_path):
    inner_size = int(size * 0.82)
    scale = inner_size / max(logo_pix.width, logo_pix.height)
    new_w = int(logo_pix.width * scale)
    new_h = int(logo_pix.height * scale)
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    corner_rx = int(size * 0.22)
    border_w = max(3, int(size * 0.015))

    composite_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
      <defs>
        <radialGradient id="grad" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#142850"/>
          <stop offset="50%" stop-color="#0b1528"/>
          <stop offset="100%" stop-color="#060b16"/>
        </radialGradient>
        <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00c6ff"/>
        </linearGradient>
      </defs>
      <!-- Premium Dark App Icon Frame -->
      <rect width="{size}" height="{size}" fill="url(#grad)" rx="{corner_rx}"/>
      <rect x="2" y="2" width="{size-4}" height="{size-4}" fill="none" stroke="url(#ring)" stroke-width="{border_w}" stroke-opacity="0.6" rx="{corner_rx}"/>
      <!-- User Logo Centered -->
      <image href="data:image/png;base64,{l_b64}" x="{offset_x}" y="{offset_y}" width="{new_w}" height="{new_h}"/>
    </svg>'''

    doc = fitz.open(stream=composite_svg.encode('utf-8'), filetype='svg')
    pix = doc[0].get_pixmap(dpi=72)
    
    # Save as RGB pixmap for mobile app icons
    rgb_pix = fitz.Pixmap(fitz.csRGB, pix)
    rgb_pix.save(out_path)
    print(f"Generated {out_path} ({size}x{size})")

# Generate sizes
create_app_icon(512, "public/icon-512.png")
create_app_icon(192, "public/icon-192.png")
create_app_icon(180, "public/apple-touch-icon.png")

# Also save SVG
with open("public/icon.svg", "w", encoding="utf-8") as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <radialGradient id="grad" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#142850"/>
          <stop offset="50%" stop-color="#0b1528"/>
          <stop offset="100%" stop-color="#060b16"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)" rx="112"/>
      <image href="data:image/png;base64,{l_b64}" x="40" y="40" width="432" height="432"/>
    </svg>''')

print("All user icons generated successfully!")
