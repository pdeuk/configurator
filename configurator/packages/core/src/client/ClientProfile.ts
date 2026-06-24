export interface ClientFeatures {
    artwork: boolean;
    dpi: boolean;
    quotes: boolean;
    manufacturing: boolean;
    customerPortal: boolean;
    reviews: boolean;
    arPreview: boolean;
    templates: boolean;
    erp: boolean;
}

export interface ClientBranding {
    appName: string;
    productLabel: string;
    landingSubtitle: string;
}

export interface ClientProfile {
    id: string;
    branding: ClientBranding;
    features: ClientFeatures;
}

export function createClientProfile(
    profile: ClientProfile
): ClientProfile {
    return profile;
}
