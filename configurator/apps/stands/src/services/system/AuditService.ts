import { appendAuditEntry, readAuditEntries } from "./systemStorage";
import { resolveSystemActorContext } from "./systemContext";
import type { AuditAction, AuditEntityType, AuditEntry } from "./SystemModel";

export interface RecordAuditInput {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    userId?: string | null;
    organizationId?: string | null;
}

export class AuditService {
    async record(input: RecordAuditInput): Promise<AuditEntry> {
        const actor = resolveSystemActorContext();
        const entry: AuditEntry = {
            id: crypto.randomUUID(),
            userId: input.userId ?? actor.userId,
            organizationId: input.organizationId ?? actor.organizationId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            timestamp: new Date().toISOString()
        };

        appendAuditEntry(entry);
        return entry;
    }

    async listEntries(limit = 100): Promise<AuditEntry[]> {
        return readAuditEntries<AuditEntry>()
            .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
            .slice(0, limit);
    }
}

export const auditService = new AuditService();

export function recordAudit(input: RecordAuditInput): Promise<AuditEntry> {
    return auditService.record(input);
}
