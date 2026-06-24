import { EMPTY_LOADING_STATE, type LoadingScope, type LoadingState } from "./SystemModel";

type LoadingListener = (state: LoadingState) => void;

class LoadingStateService {
    private state: LoadingState = { ...EMPTY_LOADING_STATE };
    private readonly listeners = new Set<LoadingListener>();
    private readonly counters: Record<LoadingScope, number> = {
        project: 0,
        assets: 0,
        export: 0
    };

    getState(): LoadingState {
        return { ...this.state };
    }

    subscribe(listener: LoadingListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());

        return () => {
            this.listeners.delete(listener);
        };
    }

    begin(scope: LoadingScope): void {
        this.counters[scope] += 1;
        this.updateScope(scope, true);
    }

    end(scope: LoadingScope): void {
        this.counters[scope] = Math.max(0, this.counters[scope] - 1);
        this.updateScope(scope, this.counters[scope] > 0);
    }

    async run<T>(scope: LoadingScope, operation: () => Promise<T>): Promise<T> {
        this.begin(scope);

        try {
            return await operation();
        } finally {
            this.end(scope);
        }
    }

    private updateScope(scope: LoadingScope, active: boolean): void {
        if (this.state[scope] === active) {
            return;
        }

        this.state = {
            ...this.state,
            [scope]: active
        };

        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }
}

export const loadingStateService = new LoadingStateService();
