import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { OPS } from "pdfjs-dist";
import type { PDFOperatorList } from "pdfjs-dist/types/src/display/api";
import * as UTIF from "utif";
import type { ArtworkFileType, ArtworkSourceSnapshot } from "../models/ModuleModel";
import { assetService } from "../services/assets";
import { syncAssetToCloudIfAvailable } from "../services/cloud";
import {
    attachArtworkSource,
    buildArtworkInfo,
    type RasterCoverageInput
} from "./fabrics";

const PDF_RENDER_SCALE = 2;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface DecodedArtwork {
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
    isCanvasSource: boolean;
}

interface TiffImage {
    width: number;
    height: number;
    data?: Uint8Array;
}

type PdfMatrix = [number, number, number, number, number, number];

interface PdfImageObject {
    width: number;
    height: number;
}

const IDENTITY_MATRIX: PdfMatrix = [1, 0, 0, 1, 0, 0];

export async function createArtworkInfo(
    file: File,
    fabricWidthMeters: number,
    fabricHeightMeters: number
) {
    const fileType = getArtworkFileType(file);
    const decoded = await decodeArtwork(file, fileType);
    const rasters = await analyzeRasters(file, fileType, fabricWidthMeters, fabricHeightMeters);
    const wholeFilePixels = fileType === "pdf"
        ? await getPdfPagePixelDimensions(file)
        : {
            pixelWidth: decoded.pixelWidth,
            pixelHeight: decoded.pixelHeight
        };

    const artwork = buildArtworkInfo(
        {
            fileName: file.name,
            fileType,
            imageUrl: decoded.imageUrl,
            pixelWidth: wholeFilePixels.pixelWidth,
            pixelHeight: wholeFilePixels.pixelHeight,
            rasters
        },
        fabricWidthMeters,
        fabricHeightMeters
    );
    const asset = await assetService.upload(file, {
        width: artwork.pixelWidth,
        height: artwork.pixelHeight,
        dpi: artwork.effectiveDpi
    });
    const imageUrl = await assetService.resolveDisplayUrl(asset.id);

    void syncAssetToCloudIfAvailable(asset.id);

    if (
        decoded.imageUrl.startsWith("blob:")
        && decoded.imageUrl !== imageUrl
    ) {
        URL.revokeObjectURL(decoded.imageUrl);
    }

    return attachArtworkSource({
        ...artwork,
        assetId: asset.id,
        imageUrl
    });
}

export function getArtworkFileTypeFromFile(file: File): ArtworkFileType {
    return getArtworkFileType(file);
}

export async function createArtworkDisplayUrlFromFile(
    file: File,
    fileType: ArtworkFileType
): Promise<string> {
    const decoded = await decodeArtwork(file, fileType);
    return decoded.imageUrl;
}

function getArtworkFileType(file: File): ArtworkFileType {
    const extension = file.name.split(".").at(-1)?.toLowerCase();

    if (extension === "pdf" || file.type === "application/pdf") {
        return "pdf";
    }

    if (
        extension === "tif" ||
        extension === "tiff" ||
        file.type === "image/tiff"
    ) {
        return "tiff";
    }

    if (extension === "jpg" || extension === "jpeg" || file.type === "image/jpeg") {
        return "jpg";
    }

    if (extension === "png" || file.type === "image/png") {
        return "png";
    }

    throw new Error("Unsupported artwork file. Use PDF, TIFF, JPG, or PNG.");
}

async function decodeArtwork(
    file: File,
    fileType: ArtworkFileType
): Promise<DecodedArtwork> {
    if (fileType === "pdf") {
        return decodePdf(file);
    }

    if (fileType === "tiff") {
        return decodeTiff(file);
    }

    return decodeBrowserImage(file);
}

async function analyzeRasters(
    file: File,
    fileType: ArtworkFileType,
    fabricWidthMeters: number,
    fabricHeightMeters: number
): Promise<RasterCoverageInput[]> {
    if (fileType === "pdf") {
        return analyzePdfRasters(file, fabricWidthMeters, fabricHeightMeters);
    }

    if (fileType === "tiff") {
        return analyzeTiffRasters(file, fabricWidthMeters, fabricHeightMeters);
    }

    const decoded = await decodeBrowserImage(file);

    return [
        createFullFabricRaster(
            "Image",
            decoded.pixelWidth,
            decoded.pixelHeight
        )
    ];
}

function createFullFabricRaster(
    label: string,
    pixelWidth: number,
    pixelHeight: number
): RasterCoverageInput {
    return {
        label,
        pixelWidth,
        pixelHeight,
        fabricWidthRatio: 1,
        fabricHeightRatio: 1
    };
}

