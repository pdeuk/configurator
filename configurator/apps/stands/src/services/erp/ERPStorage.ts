import type {
    ERPConnection,
    ERPConnectionSettings,
    ERPConnectionTestResult,
    ERPExportReference,
    ERPProvider
} from "./ERPModel";

export interface ERPStorage {
    getConnection(): Promise<ERPConnection>;
    saveConnection(connection: ERPConnection): Promise<ERPConnection>;
    listExportReferences(): Promise<ERPExportReference[]>;
    saveExportReference(reference: ERPExportReference): Promise<void>;
}

const CONNECTION_KEY = "configurator:erp:connection";
const EXPORT_INDEX_KEY = "configurator:erp:export-index";

function createDefaultConnection(): ERPConnection {
    return {
        id: crypto.randomUUID(),
        provider: "mock",
        enabled: true,
        settings: {
            mockLatencyMs: 250
        }
    };
}

function readExportIndex(): ERPExportReference[] {
    const raw = localStorage.getItem(EXPORT_INDEX_KEY);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as ERPExportReference[];
    } catch {
        return [];
    }
}

function writeExportIndex(references: ERPExportReference[]): void {
    localStorage.setItem(EXPORT_INDEX_KEY, JSON.stringify(references));
}

export class LocalERPStorage implements ERPStorage {
    async getConnection(): Promise<ERPConnection> {
        const raw = localStorage.getItem(CONNECTION_KEY);

        if (!raw) {
            const defaults = createDefaultConnection();
            localStorage.setItem(CONNECTION_KEY, JSON.stringify(defaults));
            return defaults;
        }

        try {
            return JSON.parse(raw) as ERPConnection;
        } catch {
            const defaults = createDefaultConnection();
            localStorage.setItem(CONNECTION_KEY, JSON.stringify(defaults));
            return defaults;
        }
    }

    async saveConnection(connection: ERPConnection): Promise<ERPConnection> {
        localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
        return connection;
    }

    async listExportReferences(): Promise<ERPExportReference[]> {
        return readExportIndex().sort((left, right) =>
            right.exportedAt.localeCompare(left.exportedAt)
        );
    }

    async saveExportReference(reference: ERPExportReference): Promise<void> {
        const next = readExportIndex().filter(entry => entry.id !== reference.id);
        next.push(reference);
        writeExportIndex(next);
    }
}

export const localERPStorage = new LocalERPStorage();

export type ERPConnectionUpdate = Partial<
    Pick<ERPConnection, "provider" | "enabled">
> & {
    settings?: Partial<ERPConnectionSettings>;
};

export function mergeERPConnection(
    current: ERPConnection,
    update: ERPConnectionUpdate
): ERPConnection {
    return {
        ...current,
        ...update,
        settings: {
            ...current.settings,
            ...(update.settings ?? {})
        }
    };
}

export function createConnectionTestResult(
    connection: ERPConnection,
    result: { success: boolean; message: string }
): ERPConnectionTestResult {
    return {
        connected: result.success,
        provider: connection.provider,
        message: result.message,
        testedAt: new Date().toISOString()
    };
}

export function isERPProvider(value: string): value is ERPProvider {
    return value === "mock" || value === "entersoft" || value === "rest";
}
