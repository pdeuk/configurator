import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { enableLocalDemoMode } from "../app/localDemoMode";
import {
    getCategoryBySlug,
    getProductBySlug,
    getSubcategoryBySlug,
    PRODUCT_CATEGORIES
} from "./productNavData";
import { WebsiteContactSection } from "./WebsiteContactSection";
import { WebsiteLayout } from "./WebsiteLayout";
import { bodyTextStyle, displayTitleStyle, premiumGradients, t } from "./websiteTheme";

export function WebsiteCategoryPage() {
    const { categorySlug } = useParams();
    const category = getCategoryBySlug(categorySlug);

    if (!category) {
        return <Navigate to="/" replace />;
    }

    return (
        <WebsiteLayout>
            <div style={styles.pageWrap}>
                <section style={styles.hero}>
                    <span className="website-eyebrow">Browse products</span>
                    <h1 className="website-heading" style={displayTitleStyle("clamp(2.4rem, 5vw, 4.2rem)")}>
                        {category.name}
                    </h1>
                    <p style={bodyTextStyle(820)}>{category.description}</p>
                </section>

                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {category.subcategories.map(subcategory => (
                            <Link
                                key={subcategory.id}
                                to={`/products/${category.slug}/${subcategory.slug}`}
                                className="website-card-link"
                            >
                                <div style={styles.collectionImage}>
                                    <span style={styles.collectionImageLabel}>{subcategory.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 className="website-heading" style={styles.cardTitle}>
                                        {subcategory.name}
                                    </h2>
                                    <p style={styles.cardText}>{subcategory.description}</p>
                                    <span className="website-text-link">View collection</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <WebsiteContactSection />
            </div>
        </WebsiteLayout>
    );
}

export function WebsiteSubcategoryPage() {
    const { categorySlug, subcategorySlug } = useParams();
    const result = getSubcategoryBySlug(categorySlug, subcategorySlug);

    if (!result) {
        return <Navigate to="/" replace />;
    }

    const { category, subcategory } = result;

    return (
        <WebsiteLayout>
            <div style={styles.pageWrap}>
                <section style={styles.hero}>
                    <span className="website-eyebrow">{category.name}</span>
                    <h1 className="website-heading" style={displayTitleStyle("clamp(2.4rem, 5vw, 4.2rem)")}>
                        {subcategory.name}
                    </h1>
                    <p style={bodyTextStyle(820)}>{subcategory.description}</p>
                </section>

                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {subcategory.products.map(product => (
                            <article key={product.id} style={styles.productCard}>
                                <div style={styles.productImage}>
                                    <span style={styles.productImageLabel}>{product.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 className="website-heading" style={styles.cardTitle}>
                                        {product.name}
                                    </h2>
                                    <p style={styles.cardText}>{product.shortDescription}</p>
                                    <div style={styles.cardActions}>
                                        <Link
                                            to={`/products/${category.slug}/${subcategory.slug}/${product.slug}`}
                                            className="website-btn-primary"
                                        >
                                            View Product
                                        </Link>
                                        <Link
                                            to={`/products/${category.slug}/${subcategory.slug}/${product.slug}`}
                                            className="website-btn-secondary"
                                        >
                                            Configure
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <WebsiteContactSection />
            </div>
        </WebsiteLayout>
    );
}

export function WebsiteProductPage() {
    const navigate = useNavigate();
    const { categorySlug, subcategorySlug, productSlug } = useParams();
    const result = getProductBySlug(categorySlug, subcategorySlug, productSlug);

    if (!result) {
        return <Navigate to="/" replace />;
    }

    const { category, subcategory, product } = result;

    const openConfigurator = () => {
        enableLocalDemoMode();
        navigate(`/app?product=${product.slug}`);
    };

    return (
        <WebsiteLayout>
            <div style={styles.pageWrap}>
                <section style={styles.productHero}>
                    <div style={styles.productHeroMedia}>
                        <div style={styles.productMainImage}>
                            <span style={styles.productImageLabel}>{product.name}</span>
                        </div>
                    </div>
                    <div style={styles.productHeroContent}>
                        <span className="website-eyebrow">
                            {category.name} / {subcategory.name}
                        </span>
                        <h1 className="website-heading" style={displayTitleStyle("clamp(2.4rem, 4.8vw, 4rem)")}>
                            {product.name}
                        </h1>
                        <p style={bodyTextStyle()}>{product.description}</p>
                        <div style={styles.specList}>
                            {product.specs.map(spec => (
                                <span key={spec} style={styles.specPill}>
                                    {spec}
                                </span>
                            ))}
                        </div>
                        <button type="button" className="website-btn-primary" onClick={openConfigurator}>
                            Customize This Product
                        </button>
                    </div>
                </section>

                <section style={styles.gallerySection}>
                    <div style={styles.sectionHeading}>
                        <h2 className="website-heading" style={styles.sectionTitle}>
                            Product gallery
                        </h2>
                        <p style={bodyTextStyle()}>
                            Add additional product images, detail shots, finish variations, and room
                            scenes here before sending users into the configurator.
                        </p>
                    </div>
                    <div style={styles.galleryGrid}>
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} style={styles.galleryImage}>
                                <span style={styles.galleryImageLabel}>Gallery image {index + 1}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={styles.relatedSection}>
                    <div style={styles.sectionHeading}>
                        <h2 className="website-heading" style={styles.sectionTitle}>
                            Explore more collections
                        </h2>
                        <p style={bodyTextStyle()}>
                            Browse another family or return to the parent category before entering the
                            configurator.
                        </p>
                    </div>
                    <div style={styles.relatedLinks}>
                        <Link to={`/products/${category.slug}`} className="website-btn-secondary">
                            Back to {category.name}
                        </Link>
                        <Link
                            to={`/products/${category.slug}/${subcategory.slug}`}
                            className="website-btn-primary"
                        >
                            View more {subcategory.name}
                        </Link>
                    </div>
                </section>

                <WebsiteContactSection />
            </div>
        </WebsiteLayout>
    );
}

export function WebsiteProductsHubPage() {
    return (
        <WebsiteLayout>
            <div style={styles.pageWrap}>
                <section style={styles.hero}>
                    <span className="website-eyebrow">All categories</span>
                    <h1 className="website-heading" style={displayTitleStyle("clamp(2.4rem, 5vw, 4.2rem)")}>
                        Products
                    </h1>
                    <p style={bodyTextStyle(820)}>
                        Browse categories first, then narrow down to a collection and product before
                        entering the configurator.
                    </p>
                </section>
                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {PRODUCT_CATEGORIES.map(category => (
                            <Link
                                key={category.id}
                                to={`/products/${category.slug}`}
                                className="website-card-link"
                            >
                                <div style={styles.collectionImage}>
                                    <span style={styles.collectionImageLabel}>{category.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 className="website-heading" style={styles.cardTitle}>
                                        {category.name}
                                    </h2>
                                    <p style={styles.cardText}>{category.description}</p>
                                    <span className="website-text-link">Browse category</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
                <WebsiteContactSection />
            </div>
        </WebsiteLayout>
    );
}

const styles = {
    pageWrap: {
        display: "grid",
        gap: t.spacing.sectionY,
        padding: `28px ${t.spacing.pageX}px 72px`
    },
    hero: {
        display: "grid",
        gap: 16,
        padding: "12px 0 8px"
    },
    productHero: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
        gap: 44,
        alignItems: "center"
    },
    productHeroMedia: {
        display: "grid"
    },
    productMainImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 460,
        borderRadius: t.radius.xl,
        border: `1px solid ${t.colors.borderSoft}`,
        background: premiumGradients.placeholder,
        boxShadow: t.shadow.md
    },
    productHeroContent: {
        display: "grid",
        gap: 20,
        alignContent: "start"
    },
    gridSection: {
        display: "grid"
    },
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 28
    },
    productCard: {
        display: "grid",
        gap: 0,
        borderRadius: t.radius.lg,
        overflow: "hidden",
        border: `1px solid ${t.colors.borderSoft}`,
        background: t.colors.bgElevated,
        boxShadow: t.shadow.sm
    },
    collectionImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        background: premiumGradients.placeholder
    },
    productImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 260,
        background: premiumGradients.placeholder
    },
    collectionImageLabel: {
        fontFamily: t.fonts.display,
        fontSize: 28,
        fontWeight: 600,
        color: t.colors.ink
    },
    productImageLabel: {
        fontFamily: t.fonts.display,
        fontSize: 32,
        fontWeight: 600,
        color: t.colors.ink
    },
    collectionContent: {
        display: "grid",
        gap: 14,
        padding: "22px 22px 24px"
    },
    cardTitle: {
        margin: 0,
        fontSize: 30,
        fontWeight: 600,
        lineHeight: 1.12,
        color: t.colors.ink
    },
    cardText: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.75,
        color: t.colors.inkSoft
    },
    cardActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap" as const
    },
    specList: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap" as const
    },
    specPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "9px 14px",
        borderRadius: 999,
        background: t.colors.accentSoft,
        color: t.colors.accentDark,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em"
    },
    gallerySection: {
        display: "grid",
        gap: 24
    },
    relatedSection: {
        display: "grid",
        gap: 20,
        padding: "8px 0"
    },
    sectionHeading: {
        display: "grid",
        gap: 12
    },
    sectionTitle: {
        margin: 0,
        fontSize: "clamp(2rem, 3vw, 2.6rem)",
        fontWeight: 600,
        lineHeight: 1.12,
        color: t.colors.ink
    },
    galleryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 20
    },
    galleryImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 190,
        borderRadius: t.radius.md,
        border: `1px solid ${t.colors.borderSoft}`,
        background: t.colors.surface,
        boxShadow: t.shadow.sm
    },
    galleryImageLabel: {
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    relatedLinks: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap" as const
    }
} satisfies Record<string, import("react").CSSProperties>;
