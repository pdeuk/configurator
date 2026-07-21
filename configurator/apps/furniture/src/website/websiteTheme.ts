import type { CSSProperties } from "react";

export const websiteTheme = {
    colors: {
        bg: "#f7f4ef",
        bgElevated: "#fffcf8",
        surface: "#ffffff",
        ink: "#1c1917",
        inkSoft: "#44403c",
        muted: "#78716c",
        faint: "#a8a29e",
        border: "rgba(28, 25, 23, 0.1)",
        borderSoft: "rgba(28, 25, 23, 0.06)",
        accent: "#9a7b4f",
        accentDark: "#7a6138",
        accentSoft: "rgba(154, 123, 79, 0.14)",
        dark: "#141210",
        darkSoft: "#292524",
        white: "#ffffff",
        overlay: "rgba(20, 18, 16, 0.52)"
    },
    fonts: {
        body: '"Inter", "Segoe UI", system-ui, sans-serif',
        display: '"Cormorant Garamond", Georgia, "Times New Roman", serif'
    },
    shadow: {
        sm: "0 8px 24px rgba(28, 25, 23, 0.06)",
        md: "0 18px 48px rgba(28, 25, 23, 0.08)",
        lg: "0 28px 70px rgba(28, 25, 23, 0.12)",
        header: "0 1px 0 rgba(28, 25, 23, 0.05), 0 10px 30px rgba(28, 25, 23, 0.04)"
    },
    radius: {
        sm: 12,
        md: 18,
        lg: 24,
        xl: 32,
        pill: 999
    },
    spacing: {
        pageX: 32,
        sectionY: 72
    }
} as const;

export const t = websiteTheme;

export const premiumGradients = {
    livingRoom: "linear-gradient(135deg, #d6d0c8 0%, #b8afa3 42%, #8f8578 100%)",
    bedroom: "linear-gradient(135deg, #c8ccd4 0%, #9aa3b0 45%, #6b7280 100%)",
    office: "linear-gradient(135deg, #e8dfd1 0%, #cdb99a 48%, #a68963 100%)",
    outdoor: "linear-gradient(135deg, #d5ddd0 0%, #aeb9a0 45%, #87967a 100%)",
    placeholder: "linear-gradient(145deg, #f3eee7 0%, #e8e0d6 100%)",
    placeholderDark: "linear-gradient(145deg, #2a2724 0%, #1c1917 100%)",
    cta: "linear-gradient(135deg, #141210 0%, #292524 38%, #3f3a36 72%, #6b5a45 100%)"
} as const;

export function displayTitleStyle(size = "clamp(2rem, 4vw, 3.5rem)"): CSSProperties {
    return {
        margin: 0,
        fontFamily: t.fonts.display,
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1.08,
        letterSpacing: "-0.02em",
        color: t.colors.ink
    };
}

export function bodyTextStyle(maxWidth?: number): CSSProperties {
    return {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.8,
        color: t.colors.inkSoft,
        ...(maxWidth ? { maxWidth } : {})
    };
}

export function eyebrowStyle(): CSSProperties {
    return {
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: t.colors.accent
    };
}
