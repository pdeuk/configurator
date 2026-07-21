import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicRoot = join(__dirname, "..", "public");

const CATEGORIES = [
    {
        slug: "sofas",
        subcategories: [
            "3-seater-sofas",
            "corner-sofas",
            "modular-sofas",
            "loveseats",
            "recliner-sofas",
            "sofa-beds"
        ]
    },
    {
        slug: "chairs",
        subcategories: ["dining-chairs", "office-chairs", "accent-chairs", "armchairs", "bar-stools"]
    },
    {
        slug: "tables",
        subcategories: [
            "dining-tables",
            "coffee-tables",
            "side-tables",
            "console-tables",
            "desks",
            "extendable-tables"
        ]
    },
    {
        slug: "beds",
        subcategories: ["double-beds", "king-beds", "queen-beds", "storage-beds", "bunk-beds"]
    },
    {
        slug: "wardrobes",
        subcategories: ["sliding-wardrobes", "hinged-wardrobes", "walk-in-modules", "mirrored-wardrobes"]
    },
    {
        slug: "mattresses",
        subcategories: ["memory-foam", "pocket-spring", "hybrid", "latex", "orthopaedic"]
    },
    {
        slug: "storage",
        subcategories: ["bookcases", "cabinets", "sideboards", "tv-units", "shelving", "ottomans"]
    },
    {
        slug: "outdoor",
        subcategories: ["dining-sets", "lounge-sets", "benches", "sun-loungers"]
    },
    {
        slug: "lighting",
        subcategories: ["floor-lamps", "table-lamps", "pendant-lights", "wall-lights", "ceiling-lights"]
    },
    {
        slug: "bedroom",
        subcategories: ["nightstands", "dressers", "vanities", "headboards", "bedroom-benches", "mirrors"]
    }
];

const CAROUSEL_SLIDES = ["living-room", "bedroom", "office", "outdoor"];
const DEMO_IDS = Array.from({ length: 9 }, (_, i) => `demo-${String(i + 1).padStart(2, "0")}`);
const PRODUCT_VARIANTS = ["studio", "signature", "plus"];
const GALLERY_SLOTS = ["01", "02", "03", "04"];

function ensureDir(relativePath) {
    const fullPath = join(publicRoot, relativePath);
    mkdirSync(fullPath, { recursive: true });
    const keepFile = join(fullPath, ".gitkeep");
    if (!existsSync(keepFile)) {
        writeFileSync(keepFile, "");
    }
}

function productSlug(subcategorySlug, variant) {
    return `${subcategorySlug}-${variant}`;
}

// Brand
ensureDir("images/brand");

// Carousel
for (const slide of CAROUSEL_SLIDES) {
    ensureDir(`images/carousel/${slide}`);
}

// Homepage
ensureDir("images/homepage/sections");
ensureDir("images/homepage/cta-banner");

// Category hub cards
for (const category of CATEGORIES) {
    ensureDir(`images/categories/${category.slug}`);
}

// Demos
for (const demoId of DEMO_IDS) {
    ensureDir(`images/demos/${demoId}`);
}

// Footer / misc
ensureDir("images/footer");

// Products tree
for (const category of CATEGORIES) {
    for (const subcategorySlug of category.subcategories) {
        ensureDir(`images/products/${category.slug}/${subcategorySlug}`);

        for (const variant of PRODUCT_VARIANTS) {
            const slug = productSlug(subcategorySlug, variant);
            ensureDir(`images/products/${category.slug}/${subcategorySlug}/${slug}`);
            ensureDir(`images/products/${category.slug}/${subcategorySlug}/${slug}/gallery`);
        }
    }
}

// 3D models
ensureDir("models/homepage");
ensureDir("models/demos");

for (const demoId of DEMO_IDS) {
    ensureDir(`models/demos/${demoId}`);
}

for (const category of CATEGORIES) {
    ensureDir(`models/products/${category.slug}`);
    for (const subcategorySlug of category.subcategories) {
        ensureDir(`models/products/${category.slug}/${subcategorySlug}`);
        for (const variant of PRODUCT_VARIANTS) {
            ensureDir(`models/products/${category.slug}/${subcategorySlug}/${productSlug(subcategorySlug, variant)}`);
        }
    }
}

const modelsProductsReadme = join(publicRoot, "models", "products", "README.md");
if (!existsSync(modelsProductsReadme)) {
    writeFileSync(
        modelsProductsReadme,
        `# Product 3D models

Mirror of \`public/images/products/\` — one folder per product variant.

Drop a GLB file here:

\`\`\`
models/products/{category}/{subcategory}/{product-slug}/model.glb
\`\`\`

Product slugs: \`{subcategory-slug}-studio\`, \`-signature\`, or \`-plus\`.

Example:

\`\`\`
models/products/sofas/modular-sofas/modular-sofas-studio/model.glb
\`\`\`

Regenerate empty folders:

\`\`\`bash
node apps/furniture/scripts/generate-asset-folders.mjs
\`\`\`
`
    );
}

let modelProductFolderCount = 0;
for (const category of CATEGORIES) {
    for (const subcategorySlug of category.subcategories) {
        for (const variant of PRODUCT_VARIANTS) {
            modelProductFolderCount += 1;
        }
    }
}

console.log("Asset folders created under apps/furniture/public/");
console.log(`Product model folders: ${modelProductFolderCount} (expect model.glb in each)`);
