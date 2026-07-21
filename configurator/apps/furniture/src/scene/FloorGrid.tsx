import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { FLOOR_GRID_CELL_SIZE } from "../utils/floorMaterials";

interface FloorGridProps {
    width: number;
    depth: number;
}

export function FloorGrid({ width, depth }: FloorGridProps) {
    const geometry = useMemo(() => {
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const columnCount = Math.max(1, Math.round(width / FLOOR_GRID_CELL_SIZE));
        const rowCount = Math.max(1, Math.round(depth / FLOOR_GRID_CELL_SIZE));
        const positions: number[] = [];

        for (let row = 0; row <= rowCount; row += 1) {
            const z = -halfDepth + (row / rowCount) * depth;
            positions.push(-halfWidth, 0.001, z, halfWidth, 0.001, z);
        }

        for (let column = 0; column <= columnCount; column += 1) {
            const x = -halfWidth + (column / columnCount) * width;
            positions.push(x, 0.001, -halfDepth, x, 0.001, halfDepth);
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

        return geometry;
    }, [depth, width]);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#d1d5db" />
        </lineSegments>
    );
}
