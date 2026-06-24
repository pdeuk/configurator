import type { ManufacturingPackage } from "./ManufacturingModel";
import { formatManufacturingSize } from "./ManufacturingModel";
import {
    formatFabricCutLabel,
    summarizeComponentGroups
} from "./packageBuilder";

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 5;

export interface DownloadManufacturingPdfOptions {
    fileName?: string;
    projectName?: string;
}

function drawWrappedText(
    pdf: import("jspdf").jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight = LINE_HEIGHT
): number {
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    pdf.text(lines, x, y);
    return y + lines.length * lineHeight;
}

function drawSectionTitle(
    pdf: import("jspdf").jsPDF,
    title: string,
    x: number,
    y: number
): number {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, x, y);
    return y + 8;
}

function ensureSpace(
    pdf: import("jspdf").jsPDF,
    cursorY: number,
    requiredHeight: number
): number {
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (cursorY + requiredHeight <= pageHeight - PAGE_MARGIN) {
        return cursorY;
    }

    pdf.addPage();
    return PAGE_MARGIN + 8;
}

function drawHeaderPage(
    pdf: import("jspdf").jsPDF,
    manufacturingPackage: ManufacturingPackage,
    projectName: string
): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = PAGE_MARGIN + 4;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Manufacturing Package", PAGE_MARGIN, cursorY);
    cursorY += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    cursorY = drawWrappedText(pdf, `Project: ${projectName}`, PAGE_MARGIN, cursorY, contentWidth) + 2;
    cursorY = drawWrappedText(pdf, `Project ID: ${manufacturingPackage.projectId}`, PAGE_MARGIN, cursorY, contentWidth) + 2;
    cursorY = drawWrappedText(pdf, `Package ID: ${manufacturingPackage.id}`, PAGE_MARGIN, cursorY, contentWidth) + 2;

    if (manufacturingPackage.revisionId) {
        cursorY = drawWrappedText(
            pdf,
            `Revision ID: ${manufacturingPackage.revisionId}`,
            PAGE_MARGIN,
            cursorY,
            contentWidth
        ) + 2;
    }

    cursorY = drawWrappedText(
        pdf,
        `Generated: ${new Date(manufacturingPackage.createdAt).toLocaleString()}`,
        PAGE_MARGIN,
        cursorY,
        contentWidth
    ) + 8;

    pdf.setDrawColor(180);
    pdf.line(PAGE_MARGIN, cursorY, pageWidth - PAGE_MARGIN, cursorY);

    return cursorY + 10;
}

function drawComponentsSection(
    pdf: import("jspdf").jsPDF,
    manufacturingPackage: ManufacturingPackage,
    startY: number
): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = ensureSpace(pdf, startY, 20);
    cursorY = drawSectionTitle(pdf, "1. Component List", PAGE_MARGIN, cursorY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const groups = summarizeComponentGroups(manufacturingPackage.components);

    if (groups.length === 0) {
        cursorY = drawWrappedText(pdf, "No hardware components.", PAGE_MARGIN, cursorY, contentWidth) + 6;
        return cursorY;
    }

    for (const group of groups) {
        cursorY = ensureSpace(pdf, cursorY, 18);
        cursorY = drawWrappedText(pdf, group.label, PAGE_MARGIN, cursorY, contentWidth) + 1;
        cursorY = drawWrappedText(pdf, `Qty: ${group.quantity}`, PAGE_MARGIN + 4, cursorY, contentWidth) + 1;
        cursorY = drawWrappedText(pdf, `Size: ${group.size}`, PAGE_MARGIN + 4, cursorY, contentWidth) + 6;
    }

    return cursorY;
}

