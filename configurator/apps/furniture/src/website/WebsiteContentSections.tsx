import { Link } from "react-router-dom";
import { WebsiteContactSection } from "./WebsiteContactSection";

type SectionLayout = "text-left" | "text-right";
type MediaKind = "image" | "model";

interface ContentSectionProps {
    layout: SectionLayout;
    title: string;
    paragraph: string;
    imageLabel: string;
    mediaKind?: MediaKind;
}

const DEMO_ITEMS = Array.from({ length: 9 }, (_, index) => ({
    id: `demo-${index + 1}`,
    title: `Demo title ${index + 1}`,
    paragraph:
        "Placeholder paragraph text for this demo card. Add a short description once the 3D model is ready."
}));

function ContentSection({
    layout,
    title,
    paragraph,
    imageLabel,
    mediaKind = "image"
}: ContentSectionProps) {
    const textBlock = (
        <div style={styles.textBlock}>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.paragraph}>{paragraph}</p>
        </div>
    );

    const imageBlock = (
        <div style={styles.imagePlaceholder} aria-label={imageLabel}>
            <span style={styles.imageLabel}>{imageLabel}</span>
            <span style={styles.imageHint}>
                {mediaKind === "model" ? "GLB / animated 3D placeholder" : "Placeholder image"}
            </span>
        </div>
    );

    return (
        <section style={styles.section}>
            {layout === "text-left" ? (
                <>
                    {textBlock}
                    {imageBlock}
                </>
            ) : (
                <>
                    {imageBlock}
                    {textBlock}
                </>
            )}
        </section>
    );
}

export function WebsiteContentSections() {
    return (
        <div style={styles.wrapper}>
            <ContentSection
                layout="text-left"
                title="Placeholder title"
                paragraph="Placeholder paragraph text goes here. Use this area for a short description of a collection, feature, or story that complements the image beside it."
                imageLabel="Featured collection"
            />
            <ContentSection
                layout="text-right"
                title="Placeholder title"
                paragraph="Placeholder paragraph text goes here. Use this area for a second highlight block with supporting copy and a visual on the opposite side."
                imageLabel="Design inspiration"
            />
            <ContentSection
                layout="text-left"
                title="Placeholder title"
                paragraph="Placeholder paragraph text goes here. This empty media area is reserved for a future GLB model that can later be animated and presented beside this text."
                imageLabel="3D model showcase"
                mediaKind="model"
            />
            <section style={styles.demosSection}>
                <div style={styles.demosHeading}>
                    <h2 style={styles.demosTitle}>Demos</h2>
                </div>
                <div style={styles.demosGrid}>
                    {DEMO_ITEMS.map(item => (
                        <article key={item.id} style={styles.demoCard}>
                            <div style={styles.demoMediaPlaceholder} aria-label={`${item.title} 3D model placeholder`}>
                                <span style={styles.demoMediaLabel}>3D model placeholder</span>
                            </div>
                            <div style={styles.demoContent}>
                                <h3 style={styles.demoTitle}>{item.title}</h3>
                                <p style={styles.demoParagraph}>{item.paragraph}</p>
                                <Link to="/" style={styles.demoLink}>
                                    Learn More
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <section style={styles.ctaSection}>
                <div style={styles.ctaBanner}>
                    <div style={styles.ctaCopy}>
                        <span style={styles.ctaEyebrow}>Interactive preview</span>
                        <h2 style={styles.ctaTitle}>See how the configurator works</h2>
                        <p style={styles.ctaParagraph}>
                            This full-width area is a placeholder for a future branded visual. The
                            button below should guide visitors into the live test configurator so they
                            can explore the experience themselves.
                        </p>
                    </div>
                    <div style={styles.ctaButtonRow}>
                        <Link to="/app" style={styles.ctaButton}>
                            Check Our Configurator
                        </Link>
                    </div>
                </div>
            </section>
            <WebsiteContactSection />
        </div>
    );
}

const styles = {
    wrapper: {
        display: "grid",
        gap: 48,
        padding: "8px 28px 56px"
    },
    section: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 40,
        alignItems: "center"
    },
    textBlock: {
        display: "grid",
        gap: 16,
        padding: "8px 0"
    },
    title: {
        margin: 0,
        fontSize: "clamp(28px, 3vw, 40px)",
        fontWeight: 700,
        lineHeight: 1.15,
        color: "#111827"
    },
    paragraph: {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.7,
        color: "#4b5563",
        maxWidth: 520
    },
    imagePlaceholder: {
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: 8,
        minHeight: 320,
        borderRadius: 16,
        border: "1px dashed #cbd5e1",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
    },
    imageLabel: {
        fontSize: 18,
        fontWeight: 600,
        color: "rgba(17, 24, 39, 0.72)"
    },
    imageHint: {
        fontSize: 13,
        color: "rgba(17, 24, 39, 0.5)"
    },
    demosSection: {
        display: "grid",
        gap: 28,
        paddingTop: 12
    },
    ctaSection: {
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)"
    },
    ctaBanner: {
        minHeight: 420,
        display: "grid",
        alignItems: "end",
        gap: 24,
        padding: "40px 28px 36px",
        background:
            "linear-gradient(135deg, #0f172a 0%, #1d4ed8 38%, #7c3aed 72%, #c4b5fd 100%)"
    },
    ctaCopy: {
        display: "grid",
        gap: 14,
        justifyItems: "center",
        textAlign: "center" as const,
        color: "#ffffff",
        maxWidth: 760,
        margin: "0 auto"
    },
    ctaEyebrow: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "rgba(255, 255, 255, 0.76)"
    },
    ctaTitle: {
        margin: 0,
        fontSize: "clamp(32px, 4vw, 52px)",
        lineHeight: 1.05,
        fontWeight: 700
    },
    ctaParagraph: {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.7,
        color: "rgba(255, 255, 255, 0.82)"
    },
    ctaButtonRow: {
        display: "flex",
        justifyContent: "center"
    },
    ctaButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 220,
        padding: "14px 24px",
        borderRadius: 999,
        background: "#ffffff",
        color: "#111827",
        fontSize: 15,
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.24)"
    },
    demosHeading: {
        display: "flex",
        justifyContent: "center"
    },
    demosTitle: {
        margin: 0,
        fontSize: "clamp(30px, 3.4vw, 44px)",
        fontWeight: 700,
        lineHeight: 1.1,
        color: "#111827",
        textAlign: "center" as const
    },
    demosGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 28
    },
    demoCard: {
        display: "grid",
        gap: 18,
        alignContent: "start"
    },
    demoMediaPlaceholder: {
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        borderRadius: 16,
        border: "1px dashed #cbd5e1",
        background: "#ffffff"
    },
    demoMediaLabel: {
        fontSize: 15,
        fontWeight: 600,
        color: "rgba(17, 24, 39, 0.58)"
    },
    demoContent: {
        display: "grid",
        gap: 10
    },
    demoTitle: {
        margin: 0,
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.3,
        color: "#111827"
    },
    demoParagraph: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.65,
        color: "#4b5563"
    },
    demoLink: {
        color: "#111827",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "underline"
    }
} satisfies Record<string, import("react").CSSProperties>;
