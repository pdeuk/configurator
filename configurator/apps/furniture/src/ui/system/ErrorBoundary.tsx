import {
    Component,
    type ErrorInfo,
    type ReactNode
} from "react";
import { errorTrackingService } from "../../services/system";

export interface SystemErrorBoundaryProps {
    children: ReactNode;
    title: string;
    description?: string;
    onReset?: () => void;
    resetKeys?: unknown[];
}

interface SystemErrorBoundaryState {
    error: Error | null;
}

export class SystemErrorBoundary extends Component<
    SystemErrorBoundaryProps,
    SystemErrorBoundaryState
> {
    state: SystemErrorBoundaryState = {
        error: null
    };

    static getDerivedStateFromError(error: Error): SystemErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        errorTrackingService.captureError(error, {
            context: `error-boundary:${this.props.title}`,
            severity: "fatal"
        });

        if (info.componentStack) {
            errorTrackingService.captureMessage(info.componentStack, {
                context: `error-boundary:${this.props.title}:componentStack`,
                severity: "warning"
            });
        }
    }

    componentDidUpdate(prevProps: SystemErrorBoundaryProps): void {
        if (!this.state.error) {
            return;
        }

        const resetKeysChanged = this.props.resetKeys?.some(
            (key, index) => key !== prevProps.resetKeys?.[index]
        );

        if (resetKeysChanged) {
            this.resetBoundary();
        }
    }

    private resetBoundary = (): void => {
        this.setState({ error: null });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.error) {
            return (
                <div style={styles.panel} role="alert">
                    <h3 style={styles.title}>{this.props.title}</h3>
                    {this.props.description && (
                        <p style={styles.description}>{this.props.description}</p>
                    )}
                    <p style={styles.message}>{this.state.error.message}</p>
                    <button type="button" style={styles.button} onClick={this.resetBoundary}>
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export function EditorErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <SystemErrorBoundary
            title="Editor unavailable"
            description="The configurator editor encountered an unexpected error."
        >
            {children}
        </SystemErrorBoundary>
    );
}

export function PdfExportErrorBoundary({
    children,
    resetKeys,
    onReset
}: {
    children: ReactNode;
    resetKeys?: unknown[];
    onReset?: () => void;
}) {
    return (
        <SystemErrorBoundary
            title="PDF export failed"
            description="Quote or manufacturing PDF generation could not complete."
            {...(resetKeys ? { resetKeys } : {})}
            {...(onReset ? { onReset } : {})}
        >
            {children}
        </SystemErrorBoundary>
    );
}

export function ErpErrorBoundary({
    children,
    resetKeys,
    onReset
}: {
    children: ReactNode;
    resetKeys?: unknown[];
    onReset?: () => void;
}) {
    return (
        <SystemErrorBoundary
            title="ERP integration error"
            description="ERP settings or export actions failed unexpectedly."
            {...(resetKeys ? { resetKeys } : {})}
            {...(onReset ? { onReset } : {})}
        >
            {children}
        </SystemErrorBoundary>
    );
}

/** Throws during render so an error boundary can recover from async failures. */
export function AsyncErrorTrigger({ error }: { error: Error | null }) {
    if (error) {
        throw error;
    }

    return null;
}

const styles = {
    panel: {
        padding: 16,
        borderRadius: 8,
        border: "1px solid #7f1d1d",
        background: "#2a1518",
        color: "#fecaca",
        display: "grid",
        gap: 8
    },
    title: {
        margin: 0,
        fontSize: 15
    },
    description: {
        margin: 0,
        fontSize: 12,
        color: "#fca5a5"
    },
    message: {
        margin: 0,
        fontSize: 12,
        fontFamily: "monospace"
    },
    button: {
        justifySelf: "start",
        border: "1px solid #fca5a5",
        background: "transparent",
        color: "#fecaca",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    }
};
