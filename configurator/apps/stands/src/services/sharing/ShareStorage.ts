import type { SharedProjectRecord } from "./ShareModel";

/** Persistence boundary — swap for Supabase public projects table later. */
export interface ShareStorage {
    saveShare(record: SharedProjectRecord): Promise<void>;
    getByToken(shareToken: string): Promise<SharedProjectRecord | null>;
    disableShare(shareToken: string): Promise<boolean>;
}

const SHARE_TOKEN_PREFIX = "configurator:share:token:";

function shareStorageKey(shareToken: string): string {
    return `${SHARE_TOKEN_PREFIX}${shareToken}`;
}

export class LocalShareStorage implements ShareStorage {
    async saveShare(record: SharedProjectRecord): Promise<void> {
        localStorage.setItem(
            shareStorageKey(record.shared.shareToken),
            JSON.stringify(record)
        );
    }

    async getByToken(shareToken: string): Promise<SharedProjectRecord | null> {
        const raw = localStorage.getItem(shareStorageKey(shareToken));

        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as SharedProjectRecord;

            if (!parsed?.shared?.shareToken || !parsed.projectSnapshot) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    async disableShare(shareToken: string): Promise<boolean> {
        const existing = await this.getByToken(shareToken);

        if (!existing) {
            return false;
        }

        await this.saveShare({
            ...existing,
            disabled: true
        });

        return true;
    }
}

export const localShareStorage = new LocalShareStorage();