export function createArtworkInfoFromCanvas(
    canvas: HTMLCanvasElement,
    source: {
        fileName: string;
        fileType: ArtworkFileType;
    },
    fabricWidthMeters: number,
    fabricHeightMeters: number
) {
    const outputFileType: ArtworkFileType =
        source.fileType === "jpg" ? "jpg" : "png";
    const mimeType = outputFileType === "jpg" ? "image/jpeg" : "image/png";

    return canvasToArtworkInfo(
        canvas,
        mimeType,
        outputFileType,
        source.fileName,
        fabricWidthMeters,
        fabricHeightMeters
    );
}

export async function createArtworkInfoFromCanvasAsync(
    canvas: HTMLCanvasElement,
    source: {
        fileName: string;
        fileType: ArtworkFileType;
    },
    fabricWidthMeters: number,
    fabricHeightMeters: number,
    preservedSourceArtwork?: ArtworkSourceSnapshot
) {
    const outputFileType: ArtworkFileType =
        source.fileType === "jpg" ? "jpg" : "png";
    const mimeType = outputFileType === "jpg" ? "image/jpeg" : "image/png";
    const blob = await canvasToBlob(canvas, mimeType, 0.92);
    const artwork = buildArtworkInfo(
        {
            fileName: source.fileName,
            fileType: outputFileType,
            imageUrl: "",
            pixelWidth: canvas.width,
            pixelHeight: canvas.height,
            rasters: [
                createFullFabricRaster(
                    "Edited image",
                    canvas.width,
                    canvas.height
                )
            ]
        },
        fabricWidthMeters,
        fabricHeightMeters
    );
    const asset = await assetService.uploadBlob(blob, {
        filename: source.fileName,
        type: outputFileType,
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        dpi: artwork.effectiveDpi
    });
    const imageUrl = await assetService.resolveDisplayUrl(asset.id);

    void syncAssetToCloudIfAvailable(asset.id);

    return {
        ...artwork,
        assetId: asset.id,
        imageUrl,
        ...(preservedSourceArtwork ? { sourceArtwork: preservedSourceArtwork } : {})
    };
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) {
                    resolve(blob);
                    return;
                }

                reject(new Error("Unable to encode edited artwork."));
            },
            mimeType,
            quality
        );
    });
}

function canvasToArtworkInfo(
    canvas: HTMLCanvasElement,
    mimeType: string,
    outputFileType: ArtworkFileType,
    fileName: string,
    fabricWidthMeters: number,
    fabricHeightMeters: number
) {
    return buildArtworkInfo(
        {
            fileName,
            fileType: outputFileType,
            imageUrl: canvas.toDataURL(mimeType, 0.92),
            pixelWidth: canvas.width,
            pixelHeight: canvas.height,
            rasters: [
                createFullFabricRaster(
                    "Edited image",
                    canvas.width,
                    canvas.height
                )
            ]
        },
        fabricWidthMeters,
        fabricHeightMeters
    );
}

async function decodeBrowserImage(file: File): Promise<DecodedArtwork> {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = imageUrl;

    await image.decode();

    return {
        imageUrl,
        pixelWidth: image.naturalWidth,
        pixelHeight: image.naturalHeight,
        isCanvasSource: false
    };
}

async function getPdfPagePixelDimensions(file: File) {
    const data = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 1 });

    pdfDocument.cleanup();

    return {
        pixelWidth: Math.round(viewport.width),
        pixelHeight: Math.round(viewport.height)
    };
}

async function decodePdf(file: File): Promise<DecodedArtwork> {
    const data = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to render PDF artwork.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
        canvas,
        canvasContext: context,
        viewport
    }).promise;

    pdfDocument.cleanup();

    return canvasToArtwork(canvas);
}

async function analyzePdfRasters(
    file: File,
    _fabricWidthMeters: number,
    _fabricHeightMeters: number
): Promise<RasterCoverageInput[]> {
    const data = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidthPt = viewport.width;
    const pageHeightPt = viewport.height;
    const operatorList = await page.getOperatorList();
    const embeddedRasters = await extractPdfEmbeddedRasters(page, operatorList);

    pdfDocument.cleanup();

    if (embeddedRasters.length === 0) {
        const pagePixels = await getPdfPagePixelDimensions(file);

        return [
            createFullFabricRaster(
                "Page",
                pagePixels.pixelWidth,
                pagePixels.pixelHeight
            )
        ];
    }

    return embeddedRasters.map((raster, index) => ({
        label: `Raster ${index + 1}`,
        pixelWidth: raster.pixelWidth,
        pixelHeight: raster.pixelHeight,
        fabricWidthRatio: clampRatio(raster.displayWidthPt / pageWidthPt),
        fabricHeightRatio: clampRatio(raster.displayHeightPt / pageHeightPt)
    }));
}

