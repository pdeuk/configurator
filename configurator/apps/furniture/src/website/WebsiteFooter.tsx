import {
    FacebookIcon,
    InstagramIcon,
    LinkedinIcon,
    PinIcon,
    YoutubeIcon
} from "./icons";

export function WebsiteFooter() {
    return (
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
    );
}

const styles = {
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
    }
} satisfies Record<string, import("react").CSSProperties>;
