import type { CSSProperties } from "react";

export const websiteTheme = {
    colors: {
        bg: "#f4f4f5",
        bgElevated: "#ffffff",
        surface: "#ffffff",
        ink: "#09090b",
        inkSoft: "#3f3f46",
        muted: "#71717a",
        faint: "#a1a1aa",
        border: "rgba(9, 9, 11, 0.1)",
        borderSoft: "rgba(9, 9, 11, 0.06)",
        accent: "#0284c7",
        accentDark: "#0369a1",
        accentSoft: "rgba(2, 132, 199, 0.1)",
        dark: "#09090b",
        darkSoft: "#18181b",
        white: "#ffffff",
        overlay: "rgba(9, 9, 11, 0.45)"
    },
    fonts: {
        body: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
        heading: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif'
    },
    shadow: {
        sm: "0 1px 2px rgba(9, 9, 11, 0.04), 0 8px 24px rgba(9, 9, 11, 0.04)",
        md: "0 4px 16px rgba(9, 9, 11, 0.06), 0 20px 48px rgba(9, 9, 11, 0.06)",
        lg: "0 8px 32px rgba(9, 9, 11, 0.08), 0 32px 64px rgba(9, 9, 11, 0.08)",
        header: "0 1px 0 rgba(9, 9, 11, 0.06)"
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        pill: 999
    },
    spacing: {
        pageX: 32,
        sectionY: 80
    }
} as const;

export const t = websiteTheme;

export const premiumGradients = {
    livingRoom: "linear-gradient(160deg, #e4e4e7 0%, #a1a1aa 55%, #52525b 100%)",
    bedroom: "linear-gradient(160deg, #dbeafe 0%, #93c5fd 52%, #3b82f6 100%)",
    office: "linear-gradient(160deg, #f4f4f5 0%, #d4d4d8 50%, #71717a 100%)",
    outdoor: "linear-gradient(160deg, #ecfdf5 0%, #86efac 48%, #059669 100%)",
    placeholder: "linear-gradient(180deg, #fafafa 0%, #e4e4e7 100%)",
    placeholderDark: "linear-gradient(160deg, #18181b 0%, #09090b 100%)",
    cta: "linear-gradient(160deg, #09090b 0%, #18181b 42%, #27272a 100%)"
} as const;

export function displayTitleStyle(size = "clamp(2rem, 4vw, 3.25rem)"): CSSProperties {
    return {
        margin: 0,
        fontFamily: t.fonts.heading,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        color: t.colors.ink
    };
}

export function bodyTextStyle(maxWidth?: number): CSSProperties {
    return {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.75,
        color: t.colors.inkSoft,
        ...(maxWidth ? { maxWidth } : {})
    };
}

export function eyebrowStyle(): CSSProperties {
    return {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: t.colors.muted
    };
}
