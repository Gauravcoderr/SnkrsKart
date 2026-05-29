#!/usr/bin/env python3
"""
Remove white studio backgrounds from banner images via flood-fill,
re-upload to Cloudinary as transparent PNG, update MongoDB.
"""
import io, json, uuid, http.client, urllib.request, os
from PIL import Image
from pymongo import MongoClient

CLOUD_NAME    = 'dadulg5bs'
UPLOAD_PRESET = 'Snkrs cart'
MONGODB_URI   = os.environ['MONGODB_URI']

# ── background removal ──────────────────────────────────────────────────────

def remove_bg(img: Image.Image, threshold: int = 45) -> Image.Image:
    img = img.convert('RGBA')
    px  = img.load()
    w, h = img.size
    stack, seen = [], set()

    def seed(x, y):
        if (x, y) not in seen:
            r, g, b, _ = px[x, y]
            if r >= 255-threshold and g >= 255-threshold and b >= 255-threshold:
                seen.add((x, y)); stack.append((x, y))

    for x in range(w):
        seed(x, 0); seed(x, h-1)
    for y in range(1, h-1):
        seed(0, y); seed(w-1, y)

    while stack:
        x, y = stack.pop()
        px[x, y] = (255, 255, 255, 0)
        for dx, dy in ((-1,0),(1,0),(0,-1),(0,1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                r, g, b, _ = px[nx, ny]
                if r >= 255-threshold and g >= 255-threshold and b >= 255-threshold:
                    seen.add((nx, ny)); stack.append((nx, ny))
    return img

# ── cloudinary upload ───────────────────────────────────────────────────────

def cloudinary_upload(png_bytes: bytes, public_id: str, folder: str) -> str:
    boundary = uuid.uuid4().hex
    CRLF = b'\r\n'
    def field(name, value):
        return (
            f'--{boundary}'.encode() + CRLF +
            f'Content-Disposition: form-data; name="{name}"'.encode() + CRLF + CRLF +
            (value.encode() if isinstance(value, str) else value) + CRLF
        )
    body = (
        field('upload_preset', UPLOAD_PRESET) +
        field('folder',        folder) +
        field('public_id',     public_id) +
        f'--{boundary}'.encode() + CRLF +
        f'Content-Disposition: form-data; name="file"; filename="image.png"'.encode() + CRLF +
        b'Content-Type: image/png' + CRLF + CRLF +
        png_bytes + CRLF +
        f'--{boundary}--'.encode() + CRLF
    )
    conn = http.client.HTTPSConnection('api.cloudinary.com')
    conn.request('POST', f'/v1_1/{CLOUD_NAME}/image/upload', body,
                 {'Content-Type': f'multipart/form-data; boundary={boundary}'})
    resp = conn.getresponse()
    result = json.loads(resp.read())
    conn.close()
    if resp.status != 200:
        raise Exception(f'{resp.status}: {result}')
    return result['secure_url']

def download(url: str) -> bytes:
    # Cloudinary URLs with .web extension → use .webp
    url = url.rstrip('p') + 'p' if url.endswith('.web') else url
    if url.endswith('.web'):
        url += 'p'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def fix_url(url: str) -> str:
    """Ensure .web extension is .webp for Cloudinary images."""
    if '/image/upload/' in url and url.endswith('.web'):
        return url + 'p'
    return url

# ── main ────────────────────────────────────────────────────────────────────

def process(img_url: str, public_id: str) -> str:
    print(f'  downloading…')
    raw = download(fix_url(img_url))
    print(f'  removing background…')
    img = remove_bg(Image.open(io.BytesIO(raw)), threshold=45)
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    print(f'  uploading to Cloudinary…')
    new_url = cloudinary_upload(buf.getvalue(), public_id, 'banner-images')
    print(f'  ✓ {new_url}')
    return new_url

if __name__ == '__main__':
    client = MongoClient(MONGODB_URI)
    db  = client['snkrs-cart']
    col = db['banners']

    docs = list(col.find({'active': True}))
    print(f'Found {len(docs)} active banners\n')

    for doc in docs:
        brand = doc.get('brand', '?')
        url   = doc.get('image', '')
        # Crocs already has clean/transparent background — skip
        if 'crocs' in brand.lower() or 'ijnmf0' in url:
            print(f'Skipping {brand} (already clean)\n')
            continue

        print(f'Processing: {brand}')
        pid = f'banner-{str(doc["_id"])[-8:]}-nobg'
        try:
            new_url = process(url, pid)
            col.update_one({'_id': doc['_id']}, {'$set': {'image': new_url}})
            print(f'  DB updated ✓\n')
        except Exception as e:
            print(f'  ERROR: {e}\n')

    client.close()
    print('Done.')
