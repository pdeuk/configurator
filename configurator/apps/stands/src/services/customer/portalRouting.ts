export function isPortalPath(pathname = window.location.pathname): boolean {
    return pathname === "/portal" || pathname.startsWith("/portal/");
}

export function parsePortalProjectId(pathname = window.location.pathname): string | null {
    const match = pathname.match(/^\/portal\/project\/([^/]+)\/?$/);
    return match?.[1] ?? null;
}

export function buildPortalPath(): string {
    return "/portal";
}

export function buildPortalProjectPath(projectId: string): string {
    return `/portal/project/${projectId}`;
}

export function buildPortalProjectUrl(projectId: string, origin = window.location.origin): string {
    return `${origin}${buildPortalProjectPath(projectId)}`;
}
