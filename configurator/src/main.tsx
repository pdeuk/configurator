import React from "react";
import ReactDOM from "react-dom/client";
import { Configurator } from "./app/Configurator";
import "./index.css";

ReactDOM
    .createRoot(
        document.getElementById("root")!
    )
    .render(
        <React.StrictMode>
            <Configurator />
        </React.StrictMode>
    );
