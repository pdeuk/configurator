import { useLayoutEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import {
    RepeatWrapping,
    SRGBColorSpace,
    TextureLoader,
    type Mesh,
    type Texture
} from "three";
import {
    FLOOR_AO_INTENSITY,
    FLOOR_DIFFUSE_TINT,
    FLOOR_ENV_MAP_INTENSITY,
    FLOOR_METALNESS,
    FLOOR_ROUGHNESS,
    FLOOR_TEXTURE_REFERENCE_SIZE,
    getFloorMaterial,
    type FloorMaterialId
} from "../utils/floorMaterials";

function configureFloorTexture(
    texture: Texture,
    repeatX: number,
    repeatY: number,
    isColor: boolean,
    anisotropy: number
) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = anisotropy;
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
    const maxAnisotropy = useThree(state => state.gl.capabilities.getMaxAnisotropy());
    const loadedTextures = useLoader(TextureLoader, [
        material.textures.diff,
        material.textures.arm
    ]);
    const diffuseMap = loadedTextures[0]!;
    const aoMap = loadedTextures[1]!;

    const maps = useMemo(
        () => ({
            diffuseMap,
            aoMap
        }),
        [aoMap, diffuseMap]
    );

    const textureRepeatX = material.tilesAcrossFloor * (width / FLOOR_TEXTURE_REFERENCE_SIZE);
    const textureRepeatY = material.tilesAcrossFloor * (depth / FLOOR_TEXTURE_REFERENCE_SIZE);

    useLayoutEffect(() => {
        configureFloorTexture(
            maps.diffuseMap,
            textureRepeatX,
            textureRepeatY,
            true,
            maxAnisotropy
        );
        configureFloorTexture(
            maps.aoMap,
            textureRepeatX,
            textureRepeatY,
            false,
            maxAnisotropy
        );
    }, [maps, maxAnisotropy, textureRepeatX, textureRepeatY]);

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
                aoMap={maps.aoMap}
                aoMapIntensity={FLOOR_AO_INTENSITY}
                roughness={FLOOR_ROUGHNESS}
                metalness={FLOOR_METALNESS}
                envMapIntensity={FLOOR_ENV_MAP_INTENSITY}
            />
        </mesh>
    );
}
