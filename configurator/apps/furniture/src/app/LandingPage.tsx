import { WebsiteCarousel } from "../website/WebsiteCarousel";
import { WebsiteHeader } from "../website/WebsiteHeader";

export function LandingPage() {
    return (
        <div style={styles.page}>
            <WebsiteHeader />
            <main style={styles.main}>
                <WebsiteCarousel />
            </main>
        </div>
    );
}

const styles = {
    page: {
        position: "fixed" as const,
        inset: 0,
        overflowY: "auto" as const,
        background: "#ffffff",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    },
    main: {
        maxWidth: 1440,
        margin: "0 auto"
    }
} satisfies Record<string, import("react").CSSProperties>;
