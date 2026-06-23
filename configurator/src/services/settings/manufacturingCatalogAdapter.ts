import type { ManufacturingPackage } from "../manufacturing/ManufacturingModel";
import type { MaterialCatalog } from "./SettingsModel";

const DEFAULT_FABRIC_LABELS: Record<string, string> = {
    "Standard fabric": "standard",
    "Blockout fabric": "blockout",
    "Luminous fabric": "luminous"
};

const DEFAULT_FRAME_LABELS: Record<string, string> = {
    "wall-frame": "Wall Frame",
    "cube-frame": "Cube Frame",
    "promo-stand-frame": "Promo Stand Frame",
    melamine: "Melamine Panel",
    shelf: "Melamine Shelf",
    door: "Back Door",
    "banner-frame": "Banner Frame"
};

function resolveFabricCatalogName(
    fabricType: string,
    catalog: MaterialCatalog
): string {
    const kind = DEFAULT_FABRIC_LABELS[fabricType];

    if (kind) {
        const match = catalog.fabrics.find(fabric => fabric.fabricKind === kind);

        if (match) {
            return match.name;
        }
    }

    return fabricType;
}

function resolveComponentCatalogName(notes: string, catalog: MaterialCatalog): string {
    let nextNotes = notes;

    for (const frame of catalog.frameOptions) {
        const defaultLabel = DEFAULT_FRAME_LABELS[frame.id];

        if (defaultLabel && nextNotes.includes(defaultLabel)) {
            nextNotes = nextNotes.replace(defaultLabel, frame.name);
        }
    }

    return nextNotes;
}

export function applyMaterialCatalogToManufacturingPackage(
    manufacturingPackage: ManufacturingPackage,
    catalog: MaterialCatalog
): ManufacturingPackage {
    return {
        ...manufacturingPackage,
        fabrics: manufacturingPackage.fabrics.map(sheet => ({
            ...sheet,
            fabricType: resolveFabricCatalogName(sheet.fabricType, catalog)
        })),
        components: manufacturingPackage.components.map(component => ({
            ...component,
            notes: resolveComponentCatalogName(component.notes, catalog)
        })),
        assemblyNotes: [
            ...manufacturingPackage.assemblyNotes,
            ...(catalog.accessories.length > 0
                ? [`Accessories: ${catalog.accessories.map(item => item.name).join(", ")}`]
                : [])
        ]
    };
}
