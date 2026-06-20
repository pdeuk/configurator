import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import * as UTIF from "utif";
import type { ArtworkFileType, ArtworkInfo } from "../models/ModuleModel";
import { recalculateArtworkDpi } from "./fabrics";

const PDF_RENDER_SCALE = 2;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface DecodedArtwork {
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
}

interface TiffImage {
    width: number;
    height: number;
    data?: Uint8Array;
}

export async function createArtworkInfo(
    file: File,
    fabricWidthMeters: number,
    fabricHeightMeters: number
): Promise<ArtworkInfo> {
    const fileType = getArtworkFileType(file);
    const decoded = await decodeArtwork(file, fileType);
    const artwork = {
        fileName: file.name,
        fileType,
        imageUrl: decoded.imageUrl,
        pixelWidth: decoded.pixelWidth,
        pixelHeight: decoded.pixelHeight,
        dpiX: 0,
        dpiY: 0,
        effectiveDpi: 0
    };

    return recalculateArtworkDpi(artwork, fabricWidthMeters, fabricHeightMeters);
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

async function decodeBrowserImage(file: File): Promise<DecodedArtwork> {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = imageUrl;

    await image.decode();

    return {
        imageUrl,
        pixelWidth: image.naturalWidth,
        pixelHeight: image.naturalHeight
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
        pixelHeight: canvas.height
    };
}
