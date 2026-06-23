/**
 * Offset child meshes toward the frame/interior side of a fabric panel.
 * Panel geometry lies in XY with FrontSide on +Z; rotation determines which
 * local Z direction points into the module.
 */
export function getInteriorLocalZOffset(
    rotation: [number, number, number],
    magnitude: number
): number {
    const [tiltX, yawY] = rotation;

    if (Math.abs(Math.abs(tiltX) - Math.PI / 2) < 0.001 && Math.abs(yawY) < 0.001) {
        return -magnitude;
    }

    return -Math.cos(yawY) * magnitude;
}
