import { Link } from "react-router-dom";
import { WebsiteAssetImage } from "./WebsiteAssetImage";
import { WebsiteContactSection } from "./WebsiteContactSection";
import {
    demoPreviewPath,
    demoPreviewSeed,
    homepageSectionPaths,
    homepageSectionSeed
} from "./websiteAssets";
import { bodyTextStyle, displayTitleStyle, eyebrowStyle, t } from "./websiteTheme";

type SectionLayout = "text-left" | "text-right";

interface ContentSectionProps {
    layout: SectionLayout;
    title: string;
    paragraph: string;
    localSrc: string;
    seed: string;
    alt: string;
}

const DEMO_ITEMS = Array.from({ length: 9 }, (_, index) => {
    const id = `demo-${String(index + 1).padStart(2, "0")}`;
    return {
        id,
        title: `Demo title ${index + 1}`,
        paragraph:
            "Explore this configurable product family with automatic preview imagery until your own assets are added."
    };
});

function ContentSection({ layout, title, paragraph, localSrc, seed, alt }: ContentSectionProps) {
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
        <div style={styles.imageFrame}>
            <WebsiteAssetImage localSrc={localSrc} seed={seed} alt={alt} width={1200} height={900} />
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
                paragraph="Editorial imagery loads automatically for now. Drop your own file into the matching folder anytime to override it."
                localSrc={homepageSectionPaths.featuredCollection}
                seed={homepageSectionSeed("featuredCollection")}
                alt="Featured collection"
            />
            <ContentSection
                layout="text-right"
                title="Designed to be discovered"
                paragraph="Each block uses a unique placeholder image based on its section name, so the homepage feels alive without sourcing hundreds of photos."
                localSrc={homepageSectionPaths.designInspiration}
                seed={homepageSectionSeed("designInspiration")}
                alt="Design inspiration"
            />
            <ContentSection
                layout="text-left"
                title="Configure before you buy"
                paragraph="This area is reserved for a live 3D preview. For now it shows a poster image until a GLB model is added to the models folder."
                localSrc={homepageSectionPaths.modelShowcasePoster}
                seed={homepageSectionSeed("modelShowcasePoster")}
                alt="3D model showcase"
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
                            <div style={styles.demoMediaFrame}>
                                <WebsiteAssetImage
                                    localSrc={demoPreviewPath(item.id)}
                                    seed={demoPreviewSeed(item.id)}
                                    alt={item.title}
                                    width={600}
                                    height={600}
                                />
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
                    <div style={styles.ctaBackgroundWrap}>
                        <WebsiteAssetImage
                            localSrc={homepageSectionPaths.ctaBanner}
                            seed={homepageSectionSeed("ctaBanner")}
                            alt="Configurator preview"
                            width={1920}
                            height={700}
                        />
                    </div>
                    <div style={styles.ctaOverlay} />
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
    imageFrame: {
        minHeight: 360,
        borderRadius: t.radius.lg,
        overflow: "hidden",
        border: `1px solid ${t.colors.borderSoft}`,
        boxShadow: t.shadow.sm
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
        position: "relative" as const,
        minHeight: 440,
        display: "grid",
        alignItems: "end",
        gap: 28,
        padding: "56px 32px 44px",
        overflow: "hidden",
        background: t.colors.dark
    },
    ctaBackgroundWrap: {
        position: "absolute" as const,
        inset: 0
    },
    ctaOverlay: {
        position: "absolute" as const,
        inset: 0,
        background:
            "linear-gradient(180deg, rgba(9, 9, 11, 0.35) 0%, rgba(9, 9, 11, 0.78) 72%, rgba(9, 9, 11, 0.92) 100%)"
    },
    ctaCopy: {
        position: "relative" as const,
        zIndex: 1,
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
        position: "relative" as const,
        zIndex: 1,
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
    demoMediaFrame: {
        minHeight: 240,
        borderRadius: t.radius.md,
        overflow: "hidden",
        border: `1px solid ${t.colors.borderSoft}`
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
