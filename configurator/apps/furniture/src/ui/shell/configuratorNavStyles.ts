import type { CSSProperties } from "react";

export const configuratorNavStyles = {
    navSection: {
        display: "grid"
    },
    navTrigger: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        border: "none",
        borderBottom: "1px solid #e7e5e4",
        background: "transparent",
        color: "#1c1917",
        padding: "14px 16px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left" as const
    },
    navTriggerLabel: {
        letterSpacing: "-0.01em"
    },
    navChevron: {
        color: "#78716c",
        fontSize: 12
    },
    navDropdown: {
        padding: "14px 16px 16px",
        borderBottom: "1px solid #e7e5e4",
        background: "#ffffff"
    },
    nestedNavList: {
        display: "grid",
        gap: 8
    },
    nestedNavGroup: {
        display: "grid",
        gap: 6
    },
    nestedNavTrigger: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        width: "100%",
        border: "1px solid #e7e5e4",
        borderRadius: 8,
        background: "#fafaf9",
        color: "#1c1917",
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "left" as const
    },
    subcategoryList: {
        listStyle: "none",
        margin: 0,
        padding: "0 0 0 10px",
        display: "grid",
        gap: 6
    },
    subcategoryItem: {
        fontSize: 13,
        lineHeight: 1.45,
        color: "#57534e",
        padding: "4px 0 4px 8px",
        borderLeft: "2px solid #e7e5e4"
    },
    selectedProductPanel: {
        padding: "14px 16px 16px",
        borderBottom: "1px solid #e7e5e4",
        background: "#ffffff",
        display: "grid",
        gap: 8
    },
    selectedProductLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: "#1c1917",
        letterSpacing: "-0.01em"
    },
    selectedProductValue: {
        fontSize: 13,
        lineHeight: 1.5,
        color: "#44403c",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e7e5e4",
        background: "#fafaf9"
    }
} satisfies Record<string, CSSProperties>;
