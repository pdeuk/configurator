export function overlapLength(
    minA: number,
    maxA: number,
    minB: number,
    maxB: number
) {
    return Math.max(
        0,
        Math.min(maxA, maxB) - Math.max(minA, minB)
    );
}
