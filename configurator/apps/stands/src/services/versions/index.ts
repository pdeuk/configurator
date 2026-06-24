export {
    formatRevisionDate,
    formatRevisionLabel,
    type CreateRevisionInput,
    type ProjectRevision,
    type RevisionApprovalRef,
    type RevisionAuditEntry,
    type RevisionComparison,
    type RevisionManufacturingRef
} from "./VersionModel";
export {
    LocalRevisionStorage,
    localRevisionStorage,
    type RevisionStorage
} from "./RevisionStorage";
export { SupabaseRevisionStorage } from "./SupabaseRevisionStorage";
export { compareRevisionSnapshots } from "./revisionCompare";
export {
    RevisionService,
    compareRevisions,
    createRevision,
    getRevisions,
    restoreRevision,
    revisionService
} from "./RevisionService";
