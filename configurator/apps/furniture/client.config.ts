import { createClientProfile, type ClientProfile } from "@configurator/core/client";

export const clientProfile: ClientProfile = createClientProfile({
    id: "furniture",
    branding: {
        appName: "Furniture Configurator",
        productLabel: "furniture & mattresses",
        landingSubtitle:
            "Plan room layouts with your furniture range and share designs with customers."
    },
    features: {
        artwork: false,
        dpi: false,
        quotes: true,
        manufacturing: false,
        customerPortal: false,
        reviews: false,
        arPreview: false,
        templates: true,
        erp: false
    }
});
