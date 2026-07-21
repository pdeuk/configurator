import { WebsiteCarousel } from "../website/WebsiteCarousel";
import { WebsiteContentSections } from "../website/WebsiteContentSections";
import { WebsiteLayout } from "../website/WebsiteLayout";

export function LandingPage() {
    return (
        <WebsiteLayout>
            <div style={styles.content}>
                <WebsiteCarousel />
                <WebsiteContentSections />
            </div>
        </WebsiteLayout>
    );
}

const styles = {
    content: {
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%"
    }
} satisfies Record<string, import("react").CSSProperties>;
