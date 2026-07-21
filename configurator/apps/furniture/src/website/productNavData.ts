export interface ProductItem {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    specs: string[];
}

export interface ProductSubcategory {
    id: string;
    slug: string;
    name: string;
    description: string;
    products: ProductItem[];
}

export interface ProductCategory {
    id: string;
    slug: string;
    name: string;
    description: string;
    subcategories: ProductSubcategory[];
}

function createProducts(subcategorySlug: string, subcategoryName: string): ProductItem[] {
    return [
        {
            id: `${subcategorySlug}-studio`,
            slug: `${subcategorySlug}-studio`,
            name: `${subcategoryName} Studio`,
            shortDescription: "Clean-lined version for compact interiors and modern spaces.",
            description:
                `The ${subcategoryName} Studio is a placeholder product page concept that can later hold real product photography, dimensions, finishes, and pricing.`,
            specs: ["Multiple fabric options", "Made for compact layouts", "Configurator-ready setup"]
        },
        {
            id: `${subcategorySlug}-signature`,
            slug: `${subcategorySlug}-signature`,
            name: `${subcategoryName} Signature`,
            shortDescription: "Balanced proportions with a premium showroom presentation.",
            description:
                `The ${subcategoryName} Signature is designed as a slightly more premium example with a fuller gallery and stronger storytelling before entering the configurator.`,
            specs: ["Premium finish placeholder", "Showroom-focused styling", "Works well for hero imagery"]
        },
        {
            id: `${subcategorySlug}-plus`,
            slug: `${subcategorySlug}-plus`,
            name: `${subcategoryName} Plus`,
            shortDescription: "Flexible option meant to highlight extra modules or accessories.",
            description:
                `The ${subcategoryName} Plus acts as a flexible variant for modular add-ons, accessory combinations, or optional upgrades before customization begins.`,
            specs: ["Accessory-ready", "Variant-friendly", "Great for upsell messaging"]
        }
    ];
}

function createSubcategory(name: string): ProductSubcategory {
    const slug = slugify(name);

    return {
        id: slug,
        slug,
        name,
        description: `Explore our ${name.toLowerCase()} collection and choose a design to preview before opening the configurator.`,
        products: createProducts(slug, name)
    };
}

function slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
    {
        id: "sofas",
        slug: "sofas",
        name: "Sofas",
        description: "Comfort-focused seating collections for living rooms, lounges, and hospitality settings.",
        subcategories: ["3-Seater Sofas", "Corner Sofas", "Modular Sofas", "Loveseats", "Recliner Sofas", "Sofa Beds"].map(createSubcategory)
    },
    {
        id: "chairs",
        slug: "chairs",
        name: "Chairs",
        description: "Everyday seating ranges spanning dining, office, and accent collections.",
        subcategories: ["Dining Chairs", "Office Chairs", "Accent Chairs", "Armchairs", "Bar Stools"].map(createSubcategory)
    },
    {
        id: "tables",
        slug: "tables",
        name: "Tables",
        description: "Versatile surfaces for dining, work, display, and casual living spaces.",
        subcategories: ["Dining Tables", "Coffee Tables", "Side Tables", "Console Tables", "Desks", "Extendable Tables"].map(createSubcategory)
    },
    {
        id: "beds",
        slug: "beds",
        name: "Beds",
        description: "Bedroom bed frames and sleeping solutions designed around layout flexibility.",
        subcategories: ["Double Beds", "King Beds", "Queen Beds", "Storage Beds", "Bunk Beds"].map(createSubcategory)
    },
    {
        id: "wardrobes",
        slug: "wardrobes",
        name: "Wardrobes",
        description: "Storage-forward wardrobe systems for bedrooms, dressing areas, and walk-ins.",
        subcategories: ["Sliding Wardrobes", "Hinged Wardrobes", "Walk-in Modules", "Mirrored Wardrobes"].map(createSubcategory)
    },
    {
        id: "mattresses",
        slug: "mattresses",
        name: "Mattresses",
        description: "Sleep products that pair with bed systems and comfort-focused bedroom lines.",
        subcategories: ["Memory Foam", "Pocket Spring", "Hybrid", "Latex", "Orthopaedic"].map(createSubcategory)
    },
    {
        id: "storage",
        slug: "storage",
        name: "Storage",
        description: "Display and organization products for living rooms, offices, and retail spaces.",
        subcategories: ["Bookcases", "Cabinets", "Sideboards", "TV Units", "Shelving", "Ottomans"].map(createSubcategory)
    },
    {
        id: "outdoor",
        slug: "outdoor",
        name: "Outdoor Furniture",
        description: "Weather-ready collections for gardens, terraces, hospitality, and poolside spaces.",
        subcategories: ["Dining Sets", "Lounge Sets", "Benches", "Sun Loungers"].map(createSubcategory)
    },
    {
        id: "lighting",
        slug: "lighting",
        name: "Lighting",
        description: "Decorative and task lighting for complete room planning and product storytelling.",
        subcategories: ["Floor Lamps", "Table Lamps", "Pendant Lights", "Wall Lights", "Ceiling Lights"].map(createSubcategory)
    },
    {
        id: "bedroom",
        slug: "bedroom",
        name: "Bedroom",
        description: "Finishing products and companion pieces that complete a bedroom collection.",
        subcategories: ["Nightstands", "Dressers", "Vanities", "Headboards", "Bedroom Benches", "Mirrors"].map(createSubcategory)
    }
];

export function getCategoryBySlug(categorySlug?: string) {
    return PRODUCT_CATEGORIES.find(category => category.slug === categorySlug) ?? null;
}

export function getSubcategoryBySlug(categorySlug?: string, subcategorySlug?: string) {
    const category = getCategoryBySlug(categorySlug);

    if (!category) {
        return null;
    }

    const subcategory = category.subcategories.find(item => item.slug === subcategorySlug) ?? null;
    return subcategory ? { category, subcategory } : null;
}

export function getProductBySlug(categorySlug?: string, subcategorySlug?: string, productSlug?: string) {
    const result = getSubcategoryBySlug(categorySlug, subcategorySlug);

    if (!result) {
        return null;
    }

    const product = result.subcategory.products.find(item => item.slug === productSlug) ?? null;
    return product ? { ...result, product } : null;
}

export function getProductBySlugOnly(productSlug?: string) {
    if (!productSlug) {
        return null;
    }

    for (const category of PRODUCT_CATEGORIES) {
        for (const subcategory of category.subcategories) {
            const product = subcategory.products.find(item => item.slug === productSlug) ?? null;

            if (product) {
                return { category, subcategory, product };
            }
        }
    }

    return null;
}
