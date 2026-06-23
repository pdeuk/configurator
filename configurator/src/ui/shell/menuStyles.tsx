import type { CSSProperties } from "react";

export const menuStyles = {
    sectionLabel: {
        padding: "8px 12px 4px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    divider: {
        height: 1,
        margin: "4px 0",
        background: "#3b414a"
    },
    item: {
        border: "none",
        background: "transparent",
        color: "#f7f7f2",
        textAlign: "left",
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        width: "100%"
    },
    itemIndented: {
        paddingLeft: 20
    }
} satisfies Record<string, CSSProperties>;

export function MenuSection({ label }: { label: string }) {
    return <div style={menuStyles.sectionLabel}>{label}</div>;
}

export function MenuDivider() {
    return <div style={menuStyles.divider} role="separator" />;
}
