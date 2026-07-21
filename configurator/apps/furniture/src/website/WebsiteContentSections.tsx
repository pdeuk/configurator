import { Link } from "react-router-dom";
import { WebsiteContactSection } from "./WebsiteContactSection";
import { bodyTextStyle, displayTitleStyle, eyebrowStyle, premiumGradients, t } from "./websiteTheme";

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
            <span className="website-eyebrow">Collection story</span>
            <h2 className="website-heading" style={displayTitleStyle("clamp(2rem, 3.4vw, 3rem)")}>
                {title}
            </h2>
            <p style={bodyTextStyle(520)}>{paragraph}</p>
        </div>
    );

    const imageBlock = (
        <div style={styles.imagePlaceholder} aria-label={imageLabel}>
            <span style={styles.imageLabel}>{imageLabel}</span>
            <span style={styles.imageHint}>
                {mediaKind === "model" ? "3D model preview area" : "Image placeholder"}
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
                title="Crafted for considered spaces"
                paragraph="Use this editorial block for a collection story, material focus, or brand narrative that feels closer to a luxury lookbook than a generic product page."
                imageLabel="Featured collection"
            />
            <ContentSection
                layout="text-right"
                title="Designed to be discovered"
                paragraph="This section can introduce a seasonal edit, showroom highlight, or inspiration-led product family before visitors move deeper into categories and individual products."
                imageLabel="Design inspiration"
            />
            <ContentSection
                layout="text-left"
                title="Configure before you buy"
                paragraph="This area is reserved for a live 3D product preview. It should feel like part of the shopping experience, not a separate tool bolted onto the website."
                imageLabel="3D model showcase"
                mediaKind="model"
            />
            <section style={styles.demosSection}>
                <div style={styles.demosHeading}>
                    <span className="website-eyebrow">Interactive range</span>
                    <h2 className="website-heading" style={displayTitleStyle("clamp(2.2rem, 3.8vw, 3.4rem)")}>
                        Demos
                    </h2>
                </div>
                <div style={styles.demosGrid}>
                    {DEMO_ITEMS.map(item => (
                        <article key={item.id} style={styles.demoCard}>
                            <div style={styles.demoMediaPlaceholder} aria-label={`${item.title} 3D model placeholder`}>
                                <span style={styles.demoMediaLabel}>3D model placeholder</span>
                            </div>
                            <div style={styles.demoContent}>
                                <h3 className="website-heading" style={styles.demoTitle}>
                                    {item.title}
                                </h3>
                                <p style={styles.demoParagraph}>{item.paragraph}</p>
                                <Link to="/" className="website-text-link">
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
                        <span className="website-eyebrow" style={styles.ctaEyebrow}>
                            Interactive preview
                        </span>
                        <h2 className="website-heading" style={styles.ctaTitle}>
                            See how the configurator works
                        </h2>
                        <p style={styles.ctaParagraph}>
                            Step from curated product storytelling into a live customization experience
                            designed to feel intentional, premium, and showroom-ready.
                        </p>
                    </div>
                    <div style={styles.ctaButtonRow}>
                        <Link to="/app" className="website-btn-configurator" style={styles.ctaButton}>
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
        gap: t.spacing.sectionY,
        padding: `12px ${t.spacing.pageX}px 72px`
    },
    section: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 48,
        alignItems: "center"
    },
    textBlock: {
        display: "grid",
        gap: 18,
        padding: "8px 0"
    },
    imagePlaceholder: {
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: 10,
        minHeight: 360,
        borderRadius: t.radius.lg,
        border: `1px solid ${t.colors.borderSoft}`,
        background: premiumGradients.placeholder,
        boxShadow: t.shadow.sm
    },
    imageLabel: {
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: t.colors.ink
    },
    imageHint: {
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    demosSection: {
        display: "grid",
        gap: 36,
        paddingTop: 12
    },
    ctaSection: {
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)"
    },
    ctaBanner: {
        minHeight: 440,
        display: "grid",
        alignItems: "end",
        gap: 28,
        padding: "56px 32px 44px",
        background: premiumGradients.cta,
        borderTop: `1px solid ${t.colors.borderSoft}`,
        borderBottom: `1px solid ${t.colors.borderSoft}`
    },
    ctaCopy: {
        display: "grid",
        gap: 16,
        justifyItems: "center",
        textAlign: "center" as const,
        color: t.colors.white,
        maxWidth: 760,
        margin: "0 auto"
    },
    ctaEyebrow: {
        ...eyebrowStyle(),
        color: "rgba(255, 255, 255, 0.58)"
    },
    ctaTitle: {
        ...displayTitleStyle("clamp(2.4rem, 4.8vw, 4rem)"),
        color: t.colors.white
    },
    ctaParagraph: {
        margin: 0,
        fontSize: 17,
        lineHeight: 1.8,
        color: "rgba(255, 255, 255, 0.78)"
    },
    ctaButtonRow: {
        display: "flex",
        justifyContent: "center"
    },
    ctaButton: {
        marginTop: 4
    },
    demosHeading: {
        display: "grid",
        gap: 12,
        justifyItems: "center",
        textAlign: "center" as const
    },
    demosGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 28
    },
    demoCard: {
        display: "grid",
        gap: 20,
        alignContent: "start",
        padding: 18,
        borderRadius: t.radius.lg,
        background: t.colors.bgElevated,
        border: `1px solid ${t.colors.borderSoft}`,
        boxShadow: t.shadow.sm
    },
    demoMediaPlaceholder: {
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        borderRadius: t.radius.md,
        border: `1px solid ${t.colors.borderSoft}`,
        background: t.colors.surface
    },
    demoMediaLabel: {
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    demoContent: {
        display: "grid",
        gap: 12,
        padding: "0 4px 6px"
    },
    demoTitle: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        color: t.colors.ink
    },
    demoParagraph: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.75,
        color: t.colors.inkSoft
    }
} satisfies Record<string, import("react").CSSProperties>;
