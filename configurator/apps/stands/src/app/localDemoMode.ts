const LOCAL_DEMO_KEY = "configurator:local-demo";

export function isLocalDemoMode(): boolean {
    if (typeof sessionStorage === "undefined") {
        return false;
    }

    return sessionStorage.getItem(LOCAL_DEMO_KEY) === "1";
}

export function enableLocalDemoMode(): void {
    sessionStorage.setItem(LOCAL_DEMO_KEY, "1");
}

export function disableLocalDemoMode(): void {
    sessionStorage.removeItem(LOCAL_DEMO_KEY);
}
