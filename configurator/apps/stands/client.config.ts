import { createClientProfile, type ClientProfile } from "@configurator/core/client";

export const standsClientProfile: ClientProfile = createClientProfile({
    id: "stands",
    branding: {
        appName: "Stand Configurator",
        productLabel: "exhibition stands",
        landingSubtitle:
            "Configure exhibition stands, quotes, and manufacturing exports."
    },
    features: {
        artwork: true,
        dpi: true,
        quotes: true,
        manufacturing: true,
        customerPortal: true,
        reviews: true,
        arPreview: true,
        templates: true,
        erp: true
    }
});
