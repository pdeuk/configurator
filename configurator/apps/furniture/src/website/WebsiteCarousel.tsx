import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const SLIDES = [
    {
        id: "living-room",
        label: "Living room collection",
        gradient: "linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 45%, #a8a29e 100%)"
    },
    {
        id: "bedroom",
        label: "Bedroom essentials",
        gradient: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 45%, #93c5fd 100%)"
    },
    {
        id: "office",
        label: "Home office range",
        gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 45%, #fbbf24 100%)"
    },
    {
        id: "outdoor",
        label: "Outdoor furniture",
        gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 45%, #86efac 100%)"
    }
] as const;

const AUTO_ADVANCE_MS = 5000;

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
                                <span style={styles.placeholderLabel}>{slide.label}</span>
                                <span style={styles.placeholderHint}>Placeholder image</span>
                            </div>
                        </article>
                    ))}
                </div>

                <button
                    type="button"
                    style={{ ...styles.navButton, left: 16 }}
                    aria-label="Previous slide"
                    onClick={() => goTo(activeIndex - 1)}
                >
                    <ChevronLeftIcon style={styles.navIcon} />
                </button>

                <button
                    type="button"
                    style={{ ...styles.navButton, right: 16 }}
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
        gap: 16,
        padding: "24px 28px 40px"
    },
    viewport: {
        position: "relative" as const,
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "#f3f4f6"
    },
    track: {
        display: "flex",
        width: "100%",
        transition: "transform 500ms ease"
    },
    slide: {
        minWidth: "100%"
    },
    placeholder: {
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: 8,
        minHeight: "clamp(280px, 42vw, 520px)"
    },
    placeholderLabel: {
        fontSize: "clamp(24px, 4vw, 40px)",
        fontWeight: 700,
        color: "rgba(17, 24, 39, 0.82)"
    },
    placeholderHint: {
        fontSize: 14,
        color: "rgba(17, 24, 39, 0.55)"
    },
    navButton: {
        position: "absolute" as const,
        top: "50%",
        transform: "translateY(-50%)",
        display: "grid",
        placeItems: "center",
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "1px solid rgba(255, 255, 255, 0.65)",
        background: "rgba(255, 255, 255, 0.88)",
        color: "#111827",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)"
    },
    navIcon: {
        width: 22,
        height: 22
    },
    dots: {
        display: "flex",
        justifyContent: "center",
        gap: 8
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        border: "none",
        background: "#d1d5db",
        cursor: "pointer",
        padding: 0
    },
    dotActive: {
        width: 28,
        background: "#111827"
    }
} satisfies Record<string, import("react").CSSProperties>;
