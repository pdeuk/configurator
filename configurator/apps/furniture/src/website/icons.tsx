import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function SearchIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

export function CartIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path
                d="M6 6h15l-1.5 9H8L6 6Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
            <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <circle cx="9.5" cy="19" r="1.25" fill="currentColor" />
            <circle cx="17.5" cy="19" r="1.25" fill="currentColor" />
        </svg>
    );
}

export function GlobeIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
            <path
                d="M3 12h18M12 3c2.5 2.8 3.8 6.2 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6.2-3.8 9s1.3 6.2 3.8 9"
                stroke="currentColor"
                strokeWidth="1.75"
            />
        </svg>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

export function LinkedinIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.75" />
            <path d="M8 10v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <path d="M12 16v-3.2c0-1.2.9-2.3 2.2-2.3 1.3 0 1.8.9 1.8 2.3V16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="7.5" r="1" fill="currentColor" />
        </svg>
    );
}

export function YoutubeIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <rect x="3" y="6.5" width="18" height="11" rx="3.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" />
        </svg>
    );
}

export function FacebookIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 20v-6h2.3l.4-2.5h-2.7V10c0-.8.3-1.5 1.5-1.5H16V6.3c-.3 0-.9-.1-1.7-.1-2.2 0-3.6 1.3-3.6 3.7v1.6H9v2.5h1.7v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function InstagramIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.75" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
            <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
    );
}

export function PinIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M12 20s5-5.6 5-9a5 5 0 1 0-10 0c0 3.4 5 9 5 9Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="1.8" fill="currentColor" />
        </svg>
    );
}
