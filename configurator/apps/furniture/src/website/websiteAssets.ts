/** Local path under public/ (no leading slash). */
export function localImagePath(...segments: string[]): string {
    return `/images/${segments.join("/")}`;
}

export function localModelPath(...segments: string[]): string {
    return `/models/${segments.join("/")}`;
}

function imageCandidates(basePath: string): string[] {
    return [".jpg", ".png", ".webp"].map(extension => `${basePath}${extension}`);
}

function galleryCandidatesForProduct(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string,
    index: number
): string[] {
    const slot = String(index).padStart(2, "0");
    const genericCandidates = imageCandidates(
        localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", slot)
    );

    if (
        categorySlug === "chairs"
        && subcategorySlug === "office-chairs"
        && productSlug === "office-chairs-signature"
    ) {
        const specificCandidates = [
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_white.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_dark_blue.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_beige.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "30_degrees_white.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "30_degrees_dark_blue.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "30_degrees_beige.png")
        ];

        const selectedImage = specificCandidates[index - 1] ?? specificCandidates[0] ?? genericCandidates[0] ?? "/images/products/chairs/office-chairs/office-chairs-signature/gallery/front_white.png";
        return [selectedImage, ...genericCandidates];
    }

    return genericCandidates;
}

/** Deterministic remote placeholder — no manual image hunt required. */
export function placeholderImageUrl(seed: string, width = 1200, height = 900): string {
    const safeSeed = encodeURIComponent(seed.replace(/\s+/g, "-").toLowerCase());
    return `https://picsum.photos/seed/${safeSeed}/${width}/${height}`;
}

export const carouselSlidePaths = {
    "living-room": localImagePath("carousel", "living-room", "hero.jpg"),
    bedroom: localImagePath("carousel", "bedroom", "hero.jpg"),
    office: localImagePath("carousel", "office", "hero.jpg"),
    outdoor: localImagePath("carousel", "outdoor", "hero.jpg")
} as const;

export function carouselSlideSeed(slideId: string): string {
    return `furniture-carousel-${slideId}`;
}

export const homepageSectionPaths = {
    featuredCollection: localImagePath("homepage", "sections", "featured-collection.jpg"),
    designInspiration: localImagePath("homepage", "sections", "design-inspiration.jpg"),
    modelShowcasePoster: localImagePath("homepage", "sections", "model-showcase-poster.jpg"),
    ctaBanner: localImagePath("homepage", "cta-banner", "hero.jpg")
} as const;

export function homepageSectionSeed(key: keyof typeof homepageSectionPaths): string {
    return `furniture-home-${key}`;
}

export function demoPreviewPath(demoId: string): string {
    return localImagePath("demos", demoId, "preview.jpg");
}

export function demoPreviewSeed(demoId: string): string {
    return `furniture-demo-${demoId}`;
}

export function categoryHeroPath(categorySlug: string): string {
    return localImagePath("categories", categorySlug, "hero.jpg");
}

export function categoryHeroSeed(categorySlug: string): string {
    return `furniture-category-${categorySlug}`;
}

export function subcategoryCollectionPath(categorySlug: string, subcategorySlug: string): string {
    return localImagePath("products", categorySlug, subcategorySlug, "collection.jpg");
}

export function subcategoryCollectionSeed(categorySlug: string, subcategorySlug: string): string {
    return `furniture-collection-${categorySlug}-${subcategorySlug}`;
}

export function productHeroPath(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string
): string[] {
    const basePath = localImagePath("products", categorySlug, subcategorySlug, productSlug, "hero");
    const genericCandidates = imageCandidates(basePath);

    if (
        categorySlug === "chairs"
        && subcategorySlug === "office-chairs"
        && productSlug === "office-chairs-signature"
    ) {
        return [
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_white.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_dark_blue.png"),
            localImagePath("products", categorySlug, subcategorySlug, productSlug, "gallery", "front_beige.png"),
            ...genericCandidates
        ];
    }

    return genericCandidates;
}

export function productHeroSeed(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string
): string {
    return `furniture-product-${categorySlug}-${subcategorySlug}-${productSlug}`;
}

export function productGalleryPath(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string,
    index: number
): string[] {
    return galleryCandidatesForProduct(categorySlug, subcategorySlug, productSlug, index);
}

export function productGallerySeed(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string,
    index: number
): string {
    return `furniture-gallery-${categorySlug}-${subcategorySlug}-${productSlug}-${index}`;
}

export function productModelPath(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string
): string {
    const basePath = localModelPath("products", categorySlug, subcategorySlug, productSlug);

    if (
        categorySlug === "chairs"
        && subcategorySlug === "office-chairs"
        && productSlug === "office-chairs-signature"
    ) {
        return `${basePath}/office_chair.glb`;
    }

    return `${basePath}/model.glb`;
}

export function demoModelPath(demoId: string): string {
    return localModelPath("demos", demoId, "model.glb");
}

export function homepageShowcaseModelPath(): string {
    return localModelPath("homepage", "section-showcase.glb");
}
