import { bodyTextStyle, displayTitleStyle, t } from "./websiteTheme";

export function WebsiteContactSection() {
    return (
        <section style={styles.section}>
            <div style={styles.card}>
                <div style={styles.heading}>
                    <span className="website-eyebrow">Get in touch</span>
                    <h2 className="website-heading" style={displayTitleStyle("clamp(2rem, 3.6vw, 3.2rem)")}>
                        Contact Us
                    </h2>
                </div>
                <p style={bodyTextStyle(720)}>
                    Placeholder contact section for showroom visits, configurator demos, or bespoke
                    furniture inquiries. This block can later become a refined form or appointment CTA.
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
        gap: 18,
        justifyItems: "center",
        padding: "52px 32px",
        borderRadius: t.radius.xl,
        background: t.colors.bgElevated,
        border: `1px solid ${t.colors.borderSoft}`,
        boxShadow: t.shadow.sm,
        textAlign: "center" as const
    },
    heading: {
        display: "grid",
        gap: 12
    }
} satisfies Record<string, import("react").CSSProperties>;
