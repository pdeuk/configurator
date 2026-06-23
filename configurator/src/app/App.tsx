import { Configurator } from "./Configurator";
import { CustomerPortal } from "./CustomerPortal";
import { SharedProjectViewer } from "./SharedProjectViewer";
import { isPortalPath, parsePortalProjectId } from "../services/customer";
import { parseShareTokenFromPath } from "../services/sharing";

export function App() {
    const shareToken = parseShareTokenFromPath();

    if (shareToken) {
        return <SharedProjectViewer shareToken={shareToken} />;
    }

    if (isPortalPath()) {
        return <CustomerPortal projectId={parsePortalProjectId()} />;
    }

    return <Configurator />;
}
