import type { ProjectDocument } from "../../models/ProjectModel";
import type { BOMDocument } from "./BOMModel";
import {
    aggregateFabricLines,
    collectFabricAreas,
    collectModuleLines,
    projectModuleToStandModuleShape,
    type ModuleBOMContext
} from "./moduleCalculators";

function computeProjectRevision(project: ProjectDocument): number {
    const fingerprint = [
        project.id,
        project.updatedAt,
        project.modules.length,
        project.modules
            .map(module => [
                module.id,
                module.type,
                module.dimensions.width,
                module.dimensions.height,
                module.dimensions.depth,
                module.segmentCount ?? "",
                module.hasMelamineTop ?? "",
                module.fabrics.length
            ].join(":"))
            .join("|")
    ].join("#");

    let hash = 0;

    for (let index = 0; index < fingerprint.length; index += 1) {
        hash = (hash * 31 + fingerprint.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
}

export class BOMService {
    calculateProjectBOM(project: ProjectDocument): BOMDocument {
        const moduleContexts: ModuleBOMContext[] = project.modules.map(module => ({
            module,
            moduleShape: projectModuleToStandModuleShape(module)
        }));
        const hardwareLines = moduleContexts.flatMap(collectModuleLines);
        const fabricContributions = moduleContexts.flatMap(collectFabricAreas);
        const fabricLines = aggregateFabricLines(fabricContributions);

        return {
            generatedAt: new Date().toISOString(),
            revision: computeProjectRevision(project),
            lines: [...hardwareLines, ...fabricLines]
        };
    }
}

export const bomService = new BOMService();

export function calculateProjectBOM(project: ProjectDocument): BOMDocument {
    return bomService.calculateProjectBOM(project);
}
