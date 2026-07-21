import type { ReactNode } from "react";
import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteHeader } from "./WebsiteHeader";

interface WebsiteLayoutProps {
    children: ReactNode;
}

export function WebsiteLayout({ children }: WebsiteLayoutProps) {
    return (
        <div style={styles.page}>
            <WebsiteHeader />
            <main style={styles.main}>{children}</main>
            <div style={styles.footerWrap}>
                <WebsiteFooter />
            </div>
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
        margin: "0 auto",
        width: "100%"
    },
    footerWrap: {
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%",
        padding: "0 28px 32px",
        boxSizing: "border-box" as const
    }
} satisfies Record<string, import("react").CSSProperties>;
