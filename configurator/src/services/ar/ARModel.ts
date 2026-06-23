/** Real-world meters per project centimeter (1 m = 100 cm). */
export const CM_PER_METER = 100;

export const AR_CM_TO_METERS = 1 / CM_PER_METER;

/**
 * Scene geometry is stored in meters (e.g. 100 cm wall → width 1).
 * AR uses real-world meters, so the default scale is 1.
 */
export const AR_DEFAULT_SCALE = 1;

export interface ARSession {
    supported: boolean;
    started: boolean;
    placed: boolean;
    scale: number;
}

export interface ARPlacementAnchor {
    position: [number, number, number];
    rotationY: number;
}

export function createInitialARSession(): ARSession {
    return {
        supported: false,
        started: false,
        placed: false,
        scale: AR_DEFAULT_SCALE
    };
}

export function cmToMeters(cm: number): number {
    return cm / CM_PER_METER;
}

export function metersToCm(meters: number): number {
    return meters * CM_PER_METER;
}
