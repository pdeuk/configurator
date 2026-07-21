# Furniture website — 3D models (GLB)

Drop **`.glb`** files here. The site will use these for interactive previews and the configurator handoff.

Paths are relative to `apps/furniture/public/models/`.

---

## Homepage

| File | Used for |
|------|----------|
| `homepage/section-showcase.glb` | Section 3 — animated 3D beside “Configure before you buy” |

Optional poster fallback image: `images/homepage/sections/model-showcase-poster.jpg`

---

## Demos grid (homepage)

Pair with preview images in `images/demos/demo-XX/preview.jpg`:

| File | Demo card |
|------|-----------|
| `demos/demo-01/model.glb` | Demo title 1 |
| `demos/demo-02/model.glb` | Demo title 2 |
| … | … |
| `demos/demo-09/model.glb` | Demo title 9 |

---

## Products

Same folder shape as product images. One GLB per product variant:

```
models/products/{category}/{subcategory}/{product-slug}/model.glb
```

**Product slug:** `{subcategory-slug}-{variant}` where variant is `studio`, `signature`, or `plus`.

Example:

```
models/products/sofas/modular-sofas/modular-sofas-studio/model.glb
models/products/sofas/modular-sofas/modular-sofas-signature/model.glb
models/products/sofas/modular-sofas/modular-sofas-plus/model.glb
```

---

## Configurator

When a user clicks **Customize This Product**, the app can open:

```
/app?product={product-slug}
```

and load the matching GLB from this tree (once wired in code).

---

## Tips

- Keep GLB files optimized (Draco compression if possible).
- Use consistent scale (meters) and origin at floor center.
- Name textures inside the GLB or use embedded materials.

When models are ready, ask to **wire 3D previews into the website**.
