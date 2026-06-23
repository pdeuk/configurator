import type {
    ERPCustomerPayload,
    ERPConnection,
    ERPExportResult,
    ERPManufacturingPayload,
    ERPProjectPayload,
    ERPQuotePayload
} from "./ERPModel";
import type { ERPAdapter } from "./ERPAdapter";

function notConfiguredResult(action: string): ERPExportResult {
    return {
        success: false,
        externalId: null,
        timestamp: new Date().toISOString(),
        errors: [`Entersoft adapter is not configured yet (${action}).`]
    };
}

/** Placeholder adapter reserved for Entersoft ERP integration. */
export class EntersoftERPAdapter implements ERPAdapter {
    private readonly connection: ERPConnection;

    constructor(connection: ERPConnection) {
        this.connection = connection;
    }

    async connect(): Promise<void> {
        if (!this.connection.settings.baseUrl) {
            throw new Error("Entersoft base URL is not configured.");
        }
    }

    async testConnection(): Promise<ERPExportResult> {
        return notConfiguredResult("testConnection");
    }

    async exportCustomer(_customer: ERPCustomerPayload): Promise<ERPExportResult> {
        return notConfiguredResult("exportCustomer");
    }

    async exportQuote(_quote: ERPQuotePayload): Promise<ERPExportResult> {
        return notConfiguredResult("exportQuote");
    }

    async exportOrder(_project: ERPProjectPayload): Promise<ERPExportResult> {
        return notConfiguredResult("exportOrder");
    }

    async exportManufacturingPackage(
        _manufacturingPackage: ERPManufacturingPayload
    ): Promise<ERPExportResult> {
        return notConfiguredResult("exportManufacturingPackage");
    }
}