function drawFabricSection(
    pdf: import("jspdf").jsPDF,
    manufacturingPackage: ManufacturingPackage,
    startY: number
): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = ensureSpace(pdf, startY, 20);
    cursorY = drawSectionTitle(pdf, "2. Fabric Cutting List", PAGE_MARGIN, cursorY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    if (manufacturingPackage.fabrics.length === 0) {
        cursorY = drawWrappedText(pdf, "No fabric cuts required.", PAGE_MARGIN, cursorY, contentWidth) + 6;
        return cursorY;
    }

    for (const sheet of manufacturingPackage.fabrics) {
        cursorY = ensureSpace(pdf, cursorY, 24);
        cursorY = drawWrappedText(pdf, formatFabricCutLabel(sheet), PAGE_MARGIN, cursorY, contentWidth) + 1;
        cursorY = drawWrappedText(
            pdf,
            formatManufacturingSize({
                widthCm: sheet.widthCm,
                heightCm: sheet.heightCm
            }),
            PAGE_MARGIN + 4,
            cursorY,
            contentWidth
        ) + 1;
        cursorY = drawWrappedText(pdf, sheet.fabricType, PAGE_MARGIN + 4, cursorY, contentWidth) + 1;

        const artworkLabel = manufacturingPackage.artworkFiles.find(
            entry => entry.assetId === sheet.artworkAssetId
        )?.fileName ?? "No artwork assigned";

        cursorY = drawWrappedText(
            pdf,
            `Artwork: ${artworkLabel}`,
            PAGE_MARGIN + 4,
            cursorY,
            contentWidth
        ) + 6;
    }

    return cursorY;
}

function drawArtworkSection(
    pdf: import("jspdf").jsPDF,
    manufacturingPackage: ManufacturingPackage,
    startY: number
): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = ensureSpace(pdf, startY, 20);
    cursorY = drawSectionTitle(pdf, "3. Artwork Manifest", PAGE_MARGIN, cursorY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    if (manufacturingPackage.artworkFiles.length === 0) {
        cursorY = drawWrappedText(pdf, "No artwork files referenced.", PAGE_MARGIN, cursorY, contentWidth) + 6;
        return cursorY;
    }

    for (const artwork of manufacturingPackage.artworkFiles) {
        cursorY = ensureSpace(pdf, cursorY, 28);
        cursorY = drawWrappedText(pdf, artwork.fileName, PAGE_MARGIN, cursorY, contentWidth) + 1;
        cursorY = drawWrappedText(pdf, `Asset ID: ${artwork.assetId}`, PAGE_MARGIN + 4, cursorY, contentWidth) + 1;
        cursorY = drawWrappedText(
            pdf,
            `Print size: ${Math.round(artwork.printWidthCm)}cm x ${Math.round(artwork.printHeightCm)}cm`,
            PAGE_MARGIN + 4,
            cursorY,
            contentWidth
        ) + 1;
        cursorY = drawWrappedText(
            pdf,
            `DPI: ${artwork.effectiveDpi} effective (${artwork.dpiX} x ${artwork.dpiY})`,
            PAGE_MARGIN + 4,
            cursorY,
            contentWidth
        ) + 6;
    }

    return cursorY;
}

function drawAssemblySection(
    pdf: import("jspdf").jsPDF,
    manufacturingPackage: ManufacturingPackage,
    startY: number
): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = ensureSpace(pdf, startY, 20);
    cursorY = drawSectionTitle(pdf, "4. Assembly Information", PAGE_MARGIN, cursorY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    for (const note of manufacturingPackage.assemblyNotes) {
        cursorY = ensureSpace(pdf, cursorY, 12);
        cursorY = drawWrappedText(pdf, `• ${note}`, PAGE_MARGIN, cursorY, contentWidth) + 4;
    }

    return cursorY;
}

export async function downloadManufacturingPDF(
    manufacturingPackage: ManufacturingPackage,
    options: DownloadManufacturingPdfOptions = {}
): Promise<void> {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });
    const projectName = options.projectName ?? manufacturingPackage.projectId;
    let cursorY = drawHeaderPage(pdf, manufacturingPackage, projectName);

    cursorY = drawComponentsSection(pdf, manufacturingPackage, cursorY + 4);
    cursorY = drawFabricSection(pdf, manufacturingPackage, cursorY + 4);
    cursorY = drawArtworkSection(pdf, manufacturingPackage, cursorY + 4);
    drawAssemblySection(pdf, manufacturingPackage, cursorY + 4);

    const baseName = options.projectName?.trim().replace(/[^\w\-]+/g, "-").toLowerCase()
        || manufacturingPackage.projectId;
    pdf.save(options.fileName ?? `${baseName}-manufacturing.pdf`);
}
