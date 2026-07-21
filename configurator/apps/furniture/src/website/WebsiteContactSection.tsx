export function WebsiteContactSection() {
    return (
        <section style={styles.section}>
            <div style={styles.card}>
                <div style={styles.heading}>
                    <span style={styles.eyebrow}>Get in touch</span>
                    <h2 style={styles.title}>Contact Us</h2>
                </div>
                <p style={styles.paragraph}>
                    Placeholder contact section for showroom visits, configurator demos, or custom
                    furniture inquiries. Add your real form or contact details here later.
                </p>
            </div>
        </section>
    );
}

const styles = {
    section: {
        display: "grid",
        paddingTop: 8
    },
    card: {
        display: "grid",
        gap: 16,
        justifyItems: "center",
        padding: "40px 28px",
        borderRadius: 24,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        textAlign: "center" as const
    },
    heading: {
        display: "grid",
        gap: 10
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "#64748b"
    },
    title: {
        margin: 0,
        fontSize: "clamp(30px, 3.5vw, 44px)",
        lineHeight: 1.1,
        fontWeight: 700,
        color: "#111827"
    },
    paragraph: {
        margin: 0,
        maxWidth: 720,
        fontSize: 16,
        lineHeight: 1.7,
        color: "#4b5563"
    }
} satisfies Record<string, import("react").CSSProperties>;
