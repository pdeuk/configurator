import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CloudSessionProvider } from "../ui/cloud";
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
