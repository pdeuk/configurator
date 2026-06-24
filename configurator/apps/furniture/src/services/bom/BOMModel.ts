import type { FabricSide, StandModule } from "../../models/ModuleModel";

export type BOMCategory =
    | "frame"
    | "fabric"
    | "panel"
    | "melamine"
    | "shelf"
    | "door"
    | "banner";

export interface BOMLineDimensions {
    widthCm: number;
    heightCm: number;
    depthCm?: number;
    face?: FabricSide | string;
}

/** Single manufacturing / quote line derived from project content. */
export interface BOMLine {
    id: string;
    category: BOMCategory;
    name: string;
    quantity: number;
    unit: string;
    dimensions: BOMLineDimensions | null;
    sourceModuleId: StandModule["id"] | null;
}

/** Dynamically generated bill of materials for a project. */
export interface BOMDocument {
    generatedAt: string;
    revision: number;
    lines: BOMLine[];
}

/** Reserved for future pricing integration. */
export interface BOMLinePricingRef {
    sku: string | null;
    unitPrice: number | null;
    currency: string | null;
}

/** Reserved for ERP / PDF quote export metadata. */
export interface BOMExportContext {
    projectId: string;
    projectName: string;
    pricing?: BOMLinePricingRef[];
}
