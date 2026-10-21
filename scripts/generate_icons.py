import fitz

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1128"/>
      <stop offset="50%" stop-color="#001f54"/>
      <stop offset="100%" stop-color="#034078"/>
    </linearGradient>
    <linearGradient id="wave" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#4facfe"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00e5a3"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="190" stroke="url(#wave)" stroke-width="6" fill="none" opacity="0.3"/>
  <path d="M140 280 C 190 240, 230 310, 280 260 C 330 210, 370 270, 420 240" fill="none" stroke="url(#wave)" stroke-width="24" stroke-linecap="round"/>
  <path d="M100 340 C 160 300, 210 370, 270 320 C 330 270, 380 330, 440 295" fill="none" stroke="url(#accent)" stroke-width="18" stroke-linecap="round" opacity="0.85"/>
  <circle cx="360" cy="170" r="28" fill="url(#accent)"/>
  <path d="M230 210 C 270 180, 320 175, 360 195 L 320 225 C 290 215, 250 225, 230 210 Z" fill="url(#wave)"/>
  <text x="256" y="440" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">AQUAMASTERS</text>
</svg>"""

# Save svg
with open("public/icon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

svg_doc = fitz.open(stream=svg_content.encode("utf-8"), filetype="svg")

# 512x512
pix512 = svg_doc[0].get_pixmap(dpi=72)
pix512.save("public/icon-512.png")

# 192x192
pix192 = svg_doc[0].get_pixmap(dpi=27)
pix192.save("public/icon-192.png")

print("Generated icon-512.png, icon-192.png, icon.svg successfully!")
