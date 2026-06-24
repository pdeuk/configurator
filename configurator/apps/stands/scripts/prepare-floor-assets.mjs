import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "assets", "floor-textures");
const outputRoot = path.join(projectRoot, "public", "floors");
const targetSize = 1024;

const materials = [
    "interiorTiles",
    "woodFloorWorn",
    "graniteTile04"
];

const textureKeys = ["diff", "normal", "arm"];

async function resizeTexture(sourcePath, destinationPath) {
    await sharp(sourcePath)
        .resize(targetSize, targetSize, {
            fit: "cover",
            position: "centre"
        })
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(destinationPath);
}

for (const materialId of materials) {
    const sourceDir = path.join(sourceRoot, materialId);
    const destinationDir = path.join(outputRoot, materialId);
    await mkdir(destinationDir, { recursive: true });

    for (const key of textureKeys) {
        const sourcePath = path.join(sourceDir, `${key}.jpg`);
        const destinationPath = path.join(destinationDir, `${key}.jpg`);

        await resizeTexture(sourcePath, destinationPath);
        console.log(`Wrote ${path.relative(projectRoot, destinationPath)}`);
    }
}

console.log(`Floor textures prepared at ${targetSize}px from assets/floor-textures.`);
