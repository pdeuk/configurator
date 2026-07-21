import { Link } from "react-router-dom";
import {
    FacebookIcon,
    InstagramIcon,
    LinkedinIcon,
    PinIcon,
    YoutubeIcon
} from "./icons";

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
            <section style={styles.contactSection}>
                <div style={styles.contactCard}>
                    <div style={styles.contactHeading}>
                        <span style={styles.contactEyebrow}>Get in touch</span>
                        <h2 style={styles.contactTitle}>Contact Us</h2>
                    </div>
                    <p style={styles.contactParagraph}>
                        Placeholder contact section for showroom visits, configurator demos, or custom
                        furniture inquiries. Add your real form or contact details here later.
                    </p>
                </div>
            </section>
            <footer style={styles.footer}>
                <div style={styles.footerTop}>
                    <div style={styles.footerLeft}>
                        <div style={styles.footerLogoSlot} aria-label="Footer logo placeholder">
                            <span style={styles.footerLogoText}>LOGO NAME</span>
                        </div>
                        <div style={styles.socialBlock}>
                            <h3 style={styles.footerColumnTitle}>Follow Us</h3>
                            <div style={styles.socialLinks}>
                                <a href="/" style={styles.socialLink} aria-label="LinkedIn">
                                    <LinkedinIcon style={styles.socialIcon} />
                                </a>
                                <a href="/" style={styles.socialLink} aria-label="YouTube">
                                    <YoutubeIcon style={styles.socialIcon} />
                                </a>
                                <a href="/" style={styles.socialLink} aria-label="Facebook">
                                    <FacebookIcon style={styles.socialIcon} />
                                </a>
                                <a href="/" style={styles.socialLink} aria-label="Instagram">
                                    <InstagramIcon style={styles.socialIcon} />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div style={styles.footerRight}>
                        <div style={styles.mapPlaceholder} aria-label="Map placeholder">
                            <PinIcon style={styles.mapPin} />
                            <span style={styles.mapLabel}>Map placeholder with random pin</span>
                        </div>
                        <div style={styles.footerInfoGrid}>
                            <div style={styles.footerInfoBlock}>
                                <h3 style={styles.footerColumnTitle}>Contact Us</h3>
                                <p style={styles.footerInfoText}>hello@placeholderfurniture.com</p>
                                <p style={styles.footerInfoText}>+30 210 000 0000</p>
                                <p style={styles.footerInfoText}>Monday to Friday, 9 am to 5 pm</p>
                            </div>
                            <div style={styles.footerInfoBlock}>
                                <h3 style={styles.footerColumnTitle}>Legal</h3>
                                <a href="/" style={styles.footerLegalLink}>
                                    Terms &amp; Conditions
                                </a>
                                <a href="/" style={styles.footerLegalLink}>
                                    Privacy Policy
                                </a>
                                <a href="/" style={styles.footerLegalLink}>
                                    Legal Information
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={styles.footerBottom}>
                    <span style={styles.footerBottomText}>
                        Trademark 2026 LOGO NAME, 123 Placeholder Avenue, Athens 105 58, Greece
                    </span>
                </div>
            </footer>
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
    contactSection: {
        display: "grid",
        paddingTop: 8
    },
    contactCard: {
        display: "grid",
        gap: 16,
        justifyItems: "center",
        padding: "40px 28px",
        borderRadius: 24,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        textAlign: "center" as const
    },
    contactHeading: {
        display: "grid",
        gap: 10
    },
    contactEyebrow: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "#64748b"
    },
    contactTitle: {
        margin: 0,
        fontSize: "clamp(30px, 3.5vw, 44px)",
        lineHeight: 1.1,
        fontWeight: 700,
        color: "#111827"
    },
    contactParagraph: {
        margin: 0,
        maxWidth: 720,
        fontSize: 16,
        lineHeight: 1.7,
        color: "#4b5563"
    },
    footer: {
        display: "grid",
        gap: 28,
        padding: "8px 0 0",
        borderTop: "1px solid #e5e7eb"
    },
    footerTop: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)",
        gap: 40,
        paddingTop: 16
    },
    footerLeft: {
        display: "grid",
        gap: 28,
        alignContent: "start"
    },
    footerLogoSlot: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 180,
        height: 56,
        borderRadius: 12,
        border: "1px dashed #cbd5e1",
        background: "#f8fafc"
    },
    footerLogoText: {
        fontSize: 14,
        fontWeight: 700,
        color: "#64748b",
        letterSpacing: "0.08em"
    },
    socialBlock: {
        display: "grid",
        gap: 14
    },
    footerColumnTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: "#111827"
    },
    socialLinks: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
    },
    socialLink: {
        display: "grid",
        placeItems: "center",
        width: 42,
        height: 42,
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        color: "#111827",
        textDecoration: "none",
        background: "#ffffff"
    },
    socialIcon: {
        width: 20,
        height: 20
    },
    footerRight: {
        display: "grid",
        gap: 24,
        alignContent: "start"
    },
    mapPlaceholder: {
        position: "relative" as const,
        display: "grid",
        placeItems: "center",
        minHeight: 220,
        borderRadius: 20,
        border: "1px solid #dbe4ee",
        background:
            "linear-gradient(135deg, #eff6ff 0%, #dbeafe 35%, #f8fafc 35%, #f8fafc 100%)"
    },
    mapPin: {
        width: 38,
        height: 38,
        color: "#dc2626"
    },
    mapLabel: {
        position: "absolute" as const,
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 13,
        color: "#475569"
    },
    footerInfoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 24
    },
    footerInfoBlock: {
        display: "grid",
        gap: 8,
        alignContent: "start"
    },
    footerInfoText: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.6,
        color: "#475569"
    },
    footerLegalLink: {
        color: "#111827",
        fontSize: 15,
        lineHeight: 1.6,
        textDecoration: "none"
    },
    footerBottom: {
        padding: "18px 0 0",
        borderTop: "1px solid #e5e7eb"
    },
    footerBottomText: {
        display: "block",
        fontSize: 13,
        lineHeight: 1.6,
        color: "#64748b"
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
