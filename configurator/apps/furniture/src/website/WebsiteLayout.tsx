import type { ReactNode } from "react";
import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteHeader } from "./WebsiteHeader";
import "./website.css";
import { t } from "./websiteTheme";

interface WebsiteLayoutProps {
    children: ReactNode;
}

export function WebsiteLayout({ children }: WebsiteLayoutProps) {
    return (
        <div className="website-root" style={styles.page}>
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
        background: t.colors.bg,
        color: t.colors.ink
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
        padding: `0 ${t.spacing.pageX}px 40px`,
        boxSizing: "border-box" as const
    }
} satisfies Record<string, import("react").CSSProperties>;
