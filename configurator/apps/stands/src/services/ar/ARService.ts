import {
    AR_DEFAULT_SCALE,
    createInitialARSession,
    type ARPlacementAnchor,
    type ARSession
} from "./ARModel";

type ARSessionListener = (session: ARSession) => void;

export class ARService {
    private session: ARSession = createInitialARSession();
    private anchor: ARPlacementAnchor | null = null;
    private listeners = new Set<ARSessionListener>();

    subscribe(listener: ARSessionListener): () => void {
        this.listeners.add(listener);
        listener(this.getSession());

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(): void {
        const snapshot = this.getSession();

        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }

    getSession(): ARSession {
        return { ...this.session };
    }

    getAnchor(): ARPlacementAnchor | null {
        if (!this.anchor) {
            return null;
        }

        return {
            position: [...this.anchor.position],
            rotationY: this.anchor.rotationY
        };
    }

    async checkARSupport(): Promise<ARSession> {
        let supported = false;

        if (typeof navigator !== "undefined" && navigator.xr) {
            try {
                supported = await navigator.xr.isSessionSupported("immersive-ar");
            } catch {
                supported = false;
            }
        }

        this.session = {
            ...this.session,
            supported
        };
        this.notify();

        return this.getSession();
    }

    startARSession(scale = AR_DEFAULT_SCALE): ARSession {
        this.session = {
            ...this.session,
            started: true,
            placed: false,
            scale
        };
        this.anchor = null;
        this.notify();

        return this.getSession();
    }

    placeProject(anchor: ARPlacementAnchor): ARSession {
        this.anchor = {
            position: [...anchor.position],
            rotationY: anchor.rotationY
        };
        this.session = {
            ...this.session,
            placed: true
        };
        this.notify();

        return this.getSession();
    }

    exitAR(): ARSession {
        this.session = {
            ...this.session,
            started: false,
            placed: false
        };
        this.anchor = null;
        this.notify();

        return this.getSession();
    }
}

export const arService = new ARService();

export async function checkARSupport(): Promise<ARSession> {
    return arService.checkARSupport();
}

export function startARSession(scale?: number): ARSession {
    return arService.startARSession(scale);
}

export function placeProject(anchor: ARPlacementAnchor): ARSession {
    return arService.placeProject(anchor);
}

export function exitAR(): ARSession {
    return arService.exitAR();
}
