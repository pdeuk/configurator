import type { ProjectDocument } from "../../models/ProjectModel";
import type { ManufacturingPackage } from "../manufacturing/ManufacturingModel";
import type { QuoteDocument } from "../quotes/QuoteModel";
import type { ERPAdapter } from "./ERPAdapter";
import { EntersoftERPAdapter } from "./EntersoftERPAdapter";
import type {
    ERPConnection,
    ERPConnectionTestResult,
    ERPExportReference,
    ERPExportResult
} from "./ERPModel";
import {
    customerFromProject,
    manufacturingToERP,
    projectToERP,
    quoteToERP
} from "./mappers";
import { MockERPAdapter } from "./MockERPAdapter";
import { RestERPAdapter } from "./RestERPAdapter";
import {
    createConnectionTestResult,
    localERPStorage,
    mergeERPConnection,
    type ERPConnectionUpdate,
    type ERPStorage
} from "./ERPStorage";

function createAdapter(connection: ERPConnection): ERPAdapter {
    switch (connection.provider) {
        case "entersoft":
            return new EntersoftERPAdapter(connection);
        case "rest":
            return new RestERPAdapter(connection);
        case "mock":
        default:
            return new MockERPAdapter(connection);
    }
}

function createExportReference(
    connection: ERPConnection,
    sourceType: ERPExportReference["sourceType"],
    sourceId: string,
    result: ERPExportResult
): ERPExportReference {
    return {
        id: crypto.randomUUID(),
        provider: connection.provider,
        sourceType,
        sourceId,
        externalId: result.externalId,
        exportedAt: result.timestamp
    };
}

export class ERPService {
    private readonly storage: ERPStorage;

    constructor(storage: ERPStorage = localERPStorage) {
        this.storage = storage;
    }

    async getConnection(): Promise<ERPConnection> {
        return this.storage.getConnection();
    }

    async updateConnection(update: ERPConnectionUpdate): Promise<ERPConnection> {
        const current = await this.storage.getConnection();
        const next = mergeERPConnection(current, update);
        return this.storage.saveConnection(next);
    }

    async testConnection(): Promise<ERPConnectionTestResult> {
        const connection = await this.storage.getConnection();

        if (!connection.enabled) {
            return createConnectionTestResult(connection, {
                success: false,
                message: "ERP connection is disabled."
            });
        }

        const adapter = createAdapter(connection);

        try {
            await adapter.connect();
            const result = await adapter.testConnection();

            return createConnectionTestResult(connection, {
                success: result.success,
                message: result.success
                    ? `Connected to ${connection.provider} adapter.`
                    : result.errors.join(" ")
            });
        } catch (error) {
            return createConnectionTestResult(connection, {
                success: false,
                message: error instanceof Error ? error.message : "Connection test failed."
            });
        }
    }

    async listExportReferences(): Promise<ERPExportReference[]> {
        return this.storage.listExportReferences();
    }

    async exportProjectToERP(project: ProjectDocument): Promise<ERPExportResult> {
        const connection = await this.requireEnabledConnection();
        const adapter = createAdapter(connection);
        await adapter.connect();

        const customerResult = await adapter.exportCustomer(customerFromProject(project));

        if (!customerResult.success) {
            return customerResult;
        }

        const orderResult = await adapter.exportOrder(projectToERP(project));
        await this.persistExportReference(connection, "project", project.id, orderResult);

        return orderResult;
    }

    async exportQuoteToERP(quote: QuoteDocument): Promise<ERPExportResult> {
        const connection = await this.requireEnabledConnection();
        const adapter = createAdapter(connection);
        await adapter.connect();

        const payload = quoteToERP(quote);
        const customerResult = await adapter.exportCustomer(payload.customer);

        if (!customerResult.success) {
            return customerResult;
        }

        const quoteResult = await adapter.exportQuote(payload);
        await this.persistExportReference(connection, "quote", quote.id, quoteResult);

        return quoteResult;
    }

    async exportManufacturingToERP(
        manufacturingPackage: ManufacturingPackage
    ): Promise<ERPExportResult> {
        const connection = await this.requireEnabledConnection();
        const adapter = createAdapter(connection);
        await adapter.connect();

        const payload = manufacturingToERP(manufacturingPackage);
        const result = await adapter.exportManufacturingPackage(payload);
        await this.persistExportReference(
            connection,
            "manufacturing",
            manufacturingPackage.id,
            result
        );

        return result;
    }

    private async requireEnabledConnection(): Promise<ERPConnection> {
        const connection = await this.storage.getConnection();

        if (!connection.enabled) {
            throw new Error("ERP connection is disabled.");
        }

        return connection;
    }

    private async persistExportReference(
        connection: ERPConnection,
        sourceType: ERPExportReference["sourceType"],
        sourceId: string,
        result: ERPExportResult
    ): Promise<void> {
        if (!result.success) {
            return;
        }

        await this.storage.saveExportReference(
            createExportReference(connection, sourceType, sourceId, result)
        );
    }
}

export const erpService = new ERPService();

export function exportProjectToERP(project: ProjectDocument): Promise<ERPExportResult> {
    return erpService.exportProjectToERP(project);
}

export function exportQuoteToERP(quote: QuoteDocument): Promise<ERPExportResult> {
    return erpService.exportQuoteToERP(quote);
}

export function exportManufacturingToERP(
    manufacturingPackage: ManufacturingPackage
): Promise<ERPExportResult> {
    return erpService.exportManufacturingToERP(manufacturingPackage);
}
