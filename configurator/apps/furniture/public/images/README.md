# Furniture website — image assets

Drop your files here using the paths and filenames below. Supported formats: **`.jpg`**, **`.jpeg`**, **`.webp`**, **`.png`**, **`.svg`** (logo only).

Paths are relative to `apps/furniture/public/images/`.

---

## Brand

| File | Used for |
|------|----------|
| `brand/logo.svg` | Header logo |
| `brand/logo-dark.svg` | Footer / dark backgrounds (optional) |
| `brand/favicon.svg` | Browser tab (optional; or use root `favicon.svg`) |

---

## Homepage carousel

One hero image per slide (`1920×900` or wider recommended).

| Folder | Slide |
|--------|-------|
| `carousel/living-room/hero.jpg` | Living room collection |
| `carousel/bedroom/hero.jpg` | Bedroom essentials |
| `carousel/office/hero.jpg` | Home office range |
| `carousel/outdoor/hero.jpg` | Outdoor furniture |

---

## Homepage content sections

| File | Used for |
|------|----------|
| `homepage/sections/featured-collection.jpg` | Section 1 — text left, image right |
| `homepage/sections/design-inspiration.jpg` | Section 2 — image left, text right |
| `homepage/sections/model-showcase-poster.jpg` | Section 3 — static poster behind 3D area (until GLB loads) |
| `homepage/cta-banner/hero.jpg` | Full-width “Check Our Configurator” band |

---

## Homepage demos grid (3×3)

Nine demo cards. Add a preview image per folder:

| Folder | Card |
|--------|------|
| `demos/demo-01/preview.jpg` | Demo title 1 |
| `demos/demo-02/preview.jpg` | … |
| … | … |
| `demos/demo-09/preview.jpg` | Demo title 9 |

Pair each with a 3D model in `public/models/demos/` (see models README).

---

## Category hub pages

Optional hero/card image when browsing a top-level category:

| File | Category |
|------|----------|
| `categories/sofas/hero.jpg` | Sofas |
| `categories/chairs/hero.jpg` | Chairs |
| `categories/tables/hero.jpg` | Tables |
| `categories/beds/hero.jpg` | Beds |
| `categories/wardrobes/hero.jpg` | Wardrobes |
| `categories/mattresses/hero.jpg` | Mattresses |
| `categories/storage/hero.jpg` | Storage |
| `categories/outdoor/hero.jpg` | Outdoor |
| `categories/lighting/hero.jpg` | Lighting |
| `categories/bedroom/hero.jpg` | Bedroom |

---

## Products (category → subcategory → product)

### Subcategory collection card

Shown on category pages when listing subcategories:

```
products/{category}/{subcategory}/collection.jpg
```

Example: `products/sofas/modular-sofas/collection.jpg`

### Product detail page

Each product has three variants: **studio**, **signature**, **plus**.

```
products/{category}/{subcategory}/{product-slug}/hero.jpg
products/{category}/{subcategory}/{product-slug}/gallery/01.jpg
products/{category}/{subcategory}/{product-slug}/gallery/02.jpg
products/{category}/{subcategory}/{product-slug}/gallery/03.jpg
products/{category}/{subcategory}/{product-slug}/gallery/04.jpg
```

**Product slug pattern:** `{subcategory-slug}-{variant}`

Example for Modular Sofas:

| Path | Product |
|------|---------|
| `products/sofas/modular-sofas/modular-sofas-studio/hero.jpg` | Modular Sofas Studio |
| `products/sofas/modular-sofas/modular-sofas-signature/hero.jpg` | Modular Sofas Signature |
| `products/sofas/modular-sofas/modular-sofas-plus/hero.jpg` | Modular Sofas Plus |

### Full category / subcategory tree

**Sofas** — `products/sofas/`

- `3-seater-sofas/` → `3-seater-sofas-studio`, `3-seater-sofas-signature`, `3-seater-sofas-plus`
- `corner-sofas/`
- `modular-sofas/`
- `loveseats/`
- `recliner-sofas/`
- `sofa-beds/`

**Chairs** — `products/chairs/`

- `dining-chairs/`, `office-chairs/`, `accent-chairs/`, `armchairs/`, `bar-stools/`

**Tables** — `products/tables/`

- `dining-tables/`, `coffee-tables/`, `side-tables/`, `console-tables/`, `desks/`, `extendable-tables/`

**Beds** — `products/beds/`

- `double-beds/`, `king-beds/`, `queen-beds/`, `storage-beds/`, `bunk-beds/`

**Wardrobes** — `products/wardrobes/`

- `sliding-wardrobes/`, `hinged-wardrobes/`, `walk-in-modules/`, `mirrored-wardrobes/`

**Mattresses** — `products/mattresses/`

- `memory-foam/`, `pocket-spring/`, `hybrid/`, `latex/`, `orthopaedic/`

**Storage** — `products/storage/`

- `bookcases/`, `cabinets/`, `sideboards/`, `tv-units/`, `shelving/`, `ottomans/`

**Outdoor** — `products/outdoor/`

- `dining-sets/`, `lounge-sets/`, `benches/`, `sun-loungers/`

**Lighting** — `products/lighting/`

- `floor-lamps/`, `table-lamps/`, `pendant-lights/`, `wall-lights/`, `ceiling-lights/`

**Bedroom** — `products/bedroom/`

- `nightstands/`, `dressers/`, `vanities/`, `headboards/`, `bedroom-benches/`, `mirrors/`

---

## Footer

| File | Used for |
|------|----------|
| `footer/map.jpg` | Map area background (optional) |

---

## Recommended sizes

| Asset | Size |
|-------|------|
| Carousel hero | 1920×900+ |
| Product hero | 1200×1200 or 4:3 |
| Gallery images | 1200×1200 |
| Collection / category cards | 800×600 |
| Demo previews | 600×600 |
| Logo | SVG or 240×60 PNG |

---

When files are in place, ask to **wire images into the site** and the code will load them from these paths automatically.
