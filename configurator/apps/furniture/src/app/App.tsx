import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CloudSessionProvider } from "../ui/cloud";
import {
    WebsiteCategoryPage,
    WebsiteProductPage,
    WebsiteProductsHubPage,
    WebsiteSubcategoryPage
} from "../website/WebsiteBrowsePages";
import { CustomerPortal } from "./CustomerPortal";
import { InviteSignupPage } from "./InviteSignupPage";
import { LandingPage } from "./LandingPage";
import { ProtectedAppRoute } from "./ProtectedAppRoute";
import { SharedProjectViewer } from "./SharedProjectViewer";

export function App() {
    return (
        <CloudSessionProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/products" element={<WebsiteProductsHubPage />} />
                    <Route path="/products/:categorySlug" element={<WebsiteCategoryPage />} />
                    <Route
                        path="/products/:categorySlug/:subcategorySlug"
                        element={<WebsiteSubcategoryPage />}
                    />
                    <Route
                        path="/products/:categorySlug/:subcategorySlug/:productSlug"
                        element={<WebsiteProductPage />}
                    />
                    <Route path="/join" element={<InviteSignupPage />} />
                    <Route path="/app" element={<ProtectedAppRoute />} />
                    <Route path="/share/:token" element={<SharedProjectViewer />} />
                    <Route path="/portal" element={<CustomerPortal />} />
                    <Route path="/portal/project/:projectId" element={<CustomerPortal />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </CloudSessionProvider>
    );
}
