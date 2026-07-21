# Furniture website — image assets

You do **not** need to add hundreds of images manually.

The site loads **automatic placeholder photos** for every slot. If you later drop a file into the matching folder, that local file replaces the placeholder automatically.

---

## How it works

1. The site tries the local path first (examples below).
2. If the file is missing, it falls back to a unique online placeholder image (seeded by product/category name).
3. Replace any image by adding the file — no code changes needed.

---

## Optional overrides (add only what you want)

### Brand
- `brand/logo.svg`

### Carousel
- `carousel/living-room/hero.jpg`
- `carousel/bedroom/hero.jpg`
- `carousel/office/hero.jpg`
- `carousel/outdoor/hero.jpg`

### Homepage
- `homepage/sections/featured-collection.jpg`
- `homepage/sections/design-inspiration.jpg`
- `homepage/sections/model-showcase-poster.jpg`
- `homepage/cta-banner/hero.jpg`
- `demos/demo-01/preview.jpg` … `demo-09/preview.jpg`

### Products
- `products/{category}/{subcategory}/collection.jpg` — subcategory card
- `products/{category}/{subcategory}/{product-slug}/hero.jpg` — product page
- `products/{category}/{subcategory}/{product-slug}/gallery/01.jpg` … `04.jpg`

Example:
```
products/sofas/modular-sofas/modular-sofas-studio/hero.jpg
```

Product slugs: `{subcategory-slug}-studio`, `-signature`, or `-plus`.

---

## 3D models (optional)

See `../models/README.md`. GLB files are optional — poster images are used until models exist.

---

## Regenerate empty folders

```bash
node apps/furniture/scripts/generate-asset-folders.mjs
```
