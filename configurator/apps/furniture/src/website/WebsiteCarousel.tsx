import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { premiumGradients, t } from "./websiteTheme";

const SLIDES = [
    {
        id: "living-room",
        label: "Living room collection",
        subtitle: "Refined seating and statement silhouettes",
        gradient: premiumGradients.livingRoom
    },
    {
        id: "bedroom",
        label: "Bedroom essentials",
        subtitle: "Calm textures and tailored comfort",
        gradient: premiumGradients.bedroom
    },
    {
        id: "office",
        label: "Home office range",
        subtitle: "Workspaces with quiet luxury",
        gradient: premiumGradients.office
    },
    {
        id: "outdoor",
        label: "Outdoor furniture",
        subtitle: "Terrace-ready materials and form",
        gradient: premiumGradients.outdoor
    }
] as const;

const AUTO_ADVANCE_MS = 6000;

export function WebsiteCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveIndex(current => (current + 1) % SLIDES.length);
        }, AUTO_ADVANCE_MS);

        return () => window.clearInterval(timer);
    }, []);

    const goTo = (index: number) => {
        const normalized = (index + SLIDES.length) % SLIDES.length;
        setActiveIndex(normalized);
    };

    return (
        <section style={styles.section} aria-label="Featured collections">
            <div style={styles.viewport}>
                <div
                    style={{
                        ...styles.track,
                        transform: `translateX(-${activeIndex * 100}%)`
                    }}
                >
                    {SLIDES.map(slide => (
                        <article key={slide.id} style={styles.slide} aria-hidden={slide.id !== SLIDES[activeIndex]?.id}>
                            <div
                                style={{
                                    ...styles.placeholder,
                                    background: slide.gradient
                                }}
                            >
                                <div style={styles.placeholderOverlay} />
                                <div style={styles.placeholderContent}>
                                    <span className="website-configurator-badge">3D configurator</span>
                                    <span className="website-eyebrow" style={styles.slideEyebrow}>
                                        Featured collection
                                    </span>
                                    <h2 className="website-heading" style={styles.placeholderLabel}>
                                        {slide.label}
                                    </h2>
                                    <p style={styles.placeholderHint}>{slide.subtitle}</p>
                                    {slide.id === "living-room" ? (
                                        <Link to="/app" className="website-btn-configurator" style={styles.ctaButton}>
                                            Check Our Configurator
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <button
                    type="button"
                    className="website-icon-btn"
                    style={{ ...styles.navButton, left: 20 }}
                    aria-label="Previous slide"
                    onClick={() => goTo(activeIndex - 1)}
                >
                    <ChevronLeftIcon style={styles.navIcon} />
                </button>

                <button
                    type="button"
                    className="website-icon-btn"
                    style={{ ...styles.navButton, right: 20 }}
                    aria-label="Next slide"
                    onClick={() => goTo(activeIndex + 1)}
                >
                    <ChevronRightIcon style={styles.navIcon} />
                </button>
            </div>

            <div style={styles.dots}>
                {SLIDES.map((slide, index) => (
                    <button
                        key={slide.id}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === activeIndex ? "true" : undefined}
                        style={{
                            ...styles.dot,
                            ...(index === activeIndex ? styles.dotActive : {})
                        }}
                        onClick={() => goTo(index)}
                    />
                ))}
            </div>
        </section>
    );
}

const styles = {
    section: {
        display: "grid",
        gap: 18,
        padding: "28px 32px 48px"
    },
    viewport: {
        position: "relative" as const,
        overflow: "hidden",
        borderRadius: t.radius.lg,
        background: t.colors.dark,
        border: `1px solid ${t.colors.borderSoft}`,
        boxShadow: t.shadow.md
    },
    track: {
        display: "flex",
        width: "100%",
        transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"
    },
    slide: {
        minWidth: "100%"
    },
    placeholder: {
        position: "relative" as const,
        display: "grid",
        placeItems: "center",
        minHeight: "clamp(320px, 44vw, 560px)"
    },
    placeholderOverlay: {
        position: "absolute" as const,
        inset: 0,
        background:
            "linear-gradient(180deg, rgba(9, 9, 11, 0.12) 0%, rgba(9, 9, 11, 0.55) 78%, rgba(9, 9, 11, 0.72) 100%)"
    },
    placeholderContent: {
        position: "relative" as const,
        zIndex: 1,
        display: "grid",
        gap: 16,
        justifyItems: "center",
        textAlign: "center" as const,
        padding: "0 24px"
    },
    slideEyebrow: {
        color: "rgba(255, 255, 255, 0.72)"
    },
    placeholderLabel: {
        margin: 0,
        fontSize: "clamp(2rem, 4.8vw, 3.75rem)",
        fontWeight: 700,
        color: "#fff"
    },
    placeholderHint: {
        margin: 0,
        maxWidth: 520,
        fontSize: 16,
        lineHeight: 1.7,
        color: "rgba(255, 255, 255, 0.78)"
    },
    ctaButton: {
        marginTop: 4
    },
    navButton: {
        position: "absolute" as const,
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(255, 255, 255, 0.92)"
    },
    navIcon: {
        width: 20,
        height: 20
    },
    dots: {
        display: "flex",
        justifyContent: "center",
        gap: 10
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        border: "none",
        background: "rgba(28, 25, 23, 0.18)",
        cursor: "pointer",
        padding: 0,
        transition: "all 220ms ease"
    },
    dotActive: {
        width: 28,
        background: t.colors.accent
    }
} satisfies Record<string, import("react").CSSProperties>;
