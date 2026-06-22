import { useLayoutEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import {
    RepeatWrapping,
    SRGBColorSpace,
    TextureLoader,
    type Mesh,
    type Texture,
    Vector2
} from "three";
import {
    FLOOR_DIFFUSE_TINT,
    FLOOR_ENV_MAP_INTENSITY,
    GRID_SIZE,
    getFloorMaterial,
    type FloorMaterialId
} from "../utils/floorMaterials";

function configureFloorTexture(
    texture: Texture,
    repeatX: number,
    repeatY: number,
    isColor: boolean
) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = 8;
    texture.colorSpace = isColor ? SRGBColorSpace : texture.colorSpace;
    texture.needsUpdate = true;
}

interface FloorProps {
    materialId: FloorMaterialId;
    width: number;
    depth: number;
}

export function Floor({ materialId, width, depth }: FloorProps) {
    const meshRef = useRef<Mesh>(null);
    const material = getFloorMaterial(materialId);
    const loadedTextures = useLoader(TextureLoader, [
        material.textures.diff,
        material.textures.normal,
        material.textures.arm
    ]);
    const diffuseMap = loadedTextures[0]!;
    const normalMap = loadedTextures[1]!;
    const armMap = loadedTextures[2]!;

    const maps = useMemo(
        () => ({
            diffuseMap,
            normalMap,
            armMap
        }),
        [armMap, diffuseMap, normalMap]
    );
    const normalScale = useMemo(() => new Vector2(0.65, 0.65), []);

    const textureRepeatX = material.tilesAcrossFloor * (width / GRID_SIZE);
    const textureRepeatY = material.tilesAcrossFloor * (depth / GRID_SIZE);

    useLayoutEffect(() => {
        configureFloorTexture(maps.diffuseMap, textureRepeatX, textureRepeatY, true);
        configureFloorTexture(maps.normalMap, textureRepeatX, textureRepeatY, false);
        configureFloorTexture(maps.armMap, textureRepeatX, textureRepeatY, false);
    }, [maps, textureRepeatX, textureRepeatY]);

    useLayoutEffect(() => {
        const mesh = meshRef.current;

        if (!mesh) {
            return;
        }

        mesh.raycast = () => {};
    }, []);

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.002, 0]}
        >
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial
                map={maps.diffuseMap}
                color={FLOOR_DIFFUSE_TINT}
                normalMap={maps.normalMap}
                normalScale={normalScale}
                roughnessMap={maps.armMap}
                aoMap={maps.armMap}
                aoMapIntensity={0.4}
                metalness={0}
                roughness={0.84}
                envMapIntensity={FLOOR_ENV_MAP_INTENSITY}
            />
        </mesh>
    );
}
