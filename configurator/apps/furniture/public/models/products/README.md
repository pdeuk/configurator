# Product 3D models

Mirror of `public/images/products/` — one folder per product variant.

Drop a GLB file here:

```
models/products/{category}/{subcategory}/{product-slug}/model.glb
```

Product slugs: `{subcategory-slug}-studio`, `-signature`, or `-plus`.

Example:

```
models/products/sofas/modular-sofas/modular-sofas-studio/model.glb
```

Regenerate empty folders:

```bash
node apps/furniture/scripts/generate-asset-folders.mjs
```
