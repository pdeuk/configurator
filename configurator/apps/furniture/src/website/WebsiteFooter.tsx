import {
    FacebookIcon,
    InstagramIcon,
    LinkedinIcon,
    PinIcon,
    YoutubeIcon
} from "./icons";
import { t } from "./websiteTheme";

export function WebsiteFooter() {
    return (
        <footer style={styles.footer}>
            <div style={styles.footerTop}>
                <div style={styles.footerLeft}>
                    <div style={styles.footerBrand}>
                        <span className="website-heading" style={styles.footerLogoText}>
                            Atelier
                        </span>
                        <span style={styles.footerLogoSub}>Furniture</span>
                    </div>
                    <div style={styles.socialBlock}>
                        <h3 style={styles.footerColumnTitle}>Follow Us</h3>
                        <div style={styles.socialLinks}>
                            <a href="/" className="website-icon-btn" style={styles.socialLink} aria-label="LinkedIn">
                                <LinkedinIcon style={styles.socialIcon} />
                            </a>
                            <a href="/" className="website-icon-btn" style={styles.socialLink} aria-label="YouTube">
                                <YoutubeIcon style={styles.socialIcon} />
                            </a>
                            <a href="/" className="website-icon-btn" style={styles.socialLink} aria-label="Facebook">
                                <FacebookIcon style={styles.socialIcon} />
                            </a>
                            <a href="/" className="website-icon-btn" style={styles.socialLink} aria-label="Instagram">
                                <InstagramIcon style={styles.socialIcon} />
                            </a>
                        </div>
                    </div>
                </div>
                <div style={styles.footerRight}>
                    <div style={styles.mapPlaceholder} aria-label="Map placeholder">
                        <PinIcon style={styles.mapPin} />
                        <span style={styles.mapLabel}>Athens showroom location</span>
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
                            <a href="/" className="website-text-link" style={styles.footerLegalLink}>
                                Terms &amp; Conditions
                            </a>
                            <a href="/" className="website-text-link" style={styles.footerLegalLink}>
                                Privacy Policy
                            </a>
                            <a href="/" className="website-text-link" style={styles.footerLegalLink}>
                                Legal Information
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div style={styles.footerBottom}>
                <span style={styles.footerBottomText}>
                    Trademark 2026 Atelier Furniture, 123 Placeholder Avenue, Athens 105 58, Greece
                </span>
            </div>
        </footer>
    );
}

const styles = {
    footer: {
        display: "grid",
        gap: 32,
        padding: "24px 0 0",
        borderTop: `1px solid ${t.colors.borderSoft}`
    },
    footerTop: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)",
        gap: 48,
        paddingTop: 12
    },
    footerLeft: {
        display: "grid",
        gap: 32,
        alignContent: "start"
    },
    footerBrand: {
        display: "grid",
        gap: 6
    },
    footerLogoText: {
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: t.colors.ink
    },
    footerLogoSub: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    socialBlock: {
        display: "grid",
        gap: 16
    },
    footerColumnTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: t.colors.ink
    },
    socialLinks: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
    },
    socialLink: {
        textDecoration: "none"
    },
    socialIcon: {
        width: 18,
        height: 18
    },
    footerRight: {
        display: "grid",
        gap: 28,
        alignContent: "start"
    },
    mapPlaceholder: {
        position: "relative" as const,
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        borderRadius: t.radius.lg,
        border: `1px solid ${t.colors.borderSoft}`,
        background:
            "linear-gradient(135deg, #eef2ff 0%, #dbeafe 36%, #f4f4f5 36%, #f4f4f5 100%)",
        boxShadow: t.shadow.sm
    },
    mapPin: {
        width: 36,
        height: 36,
        color: t.colors.accent
    },
    mapLabel: {
        position: "absolute" as const,
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    footerInfoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 28
    },
    footerInfoBlock: {
        display: "grid",
        gap: 10,
        alignContent: "start"
    },
    footerInfoText: {
        margin: 0,
        fontSize: 15,
        lineHeight: 1.7,
        color: t.colors.inkSoft
    },
    footerLegalLink: {
        width: "fit-content"
    },
    footerBottom: {
        padding: "20px 0 0",
        borderTop: `1px solid ${t.colors.borderSoft}`
    },
    footerBottomText: {
        display: "block",
        fontSize: 13,
        lineHeight: 1.7,
        color: t.colors.muted
    }
} satisfies Record<string, import("react").CSSProperties>;
