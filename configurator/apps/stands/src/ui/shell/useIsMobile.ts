import { useEffect, useState } from "react";

// A phone in any orientation has both dimensions under ~960px and a coarse
// (touch) pointer. Checking both width AND height keeps the drawer active in
// landscape too, while excluding tablets (one dimension >= ~1024) and desktops
// (fine pointer). Falls back to a plain width check if pointer media is absent.
const MOBILE_QUERY =
    "(pointer: coarse) and (max-width: 960px) and (max-height: 960px), (max-width: 768px)";

/** Tracks whether the viewport is phone-sized. Updates on resize/orientation change. */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return false;
        }

        return window.matchMedia(MOBILE_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return isMobile;
}
