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
                    <span style={styles.eyebrow}>Browse products</span>
                    <h1 style={styles.heroTitle}>{category.name}</h1>
                    <p style={styles.heroText}>{category.description}</p>
                </section>

                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {category.subcategories.map(subcategory => (
                            <Link
                                key={subcategory.id}
                                to={`/products/${category.slug}/${subcategory.slug}`}
                                style={styles.collectionCard}
                            >
                                <div style={styles.collectionImage}>
                                    <span style={styles.collectionImageLabel}>{subcategory.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 style={styles.cardTitle}>{subcategory.name}</h2>
                                    <p style={styles.cardText}>{subcategory.description}</p>
                                    <span style={styles.cardLink}>View collection</span>
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
                    <span style={styles.eyebrow}>{category.name}</span>
                    <h1 style={styles.heroTitle}>{subcategory.name}</h1>
                    <p style={styles.heroText}>{subcategory.description}</p>
                </section>

                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {subcategory.products.map(product => (
                            <article key={product.id} style={styles.productCard}>
                                <div style={styles.productImage}>
                                    <span style={styles.productImageLabel}>{product.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 style={styles.cardTitle}>{product.name}</h2>
                                    <p style={styles.cardText}>{product.shortDescription}</p>
                                    <div style={styles.cardActions}>
                                        <Link
                                            to={`/products/${category.slug}/${subcategory.slug}/${product.slug}`}
                                            style={styles.primaryLink}
                                        >
                                            View Product
                                        </Link>
                                        <Link
                                            to={`/products/${category.slug}/${subcategory.slug}/${product.slug}`}
                                            style={styles.secondaryLink}
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
                        <span style={styles.eyebrow}>
                            {category.name} / {subcategory.name}
                        </span>
                        <h1 style={styles.heroTitle}>{product.name}</h1>
                        <p style={styles.heroText}>{product.description}</p>
                        <div style={styles.specList}>
                            {product.specs.map(spec => (
                                <span key={spec} style={styles.specPill}>
                                    {spec}
                                </span>
                            ))}
                        </div>
                        <button type="button" style={styles.configuratorButton} onClick={openConfigurator}>
                            Customize This Product
                        </button>
                    </div>
                </section>

                <section style={styles.gallerySection}>
                    <div style={styles.sectionHeading}>
                        <h2 style={styles.sectionTitle}>Product gallery</h2>
                        <p style={styles.sectionText}>
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
                        <h2 style={styles.sectionTitle}>Explore more collections</h2>
                        <p style={styles.sectionText}>
                            Natural next step: browse another family or return to the parent category.
                        </p>
                    </div>
                    <div style={styles.relatedLinks}>
                        <Link to={`/products/${category.slug}`} style={styles.secondaryLink}>
                            Back to {category.name}
                        </Link>
                        <Link to={`/products/${category.slug}/${subcategory.slug}`} style={styles.primaryLink}>
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
                    <span style={styles.eyebrow}>All categories</span>
                    <h1 style={styles.heroTitle}>Products</h1>
                    <p style={styles.heroText}>
                        Browse categories first, then narrow down to a collection and product before
                        entering the configurator.
                    </p>
                </section>
                <section style={styles.gridSection}>
                    <div style={styles.cardGrid}>
                        {PRODUCT_CATEGORIES.map(category => (
                            <Link key={category.id} to={`/products/${category.slug}`} style={styles.collectionCard}>
                                <div style={styles.collectionImage}>
                                    <span style={styles.collectionImageLabel}>{category.name}</span>
                                </div>
                                <div style={styles.collectionContent}>
                                    <h2 style={styles.cardTitle}>{category.name}</h2>
                                    <p style={styles.cardText}>{category.description}</p>
                                    <span style={styles.cardLink}>Browse category</span>
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
        gap: 40,
        padding: "24px 28px 56px"
    },
    hero: {
        display: "grid",
        gap: 14,
        padding: "12px 0"
    },
    productHero: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
        gap: 36,
        alignItems: "center"
    },
    productHeroMedia: {
        display: "grid"
    },
    productMainImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 420,
        borderRadius: 24,
        border: "1px dashed #cbd5e1",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
    },
    productHeroContent: {
        display: "grid",
        gap: 18,
        alignContent: "start"
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "#64748b"
    },
    heroTitle: {
        margin: 0,
        fontSize: "clamp(34px, 4.8vw, 60px)",
        lineHeight: 1.04,
        fontWeight: 700,
        color: "#111827"
    },
    heroText: {
        margin: 0,
        maxWidth: 820,
        fontSize: 17,
        lineHeight: 1.75,
        color: "#4b5563"
    },
    gridSection: {
        display: "grid"
    },
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 28
    },
    collectionCard: {
        display: "grid",
        gap: 18,
        padding: 0,
        borderRadius: 20,
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)"
    },
    productCard: {
        display: "grid",
        gap: 18,
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)"
    },
    collectionImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 220,
        background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)"
    },
    productImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        background: "linear-gradient(135deg, #e5e7eb 0%, #f8fafc 100%)"
    },
    collectionImageLabel: {
        fontSize: 22,
        fontWeight: 700,
        color: "rgba(17, 24, 39, 0.72)"
    },
    productImageLabel: {
        fontSize: 28,
        fontWeight: 700,
        color: "rgba(17, 24, 39, 0.7)"
    },
    collectionContent: {
        display: "grid",
        gap: 12,
        padding: "0 20px 22px"
    },
    cardTitle: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1.2,
        color: "#111827"
    },
    cardText: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.7,
        color: "#4b5563"
    },
    cardLink: {
        fontSize: 14,
        fontWeight: 700,
        color: "#111827"
    },
    cardActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap" as const
    },
    primaryLink: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 140,
        padding: "12px 18px",
        borderRadius: 999,
        background: "#111827",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 700
    },
    secondaryLink: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 140,
        padding: "12px 18px",
        borderRadius: 999,
        border: "1px solid #d1d5db",
        background: "#ffffff",
        color: "#111827",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 700
    },
    specList: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap" as const
    },
    specPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 999,
        background: "#f1f5f9",
        color: "#334155",
        fontSize: 13,
        fontWeight: 600
    },
    configuratorButton: {
        border: "none",
        borderRadius: 999,
        padding: "14px 24px",
        background: "#111827",
        color: "#ffffff",
        font: "inherit",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        width: "fit-content"
    },
    gallerySection: {
        display: "grid",
        gap: 22
    },
    relatedSection: {
        display: "grid",
        gap: 18,
        padding: "8px 0"
    },
    sectionHeading: {
        display: "grid",
        gap: 10
    },
    sectionTitle: {
        margin: 0,
        fontSize: 30,
        fontWeight: 700,
        lineHeight: 1.15,
        color: "#111827"
    },
    sectionText: {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.7,
        color: "#4b5563"
    },
    galleryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 20
    },
    galleryImage: {
        display: "grid",
        placeItems: "center",
        minHeight: 180,
        borderRadius: 18,
        border: "1px dashed #cbd5e1",
        background: "#f8fafc"
    },
    galleryImageLabel: {
        fontSize: 16,
        fontWeight: 600,
        color: "#64748b"
    },
    relatedLinks: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap" as const
    }
} satisfies Record<string, import("react").CSSProperties>;
