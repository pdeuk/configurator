import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useSearchParams } from "react-router-dom";
import { getProductBySlugOnly } from "../../website/productNavData";
import { productModelPath } from "../../website/websiteAssets";

function ModelViewer({ url }: { url: string }) {
    const gltf = useLoader(GLTFLoader, url);

    const scene = useMemo(() => {
        const cloned = gltf.scene.clone();
        cloned.traverse(object => {
            if ("isMesh" in object && object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        return cloned;
    }, [gltf.scene]);

    return <primitive object={scene} scale={1.1} position={[0, 0, 0]} />;
}

export function ProductModelPreview() {
    const [searchParams] = useSearchParams();
    const productSlug = searchParams.get("product");
    const selectedProduct = getProductBySlugOnly(productSlug ?? undefined);

    if (!selectedProduct) {
        return null;
    }

    const categorySlug = "chairs";
    const subcategorySlug = "office-chairs";
    const productKey = selectedProduct.product.slug;

    if (productKey !== "office-chairs-signature") {
        return null;
    }

    const modelUrl = productModelPath(categorySlug, subcategorySlug, productKey);

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: 0.95,
                zIndex: 1
            }}
        >
            <Canvas camera={{ position: [2.4, 1.4, 2.4], fov: 40 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[3, 6, 3]} intensity={1.2} />
                <directionalLight position={[-3, 3, -2]} intensity={0.5} />
                <Suspense fallback={null}>
                    <ModelViewer url={modelUrl} />
                </Suspense>
            </Canvas>
        </div>
    );
}
