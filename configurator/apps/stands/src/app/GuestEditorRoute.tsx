import { Configurator } from "./Configurator";

/** Scenario 2: limited self-service editor for customers designing before official onboarding. */
export function GuestEditorRoute() {
    return <Configurator guestMode />;
}
