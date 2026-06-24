import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { errorTrackingService } from "./services/system";
import "./index.css";

errorTrackingService.installGlobalHandlers();

ReactDOM
    .createRoot(
        document.getElementById("root")!
    )
    .render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
