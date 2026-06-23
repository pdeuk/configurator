import type { FabricSide, StandModule } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import {
    getActiveFabric,
    getActiveFabricArtwork,
    getActiveFabricPrintDimensions,
    getFabricSidesForModule,
    MIN_SUITABLE_MOCKUP_DPI
} from "./fabrics";
import { createSolidBlockoutMockup, loadImageElement } from "./mockupImage";

export interface MockupEntry {
    side: FabricSide;
    isBlockout: boolean;
    fileName: string | null;
    imageUrl: string | null;
    printWidthCm: number;
    printHeightCm: number;
    pixelWidth: number | null;
    pixelHeight: number | null;
    effectiveDpi: number | null;
}

interface BlockoutMockupDraft extends MockupEntry {
    needsBlockoutFill: true;
}

type MockupEntryDraft = MockupEntry | BlockoutMockupDraft;

const BLOCKOUT_FILE_LABEL = "Block-out fabric";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function getMockupEntries(
    module: StandModule,
    modules: StandModule[]
): MockupEntryDraft[] {
    const connectionLayout = getFrameConnectionLayout(module, modules);
    const sides = getFabricSidesForModule(module);

    return sides.map(side => {
        const fabric = getActiveFabric(module, side, connectionLayout.fabric.members);
        const printDimensions = getActiveFabricPrintDimensions(
            module,
            side,
            connectionLayout.fabric.width
        );
        const printWidthCm = Math.round(printDimensions.width * 100);
        const printHeightCm = Math.round(printDimensions.height * 100);

        if (fabric.isBlockout) {
            return {
                side,
                isBlockout: true,
                fileName: BLOCKOUT_FILE_LABEL,
                imageUrl: null,
                printWidthCm,
                printHeightCm,
                pixelWidth: null,
                pixelHeight: null,
                effectiveDpi: null,
                needsBlockoutFill: true
            };
        }

        const artwork = getActiveFabricArtwork(
            module,
            side,
            connectionLayout.fabric.members,
            connectionLayout.fabric.width
        );

        return {
            side,
            isBlockout: false,
            fileName: artwork?.fileName ?? null,
            imageUrl: artwork?.imageUrl ?? null,
            printWidthCm,
            printHeightCm,
            pixelWidth: artwork?.pixelWidth ?? null,
            pixelHeight: artwork?.pixelHeight ?? null,
            effectiveDpi: artwork?.effectiveDpi ?? null
        };
    });
}

export function getInsufficientDpiTooltip(
    printWidthCm: number,
    printHeightCm: number
) {
    return `The current image file is not suitable for printing on ${printWidthCm} × ${printHeightCm} cm.`;
}

export function isMockupEntryDpiSuitable(entry: MockupEntry): boolean {
    if (entry.isBlockout) {
        return true;
    }

    if (!entry.imageUrl) {
        return true;
    }

    return entry.effectiveDpi !== null && entry.effectiveDpi >= MIN_SUITABLE_MOCKUP_DPI;
}

export function hasInsufficientMockupDpi(entries: MockupEntry[]): boolean {
    return entries.some(entry => !isMockupEntryDpiSuitable(entry));
}

export function hasEmptyMockupArtwork(entries: Pick<MockupEntry, "imageUrl">[]): boolean {
    return entries.some(entry => !entry.imageUrl);
}

export function canDownloadMockup(
    entries: MockupEntry[],
    isExporting: boolean
): boolean {
    return (
        entries.length > 0 &&
        !hasEmptyMockupArtwork(entries) &&
        !hasInsufficientMockupDpi(entries) &&
        !isExporting
    );
}

function isBlockoutDraft(entry: MockupEntryDraft): entry is BlockoutMockupDraft {
    return entry.isBlockout && "needsBlockoutFill" in entry;
}

export function resolveMockupEntries(
    entries: MockupEntryDraft[]
): MockupEntry[] {
    return entries.map(entry => {
        if (!isBlockoutDraft(entry)) {
            return entry;
        }

        const composed = createSolidBlockoutMockup(
            entry.printWidthCm,
            entry.printHeightCm
        );

        return {
            side: entry.side,
            isBlockout: entry.isBlockout,
            fileName: entry.fileName,
            imageUrl: composed.imageUrl,
            printWidthCm: entry.printWidthCm,
            printHeightCm: entry.printHeightCm,
            pixelWidth: composed.pixelWidth,
            pixelHeight: composed.pixelHeight,
            effectiveDpi: null
        };
    });
}

export function getMockupEntriesForSelection(
    selectedId: string | null,
    moduleIds: string[],
    modulesById: Record<string, StandModule>
): MockupEntryDraft[] {
    if (!selectedId) {
        return [];
    }

    const selectedModule = modulesById[selectedId];

    if (!selectedModule) {
        return [];
    }

    const modules = moduleIds
        .map(id => modulesById[id])
        .filter(isStandModule);

    return getMockupEntries(selectedModule, modules);
}

function getImageFormat(url: string): "PNG" | "JPEG" {
    if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
        return "JPEG";
    }

    return "PNG";
}

export async function downloadMockupPdf(
    moduleLabel: string,
    entries: MockupEntryDraft[]
) {
    const resolvedEntries = resolveMockupEntries(entries);

    if (resolvedEntries.some(entry => !entry.imageUrl)) {
        return;
    }

    if (hasInsufficientMockupDpi(resolvedEntries)) {
        return;
    }

    const entriesWithImages = resolvedEntries.filter(
        (entry): entry is MockupEntry & { imageUrl: string } =>
            entry.imageUrl !== null
    );

    if (entriesWithImages.length === 0) {
        return;
    }

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 28;

    for (const [index, entry] of entriesWithImages.entries()) {
        if (index > 0) {
            pdf.addPage();
        }

        const image = await loadImageElement(entry.imageUrl);
        const format = getImageFormat(entry.imageUrl);
        const maxImageHeight = pageHeight - margin * 2 - headerHeight;
        const scale = Math.min(
            contentWidth / image.naturalWidth,
            maxImageHeight / image.naturalHeight
        );
        const imageWidth = image.naturalWidth * scale;
        const imageHeight = image.naturalHeight * scale;
        const blockoutLabel = entry.isBlockout ? " [block-out]" : "";

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(`${moduleLabel} — ${entry.side}${blockoutLabel}`, margin, margin + 5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`File: ${entry.fileName ?? "Unknown"}`, margin, margin + 12);
        pdf.text(
            `Print: ${entry.printWidthCm} × ${entry.printHeightCm} cm`,
            margin,
            margin + 17
        );
        pdf.text(
            `Image: ${entry.pixelWidth} × ${entry.pixelHeight} px`,
            margin,
            margin + 22
        );

        pdf.addImage(
            entry.imageUrl,
            format,
            margin,
            margin + headerHeight,
            imageWidth,
            imageHeight
        );
    }

    pdf.save(`${moduleLabel}-mockup.pdf`);
}
