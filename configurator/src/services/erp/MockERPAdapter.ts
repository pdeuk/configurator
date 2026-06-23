import type {
    ERPCustomerPayload,
    ERPConnection,
    ERPExportResult,
    ERPManufacturingPayload,
    ERPProjectPayload,
    ERPQuotePayload
} from "./ERPModel";
import type { ERPAdapter } from "./ERPAdapter";

function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        window.setTimeout(resolve, ms);
    });
}

function successResult(externalId: string, label: string): ERPExportResult {
    console.info(`[MockERP] ${label}`, externalId);

    return {
        success: true,
        externalId,
        timestamp: new Date().toISOString(),
        errors: []
    };
}

function failureResult(errors: string[]): ERPExportResult {
    console.warn("[MockERP] Export failed.", errors);

    return {
        success: false,
        externalId: null,
        timestamp: new Date().toISOString(),
        errors
    };
}

function validateCustomer(customer: ERPCustomerPayload): string[] {
    const errors: string[] = [];

    if (!customer.name.trim()) {
        errors.push("Customer name is required.");
    }

    if (!customer.company.trim() && !customer.email.trim()) {
        errors.push("Customer company or email is required.");
    }

    return errors;
}

function validateProject(project: ERPProjectPayload): string[] {
    const errors: string[] = [];

    if (!project.sourceProjectId.trim()) {
        errors.push("Project id is required.");
    }

    if (!project.name.trim()) {
        errors.push("Project name is required.");
    }

    if (project.lineSummary.length === 0) {
        errors.push("Project must include at least one BOM line.");
    }

    return errors;
}

function validateQuote(quote: ERPQuotePayload): string[] {
    const errors = validateCustomer(quote.customer);

    if (!quote.quoteNumber.trim()) {
        errors.push("Quote number is required.");
    }

    if (quote.lines.length === 0) {
        errors.push("Quote must include at least one line.");
    }

    return errors;
}

function validateManufacturing(
    manufacturingPackage: ERPManufacturingPayload
): string[] {
    const errors: string[] = [];

    if (!manufacturingPackage.sourcePackageId.trim()) {
        errors.push("Manufacturing package id is required.");
    }

    if (!manufacturingPackage.sourceProjectId.trim()) {
        errors.push("Manufacturing project id is required.");
    }

    return errors;
}

export class MockERPAdapter implements ERPAdapter {
    private readonly connection: ERPConnection;

    constructor(connection: ERPConnection) {
        this.connection = connection;
    }

    private async simulateLatency(): Promise<void> {
        const latency = this.connection.settings.mockLatencyMs ?? 250;

        if (latency > 0) {
            await delay(latency);
        }
    }

    async connect(): Promise<void> {
        await this.simulateLatency();
        console.info("[MockERP] Connected.", this.connection.id);
    }

    async testConnection(): Promise<ERPExportResult> {
        await this.simulateLatency();

        if (!this.connection.enabled) {
            return failureResult(["Mock ERP connection is disabled."]);
        }

        return successResult(`MOCK-CONN-${this.connection.id}`, "Connection test succeeded");
    }

    async exportCustomer(customer: ERPCustomerPayload): Promise<ERPExportResult> {
        await this.simulateLatency();
        console.info("[MockERP] exportCustomer payload", customer);

        const errors = validateCustomer(customer);

        if (errors.length > 0) {
            return failureResult(errors);
        }

        const suffix = customer.sourceQuoteId ?? customer.sourceProjectId ?? crypto.randomUUID();
        return successResult(`MOCK-CUST-${suffix}`, "Customer exported");
    }

    async exportQuote(quote: ERPQuotePayload): Promise<ERPExportResult> {
        await this.simulateLatency();
        console.info("[MockERP] exportQuote payload", quote);

        const errors = validateQuote(quote);

        if (errors.length > 0) {
            return failureResult(errors);
        }

        return successResult(`MOCK-QUOTE-${quote.quoteNumber}`, "Quote exported");
    }

    async exportOrder(project: ERPProjectPayload): Promise<ERPExportResult> {
        await this.simulateLatency();
        console.info("[MockERP] exportOrder payload", project);

        const errors = validateProject(project);

        if (errors.length > 0) {
            return failureResult(errors);
        }

        return successResult(`MOCK-ORDER-${project.sourceProjectId}`, "Order exported");
    }

    async exportManufacturingPackage(
        manufacturingPackage: ERPManufacturingPayload
    ): Promise<ERPExportResult> {
        await this.simulateLatency();
        console.info("[MockERP] exportManufacturingPackage payload", manufacturingPackage);

        const errors = validateManufacturing(manufacturingPackage);

        if (errors.length > 0) {
            return failureResult(errors);
        }

        return successResult(
            `MOCK-MFG-${manufacturingPackage.sourcePackageId}`,
            "Manufacturing package exported"
        );
    }
}
