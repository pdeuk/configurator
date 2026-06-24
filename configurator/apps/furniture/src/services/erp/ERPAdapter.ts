import type {
    ERPCustomerPayload,
    ERPExportResult,
    ERPManufacturingPayload,
    ERPProjectPayload,
    ERPQuotePayload
} from "./ERPModel";

export interface ERPAdapter {
    connect(): Promise<void>;
    testConnection(): Promise<ERPExportResult>;
    exportCustomer(customer: ERPCustomerPayload): Promise<ERPExportResult>;
    exportQuote(quote: ERPQuotePayload): Promise<ERPExportResult>;
    exportOrder(project: ERPProjectPayload): Promise<ERPExportResult>;
    exportManufacturingPackage(
        manufacturingPackage: ERPManufacturingPayload
    ): Promise<ERPExportResult>;
}

export interface ERPAdapterContext {
    providerLabel: string;
}
