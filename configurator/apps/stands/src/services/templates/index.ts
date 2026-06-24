export {
    DEFAULT_TEMPLATE_CATEGORIES,
    DEFAULT_TEMPLATE_THUMBNAIL,
    getTemplateCategoryName,
    isProjectTemplateSnapshot,
    isStandTemplate,
    type CreateTemplateMetadata,
    type InstantiateTemplateOptions,
    type ProjectTemplateSnapshot,
    type StandTemplate,
    type TemplateCategory
} from "./TemplateModel";
export { extractTemplateSnapshot, instantiateProjectFromSnapshot } from "./templateSnapshot";
export {
    LocalTemplateStorage,
    localTemplateStorage,
    type TemplateStorage
} from "./TemplateStorage";
export { SupabaseTemplateStorage } from "./SupabaseTemplateStorage";
export {
    TemplateService,
    createTemplateFromProject,
    deleteTemplate,
    getTemplate,
    instantiateTemplate,
    listTemplates,
    templateService
} from "./TemplateService";
