import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { getSettingsContext } from "../settings/SettingsService";
import { resolveOrganizationId } from "../settings/SettingsStorage";

export interface SystemActorContext {
    userId: string | null;
    organizationId: string;
}

export function resolveSystemActorContext(): SystemActorContext {
    const { user } = getCloudStorageContext();

    try {
        const settingsContext = getSettingsContext();
        return {
            userId: user?.id ?? user?.email ?? null,
            organizationId: settingsContext.organizationId
        };
    } catch {
        return {
            userId: user?.id ?? user?.email ?? null,
            organizationId: resolveOrganizationId(user?.id ?? null)
        };
    }
}
