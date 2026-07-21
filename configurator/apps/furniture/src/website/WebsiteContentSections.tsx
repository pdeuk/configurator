type SectionLayout = "text-left" | "text-right";

interface ContentSectionProps {
    layout: SectionLayout;
    title: string;
    paragraph: string;
    imageLabel: string;
}

function ContentSection({ layout, title, paragraph, imageLabel }: ContentSectionProps) {
    const textBlock = (
        <div style={styles.textBlock}>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.paragraph}>{paragraph}</p>
        </div>
    );

    const imageBlock = (
        <div style={styles.imagePlaceholder} aria-label={imageLabel}>
            <span style={styles.imageLabel}>{imageLabel}</span>
            <span style={styles.imageHint}>Placeholder image</span>
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
    }
} satisfies Record<string, import("react").CSSProperties>;
