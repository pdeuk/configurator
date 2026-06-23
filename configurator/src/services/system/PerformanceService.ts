import { appendPerformanceMetric, readPerformanceMetrics } from "./systemStorage";
import type { PerformanceMetric, PerformanceMetricName } from "./SystemModel";

export interface RecordPerformanceInput {
    name: PerformanceMetricName;
    durationMs?: number | null;
    value?: number | null;
    metadata?: Record<string, string | number | boolean | null>;
}

export class PerformanceService {
    record(input: RecordPerformanceInput): PerformanceMetric {
        const metric: PerformanceMetric = {
            id: crypto.randomUUID(),
            name: input.name,
            durationMs: input.durationMs ?? null,
            value: input.value ?? null,
            metadata: input.metadata ?? {},
            timestamp: new Date().toISOString()
        };

        appendPerformanceMetric(metric);
        return metric;
    }

    async measureAsync<T>(
        name: PerformanceMetricName,
        operation: () => Promise<T>,
        metadata?: Record<string, string | number | boolean | null>
    ): Promise<T> {
        const startedAt = performance.now();

        try {
            const result = await operation();
            this.record({
                name,
                durationMs: Math.round(performance.now() - startedAt),
                ...(metadata ? { metadata } : {})
            });
            return result;
        } catch (error) {
            this.record({
                name,
                durationMs: Math.round(performance.now() - startedAt),
                metadata: {
                    ...(metadata ?? {}),
                    failed: true
                }
            });
            throw error;
        }
    }

    recordProjectLoad(durationMs: number, projectId: string): PerformanceMetric {
        return this.record({
            name: "project.load",
            durationMs,
            metadata: { projectId }
        });
    }

    recordAssetLoad(durationMs: number, assetCount: number): PerformanceMetric {
        return this.record({
            name: "assets.load",
            durationMs,
            value: assetCount,
            metadata: { assetCount }
        });
    }

    recordSceneObjectCount(count: number): PerformanceMetric {
        return this.record({
            name: "scene.objectCount",
            value: count,
            metadata: { count }
        });
    }

    recordExportDuration(
        name: Extract<
            PerformanceMetricName,
            "export.quotePdf" | "export.manufacturingPdf" | "export.manufacturingJson" | "export.erp"
        >,
        durationMs: number,
        metadata?: Record<string, string | number | boolean | null>
    ): PerformanceMetric {
        return this.record({
            name,
            durationMs,
            ...(metadata ? { metadata } : {})
        });
    }

    listMetrics(limit = 50): PerformanceMetric[] {
        return readPerformanceMetrics<PerformanceMetric>().slice(0, limit);
    }
}

export const performanceService = new PerformanceService();
