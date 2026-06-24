import type { ProjectDocument } from "../../models/ProjectModel";
import { calculateProjectBOM } from "../bom";
import type { ManufacturingPackage } from "../manufacturing/ManufacturingModel";
import type { QuoteDocument } from "../quotes/QuoteModel";
import type {
    ERPCustomerPayload,
    ERPManufacturingPayload,
    ERPProjectPayload,
    ERPQuotePayload
} from "./ERPModel";

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export function projectToERP(project: ProjectDocument): ERPProjectPayload {
    const bom = calculateProjectBOM(project);

    return {
        sourceProjectId: project.id,
        name: project.name,
        moduleCount: project.modules.length,
        floorWidthCm: Math.round(project.floor.width * 100),
        floorDepthCm: Math.round(project.floor.depth * 100),
        updatedAt: project.updatedAt,
        lineSummary: bom.lines.map(line => ({
            name: line.name,
            quantity: line.quantity,
            unit: line.unit,
            category: line.category
        }))
    };
}

export function quoteToERP(quote: QuoteDocument): ERPQuotePayload {
    return {
        sourceQuoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        projectName: quote.project.name,
        currency: quote.pricing.currency,
        subtotal: roundMoney(quote.pricing.subtotal),
        tax: roundMoney(quote.pricing.tax),
        total: roundMoney(quote.pricing.total),
        createdAt: quote.createdAt,
        customer: customerFromQuote(quote),
        lines: quote.pricing.lines.map(line => ({
            name: line.bom.name,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice
        }))
    };
}

export function customerFromQuote(quote: QuoteDocument): ERPCustomerPayload {
    return {
        sourceQuoteId: quote.id,
        name: quote.customer.name,
        email: quote.customer.email,
        company: quote.customer.company
    };
}

export function customerFromProject(project: ProjectDocument): ERPCustomerPayload {
    return {
        sourceProjectId: project.id,
        name: project.name,
        email: "",
        company: project.name
    };
}

export function manufacturingToERP(
    manufacturingPackage: ManufacturingPackage
): ERPManufacturingPayload {
    return {
        sourcePackageId: manufacturingPackage.id,
        sourceProjectId: manufacturingPackage.projectId,
        revisionId: manufacturingPackage.revisionId,
        createdAt: manufacturingPackage.createdAt,
        componentCount: manufacturingPackage.components.length,
        fabricCount: manufacturingPackage.fabrics.length,
        artworkCount: manufacturingPackage.artworkFiles.length,
        components: manufacturingPackage.components.map(component => ({
            moduleId: component.moduleId,
            type: component.type,
            quantity: component.quantity,
            notes: component.notes
        })),
        fabrics: manufacturingPackage.fabrics.map(fabric => ({
            moduleId: fabric.moduleId,
            face: fabric.face,
            widthCm: fabric.widthCm,
            heightCm: fabric.heightCm,
            fabricType: fabric.fabricType
        }))
    };
}
