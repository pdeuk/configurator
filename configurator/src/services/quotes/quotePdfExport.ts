import type { ProjectDocument } from "../../models/ProjectModel";
import { loadImageElement } from "../../utils/mockupImage";
import type {
    QuoteCompanyHeader,
    QuoteDocument,
    QuoteMaterialsSummary
} from "./QuoteModel";
import {
    collectQuoteMaterials,
    DEFAULT_QUOTE_COMPANY_HEADER
} from "./QuoteModel";

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 5;

export interface DownloadQuotePdfOptions {
    fileName?: string;
    companyHeader?: QuoteCompanyHeader;
    logoUrl?: string | null;
    /** Required for artwork details on page 3. Fabric summaries use quote BOM data. */
    projectDocument?: ProjectDocument;
}

function formatMoney(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

function formatOptionalMoney(
    amount: number | null,
    currency: string
): string {
    return amount === null ? "—" : formatMoney(amount, currency);
}

function getImageFormat(url: string): "PNG" | "JPEG" {
    if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
        return "JPEG";
    }

    return "PNG";
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

async function drawPreviewImage(
    pdf: import("jspdf").jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
): Promise<number> {
    const image = await loadImageElement(imageUrl);
    const format = getImageFormat(imageUrl);
    const scale = Math.min(
        maxWidth / image.naturalWidth,
        maxHeight / image.naturalHeight,
        1
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    pdf.addImage(imageUrl, format, x, y, width, height);

    return y + height + 6;
}

function drawPreviewPlaceholder(
    pdf: import("jspdf").jsPDF,
    x: number,
    y: number,
    width: number,
    height: number
): number {
    pdf.setDrawColor(180, 180, 180);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, width, height, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("3D preview image", x + width / 2, y + height / 2, { align: "center" });
    pdf.setTextColor(0, 0, 0);

    return y + height + 6;
}

function drawSummaryPage(
    pdf: import("jspdf").jsPDF,
    quote: QuoteDocument,
    companyHeader: QuoteCompanyHeader,
    previewBottomY: number,
    logoUrl?: string | null
) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let cursorY = PAGE_MARGIN;
    let headerStartY = PAGE_MARGIN;

    if (logoUrl) {
        try {
            pdf.addImage(logoUrl, getImageFormat(logoUrl), PAGE_MARGIN, PAGE_MARGIN, 28, 14);
            headerStartY = PAGE_MARGIN + 18;
        } catch {
            // Ignore broken logo assets and continue with text header.
        }
    }

    cursorY = headerStartY;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(companyHeader.name, PAGE_MARGIN, cursorY);
    cursorY += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    for (const line of companyHeader.addressLines) {
        pdf.text(line, PAGE_MARGIN, cursorY);
        cursorY += LINE_HEIGHT;
    }

    pdf.text(companyHeader.email, PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT;
    pdf.text(companyHeader.phone, PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT;

    if (companyHeader.website) {
        pdf.text(companyHeader.website, PAGE_MARGIN, cursorY);
        cursorY += LINE_HEIGHT;
    }

    cursorY += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Project Quote", pageWidth - PAGE_MARGIN, PAGE_MARGIN, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Quote #: ${quote.quoteNumber}`, pageWidth - PAGE_MARGIN, PAGE_MARGIN + 7, {
        align: "right"
    });
    pdf.text(
        `Date: ${new Date(quote.createdAt).toLocaleDateString()}`,
        pageWidth - PAGE_MARGIN,
        PAGE_MARGIN + 12,
        { align: "right" }
    );

    cursorY = Math.max(cursorY, PAGE_MARGIN + 20);
    cursorY = drawSectionTitle(pdf, "Customer", PAGE_MARGIN, cursorY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(quote.customer.company || "—", PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT;
    pdf.text(quote.customer.name || "—", PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT;
    pdf.text(quote.customer.email || "—", PAGE_MARGIN, cursorY);
    cursorY += 10;

    cursorY = drawSectionTitle(pdf, "Project", PAGE_MARGIN, cursorY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(quote.project.name, PAGE_MARGIN, cursorY);
    cursorY = Math.max(cursorY + 12, previewBottomY + 4);

    pdf.setDrawColor(220, 220, 220);
    pdf.line(PAGE_MARGIN, cursorY, pageWidth - PAGE_MARGIN, cursorY);
    cursorY += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Total", PAGE_MARGIN, cursorY);
    pdf.text(
        formatMoney(quote.pricing.total, quote.pricing.currency),
        pageWidth - PAGE_MARGIN,
        cursorY,
        { align: "right" }
    );
    cursorY += LINE_HEIGHT;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
        `Subtotal: ${formatMoney(quote.pricing.subtotal, quote.pricing.currency)}`,
        PAGE_MARGIN,
        cursorY
    );
    cursorY += LINE_HEIGHT;
    pdf.text(
        `Tax: ${formatMoney(quote.pricing.tax, quote.pricing.currency)}`,
        PAGE_MARGIN,
        cursorY
    );
}

function drawBomTablePage(pdf: import("jspdf").jsPDF, quote: QuoteDocument) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = PAGE_MARGIN;

    cursorY = drawSectionTitle(pdf, "Bill of Materials & Pricing", PAGE_MARGIN, cursorY);

    const columns = [
        { label: "Item", width: contentWidth * 0.42 },
        { label: "Qty", width: contentWidth * 0.12 },
        { label: "Unit", width: contentWidth * 0.12 },
        { label: "Price", width: contentWidth * 0.16 },
        { label: "Total", width: contentWidth * 0.18 }
    ];

    pdf.setFillColor(240, 240, 240);
    pdf.rect(PAGE_MARGIN, cursorY - 4, contentWidth, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    let columnX = PAGE_MARGIN;

    for (const column of columns) {
        pdf.text(column.label, columnX + 1, cursorY);
        columnX += column.width;
    }

    cursorY += 6;
    pdf.setFont("helvetica", "normal");

    for (const line of quote.pricing.lines) {
        if (cursorY > pageHeight - PAGE_MARGIN - 10) {
            pdf.addPage();
            cursorY = PAGE_MARGIN + 6;
        }

        const rowValues = [
            line.bom.name,
            String(line.quantity),
            line.unit,
            formatOptionalMoney(line.unitPrice, quote.pricing.currency),
            formatOptionalMoney(line.totalPrice, quote.pricing.currency)
        ];

        columnX = PAGE_MARGIN;
        let rowHeight = LINE_HEIGHT;

        for (const [index, value] of rowValues.entries()) {
            const column = columns[index]!;
            const wrapped = pdf.splitTextToSize(value, column.width - 2) as string[];

            pdf.text(wrapped, columnX + 1, cursorY);
            rowHeight = Math.max(rowHeight, wrapped.length * LINE_HEIGHT);
            columnX += column.width;
        }

        cursorY += rowHeight + 2;
    }

    cursorY += 4;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(PAGE_MARGIN, cursorY, pageWidth - PAGE_MARGIN, cursorY);
    cursorY += 6;
    pdf.setFont("helvetica", "bold");
    pdf.text("Subtotal", PAGE_MARGIN, cursorY);
    pdf.text(
        formatMoney(quote.pricing.subtotal, quote.pricing.currency),
        pageWidth - PAGE_MARGIN,
        cursorY,
        { align: "right" }
    );
    cursorY += LINE_HEIGHT;
    pdf.setFont("helvetica", "normal");
    pdf.text("Tax", PAGE_MARGIN, cursorY);
    pdf.text(
        formatMoney(quote.pricing.tax, quote.pricing.currency),
        pageWidth - PAGE_MARGIN,
        cursorY,
        { align: "right" }
    );
    cursorY += LINE_HEIGHT;
    pdf.setFont("helvetica", "bold");
    pdf.text("Total", PAGE_MARGIN, cursorY);
    pdf.text(
        formatMoney(quote.pricing.total, quote.pricing.currency),
        pageWidth - PAGE_MARGIN,
        cursorY,
        { align: "right" }
    );
}

function resolveMaterialsSummary(
    quote: QuoteDocument,
    projectDocument?: ProjectDocument
): QuoteMaterialsSummary {
    if (projectDocument) {
        return collectQuoteMaterials(projectDocument, quote.bom);
    }

    return {
        fabrics: quote.bom.lines
            .filter(line => line.category === "fabric")
            .map(line => ({
                name: line.name,
                areaSquareMeters: line.quantity,
                unit: line.unit
            })),
        artwork: []
    };
}

function drawMaterialsPage(
    pdf: import("jspdf").jsPDF,
    quote: QuoteDocument,
    materials: QuoteMaterialsSummary
) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    let cursorY = PAGE_MARGIN;

    cursorY = drawSectionTitle(pdf, "Materials", PAGE_MARGIN, cursorY);
    cursorY = drawSectionTitle(pdf, "Fabric Types & Areas", PAGE_MARGIN, cursorY + 2);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    if (materials.fabrics.length === 0) {
        pdf.text("No fabric areas calculated.", PAGE_MARGIN, cursorY);
        cursorY += 8;
    } else {
        for (const fabric of materials.fabrics) {
            if (cursorY > pageHeight - PAGE_MARGIN - 10) {
                pdf.addPage();
                cursorY = PAGE_MARGIN;
            }

            pdf.text(
                `${fabric.name}: ${fabric.areaSquareMeters.toFixed(2)} ${fabric.unit}`,
                PAGE_MARGIN,
                cursorY
            );
            cursorY += LINE_HEIGHT + 1;
        }
    }

    cursorY += 6;
    cursorY = drawSectionTitle(pdf, "Artwork Information", PAGE_MARGIN, cursorY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    if (materials.artwork.length === 0) {
        pdf.text("No artwork assignments in this project.", PAGE_MARGIN, cursorY);
        cursorY += 8;
    } else {
        for (const entry of materials.artwork) {
            if (cursorY > pageHeight - PAGE_MARGIN - 18) {
                pdf.addPage();
                cursorY = PAGE_MARGIN;
            }

            const lines = [
                `${entry.fileName} (${entry.fileType})`,
                `Module: ${entry.moduleId} · Face: ${entry.face} · Fabric: ${entry.fabricKind}`,
                `Print size: ${entry.printWidthCm} × ${entry.printHeightCm} cm · DPI: ${entry.effectiveDpi}`
            ];

            for (const line of lines) {
                cursorY = drawWrappedText(
                    pdf,
                    line,
                    PAGE_MARGIN,
                    cursorY,
                    contentWidth
                ) + 1;
            }

            cursorY += 3;
        }
    }

    cursorY += 6;

    if (cursorY > pageHeight - PAGE_MARGIN - 30) {
        pdf.addPage();
        cursorY = PAGE_MARGIN;
    }

    cursorY = drawSectionTitle(pdf, "Notes", PAGE_MARGIN, cursorY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    cursorY = drawWrappedText(pdf, quote.notes, PAGE_MARGIN, cursorY, contentWidth) + 6;
    cursorY = drawSectionTitle(pdf, "Terms", PAGE_MARGIN, cursorY);
    drawWrappedText(pdf, quote.terms, PAGE_MARGIN, cursorY, contentWidth);
}

export async function downloadQuotePDF(
    quote: QuoteDocument,
    options: DownloadQuotePdfOptions = {}
): Promise<void> {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });
    const companyHeader = options.companyHeader ?? DEFAULT_QUOTE_COMPANY_HEADER;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    const previewTopY = 78;
    const previewMaxHeight = 70;
    const previewImageUrl = quote.project.previewImages[0];
    let previewBottomY = previewTopY + previewMaxHeight;

    if (previewImageUrl) {
        try {
            previewBottomY = await drawPreviewImage(
                pdf,
                previewImageUrl,
                PAGE_MARGIN,
                previewTopY,
                contentWidth,
                previewMaxHeight
            );
        } catch {
            previewBottomY = drawPreviewPlaceholder(
                pdf,
                PAGE_MARGIN,
                previewTopY,
                contentWidth,
                previewMaxHeight
            );
        }
    } else {
        previewBottomY = drawPreviewPlaceholder(
            pdf,
            PAGE_MARGIN,
            previewTopY,
            contentWidth,
            previewMaxHeight
        );
    }

    drawSummaryPage(pdf, quote, companyHeader, previewBottomY, options.logoUrl);

    pdf.addPage();
    drawBomTablePage(pdf, quote);

    pdf.addPage();
    drawMaterialsPage(
        pdf,
        quote,
        resolveMaterialsSummary(quote, options.projectDocument)
    );

    const fileName = options.fileName ?? `${quote.quoteNumber}.pdf`;
    pdf.save(fileName);
}
