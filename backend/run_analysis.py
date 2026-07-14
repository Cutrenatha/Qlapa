from ai_engine import analyze_product_image
import os

# Cari contoh gambar yang ada di project (frontend/public/assets atau backend/uploads)
candidates = [
    os.path.join(os.path.dirname(__file__), 'uploads'),
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'assets'),
]

img = None
for d in candidates:
    if os.path.isdir(d):
        for f in os.listdir(d):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp')):
                img = os.path.join(d, f)
                break
    if img:
        break

if not img:
    print('Tidak menemukan file gambar contoh di uploads/ atau frontend/public/assets/.')
    raise SystemExit(1)

print('Menggunakan gambar:', img)
res = analyze_product_image(img)
import json
print(json.dumps(res, indent=2, ensure_ascii=False))