async function extractPdfEmbeddedRasters(
    page: pdfjsLib.PDFPageProxy,
    operatorList: PDFOperatorList
) {
    const rasters: Array<{
        pixelWidth: number;
        pixelHeight: number;
        displayWidthPt: number;
        displayHeightPt: number;
    }> = [];
    const matrixStack: PdfMatrix[] = [IDENTITY_MATRIX];
    let matrix = IDENTITY_MATRIX;

    for (let index = 0; index < operatorList.fnArray.length; index += 1) {
        const operation = operatorList.fnArray[index];
        const args = operatorList.argsArray[index];

        if (operation === OPS.save) {
            matrixStack.push(matrix);
            continue;
        }

        if (operation === OPS.restore) {
            matrix = matrixStack.pop() ?? IDENTITY_MATRIX;
            continue;
        }

        if (operation === OPS.transform) {
            matrix = multiplyMatrix(matrix, args as PdfMatrix);
            continue;
        }

        if (
            operation === OPS.paintImageXObject ||
            operation === OPS.paintInlineImageXObject
        ) {
            const image = operation === OPS.paintInlineImageXObject
                ? args[0] as PdfImageObject
                : await resolvePdfImage(page.objs, args[0] as string);

            if (!image?.width || !image?.height) {
                continue;
            }

            const displaySize = getImageDisplaySizePt(matrix);

            if (displaySize.width <= 0 || displaySize.height <= 0) {
                continue;
            }

            rasters.push({
                pixelWidth: image.width,
                pixelHeight: image.height,
                displayWidthPt: displaySize.width,
                displayHeightPt: displaySize.height
            });
        }
    }

    return rasters;
}

function multiplyMatrix(left: PdfMatrix, right: PdfMatrix): PdfMatrix {
    const [a1, b1, c1, d1, e1, f1] = left;
    const [a2, b2, c2, d2, e2, f2] = right;

    return [
        a1 * a2 + c1 * b2,
        b1 * a2 + d1 * b2,
        a1 * c2 + c1 * d2,
        b1 * c2 + d1 * d2,
        a1 * e2 + c1 * f2 + e1,
        b1 * e2 + d1 * f2 + f1
    ];
}

function getImageDisplaySizePt(matrix: PdfMatrix) {
    const [a, b, c, d] = matrix;

    return {
        width: Math.hypot(a, b),
        height: Math.hypot(c, d)
    };
}

async function resolvePdfImage(
    objects: pdfjsLib.PDFPageProxy["objs"],
    objectId: string
): Promise<PdfImageObject | null> {
    if (!objects.has(objectId)) {
        return null;
    }

    try {
        const resolved = objects.get(objectId) as PdfImageObject | undefined;

        if (resolved?.width && resolved?.height) {
            return resolved;
        }
    } catch {
        // Object is resolved asynchronously.
    }

    return new Promise(resolve => {
        objects.get(objectId, (object: PdfImageObject) => {
            resolve(object?.width && object?.height ? object : null);
        });
    });
}

async function analyzeTiffRasters(
    file: File,
    _fabricWidthMeters: number,
    _fabricHeightMeters: number
): Promise<RasterCoverageInput[]> {
    const buffer = await file.arrayBuffer();
    const pages = UTIF.decode(buffer) as TiffImage[];

    if (pages.length === 0) {
        throw new Error("Unable to decode TIFF artwork.");
    }

    return pages.map((page, index) => {
        UTIF.decodeImage(buffer, page);

        return createFullFabricRaster(
            pages.length > 1 ? `Page ${index + 1}` : "Image",
            page.width,
            page.height
        );
    });
}

async function decodeTiff(file: File): Promise<DecodedArtwork> {
    const buffer = await file.arrayBuffer();
    const ifds = UTIF.decode(buffer) as TiffImage[];
    const firstImage = ifds[0];

    if (!firstImage) {
        throw new Error("Unable to decode TIFF artwork.");
    }

    UTIF.decodeImage(buffer, firstImage);

    const rgba = UTIF.toRGBA8(firstImage);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to render TIFF artwork.");
    }

    canvas.width = firstImage.width;
    canvas.height = firstImage.height;
    context.putImageData(
        new ImageData(
            new Uint8ClampedArray(rgba),
            firstImage.width,
            firstImage.height
        ),
        0,
        0
    );

    return canvasToArtwork(canvas);
}

function canvasToArtwork(canvas: HTMLCanvasElement): DecodedArtwork {
    return {
        imageUrl: canvas.toDataURL("image/png"),
        pixelWidth: canvas.width,
        pixelHeight: canvas.height,
        isCanvasSource: true
    };
}

function clampRatio(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }

    return Math.min(value, 1);
}
